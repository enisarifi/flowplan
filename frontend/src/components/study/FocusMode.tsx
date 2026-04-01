"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/store/useTimerStore";
import { Minimize2, Pause, Play, SkipForward, X } from "lucide-react";

export default function FocusMode({ onExit }: { onExit: () => void }) {
  const { phase, secondsLeft, isRunning, currentEntry, togglePause, skipToNext, stopAll } = useTimerStore();

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = currentEntry ? 1 - secondsLeft / (currentEntry.duration_min * 60) : 0;
  const circumference = 2 * Math.PI * 90;

  // Exit focus mode if timer goes to a non-work phase
  useEffect(() => {
    if (phase !== "work") onExit();
  }, [phase, onExit]);

  // Escape key exits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onExit(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onExit]);

  const handleStop = () => {
    stopAll();
    onExit();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[rgb(var(--background))] flex flex-col items-center justify-center animate-fade-in select-none">
      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-accent-500/5 pointer-events-none" />

      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-6 right-6 p-2.5 rounded-xl glass hover:bg-[rgb(var(--surface-raised))] text-surface-400 hover:text-[rgb(var(--foreground))] transition-all"
        title="Exit focus mode (Esc)"
      >
        <Minimize2 className="w-5 h-5" />
      </button>

      {/* Stop button */}
      <button
        onClick={handleStop}
        className="absolute top-6 left-6 p-2.5 rounded-xl glass hover:bg-red-50 dark:hover:bg-red-950/20 text-surface-400 hover:text-red-500 transition-all"
        title="Stop session"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Subject name */}
      {currentEntry && (
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-surface-400 uppercase tracking-widest mb-2">Now studying</p>
          <h1 className="font-display text-3xl font-bold text-[rgb(var(--foreground))]">{currentEntry.title}</h1>
          {currentEntry.ai_suggested_topic && (
            <p className="text-surface-400 mt-2">{currentEntry.ai_suggested_topic}</p>
          )}
        </div>
      )}

      {/* Ring timer */}
      <div className="relative flex items-center justify-center mb-10">
        <svg width="220" height="220" className="-rotate-90">
          <circle cx="110" cy="110" r="90" fill="none" stroke="rgb(var(--border-subtle))" strokeWidth="6" />
          <circle
            cx="110" cy="110" r="90" fill="none"
            stroke={isRunning ? "rgb(var(--brand-500, 99 102 241))" : "#94a3b8"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(progress, 1))}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute text-center">
          <span className="font-display text-5xl font-bold text-[rgb(var(--foreground))] tabular-nums">{timeStr}</span>
          <p className="text-sm text-surface-400 mt-1">{isRunning ? "focused" : "paused"}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePause}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-3.5 rounded-2xl text-base font-semibold transition-all shadow-brand-md"
        >
          {isRunning ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Resume</>}
        </button>
        <button
          onClick={skipToNext}
          className="inline-flex items-center gap-2 glass px-5 py-3.5 rounded-2xl text-sm font-semibold text-surface-400 hover:text-[rgb(var(--foreground))] transition-all"
        >
          <SkipForward className="w-4 h-4" /> Skip
        </button>
      </div>

      {/* Hint */}
      <p className="absolute bottom-8 text-xs text-surface-300 dark:text-surface-700">Press Esc to exit focus mode</p>
    </div>
  );
}
