"use client";

import { useState } from "react";
import { useGoals, useCreateGoal, useDeleteGoal } from "@/hooks/useGoals";
import { useSubjects } from "@/hooks/useSubjects";
import { toast } from "sonner";
import { Target, Plus, X, Trash2, CheckCircle2, Trophy } from "lucide-react";
import { format } from "date-fns";

const inputClass = "w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[rgb(var(--foreground))] placeholder:text-surface-400 transition-all";

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const { data: subjects = [] } = useSubjects();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState("sessions");
  const [targetValue, setTargetValue] = useState(10);
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState("");

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createGoal.mutateAsync({
        title: title.trim(),
        target_type: targetType,
        target_value: targetValue,
        subject_id: subjectId || undefined,
        deadline: deadline || undefined,
      });
      toast.success("Goal created!");
      setTitle(""); setTargetValue(10); setSubjectId(""); setDeadline("");
      setShowForm(false);
    } catch { toast.error("Failed to create goal."); }
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-500" />
          <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">Goals</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            showForm ? "border border-[rgb(var(--border-strong))] text-surface-600" : "bg-brand-500 hover:bg-brand-600 text-white shadow-brand-sm"
          }`}
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New goal</>}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl shadow-soft p-6 mb-6 space-y-4 animate-fade-up">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study 20 hours this week" className={inputClass} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Type</label>
              <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className={inputClass}>
                <option value="sessions">Sessions</option>
                <option value="hours">Hours</option>
                <option value="completion">Completion %</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Target</label>
              <input type="number" value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} min={1} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
            </div>
          </div>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputClass}>
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={handleCreate} disabled={createGoal.isPending || !title.trim()} className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm">
            {createGoal.isPending ? "Creating..." : "Create goal"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface-200 dark:bg-surface-800 rounded-xl" />)}
        </div>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="glass rounded-2xl shadow-soft p-16 text-center">
          <Trophy className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-display font-bold text-[rgb(var(--foreground))] mb-2">No goals yet</h3>
          <p className="text-surface-400 text-sm">Set study goals to track your progress and stay motivated.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="glass rounded-xl p-5 group">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">{goal.title}</h3>
                  <p className="text-xs text-surface-400">
                    {goal.current_value}/{goal.target_value} {goal.target_type}
                    {goal.subject_name && ` · ${goal.subject_name}`}
                    {goal.deadline && ` · Due ${format(new Date(goal.deadline), "MMM d")}`}
                  </p>
                </div>
                <button
                  onClick={() => { if (confirm("Delete this goal?")) deleteGoal.mutate(goal.id); }}
                  className="p-2 rounded-lg text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="h-2.5 bg-[rgb(var(--border-subtle))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(goal.progress_pct, 100)}%` }}
                />
              </div>
              <p className="text-right text-xs text-surface-400 mt-1">{Math.round(goal.progress_pct)}%</p>
            </div>
          ))}

          {completedGoals.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Completed
              </p>
              {completedGoals.map((goal) => (
                <div key={goal.id} className="glass rounded-xl p-4 mb-2 opacity-60">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[rgb(var(--foreground))] line-through">{goal.title}</p>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
