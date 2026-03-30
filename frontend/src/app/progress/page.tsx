"use client";

import dynamic from "next/dynamic";
import { useSessionStats, useSubjectStats, useWeeklyTrend, useEnergyHeatmap } from "@/hooks/useSchedule";
import { Target, CheckCircle2, Zap, BarChart3, Trophy, TrendingUp, Clock } from "lucide-react";

const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });

const CHART_COLORS = ["#6c5ce7", "#f99b07", "#22c55e", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: subjectStats = [], isLoading: subjectLoading } = useSubjectStats();
  const { data: weeklyTrend = [] } = useWeeklyTrend();
  const { data: heatmap = [] } = useEnergyHeatmap();

  const maxHours = subjectStats.length > 0
    ? Math.max(...subjectStats.map((s) => s.total_minutes_studied / 60), 1)
    : 1;

  // Prepare pie chart data
  const pieData = subjectStats
    .filter((s) => s.total_minutes_studied > 0)
    .map((s, i) => ({
      name: s.subject_name,
      value: Math.round(s.total_minutes_studied / 60 * 10) / 10,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  // Prepare trend data
  const trendData = weeklyTrend.map((t) => ({
    date: t.date.slice(5), // "MM-DD"
    sessions: t.sessions,
    hours: Math.round(t.minutes / 60 * 10) / 10,
  }));

  // Build heatmap grid (7 days x 17 hours: 6am-11pm)
  const heatmapGrid: (number | null)[][] = Array.from({ length: 7 }, () => Array(17).fill(null));
  heatmap.forEach((h) => {
    if (h.hour >= 6 && h.hour <= 22) {
      heatmapGrid[h.day][h.hour - 6] = h.avg_energy;
    }
  });

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">Progress</h1>
        <p className="text-surface-500 text-sm mt-1">Your study activity and performance analytics.</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl shadow-soft p-5 animate-pulse">
              <div className="h-3 bg-[rgb(var(--border-subtle))] rounded w-24 mb-3" />
              <div className="h-8 bg-[rgb(var(--border-subtle))] rounded w-16" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard icon={<Target className="w-5 h-5 text-brand-500" />} label="Completion rate" value={`${stats.completion_rate}%`} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Sessions completed" value={String(stats.completed_sessions)} />
            <StatCard icon={<Zap className="w-5 h-5 text-accent-500" />} label="Avg energy" value={stats.avg_energy_rating ? `${stats.avg_energy_rating}/5` : "—"} />
          </>
        ) : null}
      </div>

      {subjectLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl shadow-soft p-6 animate-pulse">
              <div className="h-4 bg-[rgb(var(--border-subtle))] rounded w-32 mb-4" />
              <div className="h-48 bg-[rgb(var(--border-subtle))] rounded" />
            </div>
          ))}
        </div>
      ) : subjectStats.length === 0 ? (
        <div className="glass rounded-2xl shadow-soft p-16 text-center">
          <BarChart3 className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-display font-bold text-[rgb(var(--foreground))] mb-2">No data yet</h3>
          <p className="text-surface-400 text-sm">Complete some study sessions to see your analytics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weekly trend chart */}
          {trendData.length > 0 && (
            <div className="glass rounded-2xl shadow-soft p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-surface-400" />
                <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Study activity (last 4 weeks)</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-subtle))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(var(--foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(var(--surface))",
                      border: "1px solid rgb(var(--border-subtle))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="sessions" stroke="#6c5ce7" strokeWidth={2} dot={{ r: 3, fill: "#6c5ce7" }} name="Sessions" />
                  <Line type="monotone" dataKey="hours" stroke="#f99b07" strokeWidth={2} dot={{ r: 3, fill: "#f99b07" }} name="Hours" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two-column: pie chart + hours per subject */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject time pie chart */}
            {pieData.length > 0 && (
              <div className="glass rounded-2xl shadow-soft p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-4 h-4 text-surface-400" />
                  <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Time distribution</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}h`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-surface-500">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hours studied per subject */}
            <div className="glass rounded-2xl shadow-soft p-6">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-surface-400" />
                <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Hours per subject</h2>
              </div>
              <div className="space-y-4">
                {subjectStats.map((s) => {
                  const hours = s.total_minutes_studied / 60;
                  const pct = (hours / maxHours) * 100;
                  return (
                    <div key={s.subject_id}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-[rgb(var(--foreground))] font-medium">{s.subject_name}</span>
                        <span className="text-surface-400 font-mono text-xs">{hours.toFixed(1)}h</span>
                      </div>
                      <div className="h-2.5 bg-[rgb(var(--border-subtle))] rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Energy heatmap */}
          {heatmap.length > 0 && (
            <div className="glass rounded-2xl shadow-soft p-6">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-4 h-4 text-surface-400" />
                <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Energy heatmap</h2>
                <span className="text-xs text-surface-400 ml-auto">When you study best</span>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Hour labels */}
                  <div className="flex ml-12 mb-1">
                    {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                      <div key={h} className="flex-1 text-center text-[10px] text-surface-400">
                        {h % 2 === 0 ? `${h}:00` : ""}
                      </div>
                    ))}
                  </div>
                  {/* Grid */}
                  {DAYS.map((day, di) => (
                    <div key={day} className="flex items-center gap-1 mb-1">
                      <span className="w-10 text-xs text-surface-400 text-right pr-1 shrink-0">{day}</span>
                      <div className="flex flex-1 gap-px">
                        {heatmapGrid[di].map((val, hi) => (
                          <div
                            key={hi}
                            className="flex-1 h-6 rounded-sm transition-colors"
                            style={{
                              backgroundColor: val === null
                                ? "rgb(var(--surface-raised))"
                                : `rgba(108, 92, 231, ${Math.max(0.1, (val / 5) * 0.9)})`,
                            }}
                            title={val !== null ? `${DAYS[di]} ${hi + 6}:00 — Energy: ${val}/5` : "No data"}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3 ml-12">
                    <span className="text-[10px] text-surface-400">Low energy</span>
                    <div className="flex gap-px">
                      {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
                        <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(108, 92, 231, ${opacity})` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-surface-400">High energy</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion rate per subject */}
          <div className="glass rounded-2xl shadow-soft p-6">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="w-4 h-4 text-surface-400" />
              <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Completion rate per subject</h2>
            </div>
            <div className="space-y-4">
              {subjectStats.map((s) => (
                <div key={s.subject_id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[rgb(var(--foreground))] font-medium">{s.subject_name}</span>
                    <span className="text-surface-400 text-xs">
                      {s.completed_sessions}/{s.total_sessions} · <span className={`font-semibold ${
                        s.completion_rate >= 70 ? "text-green-600 dark:text-green-400" :
                        s.completion_rate >= 40 ? "text-amber-600 dark:text-amber-400" :
                        "text-red-500 dark:text-red-400"
                      }`}>{s.completion_rate}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-[rgb(var(--border-subtle))] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.completion_rate >= 70 ? "bg-green-500" : s.completion_rate >= 40 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${s.completion_rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary table */}
          <div className="glass rounded-2xl shadow-soft p-6 overflow-x-auto">
            <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))] mb-4">Summary</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-[rgb(var(--border-subtle))]">
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium text-right">Sessions</th>
                  <th className="pb-3 font-medium text-right">Completed</th>
                  <th className="pb-3 font-medium text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((s) => (
                  <tr key={s.subject_id} className="border-b border-[rgb(var(--border-subtle))]/50 last:border-0 hover:bg-[rgb(var(--surface-raised))] transition-colors">
                    <td className="py-3 font-medium text-[rgb(var(--foreground))]">{s.subject_name}</td>
                    <td className="py-3 text-right text-surface-500">{s.total_sessions}</td>
                    <td className="py-3 text-right text-surface-500">{s.completed_sessions}</td>
                    <td className="py-3 text-right text-surface-500">{(s.total_minutes_studied / 60).toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-xl shadow-soft p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-display font-bold text-[rgb(var(--foreground))]">{value}</p>
    </div>
  );
}
