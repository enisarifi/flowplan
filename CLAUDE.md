# FlowPlan

AI-powered study planner. Python FastAPI backend + Next.js frontend + PostgreSQL + Anthropic Claude API.

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload        # dev server at localhost:8000
alembic upgrade head                 # run DB migrations
alembic revision --autogenerate -m "description"  # generate migration
pytest                               # run tests
```

### Frontend
```bash
cd frontend
npm install
npm run dev                          # dev server at localhost:3000
npm run build                        # production build
```

### Docker (full stack)
```bash
cp backend/.env.example backend/.env  # then fill in ANTHROPIC_API_KEY
docker compose up --build
```

## Architecture

- **Backend**: `backend/app/` — FastAPI, SQLAlchemy async ORM, Alembic migrations
- **Frontend**: `frontend/src/` — Next.js App Router, React Query, Zustand, FullCalendar
- **AI**: All Claude calls live exclusively in `backend/app/services/ai_service.py`

## Key Rules

- Routes are thin — no business logic in routers, only HTTP validation + response
- Services orchestrate business logic and call repositories
- Repositories handle all DB access — never write raw SQL outside repositories
- `AIService` is the only place that calls the Anthropic SDK
- Frontend never calls Claude directly — always through the backend API
- Custom React Query hooks (`useSchedule`, `useSubjects`, etc.) — components never call `axios` directly

## Environment Variables

Backend `.env`:
```
DATABASE_URL=postgresql+asyncpg://flowplan:flowplan@localhost:5432/flowplan
SECRET_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6
```

Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Data Flow

1. User registers → sets preferences → adds subjects
2. POST `/api/schedule/generate` → Claude generates weekly plan → stored in DB
3. User marks sessions complete via FeedbackModal on calendar
4. POST `/api/schedule/adapt` → Claude re-adapts based on behavioral feedback
