"use client";

import { useState } from "react";
import { useCompleteSession, useSkipSession } from "@/hooks/useSchedule";
import { ScheduleEntry } from "@/types/api";

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

  const handleComplete = async () => {
    try {
      await complete.mutateAsync({
        id: entry.id,
        energy_rating: energy,
        difficulty_rating: difficulty,
        completion_pct: completionPct,
        notes: notes || undefined,
      });
      onClose();
    } catch {
      // error shown via complete.error
    }
  };

  const handleSkip = async () => {
    try {
      await skip.mutateAsync(entry.id);
      onClose();
    } catch {
      // error shown via skip.error
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">{entry.title}</h2>
        {entry.ai_suggested_topic && (
          <p className="text-slate-500 text-sm mb-4">{entry.ai_suggested_topic}</p>
        )}

        <div className="space-y-4">
          <RatingInput label="Energy level" value={energy} onChange={setEnergy} />
          <RatingInput label="Difficulty" value={difficulty} onChange={setDifficulty} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Completion %</label>
            <input
              type="range" min={0} max={100} step={10}
              value={completionPct}
              onChange={(e) => setCompletionPct(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <span className="text-xs text-slate-500">{completionPct}%</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {(complete.error || skip.error) && (
          <p className="text-red-500 text-sm mt-4">Something went wrong. Please try again.</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleComplete}
            disabled={complete.isPending}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
          >
            Mark complete
          </button>
          <button
            onClick={handleSkip}
            disabled={skip.isPending}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2 text-sm font-medium transition"
          >
            Skip
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-slate-400 hover:text-slate-600 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
              value === n ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
