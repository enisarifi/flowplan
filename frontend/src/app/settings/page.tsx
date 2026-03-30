"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserPreferences } from "@/types/api";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { Settings, Save, Clock, Timer, Palette, Sun, Moon, Bell } from "lucide-react";
import { requestPermission } from "@/lib/notifications";

const inputClass = "w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[rgb(var(--foreground))] transition-all";
const labelClass = "block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5";

type Tab = "study" | "timer" | "appearance";

export default function SettingsPage() {
  const qc = useQueryClient();
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const [tab, setTab] = useState<Tab>("study");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [reminderMin, setReminderMin] = useState(5);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await api.get<UserPreferences>("/users/me/preferences");
      return res.data;
    },
  });

  const { register, handleSubmit, reset } = useForm<Partial<UserPreferences>>();

  useEffect(() => {
    if (prefs) reset(prefs);
  }, [prefs, reset]);

  useEffect(() => {
    setNotifEnabled(localStorage.getItem("notif_enabled") === "true");
    setReminderMin(Number(localStorage.getItem("notif_reminder_min") || "5"));
  }, []);

  const update = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      await api.put("/users/me/preferences", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Preferences saved!");
    },
    onError: () => toast.error("Failed to save preferences."),
  });

  const handleNotifToggle = async () => {
    if (!notifEnabled) {
      const granted = await requestPermission();
      if (!granted) {
        toast.error("Notification permission denied by browser.");
        return;
      }
    }
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem("notif_enabled", String(next));
    toast.success(next ? "Notifications enabled" : "Notifications disabled");
  };

  const handleReminderChange = (val: number) => {
    setReminderMin(val);
    localStorage.setItem("notif_reminder_min", String(val));
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "study", label: "Study", icon: <Clock className="w-4 h-4" /> },
    { key: "timer", label: "Timer", icon: <Timer className="w-4 h-4" /> },
    { key: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="max-w-2xl animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))] mb-6">Settings</h1>
        <div className="glass rounded-2xl shadow-soft p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 bg-surface-200 dark:bg-surface-800 rounded w-32 mb-2" />
              <div className="h-9 bg-surface-200 dark:bg-surface-800 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center ${
              tab === t.key
                ? "bg-brand-500 text-white shadow-brand-sm"
                : "text-surface-500 hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-raised))]"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Study Tab */}
      {tab === "study" && (
        <div className="glass rounded-2xl shadow-soft p-6 animate-fade-up">
          <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Available hours/day</label>
                <input {...register("available_hours_day", { valueAsNumber: true })} type="number" min={0.5} max={16} step={0.5} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Energy peak</label>
                <select {...register("energy_peak")} className={inputClass}>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Session length (min)</label>
                <input {...register("preferred_session_len_min", { valueAsNumber: true })} type="number" min={15} max={180} step={5} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Break length (min)</label>
                <input {...register("break_len_min", { valueAsNumber: true })} type="number" min={5} max={60} step={5} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Don&apos;t schedule before</label>
                <input {...register("blocked_hours_end")} type="time" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Don&apos;t schedule after</label>
                <input {...register("blocked_hours_start")} type="time" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Max sessions/day</label>
                <input {...register("max_sessions_per_day", { valueAsNumber: true })} type="number" min={1} max={15} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Min break between (min)</label>
                <input {...register("min_break_between_min", { valueAsNumber: true })} type="number" min={5} max={60} step={5} className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={update.isPending} className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm hover:shadow-brand-md">
              <Save className="w-4 h-4" />
              {update.isPending ? "Saving..." : "Save study preferences"}
            </button>
          </form>
        </div>
      )}

      {/* Timer Tab */}
      {tab === "timer" && (
        <div className="glass rounded-2xl shadow-soft p-6 animate-fade-up">
          <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Pomodoro work (min)</label>
                <input {...register("pomodoro_work_min", { valueAsNumber: true })} type="number" min={10} max={90} step={5} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pomodoro break (min)</label>
                <input {...register("pomodoro_break_min", { valueAsNumber: true })} type="number" min={3} max={30} step={1} className={inputClass} />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-[rgb(var(--foreground))]">Sound notifications</label>
              <button
                type="button"
                onClick={() => {
                  const current = prefs?.sound_enabled ?? true;
                  update.mutate({ sound_enabled: !current });
                }}
                className={`w-11 h-6 rounded-full transition-colors relative ${prefs?.sound_enabled ? "bg-brand-500" : "bg-surface-300 dark:bg-surface-700"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${prefs?.sound_enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </div>
            <button type="submit" disabled={update.isPending} className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm hover:shadow-brand-md">
              <Save className="w-4 h-4" />
              {update.isPending ? "Saving..." : "Save timer preferences"}
            </button>
          </form>
        </div>
      )}

      {/* Appearance Tab */}
      {tab === "appearance" && (
        <div className="glass rounded-2xl shadow-soft p-6 space-y-5 animate-fade-up">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[rgb(var(--foreground))]">Theme</p>
              <p className="text-xs text-surface-400">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-brand-500" : "bg-surface-300 dark:bg-surface-700"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm flex items-center justify-center ${darkMode ? "translate-x-[22px]" : "translate-x-0.5"}`}>
                {darkMode ? <Moon className="w-3 h-3 text-brand-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
              </div>
            </button>
          </div>

          {/* Calendar default view */}
          <div>
            <label className={labelClass}>Default calendar view</label>
            <select
              value={prefs?.calendar_default_view || "timeGridWeek"}
              onChange={(e) => update.mutate({ calendar_default_view: e.target.value })}
              className={inputClass}
            >
              <option value="timeGridWeek">Week</option>
              <option value="timeGridDay">Day</option>
              <option value="dayGridMonth">Month</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="pt-3 border-t border-[rgb(var(--border-subtle))]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[rgb(var(--foreground))] flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-surface-400" />
                  Session reminders
                </p>
                <p className="text-xs text-surface-400">Get notified before scheduled sessions</p>
              </div>
              <button
                onClick={handleNotifToggle}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifEnabled ? "bg-brand-500" : "bg-surface-300 dark:bg-surface-700"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${notifEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </div>
            {notifEnabled && (
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Remind me before</label>
                <select
                  value={reminderMin}
                  onChange={(e) => handleReminderChange(Number(e.target.value))}
                  className={inputClass}
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
