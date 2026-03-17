"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Set up your study profile</h1>
        <p className="text-slate-500 text-sm mb-1">This helps FlowPlan build a schedule that fits your life.</p>
        <p className="text-xs text-slate-400 mb-6">Detected timezone: <span className="font-medium text-slate-500">{detectedTimezone}</span></p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Available study hours per day</label>
            <input
              {...register("available_hours_day", { valueAsNumber: true })}
              type="number" min={0.5} max={16} step={0.5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">When is your energy highest?</label>
            <select
              {...register("energy_peak")}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="morning">Morning (6am – 12pm)</option>
              <option value="afternoon">Afternoon (12pm – 5pm)</option>
              <option value="evening">Evening (5pm – 11pm)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Session length (min)</label>
              <input
                {...register("preferred_session_len_min", { valueAsNumber: true })}
                type="number" min={15} max={180} step={5}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Break length (min)</label>
              <input
                {...register("break_len_min", { valueAsNumber: true })}
                type="number" min={5} max={60} step={5}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Study days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    selectedDays.includes(day)
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue to subjects"}
          </button>
        </form>
      </div>
    </div>
  );
}
