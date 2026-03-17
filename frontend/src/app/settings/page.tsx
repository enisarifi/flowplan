"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserPreferences } from "@/types/api";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function SettingsPage() {
  const qc = useQueryClient();
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

  const update = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      await api.put("/users/me/preferences", data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preferences"] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 bg-slate-100 rounded w-32 mb-2" />
              <div className="h-9 bg-slate-100 rounded w-full" />
            </div>
          ))}
          <div className="h-9 bg-slate-100 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Available hours per day</label>
            <input
              {...register("available_hours_day", { valueAsNumber: true })}
              type="number" min={0.5} max={16} step={0.5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Energy peak</label>
            <select
              {...register("energy_peak")}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
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
          <button
            type="submit"
            disabled={update.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
          >
            {update.isPending ? "Saving..." : "Save preferences"}
          </button>
          {update.isSuccess && <p className="text-green-600 text-sm text-center">Saved!</p>}
        </form>
      </div>
    </div>
  );
}
