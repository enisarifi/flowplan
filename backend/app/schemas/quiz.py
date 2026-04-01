from pydantic import BaseModel
from typing import Optional
import uuid


class QuizGenerateRequest(BaseModel):
    subject_id: uuid.UUID
    topic: Optional[str] = None
    question_type: str = "mixed"  # multiple_choice, true_false, short_answer, mixed
    difficulty: int = 3  # 1-5
    count: int = 5  # 1-10
    extra_instructions: Optional[str] = None


class QuizQuestion(BaseModel):
    question: str
    question_type: str
    options: Optional[list[str]] = None
    correct_answer: str
    hint: str
    explanation: str


class QuizGenerateResponse(BaseModel):
    questions: list[QuizQuestion]


class FlashcardGenerateRequest(BaseModel):
    subject_id: uuid.UUID
    topic: Optional[str] = None
    count: int = 10  # 5-20
    extra_instructions: Optional[str] = None


class Flashcard(BaseModel):
    front: str
    back: str
    mnemonic: Optional[str] = None


class FlashcardGenerateResponse(BaseModel):
    flashcards: list[Flashcard]


class CheckAnswerRequest(BaseModel):
    question: str
    correct_answer: str
    user_answer: str
    explanation: str


class CheckAnswerResponse(BaseModel):
    is_correct: bool
    feedback: str
