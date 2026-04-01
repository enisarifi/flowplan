import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { QuizQuestion, Flashcard, CheckAnswerResponse } from "@/types/api";

export function useGenerateQuiz() {
  return useMutation({
    mutationFn: async (params: {
      subject_id: string;
      topic?: string;
      question_type: string;
      difficulty: number;
      count: number;
      extra_instructions?: string;
    }) => {
      const res = await api.post<{ questions: QuizQuestion[] }>("/quiz/generate", params);
      return res.data.questions;
    },
  });
}

export function useGenerateFlashcards() {
  return useMutation({
    mutationFn: async (params: {
      subject_id: string;
      topic?: string;
      count: number;
      extra_instructions?: string;
    }) => {
      const res = await api.post<{ flashcards: Flashcard[] }>("/quiz/flashcards", params);
      return res.data.flashcards;
    },
  });
}

export function useCheckAnswer() {
  return useMutation({
    mutationFn: async (params: {
      question: string;
      correct_answer: string;
      user_answer: string;
      explanation: string;
    }) => {
      const res = await api.post<CheckAnswerResponse>("/quiz/check-answer", params);
      return res.data;
    },
  });
}
