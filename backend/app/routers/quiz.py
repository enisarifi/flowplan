from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_subject_repo
from app.models.user import User
from app.repositories.subject_repo import SubjectRepository
from app.services.ai_service import AIService, AIResponseValidationError
from app.schemas.quiz import (
    QuizGenerateRequest, QuizGenerateResponse,
    FlashcardGenerateRequest, FlashcardGenerateResponse,
    CheckAnswerRequest, CheckAnswerResponse,
)

router = APIRouter()


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    data: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    subject = await subject_repo.get_user_subject(current_user.id, data.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    ai = AIService()
    topic = data.topic or subject.notes or None
    try:
        result = await ai.generate_quiz_questions(
            subject_name=subject.name,
            difficulty=data.difficulty,
            topic=topic,
            question_type=data.question_type,
            count=min(data.count, 10),
            extra_instructions=data.extra_instructions,
        )
        return result
    except (AIResponseValidationError, Exception) as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")


@router.post("/flashcards", response_model=FlashcardGenerateResponse)
async def generate_flashcards(
    data: FlashcardGenerateRequest,
    current_user: User = Depends(get_current_user),
    subject_repo: SubjectRepository = Depends(get_subject_repo),
):
    subject = await subject_repo.get_user_subject(current_user.id, data.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    ai = AIService()
    topic = data.topic or subject.notes or None
    try:
        result = await ai.generate_flashcards(
            subject_name=subject.name,
            topic=topic,
            count=min(data.count, 20),
            extra_instructions=data.extra_instructions,
        )
        return result
    except (AIResponseValidationError, Exception) as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")


@router.post("/check-answer", response_model=CheckAnswerResponse)
async def check_answer(
    data: CheckAnswerRequest,
    current_user: User = Depends(get_current_user),
):
    ai = AIService()
    try:
        result = await ai.check_answer(
            question=data.question,
            correct_answer=data.correct_answer,
            user_answer=data.user_answer,
            explanation=data.explanation,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check answer: {str(e)}")
