from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, subjects, schedule, sessions, notes, goals, resources, quiz


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="FlowPlan API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(resources.router, prefix="/api/resources", tags=["resources"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])


@app.get("/health")
async def health():
    return {"status": "ok"}
