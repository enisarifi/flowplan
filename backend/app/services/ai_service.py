import json
from datetime import datetime, date, timedelta, timezone

from openai import AsyncOpenAI
from pydantic import ValidationError

from app.config import settings
from app.models.user import UserPreferences
from app.models.subject import Subject
from app.models.schedule_entry import SessionFeedback
from app.schemas.schedule import AIScheduleResponseSchema


class AIResponseValidationError(Exception):
    pass


SYSTEM_PROMPT = (
    "You are FlowPlan's scheduling engine. You create realistic, personalized weekly study schedules. "
    "You always respond with valid JSON matching the provided schema — no prose, no markdown fences, only raw JSON."
)


class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            timeout=30.0,
        )
        self.model = settings.OPENAI_MODEL

    def _default_start_date(self) -> date:
        return datetime.now(timezone.utc).date()

    def build_generation_prompt(
        self,
        prefs: UserPreferences,
        subjects: list[Subject],
        start_date: date | None = None,
        last_studied: dict[str, int] | None = None,
    ) -> str:
        if start_date is None:
            start_date = self._default_start_date()

        subject_lines = []
        for s in subjects:
            exam_str = str(s.exam_date) if s.exam_date else "no exam"
            notes_str = s.notes or "none"
            days_ago = last_studied.get(s.name, -1) if last_studied else -1
            review_note = ""
            if days_ago > 3:
                review_note = f"\n  ⚠ Last studied {days_ago} days ago — schedule a review session"
            elif days_ago == -1:
                review_note = "\n  ⚠ Never studied — prioritize initial sessions"
            subject_lines.append(
                f"- Name: {s.name}\n"
                f"  Difficulty: {s.difficulty}/5\n"
                f"  Weekly hours target: {float(s.weekly_hours_target)}h\n"
                f"  Exam date: {exam_str}\n"
                f"  Notes: {notes_str}{review_note}"
            )

        return f"""Generate a 7-day study schedule starting on {start_date} (Monday).

## User Profile
- Timezone: {prefs.timezone}
- Available hours per day: {float(prefs.available_hours_day)}
- Preferred session length: {prefs.preferred_session_len_min} minutes
- Break length: {prefs.break_len_min} minutes
- Energy peak: {prefs.energy_peak}
- Study days: {', '.join(prefs.study_days)}

## Subjects to Schedule
{chr(10).join(subject_lines)}

## Constraints
- Do not schedule sessions before {prefs.blocked_hours_end} or after {prefs.blocked_hours_start} in the user's timezone.
- Schedule no more than {prefs.max_sessions_per_day} sessions per day.
- Leave at least {prefs.min_break_between_min} minutes between consecutive sessions.
- Sessions for difficulty-5 subjects should be placed at the user's energy peak time.
- If an exam is within 7 days, increase that subject's session frequency.
- Leave at least one full day without sessions if total weekly hours target is under 10h.

## Required Output Format (strict JSON)
{{
  "schedule": [
    {{
      "subject_name": "must match a subject name above exactly",
      "title": "brief topic description",
      "start_time": "ISO 8601 with timezone offset",
      "end_time": "ISO 8601 with timezone offset",
      "suggested_topic": "1-2 sentences on what to focus on"
    }}
  ],
  "reasoning": "2-3 sentences explaining the schedule logic"
}}"""

    def build_adaptation_prompt(
        self,
        prefs: UserPreferences,
        subjects: list[Subject],
        feedback_rows: list[SessionFeedback],
        start_date: date | None = None,
    ) -> str:
        base = self.build_generation_prompt(prefs, subjects, start_date)

        if not feedback_rows:
            return base

        total = len(feedback_rows)
        completed = sum(1 for f in feedback_rows if f.completion_pct and f.completion_pct >= 80)
        completion_rate = round(completed / total * 100, 1) if total else 0

        energy_by_period: dict[str, list[int]] = {"morning": [], "afternoon": [], "evening": []}
        for f in feedback_rows:
            if f.energy_rating and hasattr(f, "schedule_entry") and f.schedule_entry:
                hour = f.schedule_entry.start_time.hour
                if 6 <= hour < 12:
                    energy_by_period["morning"].append(f.energy_rating)
                elif 12 <= hour < 17:
                    energy_by_period["afternoon"].append(f.energy_rating)
                else:
                    energy_by_period["evening"].append(f.energy_rating)

        def avg(lst: list[int]) -> str:
            return f"{sum(lst)/len(lst):.1f}" if lst else "no data"

        hard_subjects = []
        diff_by_subject: dict[str, list[int]] = {}
        for f in feedback_rows:
            if f.difficulty_rating and hasattr(f, "schedule_entry") and f.schedule_entry:
                name = f.schedule_entry.subject.name if f.schedule_entry.subject else "unknown"
                diff_by_subject.setdefault(name, []).append(f.difficulty_rating)
        for name, ratings in diff_by_subject.items():
            if sum(ratings) / len(ratings) > 4:
                hard_subjects.append(name)

        behavioral_section = f"""

## Behavioral Patterns from Last {total} Sessions
- Overall completion rate: {completion_rate}%
- Average energy rating by time slot:
    Morning (06-12):   {avg(energy_by_period['morning'])}/5
    Afternoon (12-17): {avg(energy_by_period['afternoon'])}/5
    Evening (17-23):   {avg(energy_by_period['evening'])}/5
- Subjects consistently rated difficulty > 4 (needs shorter sessions): {', '.join(hard_subjects) or 'none'}

## Instruction
Adjust the schedule for the next 7 days to:
1. Reallocate time toward subjects that are behind their weekly target.
2. Move high-difficulty sessions to the time slot with the highest avg energy.
3. Shorten session lengths for subjects consistently rated difficulty > 4.
Respond with the same JSON schema as before."""

        return base + behavioral_section

    async def _call_openai(self, user_prompt: str) -> tuple[str, int, int]:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        return text, prompt_tokens, completion_tokens

    def _parse_and_validate(self, raw: str, subjects: list[Subject]) -> AIScheduleResponseSchema:
        try:
            data = json.loads(raw)
            parsed = AIScheduleResponseSchema(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            raise AIResponseValidationError(f"AI response failed validation: {e}")

        # Build case-insensitive, whitespace-stripped map so minor AI formatting differences don't fail validation
        name_map = {s.name.strip().lower(): s.name for s in subjects}
        for entry in parsed.schedule:
            canonical = name_map.get(entry.subject_name.strip().lower())
            if canonical is None:
                raise AIResponseValidationError(
                    f"Unknown subject '{entry.subject_name}' in AI response. Expected one of: {set(name_map.values())}"
                )
            # Normalize to the exact stored name so schedule_service lookups match
            entry.subject_name = canonical

        return parsed

    async def generate_schedule(
        self, prefs: UserPreferences, subjects: list[Subject], start_date: date | None = None, last_studied: dict[str, int] | None = None
    ) -> tuple[AIScheduleResponseSchema, int, int]:
        prompt = self.build_generation_prompt(prefs, subjects, start_date, last_studied)
        raw, prompt_tokens, completion_tokens = await self._call_openai(prompt)
        parsed = self._parse_and_validate(raw, subjects)
        return parsed, prompt_tokens, completion_tokens

    async def adapt_schedule(
        self,
        prefs: UserPreferences,
        subjects: list[Subject],
        feedback_rows: list[SessionFeedback],
        start_date: date | None = None,
    ) -> tuple[AIScheduleResponseSchema, int, int]:
        prompt = self.build_adaptation_prompt(prefs, subjects, feedback_rows, start_date)
        raw, prompt_tokens, completion_tokens = await self._call_openai(prompt)
        parsed = self._parse_and_validate(raw, subjects)
        return parsed, prompt_tokens, completion_tokens

    async def generate_weekly_summary(self, stats_text: str) -> dict:
        prompt = f"""Analyze this student's study week and give a brief, encouraging summary.

{stats_text}

Respond with strict JSON:
{{
  "summary": "2-3 sentence overview of the week (encouraging tone, mention specific subjects)",
  "tips": ["tip 1", "tip 2", "tip 3"]
}}

Tips should be specific and actionable based on the data. Keep them short (1 sentence each)."""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a supportive study coach. Be specific, concise, and encouraging."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    async def generate_exam_prep(self, subject_name: str, difficulty: int, days_until: int, notes: str | None) -> dict:
        prompt = f"""Create an exam preparation plan for a student.

Subject: {subject_name}
Difficulty: {difficulty}/5
Days until exam: {days_until}
Student's notes about what to study: {notes or 'No specific notes provided'}

Respond with strict JSON:
{{
  "checklist": ["item 1", "item 2", "item 3", "item 4", "item 5"],
  "daily_hours": 2.0,
  "priority": "high",
  "tips": ["tip 1", "tip 2"]
}}

Checklist items should be specific study tasks (5-8 items). daily_hours is the recommended study hours per day. tips should be exam-specific advice."""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert academic advisor. Create specific, actionable exam prep plans."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    async def generate_quiz_questions(
        self, subject_name: str, difficulty: int, topic: str | None, question_type: str, count: int, extra_instructions: str | None = None
    ) -> dict:
        type_instruction = {
            "multiple_choice": "All questions must be multiple choice with exactly 4 options (A, B, C, D).",
            "true_false": 'All questions must be true/false. Options should be ["True", "False"].',
            "short_answer": "All questions must be short answer. Set options to null.",
            "mixed": "Use a mix of multiple choice (4 options), true/false, and short answer questions.",
        }.get(question_type, "Use a mix of question types.")

        extra = f"\n\nAdditional instructions from the student: {extra_instructions}" if extra_instructions else ""

        prompt = f"""Generate {count} quiz questions about "{subject_name}".
Difficulty level: {difficulty}/5 (1=beginner, 5=expert).
Topic focus: {topic or 'General coverage of the subject'}

{type_instruction}

MATH FORMATTING RULES (MANDATORY):
- ALL mathematical expressions MUST be wrapped in LaTeX delimiters.
- Use $...$ for inline math: $x^2$, $\\frac{{1}}{{2}}$, $\\sqrt{{x}}$
- Use $$...$$ for standalone/display math: $$\\int_0^1 x^2 \\, dx$$
- Powers/exponents: ALWAYS use $x^{{2}}$ or $2^{{n}}$, NEVER x^2 or 2^n
- Fractions: ALWAYS use $\\frac{{a}}{{b}}$, NEVER a/b or a÷b
- Square roots: ALWAYS use $\\sqrt{{x}}$, NEVER sqrt(x) or √x
- Subscripts: ALWAYS use $x_{{1}}$, NEVER x1 or x_1
- Multiplication: Use $\\cdot$ or $\\times$, NEVER * or plain x
- Greek letters: $\\alpha$, $\\beta$, $\\pi$, etc.
- Summation: $\\sum_{{i=1}}^{{n}}$, Products: $\\prod$
- Even simple numbers in math context should use LaTeX: "Find $x$ if $2x + 3 = 7$"
- The correct_answer for math questions should also use LaTeX: "$\\frac{{1}}{{2}}$" not "1/2"

ANSWER ACCURACY:
- Double-check every correct_answer by solving the problem yourself step by step.
- The explanation must show the full solution process.
- For multiple choice, verify the correct option letter matches the answer.{extra}

Respond with strict JSON:
{{
  "questions": [
    {{
      "question": "the question text",
      "question_type": "multiple_choice" or "true_false" or "short_answer",
      "options": ["A", "B", "C", "D"] or ["True", "False"] or null,
      "correct_answer": "the correct answer text",
      "hint": "a helpful hint without giving away the answer",
      "explanation": "full explanation of why the answer is correct"
    }}
  ]
}}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a university-level quiz generator. Create clear, educational questions that test understanding. Always respond with valid JSON. CRITICAL: All mathematical expressions must use LaTeX notation with $ delimiters. Never use plain text for math — use $x^{2}$ not x^2, $\\frac{a}{b}$ not a/b, $\\sqrt{x}$ not sqrt(x). Double-check all answers for correctness."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    async def generate_flashcards(self, subject_name: str, topic: str | None, count: int, extra_instructions: str | None = None) -> dict:
        extra = f"\n\nAdditional instructions from the student: {extra_instructions}" if extra_instructions else ""

        prompt = f"""Generate {count} study flashcards for "{subject_name}".
Topic focus: {topic or 'General coverage of the subject'}

Each flashcard should have a concise question/term on the front and a clear answer/definition on the back.
Include a short mnemonic or memory aid when helpful (set to null if not applicable).

MATH FORMATTING RULES (MANDATORY):
- ALL mathematical expressions MUST be wrapped in LaTeX delimiters.
- Use $...$ for inline math: $x^2$, $\\frac{{1}}{{2}}$, $\\sqrt{{x}}$
- Use $$...$$ for standalone/display math: $$\\int_0^1 x^2 \\, dx$$
- Powers/exponents: ALWAYS use $x^{{2}}$, NEVER x^2 or 2^n
- Fractions: ALWAYS use $\\frac{{a}}{{b}}$, NEVER a/b
- Square roots: ALWAYS use $\\sqrt{{x}}$, NEVER sqrt(x) or √x
- Multiplication: Use $\\cdot$ or $\\times$, NEVER *
- Even simple numbers in math context should use LaTeX.{extra}

Respond with strict JSON:
{{
  "flashcards": [
    {{
      "front": "term or question",
      "back": "definition or answer",
      "mnemonic": "memory aid or null"
    }}
  ]
}}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a study flashcard creator. Make concise, memorable flashcards that aid retention. Always respond with valid JSON. Use LaTeX $...$ for all math expressions."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    async def check_answer(
        self, question: str, correct_answer: str, user_answer: str, explanation: str
    ) -> dict:
        prompt = f"""A student answered a quiz question. Determine if their answer is correct.

Question: {question}
Expected correct answer: {correct_answer}
Student's answer: {user_answer}

Context/explanation: {explanation}

Be lenient with formatting differences (e.g. "1/2" and "$\\frac{{1}}{{2}}$" and "0.5" are all the same).
Focus on whether the student's answer is mathematically/factually equivalent to the correct answer.
For math answers, evaluate if the expressions are equivalent even if written differently.

Respond with strict JSON:
{{
  "is_correct": true or false,
  "feedback": "Brief feedback explaining why the answer is correct or what the correct answer is. Use LaTeX for any math: $...$ for inline."
}}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a fair quiz grader. Judge answers on correctness, not formatting. Be lenient with equivalent forms. Always respond with valid JSON. Use LaTeX $...$ for any math in feedback."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
