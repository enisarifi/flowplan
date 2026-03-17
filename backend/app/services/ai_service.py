import json
from datetime import datetime, date, timedelta, timezone

from openai import OpenAI  # used for Gemini via OpenAI-compatible endpoint
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
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        self.model = settings.OPENAI_MODEL

    def _default_start_date(self) -> date:
        return datetime.now(timezone.utc).date()

    def build_generation_prompt(
        self,
        prefs: UserPreferences,
        subjects: list[Subject],
        start_date: date | None = None,
    ) -> str:
        if start_date is None:
            start_date = self._default_start_date()

        subject_lines = []
        for s in subjects:
            exam_str = str(s.exam_date) if s.exam_date else "no exam"
            notes_str = s.notes or "none"
            subject_lines.append(
                f"- Name: {s.name}\n"
                f"  Difficulty: {s.difficulty}/5\n"
                f"  Weekly hours target: {float(s.weekly_hours_target)}h\n"
                f"  Exam date: {exam_str}\n"
                f"  Notes: {notes_str}"
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
- Do not schedule sessions before 07:00 or after 23:00 in the user's timezone.
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

    def _call_openai(self, user_prompt: str) -> tuple[str, int, int]:
        response = self.client.chat.completions.create(
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

    def generate_schedule(
        self, prefs: UserPreferences, subjects: list[Subject], start_date: date | None = None
    ) -> tuple[AIScheduleResponseSchema, int, int]:
        prompt = self.build_generation_prompt(prefs, subjects, start_date)
        raw, prompt_tokens, completion_tokens = self._call_openai(prompt)
        parsed = self._parse_and_validate(raw, subjects)
        return parsed, prompt_tokens, completion_tokens

    def adapt_schedule(
        self,
        prefs: UserPreferences,
        subjects: list[Subject],
        feedback_rows: list[SessionFeedback],
        start_date: date | None = None,
    ) -> tuple[AIScheduleResponseSchema, int, int]:
        prompt = self.build_adaptation_prompt(prefs, subjects, feedback_rows, start_date)
        raw, prompt_tokens, completion_tokens = self._call_openai(prompt)
        parsed = self._parse_and_validate(raw, subjects)
        return parsed, prompt_tokens, completion_tokens
