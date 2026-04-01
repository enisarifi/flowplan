"use client";

import { useState, useEffect, useRef } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useGenerateQuiz, useGenerateFlashcards, useCheckAnswer } from "@/hooks/useQuiz";
import { QuizQuestion, Flashcard } from "@/types/api";
import { toast } from "sonner";
import {
  BrainCircuit, Sparkles, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Lightbulb, Eye, RotateCcw,
  Shuffle, Loader2,
} from "lucide-react";

type Tab = "quiz" | "flashcards";

const inputClass = "w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[rgb(var(--foreground))] transition-all";

const mathStyles = `
  .katex { font-size: 1.1em; }
  .katex-display { margin: 0.75em 0; overflow-x: auto; overflow-y: hidden; }
  .katex-display > .katex { text-align: left; }
`;

function MathText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;

    let html = text;

    // 1. Render display math $$...$$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
      } catch { return tex; }
    });

    // 2. Render inline math $...$
    html = html.replace(/\$([^$]+?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
      } catch { return tex; }
    });

    // 3. Fallback: catch common undelimited math patterns the AI might produce
    // Powers like x^2, 2^n (only if no KaTeX already rendered)
    if (!html.includes("katex")) {
      html = html.replace(/\b(\w+)\^(\{[^}]+\}|\w+)/g, (_, base, exp) => {
        const cleanExp = exp.replace(/^\{|\}$/g, "");
        try {
          return katex.renderToString(`${base}^{${cleanExp}}`, { displayMode: false, throwOnError: false });
        } catch { return `${base}^${exp}`; }
      });
      // Fractions like a/b in math-like context
      html = html.replace(/(\d+)\s*\/\s*(\d+)/g, (match, num, den) => {
        try {
          return katex.renderToString(`\\frac{${num}}{${den}}`, { displayMode: false, throwOnError: false });
        } catch { return match; }
      });
      // sqrt(...) pattern
      html = html.replace(/sqrt\(([^)]+)\)/g, (match, inner) => {
        try {
          return katex.renderToString(`\\sqrt{${inner}}`, { displayMode: false, throwOnError: false });
        } catch { return match; }
      });
    }

    ref.current.innerHTML = html;
  }, [text]);
  return <div ref={ref} className={`inline ${className ?? ""}`} />;
}

export default function QuizPage() {
  const { data: subjects = [] } = useSubjects();
  const genQuiz = useGenerateQuiz();
  const genFlash = useGenerateFlashcards();
  const checkAnswerAI = useCheckAnswer();

  const [tab, setTab] = useState<Tab>("quiz");
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");

  const [extraInstructions, setExtraInstructions] = useState("");

  // Quiz settings
  const [questionType, setQuestionType] = useState("mixed");
  const [difficulty, setDifficulty] = useState(3);
  const [quizCount, setQuizCount] = useState(5);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiCorrect, setAiCorrect] = useState<boolean | null>(null);

  // Flashcard settings & state
  const [flashCount, setFlashCount] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [fIndex, setFIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleGenerateQuiz = () => {
    if (!subjectId) { toast.error("Select a subject first."); return; }
    genQuiz.mutate(
      { subject_id: subjectId, topic: topic || undefined, question_type: questionType, difficulty, count: quizCount, extra_instructions: extraInstructions || undefined },
      {
        onSuccess: (qs) => {
          setQuestions(qs);
          setQIndex(0); setUserAnswer(""); setChecked(false);
          setShowHint(false); setShowAnswer(false); setScore(0); setFinished(false);
          setAiFeedback(null); setAiCorrect(null);
        },
        onError: () => toast.error("Failed to generate quiz. Try again."),
      }
    );
  };

  const handleGenerateFlash = () => {
    if (!subjectId) { toast.error("Select a subject first."); return; }
    genFlash.mutate(
      { subject_id: subjectId, topic: topic || undefined, count: flashCount, extra_instructions: extraInstructions || undefined },
      {
        onSuccess: (fc) => { setFlashcards(fc); setFIndex(0); setFlipped(false); },
        onError: () => toast.error("Failed to generate flashcards. Try again."),
      }
    );
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    const q = questions[qIndex];

    // For multiple choice / true-false, do local check first (fast)
    if (q.options && q.options.length > 0) {
      const correct = userAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      if (correct) setScore((s) => s + 1);
      setAiCorrect(correct);
      setAiFeedback(null);
      setChecked(true);
      return;
    }

    // For short answer, use AI to check
    try {
      const result = await checkAnswerAI.mutateAsync({
        question: q.question,
        correct_answer: q.correct_answer,
        user_answer: userAnswer.trim(),
        explanation: q.explanation,
      });
      if (result.is_correct) setScore((s) => s + 1);
      setAiCorrect(result.is_correct);
      setAiFeedback(result.feedback);
      setChecked(true);
    } catch {
      // Fallback to string comparison if AI check fails
      const correct = userAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      if (correct) setScore((s) => s + 1);
      setAiCorrect(correct);
      setAiFeedback(null);
      setChecked(true);
    }
  };

  const nextQuestion = () => {
    if (qIndex + 1 >= questions.length) { setFinished(true); return; }
    setQIndex((i) => i + 1);
    setUserAnswer(""); setChecked(false); setShowHint(false); setShowAnswer(false);
    setAiFeedback(null); setAiCorrect(null);
  };

  const resetQuiz = () => {
    setQuestions([]); setQIndex(0); setUserAnswer(""); setChecked(false);
    setShowHint(false); setShowAnswer(false); setScore(0); setFinished(false);
    setAiFeedback(null); setAiCorrect(null);
  };

  const shuffleCards = () => {
    setFlashcards((fc) => [...fc].sort(() => Math.random() - 0.5));
    setFIndex(0); setFlipped(false);
  };

  const q = questions[qIndex];
  const isCorrect = checked && aiCorrect === true;

  return (
    <div className="max-w-3xl animate-fade-in">
      <style dangerouslySetInnerHTML={{ __html: mathStyles }} />
      <div className="flex items-center gap-2 mb-6">
        <BrainCircuit className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">Quiz & Flashcards</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-xl">
        {(["quiz", "flashcards"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? "bg-brand-500 text-white shadow-brand-sm" : "text-surface-500 hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-raised))]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Settings panel */}
      <div className="glass rounded-2xl shadow-soft p-5 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputClass}>
              <option value="">Select a subject...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Topic (optional)</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Calculus integrals" className={inputClass} />
          </div>
        </div>

        {tab === "quiz" && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Type</label>
              <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className={inputClass}>
                <option value="mixed">Mixed</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Difficulty ({difficulty}/5)</label>
              <input type="range" min={1} max={5} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="w-full mt-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Questions</label>
              <select value={quizCount} onChange={(e) => setQuizCount(Number(e.target.value))} className={inputClass}>
                {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === "flashcards" && (
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Number of cards</label>
            <select value={flashCount} onChange={(e) => setFlashCount(Number(e.target.value))} className={inputClass}>
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Additional instructions (optional)</label>
          <textarea
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
            rows={2}
            placeholder="e.g. Focus on chapter 5, include real-world examples, make it harder..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          onClick={tab === "quiz" ? handleGenerateQuiz : handleGenerateFlash}
          disabled={genQuiz.isPending || genFlash.isPending || !subjectId}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm hover:shadow-brand-md"
        >
          {(genQuiz.isPending || genFlash.isPending) ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate {tab === "quiz" ? "quiz" : "flashcards"}</>
          )}
        </button>
      </div>

      {/* Quiz flow */}
      {tab === "quiz" && questions.length > 0 && !finished && q && (
        <div className="glass rounded-2xl shadow-soft p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Question {qIndex + 1}/{questions.length}</span>
            <span className="text-xs text-surface-400">Score: {score}/{qIndex + (checked ? 1 : 0)}</span>
          </div>

          <p className="text-[rgb(var(--foreground))] font-medium mb-5 text-base leading-relaxed"><MathText text={q.question} /></p>

          {/* Multiple choice / True-false */}
          {q.options && q.options.length > 0 ? (
            <div className="space-y-2 mb-5">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => !checked && setUserAnswer(opt)}
                  disabled={checked}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    checked && opt.toLowerCase() === q.correct_answer.toLowerCase()
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                      : checked && userAnswer === opt && !isCorrect
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                      : userAnswer === opt
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400"
                      : "border-[rgb(var(--border-subtle))] text-[rgb(var(--foreground))] hover:border-brand-300 dark:hover:border-brand-700"
                  }`}
                >
                  <MathText text={opt} />
                </button>
              ))}
            </div>
          ) : (
            /* Short answer */
            <div className="mb-5">
              <input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !checked && checkAnswer()}
                disabled={checked}
                placeholder="Type your answer..."
                className={inputClass}
              />
            </div>
          )}

          {/* Check / feedback */}
          {!checked ? (
            <button
              onClick={checkAnswer}
              disabled={!userAnswer.trim() || checkAnswerAI.isPending}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            >
              {checkAnswerAI.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : "Check Answer"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className={`flex items-start gap-2 p-3 rounded-xl ${isCorrect ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <span className={`text-sm font-semibold ${isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </span>
                  {aiFeedback && (
                    <p className={`text-sm mt-1 ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      <MathText text={aiFeedback} />
                    </p>
                  )}
                </div>
              </div>

              {!isCorrect && !showHint && !showAnswer && (
                <div className="flex gap-2">
                  <button onClick={() => setShowHint(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[rgb(var(--border-subtle))] text-[rgb(var(--foreground))] py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[rgb(var(--surface-raised))]">
                    <Lightbulb className="w-4 h-4 text-accent-500" /> Show Hint
                  </button>
                  <button onClick={() => setShowAnswer(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[rgb(var(--border-subtle))] text-[rgb(var(--foreground))] py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[rgb(var(--surface-raised))]">
                    <Eye className="w-4 h-4 text-brand-500" /> Show Answer
                  </button>
                </div>
              )}

              {showHint && !showAnswer && (
                <div className="bg-accent-50/50 dark:bg-accent-950/20 rounded-xl p-4 border border-accent-200 dark:border-accent-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-accent-500" />
                    <span className="text-xs font-semibold text-accent-600 dark:text-accent-400 uppercase">Hint</span>
                  </div>
                  <p className="text-sm text-[rgb(var(--foreground))]"><MathText text={q.hint} /></p>
                  <button onClick={() => setShowAnswer(true)} className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-semibold">Still stuck? Show answer</button>
                </div>
              )}

              {(showAnswer || isCorrect) && (
                <div className="bg-brand-50/50 dark:bg-brand-950/20 rounded-xl p-4 border border-brand-200 dark:border-brand-800">
                  {!isCorrect && (
                    <p className="text-sm font-semibold text-[rgb(var(--foreground))] mb-1">Answer: <MathText text={q.correct_answer} /></p>
                  )}
                  <p className="text-sm text-surface-600 dark:text-surface-400"><MathText text={q.explanation} /></p>
                </div>
              )}

              <button
                onClick={nextQuestion}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-sm font-semibold transition-all"
              >
                {qIndex + 1 >= questions.length ? "See Results" : "Next Question"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quiz finished */}
      {tab === "quiz" && finished && (
        <div className="glass rounded-2xl shadow-soft p-8 text-center animate-fade-up">
          <CheckCircle2 className="w-12 h-12 text-brand-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-[rgb(var(--foreground))] mb-2">Quiz Complete!</h2>
          <p className="text-4xl font-display font-bold text-brand-500 mb-2">{score}/{questions.length}</p>
          <p className="text-surface-400 text-sm mb-6">
            {score === questions.length ? "Perfect score!" : score >= questions.length * 0.7 ? "Great job!" : "Keep practicing!"}
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={resetQuiz} className="inline-flex items-center gap-2 border border-[rgb(var(--border-subtle))] text-[rgb(var(--foreground))] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[rgb(var(--surface-raised))]">
              <RotateCcw className="w-4 h-4" /> New Quiz
            </button>
            <button onClick={handleGenerateQuiz} disabled={genQuiz.isPending} className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60">
              <Sparkles className="w-4 h-4" /> {genQuiz.isPending ? "Generating..." : "Try Again"}
            </button>
          </div>
        </div>
      )}

      {/* Flashcards flow */}
      {tab === "flashcards" && flashcards.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Card {fIndex + 1}/{flashcards.length}</span>
            <button onClick={shuffleCards} className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-500 transition-colors">
              <Shuffle className="w-3.5 h-3.5" /> Shuffle
            </button>
          </div>

          {/* Flip card */}
          <div
            onClick={() => setFlipped((f) => !f)}
            className="cursor-pointer perspective-1000 mb-5"
            style={{ perspective: "1000px" }}
          >
            <div
              className="relative w-full transition-transform duration-500"
              style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
            >
              {/* Front */}
              <div className="glass rounded-2xl shadow-soft p-8 min-h-[220px] flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
                <p className="text-xs text-surface-400 uppercase tracking-wider mb-3">Tap to flip</p>
                <p className="text-lg font-semibold text-[rgb(var(--foreground))] leading-relaxed"><MathText text={flashcards[fIndex].front} /></p>
              </div>
              {/* Back */}
              <div
                className="glass rounded-2xl shadow-soft p-8 min-h-[220px] flex flex-col items-center justify-center text-center absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-xs text-brand-500 uppercase tracking-wider mb-3">Answer</p>
                <p className="text-lg font-semibold text-[rgb(var(--foreground))] leading-relaxed mb-3"><MathText text={flashcards[fIndex].back} /></p>
                {flashcards[fIndex].mnemonic && (
                  <p className="text-xs text-surface-400 italic">💡 {flashcards[fIndex].mnemonic}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { setFIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
              disabled={fIndex === 0}
              className="p-3 rounded-xl border border-[rgb(var(--border-subtle))] text-surface-400 hover:text-[rgb(var(--foreground))] transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5">
              {flashcards.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === fIndex ? "w-5 bg-brand-500" : "w-1.5 bg-surface-200 dark:bg-surface-800"}`} />
              ))}
            </div>
            <button
              onClick={() => { setFIndex((i) => Math.min(flashcards.length - 1, i + 1)); setFlipped(false); }}
              disabled={fIndex === flashcards.length - 1}
              className="p-3 rounded-xl border border-[rgb(var(--border-subtle))] text-surface-400 hover:text-[rgb(var(--foreground))] transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
