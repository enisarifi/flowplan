"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubjects, useCreateSubject, useDeleteSubject } from "@/hooks/useSubjects";
import { Subject } from "@/types/api";

const schema = z.object({
  name: z.string().min(1),
  difficulty: z.coerce.number().min(1).max(5),
  weekly_hours_target: z.coerce.number().min(0.5).max(40),
  exam_date: z.string().optional(),
  color_hex: z.string().default("#6366f1"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function SubjectsPage() {
  const { data: subjects = [] } = useSubjects();
  const create = useCreateSubject();
  const remove = useDeleteSubject();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color_hex: "#6366f1", difficulty: 3, weekly_hours_target: 3 },
  });

  const selectedColor = watch("color_hex");

  const onSubmit = async (data: FormData) => {
    try {
      await create.mutateAsync(data);
      reset();
      setShowForm(false);
    } catch {
      // error shown below submit button via create.error
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}"? This cannot be undone.`)) return;
    remove.mutate(id);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          {showForm ? "Cancel" : "+ Add subject"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject name</label>
              <input
                {...register("name")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Mathematics"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty (1–5)</label>
              <input
                {...register("difficulty")}
                type="number" min={1} max={5}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weekly hours target</label>
              <input
                {...register("weekly_hours_target")}
                type="number" min={0.5} max={40} step={0.5}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Exam date (optional)</label>
              <input
                {...register("exam_date")}
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color_hex", c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition ${selectedColor === c ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
          >
            {create.isPending ? "Adding..." : "Add subject"}
          </button>
          {create.error && <p className="text-red-500 text-sm">Failed to add subject. Please try again.</p>}
        </form>
      )}

      <div className="space-y-3">
        {subjects.length === 0 && (
          <p className="text-slate-400 text-sm">No subjects yet. Add one to get started.</p>
        )}
        {subjects.map((subject: Subject) => (
          <div key={subject.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color_hex }} />
              <div>
                <p className="font-medium text-slate-800 text-sm">{subject.name}</p>
                <p className="text-xs text-slate-400">Difficulty {subject.difficulty}/5 · {subject.weekly_hours_target}h/week</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(subject.id, subject.name)}
              disabled={remove.isPending}
              className="text-xs text-slate-400 hover:text-red-500 transition disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
