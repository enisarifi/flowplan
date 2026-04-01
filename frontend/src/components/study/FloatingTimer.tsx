"use client";

import { useEffect, useState } from "react";
import { useTimerStore, TimerPhase } from "@/store/useTimerStore";
import { useCompleteSession } from "@/hooks/useSchedule";
import { toast } from "sonner";
import {
  Play, Pause, Square, RotateCcw, Timer, Coffee,
  ChevronUp, ChevronDown, X, SkipForward, Star,
  CheckCircle2, PartyPopper, Maximize2,
} from "lucide-react";
import dynamic from "next/dynamic";
const FocusMode = dynamic(() => import("./FocusMode"), { ssr: false });

export default function FloatingTimer() {
  const store = useTimerStore();
  const {
    phase, secondsLeft, isRunning, currentEntry, queue, currentIndex,
    sessionWorkedSeconds, dailyWorkedSeconds, completedToday,
    togglePause, stopAll, startNext, finishFeedback, skipToNext, reset, tick,
  } = store;

  const completeSession = useCompleteSession();
  const [expanded, setExpanded] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [energy, setEnergy] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [completionPct, setCompletionPct] = useState(100);

  // Tick interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  if (phase === "idle") return null;
  if (focusMode) return <FocusMode onExit={() => setFocusMode(false)} />;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const dailyMin = Math.floor(dailyWorkedSeconds / 60);
  const sessionMin = Math.floor(sessionWorkedSeconds / 60);
  const nextEntry = currentIndex + 1 < queue.length ? queue[currentIndex + 1] : null;

  const handleStop = () => {
    const { dailyMinutes, sessionsCompleted } = stopAll();
    toast.success(
      `Session ended. ${dailyMinutes > 0 ? `You studied for ${dailyMinutes}m today (${sessionsCompleted} session${sessionsCompleted !== 1 ? "s" : ""}).` : ""}`,
      {
        duration: 6000,
        action: {
          label: "Undo",
          onClick: () => {
            useTimerStore.getState().restore();
            toast.info("Timer restored.");
          },
        },
      }
    );
  };

  const handleSubmitFeedback = async () => {
    if (currentEntry) {
      try {
        await completeSession.mutateAsync({
          id: currentEntry.id,
          energy_rating: energy,
          difficulty_rating: difficulty,
          completion_pct: completionPct,
          actual_duration_min: sessionMin,
        });
      } catch {
        // Silent fail — session might already be completed
      }
    }
    setEnergy(3);
    setDifficulty(3);
    setCompletionPct(100);
    finishFeedback();
  };

  // Collapsed pill
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 glass-strong rounded-full shadow-heavy hover:shadow-glow transition-all animate-scale-in"
      >
        <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : phase === "feedback" ? "bg-amber-500" : "bg-brand-500"}`} />
        <span className="font-display font-bold text-sm text-[rgb(var(--foreground))] tabular-nums">{timeStr}</span>
        {currentEntry && <span className="text-xs text-surface-400 max-w-[120px] truncate">{currentEntry.title}</span>}
        <ChevronUp className="w-3.5 h-3.5 text-surface-400" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 glass-strong rounded-2xl shadow-heavy animate-scale-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border-subtle))]">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-brand-500" />
          <span className="text-xs font-semibold text-[rgb(var(--foreground))]">
            {phase === "break" ? "Break time" : phase === "feedback" ? "Rate session" : phase === "done" ? "All done!" : "Studying"}
          </span>
          <span className="text-xs text-surface-400">
            {completedToday.length}/{queue.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(false)} className="p-1 rounded-lg hover:bg-[rgb(var(--surface-raised))] transition-colors">
            <ChevronDown className="w-4 h-4 text-surface-400" />
          </button>
          <button onClick={handleStop} title="End session" className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors text-surface-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* === WORK PHASE === */}
        {phase === "work" && (
          <>
            {currentEntry && (
              <p className="text-sm font-semibold text-[rgb(var(--foreground))] truncate mb-1">{currentEntry.title}</p>
            )}
            {currentEntry?.ai_suggested_topic && (
              <p className="text-xs text-surface-400 truncate mb-4">{currentEntry.ai_suggested_topic}</p>
            )}
            <div className="text-center mb-4">
              <span className="text-4xl font-display font-bold text-[rgb(var(--foreground))] tabular-nums">{timeStr}</span>
              <p className="text-xs text-surface-400 mt-1">Session: {sessionMin}m studied</p>
            </div>
            <div className="flex justify-center gap-2">
              <button onClick={togglePause} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-[rgb(var(--surface-raised))] text-[rgb(var(--foreground))]">
                {isRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
              </button>
              <button onClick={() => setFocusMode(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all" title="Focus mode">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={skipToNext} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-surface-400 hover:text-surface-600 transition-all">
                <SkipForward className="w-3.5 h-3.5" /> Skip
              </button>
            </div>
          </>
        )}

        {/* === FEEDBACK PHASE === */}
        {phase === "feedback" && (
          <>
            <p className="text-sm font-semibold text-[rgb(var(--foreground))] mb-1">
              {currentEntry?.title} — {sessionMin}m
            </p>
            <p className="text-xs text-surface-400 mb-4">Rate this session to continue</p>

            <div className="space-y-3 mb-4">
              <MiniStarRow label="Energy" value={energy} onChange={setEnergy} />
              <MiniStarRow label="Difficulty" value={difficulty} onChange={setDifficulty} />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-surface-500">Completion</span>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} step={10} value={completionPct} onChange={(e) => setCompletionPct(Number(e.target.value))} className="w-24 h-1.5" />
                  <span className="text-xs font-semibold text-[rgb(var(--foreground))] w-8 text-right">{completionPct}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmitFeedback}
              disabled={completeSession.isPending}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-brand-sm disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {completeSession.isPending ? "Saving..." : nextEntry ? "Submit & continue" : "Submit & finish"}
            </button>
          </>
        )}

        {/* === BREAK PHASE === */}
        {phase === "break" && (
          <>
            <div className="text-center mb-4">
              <Coffee className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <span className="text-3xl font-display font-bold text-green-500 tabular-nums">{timeStr}</span>
              <p className="text-xs text-surface-400 mt-2">Take a break. You earned it.</p>
            </div>
            {nextEntry && (
              <div className="bg-[rgb(var(--surface-raised))] rounded-xl p-3 mb-3">
                <p className="text-xs text-surface-400">Next up</p>
                <p className="text-sm font-semibold text-[rgb(var(--foreground))] truncate">{nextEntry.title}</p>
              </div>
            )}
            <div className="flex justify-center gap-2">
              <button onClick={togglePause} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[rgb(var(--surface-raised))] text-[rgb(var(--foreground))]">
                {isRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
              </button>
              <button onClick={() => { store.startNext(); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-surface-400 hover:text-surface-600">
                <SkipForward className="w-3.5 h-3.5" /> Skip break
              </button>
            </div>
          </>
        )}

        {/* === DONE PHASE === */}
        {phase === "done" && (
          <div className="text-center py-2">
            <PartyPopper className="w-10 h-10 text-accent-500 mx-auto mb-3" />
            <p className="text-lg font-display font-bold text-[rgb(var(--foreground))] mb-1">Great work!</p>
            <p className="text-sm text-surface-500 mb-4">
              {completedToday.length} session{completedToday.length !== 1 ? "s" : ""} · {dailyMin}m studied
            </p>
            <button onClick={handleStop} className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-brand-sm">
              <RotateCcw className="w-4 h-4" /> Done
            </button>
          </div>
        )}

        {/* Daily total (visible in work/break phases) */}
        {(phase === "work" || phase === "break") && dailyWorkedSeconds > 0 && (
          <p className="text-center text-xs text-surface-400 mt-3 pt-3 border-t border-[rgb(var(--border-subtle))]">
            Today: {dailyMin}m studied · {completedToday.length} done
          </p>
        )}
      </div>
    </div>
  );
}

function MiniStarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-surface-500">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
            <Star className={`w-4 h-4 transition-colors ${n <= value ? "text-amber-400 fill-amber-400" : "text-surface-300 dark:text-surface-700"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
