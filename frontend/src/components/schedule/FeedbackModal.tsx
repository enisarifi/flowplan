"use client";

import { useState, useEffect, useCallback } from "react";
import { useCompleteSession, useSkipSession } from "@/hooks/useSchedule";
import { ScheduleEntry } from "@/types/api";
import { toast } from "sonner";
import { Star, CheckCircle, SkipForward, X } from "lucide-react";

interface Props {
  entry: ScheduleEntry;
  onClose: () => void;
}

export default function FeedbackModal({ entry, onClose }: Props) {
  const complete = useCompleteSession();
  const skip = useSkipSession();
  const [energy, setEnergy] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [completionPct, setCompletionPct] = useState(100);
  const [notes, setNotes] = useState("");

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  const handleComplete = async () => {
    try {
      await complete.mutateAsync({
        id: entry.id,
        energy_rating: energy,
        difficulty_rating: difficulty,
        completion_pct: completionPct,
        notes: notes || undefined,
      });
      toast.success("Session completed!");
      onClose();
    } catch {
      toast.error("Failed to save feedback. Please try again.");
    }
  };

  const handleSkip = async () => {
    try {
      await skip.mutateAsync(entry.id);
      toast.info("Session skipped.");
      onClose();
    } catch {
      toast.error("Failed to skip session.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-strong rounded-2xl shadow-heavy p-6 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">{entry.title}</h2>
            {entry.ai_suggested_topic && (
              <p className="text-surface-500 text-sm mt-0.5">{entry.ai_suggested_topic}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-5">
          <StarRating label="Energy level" value={energy} onChange={setEnergy} />
          <StarRating label="Difficulty" value={difficulty} onChange={setDifficulty} />

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
              Completion
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} step={10}
                value={completionPct}
                onChange={(e) => setCompletionPct(Number(e.target.value))}
                className="flex-1 accent-brand-500 h-2 rounded-full"
              />
              <span className={`text-sm font-semibold min-w-[3ch] text-right ${
                completionPct >= 80 ? "text-green-600 dark:text-green-400" :
                completionPct >= 50 ? "text-amber-600 dark:text-amber-400" :
                "text-red-500 dark:text-red-400"
              }`}>{completionPct}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What did you work on?"
              className="w-full border border-[rgb(var(--border-subtle))] bg-white dark:bg-surface-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-surface-200"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleComplete}
            disabled={complete.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          >
            <CheckCircle className="w-4 h-4" />
            {complete.isPending ? "Saving..." : "Mark complete"}
          </button>
          <button
            onClick={handleSkip}
            disabled={skip.isPending}
            className="inline-flex items-center justify-center gap-2 border border-[rgb(var(--border-subtle))] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                n <= (hovered || value)
                  ? "text-amber-400 fill-amber-400"
                  : "text-surface-300 dark:text-surface-700"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
