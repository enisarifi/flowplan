# FlowPlan

FlowPlan is an AI-powered study planner that builds a personalized weekly schedule based on your subjects, difficulty levels, and energy patterns. After each study session you log how it went, and FlowPlan re-adapts the schedule to put hard subjects at your peak energy times, shorten sessions you consistently struggle with, and prioritize anything with an upcoming exam.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 · FastAPI · SQLAlchemy async · Alembic |
| Frontend | Next.js 15 · React · Tailwind CSS · FullCalendar |
| Database | PostgreSQL 16 |
| AI | Groq API · llama-3.3-70b-versatile |
| Infrastructure | Docker Compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- A free [Groq API key](https://console.groq.com) — takes about 30 seconds to get

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/flowplan.git
cd flowplan

# 2. Copy the example env file
cp backend/.env.example .env

# 3. Open .env and paste your Groq API key
#    OPENAI_API_KEY=gsk_...

# 4. Start everything
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

## First Run Walkthrough

1. **Register** — create an account on the login page
2. **Onboarding** — set your study hours per day, energy peak time, session length, and which days you study
3. **Subjects** — add each subject with its difficulty (1–5), weekly hour target, and optional exam date
4. **Generate** — go to Dashboard and click **Generate new schedule** — the AI builds a 7-day plan
5. **Study** — click any session on the calendar to mark it complete and log energy/difficulty feedback
6. **Adapt** — click **Re-adapt schedule** anytime to have the AI adjust based on your feedback

## Local Development (without Docker)

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
alembic upgrade head   # run DB migrations (needs a local Postgres instance)
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
# create frontend/.env.local with:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
# App available at http://localhost:3000
```

## Project Structure

```
flowplan/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic DTOs
│   │   ├── repositories/    # DB access layer
│   │   ├── services/        # Business logic + AI calls
│   │   └── routers/         # FastAPI route handlers
│   ├── alembic/             # DB migrations
│   └── .env.example
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # React components
│       └── hooks/           # React Query hooks
└── docker-compose.yml
```

## API Docs

With the backend running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for the full interactive API reference.
