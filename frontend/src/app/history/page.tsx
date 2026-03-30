"use client";

import { useState } from "react";
import { useStudyHistory } from "@/hooks/useSchedule";
import { useSubjects } from "@/hooks/useSubjects";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import { History, Star, Clock, ChevronDown, ChevronRight, CalendarDays } from "lucide-react";

const DAYS_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HistoryPage() {
  const { data: subjects = [] } = useSubjects();
  const [filterSubject, setFilterSubject] = useState("");
  const [days, setDays] = useState(28);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const { data: history = [], isLoading } = useStudyHistory(days, filterSubject || undefined);

  // Build heatmap data (last N days)
  const today = new Date();
  const startDate = subDays(today, days - 1);
  const allDays = eachDayOfInterval({ start: startDate, end: today });
  const dayMinutes: Record<string, number> = {};
  history.forEach((d) => { dayMinutes[d.date] = d.total_minutes; });

  const maxMinutes = Math.max(...Object.values(dayMinutes), 1);

  // Stats
  const totalMinutes = history.reduce((a, d) => a + d.total_minutes, 0);
  const totalSessions = history.reduce((a, d) => a + d.session_count, 0);
  const avgPerDay = history.length > 0 ? Math.round(totalMinutes / history.length) : 0;

  const inputClass = "border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-[rgb(var(--foreground))] transition-all";

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-brand-500" />
          <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">Study History</h1>
        </div>
        <div className="flex gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={inputClass}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className={inputClass}>
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-[rgb(var(--foreground))]">{Math.round(totalMinutes / 60 * 10) / 10}h</p>
          <p className="text-xs text-surface-400">Total studied</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-[rgb(var(--foreground))]">{totalSessions}</p>
          <p className="text-xs text-surface-400">Sessions completed</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-[rgb(var(--foreground))]">{avgPerDay}m</p>
          <p className="text-xs text-surface-400">Avg per study day</p>
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className="glass rounded-2xl shadow-soft p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-surface-400" />
          <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] flex-wrap" style={{ maxWidth: `${Math.ceil(allDays.length / 7) * 17}px` }}>
            {allDays.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const mins = dayMinutes[key] || 0;
              const intensity = mins > 0 ? Math.max(0.15, mins / maxMinutes) : 0;
              return (
                <div
                  key={key}
                  className="w-3.5 h-3.5 rounded-sm transition-colors cursor-default"
                  style={{
                    backgroundColor: intensity > 0
                      ? `rgba(108, 92, 231, ${intensity})`
                      : "rgb(var(--surface-raised))",
                  }}
                  title={`${format(d, "MMM d")}: ${mins > 0 ? `${Math.round(mins / 60 * 10) / 10}h studied` : "No activity"}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-surface-400">Less</span>
            <div className="flex gap-[2px]">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: o === 0 ? "rgb(var(--surface-raised))" : `rgba(108, 92, 231, ${o})` }} />
              ))}
            </div>
            <span className="text-[10px] text-surface-400">More</span>
          </div>
        </div>
      </div>

      {/* Session log */}
      <div className="glass rounded-2xl shadow-soft p-6">
        <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))] mb-4">Session log</h2>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-200 dark:bg-surface-800 rounded-xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-surface-400 text-sm text-center py-8">No completed sessions in this period.</p>
        ) : (
          <div className="space-y-2">
            {history.map((day) => (
              <div key={day.date} className="rounded-xl border border-[rgb(var(--border-subtle))] overflow-hidden">
                {/* Day header */}
                <button
                  onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgb(var(--surface-raised))] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedDay === day.date ? <ChevronDown className="w-4 h-4 text-surface-400" /> : <ChevronRight className="w-4 h-4 text-surface-400" />}
                    <span className="text-sm font-semibold text-[rgb(var(--foreground))]">
                      {format(parseISO(day.date), "EEEE, MMM d")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-400">
                    <span>{day.session_count} session{day.session_count !== 1 ? "s" : ""}</span>
                    <span className="font-mono">{Math.round(day.total_minutes / 60 * 10) / 10}h</span>
                  </div>
                </button>

                {/* Expanded entries */}
                {expandedDay === day.date && (
                  <div className="border-t border-[rgb(var(--border-subtle))] px-4 py-2 space-y-2">
                    {day.entries.map((entry) => (
                      <div key={entry.entry_id} className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {entry.subject_color && (
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.subject_color }} />
                          )}
                          <div className="min-w-0">
                            <span className="font-medium text-[rgb(var(--foreground))] truncate block">{entry.title}</span>
                            <span className="text-xs text-surface-400">
                              {entry.subject_name || "General"} · {entry.actual_min || entry.planned_min}m
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {entry.energy && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="text-xs text-surface-400">{entry.energy}</span>
                            </div>
                          )}
                          {entry.completion_pct !== null && (
                            <span className={`text-xs font-semibold ${
                              entry.completion_pct >= 80 ? "text-green-500" :
                              entry.completion_pct >= 50 ? "text-amber-500" : "text-red-500"
                            }`}>{entry.completion_pct}%</span>
                          )}
                          <span className="text-xs text-surface-400 font-mono">
                            {format(parseISO(entry.completed_at), "HH:mm")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
