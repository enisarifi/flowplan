"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { GraduationCap, ArrowRight, Clock, Zap, Calendar } from "lucide-react";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const inputClass = "w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[rgb(var(--foreground))] placeholder:text-surface-400 transition-all";
const labelClass = "block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { register, handleSubmit } = useForm({
    defaultValues: {
      available_hours_day: 4,
      energy_peak: "morning",
      preferred_session_len_min: 50,
      break_len_min: 10,
      timezone: detectedTimezone,
    },
  });

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const onSubmit = async (data: any) => {
    if (selectedDays.length === 0) { setError("Please select at least one study day."); return; }
    setLoading(true);
    setError("");
    try {
      await api.put("/users/me/preferences", { ...data, study_days: selectedDays });
      router.push("/subjects");
    } catch {
      setError("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="glass-strong rounded-2xl shadow-medium p-8 w-full max-w-lg animate-fade-up">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-brand-600 dark:text-brand-400">FlowPlan</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))] mb-1">Set up your study profile</h1>
        <p className="text-surface-500 text-sm mb-1">This helps FlowPlan build a schedule that fits your life.</p>
        <p className="text-xs text-surface-400 mb-6">
          Detected timezone: <span className="font-medium text-surface-600">{detectedTimezone}</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className={labelClass}>
              <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              Available study hours per day
            </label>
            <input
              {...register("available_hours_day", { valueAsNumber: true })}
              type="number" min={0.5} max={16} step={0.5}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Zap className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              When is your energy highest?
            </label>
            <select {...register("energy_peak")} className={inputClass}>
              <option value="morning">Morning (6am - 12pm)</option>
              <option value="afternoon">Afternoon (12pm - 5pm)</option>
              <option value="evening">Evening (5pm - 11pm)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Session length (min)</label>
              <input
                {...register("preferred_session_len_min", { valueAsNumber: true })}
                type="number" min={15} max={180} step={5}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Break length (min)</label>
              <input
                {...register("break_len_min", { valueAsNumber: true })}
                type="number" min={5} max={60} step={5}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
              Study days
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedDays.includes(day)
                      ? "bg-brand-500 text-white shadow-brand-sm"
                      : "bg-[rgb(var(--surface-raised))] text-surface-600 hover:bg-surface-300 dark:hover:bg-surface-700"
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm hover:shadow-brand-md"
          >
            {loading ? "Saving..." : (
              <>
                Continue to subjects
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
