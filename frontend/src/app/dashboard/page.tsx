"use client";

import { useState } from "react";
import { useSessionStats } from "@/hooks/useSchedule";
import { useSchedule, useGenerateSchedule, useAdaptSchedule } from "@/hooks/useSchedule";
import { format, startOfDay, endOfDay } from "date-fns";

export default function DashboardPage() {
  const today = new Date();
  const [successMsg, setSuccessMsg] = useState("");
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: todaySessions, isLoading: sessionsLoading } = useSchedule(
    startOfDay(today).toISOString(),
    endOfDay(today).toISOString()
  );
  const generate = useGenerateSchedule();
  const adapt = useAdaptSchedule();

  const handleGenerate = () => {
    setSuccessMsg("");
    generate.mutate(undefined, {
      onSuccess: () => setSuccessMsg("Schedule generated! Head to the Schedule page to see it."),
    });
  };

  const handleAdapt = () => {
    setSuccessMsg("");
    adapt.mutate(undefined, {
      onSuccess: () => setSuccessMsg("Schedule adapted based on your recent sessions!"),
    });
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">{format(today, "EEEE, MMMM d")}</p>

      {/* Stats row */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-24 mb-2" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Completion rate" value={`${stats.completion_rate}%`} />
          <StatCard label="Sessions completed" value={String(stats.completed_sessions)} />
          <StatCard label="Avg energy" value={stats.avg_energy_rating ? `${stats.avg_energy_rating}/5` : "—"} />
        </div>
      ) : null}

      {/* Today's sessions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Today's sessions</h2>
        {sessionsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-48" />
                <div className="h-4 bg-slate-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : !todaySessions || todaySessions.length === 0 ? (
          <p className="text-slate-400 text-sm">No sessions scheduled today.</p>
        ) : (
          <ul className="space-y-2">
            {todaySessions.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{entry.title}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  entry.status === "completed" ? "bg-green-100 text-green-700" :
                  entry.status === "skipped" ? "bg-red-100 text-red-700" :
                  "bg-brand-50 text-brand-600"
                }`}>{entry.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
        >
          {generate.isPending ? "Generating..." : "Generate new schedule"}
        </button>
        <button
          onClick={handleAdapt}
          disabled={adapt.isPending}
          className="border border-brand-500 text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
        >
          {adapt.isPending ? "Adapting..." : "Re-adapt schedule"}
        </button>
      </div>
      {successMsg && <p className="text-green-600 text-sm mt-2">{successMsg}</p>}
      {(generate.error || adapt.error) && (
        <p className="text-red-500 text-sm mt-2">Something went wrong. Make sure you have subjects and preferences set.</p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
