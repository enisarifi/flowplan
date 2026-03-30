# FlowPlan — Full Presentation Script

**Duration:** 10-15 minutes (target: ~12 min + Q&A)
**Format:** Group presentation with live demo
**Team:** Enis Arifi (CEO), Gent Govori (CTO), Ylli Berbatovci (CMO)

---

## Timing Overview

| Slide | Topic | Presenter | Duration | Cumulative |
|-------|-------|-----------|----------|------------|
| 1 | Title | Enis | 0:15 | 0:15 |
| 2 | The Problem | Enis | 1:00 | 1:15 |
| 3 | Market Pain Points | Ylli | 1:00 | 2:15 |
| 4 | The Solution | Enis | 1:00 | 3:15 |
| 5 | How It Works | Gent | 1:00 | 4:15 |
| 6 | The AI Engine | Gent | 1:30 | 5:45 |
| 7 | Live Demo | Gent | 2:30 | 8:15 |
| 8 | Target Audience | Ylli | 1:00 | 9:15 |
| 9 | Go-to-Market | Ylli | 1:00 | 10:15 |
| 10 | Business Model | Enis | 1:00 | 11:15 |
| 11 | Competitive Advantage | Enis | 0:45 | 12:00 |
| 12 | Future Vision | All | 0:45 | 12:45 |
| 13 | Thank You & Q&A | All | — | — |

---

## SLIDE 1 — Title
**Presenter: Enis**
**Time: 0:15**

> "Good [morning/afternoon], everyone. We're Enis, Gent, and Ylli, and today we're presenting FlowPlan — an AI-powered study planner that helps students study smarter, not harder."

*[Click to next slide]*

---

## SLIDE 2 — The Problem
**Presenter: Enis**
**Time: 1:00**

> "Let's start with a question — raise your hand if you've ever made a study plan and abandoned it within a week."

*[Pause for audience reaction]*

> "You're not alone. Studies show that around 70% of students can't stick to their study plans. And the reason is simple — the tools we use don't understand us."

> "Google Calendar doesn't know that you're exhausted at 8pm. Notion doesn't know you have three exams next week. These are generic tools for a problem that's deeply personal."

> "The result? Procrastination. Burnout. And cramming the night before an exam hoping for the best."

> "My colleague Ylli will share what students are actually saying about this."

---

## SLIDE 3 — Market Pain Points
**Presenter: Ylli**
**Time: 1:00**

> "Thanks, Enis. When we talked to students, we kept hearing the same things."

> "One student told us: 'I make a study plan every semester and never follow it past week two.'"

> "Another said: 'I always study hard subjects when I'm already tired, then wonder why nothing sticks.'"

> "And this one really stood out: 'My planner doesn't know I have three exams next week. I have to figure out priorities myself.'"

> "These aren't edge cases — 85% of university students report feeling overwhelmed by their academic workload. The tools exist, but they're not working. That's where FlowPlan comes in."

---

## SLIDE 4 — The Solution
**Presenter: Enis**
**Time: 1:00**

> "FlowPlan is your AI study partner that learns how you actually work — not how you think you work."

> "It does three things that no other study tool does."

> "First — **AI-generated schedules**. You tell it your subjects, their difficulty, your exam dates, and when you have energy. The AI builds a personalized weekly plan."

> "Second — **a feedback loop**. After every study session, you rate your energy, difficulty, and how much you completed. It takes 10 seconds."

> "Third — and this is the key — **continuous adaptation**. Based on your real behavior, the AI restructures your next week. If you say you're a morning person but your energy ratings show you actually perform better in the afternoon — FlowPlan notices. And it adjusts."

> "Gent will now show you exactly how this works under the hood."

---

## SLIDE 5 — How It Works
**Presenter: Gent**
**Time: 1:00**

> "Thanks, Enis. FlowPlan works in four simple steps."

> "**Step one** — you set your preferences. How many hours can you study per day? When do you have the most energy? How long should each session be? Which days do you study?"

> "**Step two** — you add your subjects. Each subject has a name, a difficulty rating from 1 to 5, how many hours per week you want to spend on it, and optionally an exam date."

> "**Step three** — the AI generates your schedule. It takes all of this information and creates a personalized 7-day plan. Hard subjects at your peak energy. More sessions for upcoming exams. Proper breaks built in."

> "**Step four** — you study, you give feedback, and the AI adapts. This is the loop that makes FlowPlan get smarter over time."

> "Let me show you what's actually happening inside the AI."

---

## SLIDE 6 — The AI Engine
**Presenter: Gent**
**Time: 1:30**

> "FlowPlan is powered by Claude, an AI model by Anthropic."

> "On the left — what the AI considers when building your schedule. It looks at subject difficulty, your energy peak time, how close your exams are, your weekly hour targets, and your preferred session length."

> "For example — if a subject is rated difficulty 5 and you're a morning person, the AI will place that subject in the morning when your brain is sharpest."

> "If an exam is less than 7 days away, the AI automatically increases session frequency for that subject."

> "Now, on the right — this is where it gets interesting. After you've completed sessions and provided feedback, the AI analyzes your actual patterns."

> "Let's say your profile says you peak in the morning. But your feedback data shows you consistently rate your energy as 2 out of 5 in the morning and 4 out of 5 in the afternoon. FlowPlan detects this. And it moves your hardest subjects to the afternoon — based on data, not assumptions."

> "It also shortens sessions for subjects you consistently rate as very difficult, and reallocates time toward subjects where you're falling behind."

> "Now — instead of just telling you about this, let me show you the real thing."

---

## SLIDE 7 — Live Demo
**Presenter: Gent**
**Time: 2:30**

> "What you're about to see is not a mockup or a prototype design — this is a fully functional application that we built."

### Demo Script (step by step):

**Step 1 — Landing Page (15 sec)**
> "This is our landing page. Clean, simple — explains the three core features."

*[Show the landing page briefly, point out the three feature cards]*

**Step 2 — Login & Dashboard (20 sec)**
> "Let me log in to a demo account."

*[Log in → Dashboard loads]*

> "This is the dashboard. At the top you can see the completion rate, total sessions completed, and average energy rating. Below that — today's scheduled sessions with their status, and upcoming exams sorted by date."

**Step 3 — Subjects (20 sec)**
*[Navigate to Subjects page]*

> "Here are the subjects. Each one has a difficulty level, weekly hour target, and an optional exam date. You can add, edit, or remove subjects at any time."

**Step 4 — Generate Schedule (20 sec)**
*[Go back to Dashboard, click "Generate new schedule"]*

> "Now watch this — I click 'Generate new schedule' and the AI builds a personalized week."

*[Wait for generation → redirect to schedule]*

**Step 5 — Calendar View (20 sec)**
> "Here's the calendar. Each block is a study session, color-coded by subject. You can switch between week, day, and month views."

*[Show the weekly view with color-coded sessions]*

**Step 6 — Feedback Modal (30 sec)**
*[Click on a planned session]*

> "When I click a session, this feedback modal opens. I rate my energy level — let's say 4. Difficulty — 3. Completion — 80%. I can add notes if I want. Then I mark it complete."

*[Fill in the ratings and submit]*

> "That session is now green — completed. This feedback data is what powers the adaptation."

**Step 7 — Progress Page (20 sec)**
*[Navigate to Progress page]*

> "And here's the progress page. Hours studied per subject, completion rates with color coding — green means on track, red means falling behind — and a summary table."

**Step 8 — Wrap up (15 sec)**
> "If I go back to the dashboard and click 'Re-adapt schedule,' the AI takes all of this feedback and restructures next week's plan. The more you use it, the smarter it gets."

*[Switch back to slides]*

> "Now I'll hand it over to Ylli to talk about who this is for and how we reach them."

---

## SLIDE 8 — Target Audience
**Presenter: Ylli**
**Time: 1:00**

> "Thanks, Gent. So who is FlowPlan for?"

> "Our primary audience is **university students between 18 and 25**. They're juggling five or more subjects, they have overlapping deadlines, and they want structure — but not rigidity. They're digital natives who already use apps for everything."

> "Our secondary audience is **graduate and professional students**. These are people studying for certifications, working on a thesis, doing self-directed learning. The stakes are higher, and they need an accountability system."

> "And our third segment is **high school students preparing for university entrance exams**. Their parents want to see structured study habits, and FlowPlan provides exactly that — with data to prove it."

---

## SLIDE 9 — Go-to-Market Strategy
**Presenter: Ylli**
**Time: 1:00**

> "Here's how we plan to reach these students."

> "**First — university partnerships.** We partner with student unions and academic advisors who can recommend FlowPlan as a study tool. Universum could be our first pilot."

> "**Second — social media.** Study content is massive on TikTok and Instagram. We work with student influencers who can demo the app to their audience — real students showing real results."

> "**Third — the freemium viral loop.** The free tier gets students in the door. When they see their progress stats improving, they share it. Word of mouth in dormitories and study groups is powerful."

> "**Fourth — exam season campaigns.** We run targeted ads during midterms and finals — that's when the pain is highest and students are actively searching for help."

> "I'll hand it back to Enis for the business model."

---

## SLIDE 10 — Business Model
**Presenter: Enis**
**Time: 1:00**

> "Thanks, Ylli. Our business model is freemium with three tiers."

> "The **free tier** gives students basic AI schedule generation once a week, up to 3 subjects, and simple session tracking. Enough to see the value."

> "The **Pro tier at 5 dollars per month** unlocks everything — unlimited schedule generation, full AI adaptation based on your behavior, detailed progress analytics, and unlimited subjects. For a student, that's less than one coffee a week for a tool that can change their grades."

> "And the **University License** — this is the B2B play. Universities pay per-student for campus-wide access. They get an admin dashboard showing aggregate study patterns — which helps academic advisors identify at-risk students early."

> "The path is: students love it individually, then we sell it to their universities at scale."

---

## SLIDE 11 — Competitive Advantage
**Presenter: Enis**
**Time: 0:45**

> "Now, you might wonder — there are calendars and planners out there. What makes FlowPlan different?"

> "Google Calendar, Notion, MyStudyLife — they're all static. You put things in, they stay there. None of them generate a schedule for you. None of them learn from your behavior. None of them adapt."

*[Point to the comparison table]*

> "FlowPlan is the only study planner that learns from how you actually study — not how you think you study."

> "And here's something we're proud of — we didn't just pitch an idea today. We built it. The application you just saw is real, functional, and running. That's our strongest proof of concept."

---

## SLIDE 12 — Future Vision
**Presenter: All (Enis introduces, each takes one phase)**
**Time: 0:45**

**Enis:**
> "Let me quickly share where FlowPlan is going."

> "**Phase 1 — where we are now.** A working MVP with AI scheduling, feedback, and adaptation. The foundation is built."

**Gent:**
> "**Phase 2 — what's next.** A mobile app for iOS and Android, group study coordination so friends can sync schedules, and spaced repetition integration for better long-term retention."

**Ylli:**
> "**Phase 3 — the bigger picture.** University-wide analytics dashboards, integration with learning management systems like Moodle and Canvas, and multi-language support to go global."

---

## SLIDE 13 — Thank You & Q&A
**Presenter: Enis**
**Time: —**

> "That's FlowPlan — study smarter, not harder. We're Enis, Gent, and Ylli, and we're happy to take your questions."

*[Open floor for Q&A]*

---

## Preparation Notes

### Before the Presentation
- Have the app running locally (`docker compose up` or both servers running)
- Pre-create a demo account with:
  - 4-5 subjects already added (Mathematics, Physics, Programming, English, etc.) with varying difficulties and some exam dates set within the next 2 weeks
  - A generated schedule already visible on the calendar
  - A few sessions already marked as completed (so stats show data)
  - A few sessions still "planned" (so you can demo the feedback modal live)
- Test the demo flow once fully before presenting
- Have a backup: screenshots of each step in case the live demo has technical issues

### Potential Q&A Questions & Answers

**Q: How is this different from just using ChatGPT to make a study plan?**
> "Great question. You can ask ChatGPT once for a plan, but it doesn't track whether you followed it, it doesn't know your energy patterns, and it can't adapt next week based on what happened this week. FlowPlan is a continuous system — it gets better the more you use it."

**Q: What AI model do you use?**
> "We use Claude by Anthropic. It's connected through our backend — the AI never sees your personal data directly, only the parameters needed to build your schedule."

**Q: How do you make money?**
> "Freemium model. Free tier to get students in, $5/month Pro for full adaptation and analytics, and university-wide licenses for the B2B market."

**Q: What tech stack did you use?**
> "Next.js with React on the frontend, Python FastAPI on the backend, PostgreSQL for the database, and Claude AI for schedule intelligence. Everything runs in Docker."

**Q: What if the AI makes a bad schedule?**
> "That's exactly what the feedback loop solves. If sessions aren't working, you rate them low — the AI picks up on this and adjusts. You can also regenerate from scratch at any time."

**Q: Did you actually build this or is it a concept?**
> "It's fully built and functional. What we showed in the demo is the real application. We went beyond the assignment to prove the concept works."
