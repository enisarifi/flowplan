"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubjects, useCreateSubject, useDeleteSubject, useUpdateSubject } from "@/hooks/useSubjects";
import { Subject } from "@/types/api";
import { toast } from "sonner";
import { Plus, X, BookOpen, Pencil, Trash2, Sparkles } from "lucide-react";

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

const inputClass = "w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[rgb(var(--foreground))] placeholder:text-surface-400 transition-all";
const labelClass = "block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5";

export default function SubjectsPage() {
  const { data: subjects = [] } = useSubjects();
  const create = useCreateSubject();
  const remove = useDeleteSubject();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      toast.success(`Added "${data.name}"`);
    } catch {
      toast.error("Failed to add subject.");
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}"? This cannot be undone.`)) return;
    remove.mutate(id, {
      onSuccess: () => toast.success(`Removed "${name}"`),
      onError: () => toast.error("Failed to remove subject."),
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Subjects</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            showForm
              ? "border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              : "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
          }`}
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add subject</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-[rgb(var(--surface))] rounded-2xl shadow-sm border border-[rgb(var(--border-subtle))] p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Subject name</label>
              <input {...register("name")} className={inputClass} placeholder="e.g. Mathematics" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Difficulty (1-5)</label>
              <input {...register("difficulty")} type="number" min={1} max={5} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Weekly hours target</label>
              <input {...register("weekly_hours_target")} type="number" min={0.5} max={40} step={0.5} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Exam date (optional)</label>
              <input {...register("exam_date")} type="date" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color_hex", c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-all ${selectedColor === c ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-110" : "hover:scale-105"}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-brand-400" />
              What do you want to study?
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="e.g. Chapters 5-8 on differential equations, practice integration techniques, review past exam problems on linear algebra..."
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-surface-400 mt-1">
              The AI uses this to suggest specific topics for each study session.
            </p>
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {create.isPending ? "Adding..." : "Add subject"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {subjects.length === 0 && (
          <div className="bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border-subtle))] shadow-sm p-12 text-center">
            <BookOpen className="w-10 h-10 text-surface-300 dark:text-surface-700 mx-auto mb-3" />
            <p className="text-surface-400 text-sm">No subjects yet. Add one to get started.</p>
          </div>
        )}
        {subjects.map((subject: Subject) =>
          editingId === subject.id ? (
            <EditSubjectForm
              key={subject.id}
              subject={subject}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div key={subject.id} className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border-subtle))] shadow-sm p-4 flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color_hex }} />
                <div className="min-w-0">
                  <p className="font-medium text-[rgb(var(--foreground))] text-sm truncate">{subject.name}</p>
                  <p className="text-xs text-surface-400">
                    Difficulty {subject.difficulty}/5 · {subject.weekly_hours_target}h/week
                    {subject.exam_date && ` · Exam ${subject.exam_date}`}
                  </p>
                  {subject.notes && (
                    <p className="text-xs text-surface-400 mt-0.5 truncate max-w-xs">
                      <Sparkles className="w-3 h-3 inline mr-0.5 text-brand-400" />
                      {subject.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingId(subject.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(subject.id, subject.name)}
                  disabled={remove.isPending}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-60"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EditSubjectForm({ subject, onDone }: { subject: Subject; onDone: () => void }) {
  const update = useUpdateSubject();
  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: subject.name,
      difficulty: subject.difficulty,
      weekly_hours_target: subject.weekly_hours_target,
      exam_date: subject.exam_date ?? "",
      color_hex: subject.color_hex,
      notes: subject.notes ?? "",
    },
  });
  const selectedColor = watch("color_hex");

  const onSubmit = async (data: FormData) => {
    try {
      await update.mutateAsync({ id: subject.id, ...data });
      toast.success("Subject updated");
      onDone();
    } catch {
      toast.error("Failed to save changes.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-[rgb(var(--surface))] rounded-xl border-2 border-brand-200 dark:border-brand-800 shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
          <input {...register("name")} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Difficulty (1-5)</label>
          <input {...register("difficulty")} type="number" min={1} max={5} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Weekly hours</label>
          <input {...register("weekly_hours_target")} type="number" min={0.5} max={40} step={0.5} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Exam date</label>
          <input {...register("exam_date")} type="date" className={inputClass} />
        </div>
      </div>
      <div className="flex gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setValue("color_hex", c)}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded-full transition-all ${selectedColor === c ? "ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-800" : ""}`}
          />
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          <Sparkles className="w-3 h-3 inline mr-1 text-brand-400" />
          What do you want to study?
        </label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="e.g. Focus on chapters 5-8, practice past exam problems..."
          className={`${inputClass} resize-none text-xs`}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={update.isPending}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
        >
          {update.isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
