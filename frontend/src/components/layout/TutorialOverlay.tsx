"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  GraduationCap, BookOpen, Target, Timer, Sparkles,
  ArrowRight, X, CheckCircle2, LayoutDashboard,
} from "lucide-react";

const STEPS = [
  { title: "Welcome to FlowPlan!", description: "Your AI-powered study planner that adapts to how you actually learn. Let's take a quick tour.", icon: <GraduationCap className="w-7 h-7 text-brand-500" /> },
  { title: "Add your subjects", description: "Go to Subjects and add what you're studying — set difficulty, weekly hours, and exam dates so the AI builds the right plan.", icon: <BookOpen className="w-7 h-7 text-green-500" /> },
  { title: "Generate your schedule", description: 'Hit "Generate new schedule" on the Dashboard. Claude creates a personalized weekly plan based on your subjects and preferences.', icon: <Sparkles className="w-7 h-7 text-accent-500" /> },
  { title: "Start a study flow", description: 'Click "Start study flow" on the Dashboard. The auto-pilot timer guides you through each session — rate each one to help the AI adapt.', icon: <Timer className="w-7 h-7 text-brand-500" /> },
  { title: "Track your goals", description: "Set study targets on the Goals page — hours, sessions, or completion milestones. Progress updates as you study.", icon: <Target className="w-7 h-7 text-accent-500" /> },
  { title: "Review your progress", description: "Check Progress and History for trends, energy heatmaps, and your AI weekly summary. The schedule re-adapts based on your feedback.", icon: <LayoutDashboard className="w-7 h-7 text-green-500" /> },
  { title: "You're all set!", description: "Start by adding your subjects, then generate a schedule. Good luck!", icon: <CheckCircle2 className="w-7 h-7 text-green-500" /> },
];

export default function TutorialOverlay() {
  const user = useAppStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!localStorage.getItem("tutorial_done")) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  const dismiss = () => { localStorage.setItem("tutorial_done", "true"); setVisible(false); };
  const next = () => step < STEPS.length - 1 ? setStep((s) => s + 1) : dismiss();

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <>
      {/* Dark backdrop — pointer-events-none so nothing underneath is blocked */}
      <div className="fixed inset-0 bg-black/60 z-[200] pointer-events-none" />

      {/* Centered card — its own layer, fully interactive */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none">
        <div className="w-80 bg-[rgb(var(--surface))] border border-[rgb(var(--border-subtle))] rounded-2xl shadow-heavy p-5 pointer-events-auto">
          {/* Progress dots */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-5 bg-brand-500" : i < step ? "w-1.5 bg-brand-300 dark:bg-brand-700" : "w-1.5 bg-surface-200 dark:bg-surface-800"}`} />
              ))}
            </div>
            <button onClick={dismiss} className="p-1 rounded-lg hover:bg-[rgb(var(--surface-raised))] text-surface-400 hover:text-[rgb(var(--foreground))] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 mb-5">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-[rgb(var(--surface-raised))] flex items-center justify-center">
              {current.icon}
            </div>
            <div>
              <h3 className="font-display font-bold text-[rgb(var(--foreground))] mb-1 text-sm">{current.title}</h3>
              <p className="text-xs text-surface-500 leading-relaxed">{current.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={dismiss} className="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
              Skip tour
            </button>
            <button onClick={next} className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-brand-sm">
              {step === STEPS.length - 1 ? <><CheckCircle2 className="w-3.5 h-3.5" /> Get started</> : <>Next <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
