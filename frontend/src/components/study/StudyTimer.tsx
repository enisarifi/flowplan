"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, Square, RotateCcw, Timer, Coffee } from "lucide-react";

interface Props {
  sessionTitle?: string;
  sessionMinutes?: number;
  breakMinutes?: number;
  onComplete?: (actualMinutes: number) => void;
}

type Phase = "idle" | "work" | "break" | "done";

export default function StudyTimer({
  sessionTitle,
  sessionMinutes = 25,
  breakMinutes = 5,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(sessionMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalWorkedSeconds, setTotalWorkedSeconds] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = phase === "break" ? breakMinutes * 60 : sessionMinutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    // Create a simple beep using AudioContext when timer ends
    audioRef.current = null;
  }, []);

  const playSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 300);
    } catch {
      // Audio not available
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Track work time OUTSIDE the updater to avoid React double-invocation
      if (phase === "work") {
        setTotalWorkedSeconds((t) => t + 1);
      }

      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playSound();

          if (phase === "work") {
            setPhase("break");
            setIsRunning(false);
            return breakMinutes * 60;
          } else if (phase === "break") {
            setPhase("done");
            setIsRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, phase, sessionMinutes, breakMinutes, playSound]);

  const handleStart = () => {
    if (phase === "idle") setPhase("work");
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleStop = () => {
    setIsRunning(false);
    if (totalWorkedSeconds > 0 && onComplete) {
      onComplete(Math.round(totalWorkedSeconds / 60));
    }
    setPhase("idle");
    setSecondsLeft(sessionMinutes * 60);
    setTotalWorkedSeconds(0);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase("idle");
    setSecondsLeft(sessionMinutes * 60);
    setTotalWorkedSeconds(0);
  };

  const handleStartBreak = () => {
    setPhase("break");
    setSecondsLeft(breakMinutes * 60);
    setIsRunning(true);
  };

  const handleSkipBreak = () => {
    setPhase("done");
    setSecondsLeft(0);
    setIsRunning(false);
  };

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="glass rounded-2xl shadow-soft p-6">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-4 h-4 text-surface-400" />
        <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">
          Study Timer
        </h2>
        {phase === "break" && (
          <span className="ml-auto px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
            <Coffee className="w-3 h-3" /> Break
          </span>
        )}
      </div>

      {sessionTitle && phase !== "idle" && (
        <p className="text-sm text-surface-500 mb-4 truncate">{sessionTitle}</p>
      )}

      {/* Circular progress */}
      <div className="flex justify-center mb-5">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="rgb(var(--border-subtle))"
              strokeWidth="6"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={phase === "break" ? "#22c55e" : "#6c5ce7"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-bold text-[rgb(var(--foreground))] tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-xs text-surface-400 mt-0.5">
              {phase === "idle" ? "Ready" : phase === "work" ? "Studying" : phase === "break" ? "Break" : "Done"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {phase === "idle" && (
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-brand-sm"
          >
            <Play className="w-4 h-4" /> Start
          </button>
        )}

        {(phase === "work" || (phase === "break" && isRunning)) && (
          <>
            {isRunning ? (
              <button
                onClick={handlePause}
                className="inline-flex items-center gap-2 bg-surface-200 dark:bg-surface-700 text-[rgb(var(--foreground))] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-brand-sm"
              >
                <Play className="w-4 h-4" /> Resume
              </button>
            )}
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-2 border border-[rgb(var(--border-strong))] text-surface-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </>
        )}

        {phase === "break" && !isRunning && secondsLeft === breakMinutes * 60 && (
          <div className="flex gap-2">
            <button
              onClick={handleStartBreak}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Coffee className="w-4 h-4" /> Take Break
            </button>
            <button
              onClick={handleSkipBreak}
              className="inline-flex items-center gap-2 border border-[rgb(var(--border-strong))] text-surface-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Skip
            </button>
          </div>
        )}

        {phase === "done" && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-brand-sm"
          >
            <RotateCcw className="w-4 h-4" /> New Session
          </button>
        )}
      </div>

      {/* Total time worked this session */}
      {totalWorkedSeconds > 0 && (
        <p className="text-center text-xs text-surface-400 mt-3">
          Total studied: {Math.floor(totalWorkedSeconds / 60)}m {totalWorkedSeconds % 60}s
        </p>
      )}
    </div>
  );
}
