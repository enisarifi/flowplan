"use client";

import { useState, useEffect } from "react";
import { useSessionStats, useWeeklySummary, useExportIcal } from "@/hooks/useSchedule";
import type { SessionStats, WeeklySummary, Subject as SubjectType } from "@/types/api";
import { useSchedule, useGenerateSchedule, useAdaptSchedule } from "@/hooks/useSchedule";
import { useGoals } from "@/hooks/useGoals";
import { useSubjects } from "@/hooks/useSubjects";
import { format, startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useTimerStore } from "@/store/useTimerStore";
import { scheduleNotification, clearAllScheduled } from "@/lib/notifications";
import {
  Target,
  CheckCircle2,
  Zap,
  Sparkles,
  RefreshCw,
  CalendarClock,
  BookOpen,
  Clock,
  Sun,
  Moon,
  Sunset,
  Flame,
  Brain,
  Download,
  Play,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Timer,
  Share2,
} from "lucide-react";

function getGreeting(hour: number) {
  if (hour < 12) return { text: "Good morning", icon: Sun, color: "text-amber-400" };
  if (hour < 17) return { text: "Good afternoon", icon: Sunset, color: "text-orange-400" };
  return { text: "Good evening", icon: Moon, color: "text-brand-300" };
}

export default function DashboardPage() {
  const today = new Date();
  const user = useAppStore((s) => s.user);
  const greeting = getGreeting(today.getHours());
  const GreetingIcon = greeting.icon;
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: subjects = [] } = useSubjects();
  const { data: weeklySummary } = useWeeklySummary();
  const [showShareCard, setShowShareCard] = useState(false);
  const exportIcal = useExportIcal();
  const { data: goals = [] } = useGoals();
  const activeGoals = goals.filter((g) => !g.is_completed).slice(0, 3);

  const loadQueue = useTimerStore((s) => s.loadQueue);
  const startSession = useTimerStore((s) => s.startSession);
  const timerPhase = useTimerStore((s) => s.phase);
  const [showSummary, setShowSummary] = useState(true);

  const upcomingExams = subjects
    .filter((s) => s.exam_date && differenceInCalendarDays(new Date(s.exam_date), today) >= 0)
    .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
    .slice(0, 5);
  const { data: todaySessions, isLoading: sessionsLoading } = useSchedule(
    startOfDay(today).toISOString(),
    endOfDay(today).toISOString()
  );
  const generate = useGenerateSchedule();
  const adapt = useAdaptSchedule();

  // Calculate streak from today's data
  const streak = stats ? Math.min(stats.completed_sessions, 30) : 0;

  // Schedule browser notifications for upcoming sessions
  useEffect(() => {
    if (!todaySessions || localStorage.getItem("notif_enabled") !== "true") return;
    const reminderMin = Number(localStorage.getItem("notif_reminder_min") || "5");

    clearAllScheduled();
    const now = Date.now();

    todaySessions.forEach((entry) => {
      if (entry.status !== "planned") return;
      const start = new Date(entry.start_time).getTime();
      const delay = start - now - reminderMin * 60 * 1000;
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        scheduleNotification(
          `Study session starting soon`,
          `${entry.title} starts in ${reminderMin} minutes`,
          delay
        );
      }
    });

    // Exam alerts
    subjects.forEach((s) => {
      if (!s.exam_date) return;
      const days = differenceInCalendarDays(new Date(s.exam_date), today);
      if (days > 0 && days <= 3) {
        scheduleNotification(
          `Exam reminder`,
          `${s.name} exam in ${days} day${days > 1 ? "s" : ""}`,
          5000
        );
      }
    });

    return () => clearAllScheduled();
  }, [todaySessions, subjects]);

  const handleGenerate = () => {
    generate.mutate(undefined, {
      onSuccess: () => toast.success("Schedule generated! Head to the Schedule page to see it."),
      onError: () => toast.error("Failed to generate schedule. Make sure you have subjects and preferences set."),
    });
  };

  const handleAdapt = () => {
    adapt.mutate(undefined, {
      onSuccess: () => toast.success("Schedule adapted based on your recent sessions!"),
      onError: () => toast.error("Failed to adapt schedule. Complete some sessions first."),
    });
  };

  const handleExport = async () => {
    try {
      await exportIcal();
      toast.success("Schedule exported! Check your downloads.");
    } catch {
      toast.error("Failed to export schedule.");
    }
  };

  return (
    <div className="max-w-5xl animate-fade-in relative">
      {/* Gradient wash */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-50/50 to-transparent dark:from-brand-950/20 dark:to-transparent -z-10 rounded-3xl" />

      {/* Header with greeting + streak */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GreetingIcon className={`w-7 h-7 ${greeting.color}`} />
          <div>
            <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">
              {greeting.text}{user ? `, ${user.display_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-surface-500 text-sm">{format(today, "EEEE, MMMM d")}</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-[rgb(var(--foreground))]">{streak}</span>
            <span className="text-xs text-surface-400">sessions</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statsLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl shadow-soft p-5 animate-pulse">
              <div className="h-3 bg-surface-200 dark:bg-surface-800 rounded w-24 mb-3" />
              <div className="h-8 bg-surface-200 dark:bg-surface-800 rounded w-16" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard icon={<Target className="w-5 h-5" />} iconColor="text-brand-500" accentBorder="border-t-brand-500" label="Completion rate" value={`${stats.completion_rate}%`} accent={stats.completion_rate >= 70 ? "text-green-600 dark:text-green-400" : undefined} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} iconColor="text-green-500" accentBorder="border-t-green-500" label="Sessions completed" value={String(stats.completed_sessions)} />
            <StatCard icon={<Zap className="w-5 h-5" />} iconColor="text-accent-500" accentBorder="border-t-accent-500" label="Avg energy" value={stats.avg_energy_rating ? `${stats.avg_energy_rating}/5` : "—"} />
          </>
        ) : null}
      </div>

      {/* Goals widget */}
      {activeGoals.length > 0 && (
        <div className="glass rounded-2xl shadow-soft p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-display font-semibold text-[rgb(var(--foreground))]">Active Goals</span>
            </div>
            <a href="/goals" className="text-xs text-brand-500 hover:text-brand-600 font-semibold">View all</a>
          </div>
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[rgb(var(--foreground))] truncate">{goal.title}</span>
                  <span className="text-xs text-surface-400 shrink-0 ml-2">{Math.round(goal.progress_pct)}%</span>
                </div>
                <div className="h-1.5 bg-[rgb(var(--border-subtle))] rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(goal.progress_pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-pilot study flow */}
      {timerPhase === "idle" && todaySessions && todaySessions.filter((s) => s.status === "planned").length > 0 && (
        <div className="glass rounded-2xl shadow-soft p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-display font-semibold text-[rgb(var(--foreground))]">Study Flow</span>
            </div>
            <span className="text-xs text-surface-400">
              {todaySessions.filter((s) => s.status === "planned").length} sessions · ~{Math.round(todaySessions.filter((s) => s.status === "planned").reduce((a, s) => a + s.duration_min, 0) / 60 * 10) / 10}h
            </span>
          </div>
          {/* Mini timeline */}
          <div className="flex gap-1.5 mb-4">
            {todaySessions.filter((s) => s.status === "planned").slice(0, 6).map((s, i) => (
              <div key={s.id} className="flex-1 h-1.5 rounded-full bg-brand-200 dark:bg-brand-800" title={s.title} />
            ))}
          </div>
          <button
            onClick={() => loadQueue(todaySessions)}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-brand-sm hover:shadow-brand-md"
          >
            <Play className="w-4 h-4" />
            Start study flow
          </button>
        </div>
      )}

      {/* Today's sessions */}
      <div className="mb-6">
        <div className="glass rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-surface-400" />
            <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Today&apos;s sessions</h2>
          </div>
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between animate-pulse">
                  <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-48" />
                  <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-16" />
                </div>
              ))}
            </div>
          ) : !todaySessions || todaySessions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-surface-300 dark:text-surface-700 mx-auto mb-3" />
              <p className="text-surface-400 text-sm mb-3">No sessions scheduled today.</p>
              <button onClick={handleGenerate} disabled={generate.isPending} className="text-sm text-brand-500 hover:text-brand-600 font-semibold">
                Generate a schedule
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {todaySessions.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[rgb(var(--surface-raised))] transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-4 h-4 text-surface-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium text-sm text-[rgb(var(--foreground))] block truncate">{entry.title}</span>
                      <span className="text-xs text-surface-500">
                        {format(new Date(entry.start_time), "HH:mm")} – {format(new Date(entry.end_time), "HH:mm")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.status === "planned" && (
                      <button
                        onClick={() => timerPhase === "idle" && startSession(entry)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30"
                        title="Start studying"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      entry.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      entry.status === "skipped" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300"
                    }`}>{entry.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Weekly AI Summary */}
      {weeklySummary && weeklySummary.total_sessions > 0 && (
        <div className="glass rounded-2xl shadow-soft p-6 mb-6">
          <button
            onClick={() => setShowSummary((v) => !v)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-500" />
              <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Weekly Summary</h2>
              <span className="text-xs text-surface-400">
                {weeklySummary.completed_sessions}/{weeklySummary.total_sessions} sessions · {weeklySummary.total_hours_studied}h
              </span>
            </div>
            {showSummary ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
          </button>

          {showSummary && (
            <div className="mt-4 space-y-4 animate-fade-up">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="Completed" value={String(weeklySummary.completed_sessions)} />
                <MiniStat label="Hours" value={`${weeklySummary.total_hours_studied}h`} />
                <MiniStat label="Rate" value={`${weeklySummary.completion_rate}%`} />
                <MiniStat label="Energy" value={weeklySummary.avg_energy ? `${weeklySummary.avg_energy}/5` : "—"} />
              </div>

              {/* AI insights */}
              {weeklySummary.ai_summary && (
                <div className="bg-brand-50/50 dark:bg-brand-950/30 rounded-xl p-4 border border-brand-100 dark:border-brand-900">
                  <p className="text-sm text-[rgb(var(--foreground))] leading-relaxed">{weeklySummary.ai_summary}</p>
                </div>
              )}

              {weeklySummary.ai_tips && weeklySummary.ai_tips.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-accent-500" />
                    <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Tips for next week</span>
                  </div>
                  <ul className="space-y-1.5">
                    {weeklySummary.ai_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <TrendingUp className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subject highlights */}
              <div className="flex gap-4 text-xs">
                {weeklySummary.top_subject && (
                  <span className="text-surface-500">
                    Most studied: <span className="font-semibold text-[rgb(var(--foreground))]">{weeklySummary.top_subject}</span>
                  </span>
                )}
                {weeklySummary.weakest_subject && (
                  <span className="text-surface-500">
                    Needs attention: <span className="font-semibold text-accent-600 dark:text-accent-400">{weeklySummary.weakest_subject}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming exams */}
      <div className="glass rounded-2xl shadow-soft p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-4 h-4 text-surface-400" />
          <h2 className="text-base font-display font-semibold text-[rgb(var(--foreground))]">Upcoming exams</h2>
        </div>
        {upcomingExams.length === 0 ? (
          <p className="text-surface-400 text-sm">No upcoming exams — add exam dates in Subjects.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingExams.map((s) => {
              const days = differenceInCalendarDays(new Date(s.exam_date!), today);
              const badge =
                days === 0 ? { label: "Today", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" } :
                days === 1 ? { label: "Tomorrow", cls: "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400" } :
                days <= 7  ? { label: `${days} days`, cls: "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400" } :
                             { label: `${days} days`, cls: "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400" };
              return (
                <li key={s.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color_hex }} />
                    <span className="font-medium text-[rgb(var(--foreground))]">{s.name}</span>
                    <span className="text-surface-400">{format(new Date(s.exam_date!), "MMM d")}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="group inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm hover:shadow-brand-md"
        >
          {generate.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate new schedule</>}
        </button>
        <button
          onClick={handleAdapt}
          disabled={adapt.isPending}
          className="inline-flex items-center gap-2 border border-[rgb(var(--border-strong))] text-[rgb(var(--foreground))] hover:border-brand-300 dark:hover:border-brand-700 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-soft hover:shadow-medium"
        >
          {adapt.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adapting...</> : <><RefreshCw className="w-4 h-4" /> Re-adapt schedule</>}
        </button>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 border border-[rgb(var(--border-strong))] text-[rgb(var(--foreground))] hover:border-brand-300 dark:hover:border-brand-700 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-soft hover:shadow-medium"
        >
          <Download className="w-4 h-4" /> Export iCal
        </button>
        {stats && (
          <button
            onClick={() => setShowShareCard(true)}
            className="inline-flex items-center gap-2 border border-[rgb(var(--border-strong))] text-[rgb(var(--foreground))] hover:border-brand-300 dark:hover:border-brand-700 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-soft hover:shadow-medium"
          >
            <Share2 className="w-4 h-4" /> Share progress
          </button>
        )}
      </div>

      {showShareCard && stats && (
        <ShareCardModal
          user={user}
          stats={stats}
          weeklySummary={weeklySummary ?? null}
          subjects={subjects}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, iconColor, accentBorder, label, value, accent }: {
  icon: React.ReactNode; iconColor: string; accentBorder: string; label: string; value: string; accent?: string;
}) {
  return (
    <div className={`glass rounded-xl border-t-2 ${accentBorder} shadow-soft p-5 hover:shadow-medium transition-shadow`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColor}>{icon}</span>
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-display font-bold ${accent || "text-[rgb(var(--foreground))]"}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center py-2 px-3 rounded-xl bg-[rgb(var(--surface-raised))]">
      <p className="text-lg font-display font-bold text-[rgb(var(--foreground))]">{value}</p>
      <p className="text-xs text-surface-400">{label}</p>
    </div>
  );
}

function ShareCardModal({ user, stats, weeklySummary, subjects, onClose }: {
  user: ReturnType<typeof useAppStore<any>> | null;
  stats: SessionStats;
  weeklySummary: WeeklySummary | null;
  subjects: SubjectType[];
  onClose: () => void;
}) {
  const copied = useState(false);
  const [isCopied, setIsCopied] = copied;

  const text = [
    `📚 FlowPlan Weekly Progress`,
    ``,
    `✅ ${stats.completed_sessions} sessions completed`,
    `📈 ${stats.completion_rate}% completion rate`,
    weeklySummary ? `⏱ ${weeklySummary.total_hours_studied}h studied this week` : "",
    stats.avg_energy_rating ? `⚡ Avg energy: ${stats.avg_energy_rating}/5` : "",
    subjects.length > 0 ? `📖 Subjects: ${subjects.map((s) => s.name).join(", ")}` : "",
    ``,
    `#FlowPlan #StudySmart`,
  ].filter(Boolean).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm mx-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        {/* Card preview */}
        <div className="relative bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 mb-3 overflow-hidden shadow-heavy">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_80%,white,transparent_50%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-display font-bold">FlowPlan</span>
            </div>
            {user && <p className="text-white/70 text-xs mb-3">{user.display_name}</p>}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs mb-1">Sessions</p>
                <p className="text-white text-2xl font-display font-bold">{stats.completed_sessions}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs mb-1">Rate</p>
                <p className="text-white text-2xl font-display font-bold">{stats.completion_rate}%</p>
              </div>
              {weeklySummary && (
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs mb-1">Hours</p>
                  <p className="text-white text-2xl font-display font-bold">{weeklySummary.total_hours_studied}h</p>
                </div>
              )}
              {stats.avg_energy_rating && (
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs mb-1">Energy</p>
                  <p className="text-white text-2xl font-display font-bold">{stats.avg_energy_rating}/5</p>
                </div>
              )}
            </div>
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subjects.slice(0, 4).map((s) => (
                  <span key={s.id} className="px-2 py-0.5 bg-white/15 rounded-full text-white/80 text-xs">{s.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-all"
          >
            <Share2 className="w-4 h-4" />
            {isCopied ? "Copied!" : "Copy text"}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl border border-[rgb(var(--border-subtle))] text-sm text-surface-400 hover:text-[rgb(var(--foreground))] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
