"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubjects, useCreateSubject, useDeleteSubject, useUpdateSubject } from "@/hooks/useSubjects";
import { useResources, useCreateResource, useDeleteResource } from "@/hooks/useResources";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Subject, Resource, ExamPrep } from "@/types/api";
import { differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { Plus, X, BookOpen, Pencil, Trash2, Sparkles, Globe, FileText, Play, ChevronDown, ChevronUp, Link2, Trash, Upload, GraduationCap, CheckSquare, Lightbulb } from "lucide-react";

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
  const [expandedResources, setExpandedResources] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [examPrepSubject, setExamPrepSubject] = useState<Subject | null>(null);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[rgb(var(--border-subtle))] text-surface-500 hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-raised))] transition-colors"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
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
      </div>

      {showImport && <BulkImportModal onClose={() => setShowImport(false)} />}
      {examPrepSubject && <ExamPrepModal subject={examPrepSubject} onClose={() => setExamPrepSubject(null)} />}

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
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={() => setEditingId(subject.id)}
              onDelete={() => handleDelete(subject.id, subject.name)}
              deleteDisabled={remove.isPending}
              resourcesExpanded={expandedResources === subject.id}
              onToggleResources={() => setExpandedResources(expandedResources === subject.id ? null : subject.id)}
              onExamPrep={() => setExamPrepSubject(subject)}
            />
          )
        )}
      </div>
    </div>
  );
}

function SubjectCard({ subject, onEdit, onDelete, deleteDisabled, resourcesExpanded, onToggleResources, onExamPrep }: {
  subject: Subject;
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled: boolean;
  resourcesExpanded: boolean;
  onToggleResources: () => void;
  onExamPrep: () => void;
}) {
  const { data: resources = [] } = useResources(subject.id);
  const daysUntilExam = subject.exam_date ? differenceInCalendarDays(new Date(subject.exam_date), new Date()) : null;

  return (
    <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border-subtle))] shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-4 flex items-center justify-between">
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
        <div className="flex items-center gap-1">
          {daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= 14 && (
            <button
              onClick={onExamPrep}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Exam prep
            </button>
          )}
          <button
            onClick={onToggleResources}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              resourcesExpanded ? "bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400" : "text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {resources.length > 0 ? resources.length : ""}
            {resourcesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-2 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors" title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} disabled={deleteDisabled} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-60" title="Remove">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {resourcesExpanded && <ResourcesPanel subjectId={subject.id} resources={resources} />}
    </div>
  );
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  link: <Globe className="w-3.5 h-3.5" />,
  video: <Play className="w-3.5 h-3.5" />,
  pdf: <FileText className="w-3.5 h-3.5" />,
  textbook: <BookOpen className="w-3.5 h-3.5" />,
};

function ResourcesPanel({ subjectId, resources }: { subjectId: string; resources: Resource[] }) {
  const createResource = useCreateResource();
  const deleteResource = useDeleteResource();
  const [form, setForm] = useState({ title: "", url: "", type: "link", page_ref: "" });
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    try {
      await createResource.mutateAsync({ subject_id: subjectId, title: form.title, url: form.url, type: form.type, page_ref: form.page_ref || undefined });
      setForm({ title: "", url: "", type: "link", page_ref: "" });
      setShowAdd(false);
    } catch { toast.error("Failed to add resource."); }
  };

  return (
    <div className="border-t border-[rgb(var(--border-subtle))] px-4 py-3 bg-[rgb(var(--surface-raised))]/50">
      {resources && resources.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {resources.map((r) => (
            <li key={r.id} className="flex items-center justify-between group/r">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-brand-500 hover:text-brand-600 min-w-0">
                <span className="text-surface-400">{RESOURCE_ICONS[r.type] || RESOURCE_ICONS.link}</span>
                <span className="truncate font-medium">{r.title}</span>
                {r.page_ref && <span className="text-surface-400 shrink-0">· {r.page_ref}</span>}
              </a>
              <button
                onClick={() => deleteResource.mutate(r.id)}
                className="p-1 rounded opacity-0 group-hover/r:opacity-100 text-surface-300 hover:text-red-500 transition-all"
              >
                <Trash className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {showAdd ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40 text-[rgb(var(--foreground))]" />
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-lg px-3 py-1.5 text-xs text-[rgb(var(--foreground))]">
              <option value="link">Link</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="textbook">Textbook</option>
            </select>
          </div>
          <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." className="w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40 text-[rgb(var(--foreground))]" />
          <input value={form.page_ref} onChange={(e) => setForm((f) => ({ ...f, page_ref: e.target.value }))} placeholder="Page ref (optional, e.g. pp. 45-67)" className="w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40 text-[rgb(var(--foreground))]" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={createResource.isPending || !form.title.trim() || !form.url.trim()} className="bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60">
              {createResource.isPending ? "Adding..." : "Add"}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-surface-400 hover:text-[rgb(var(--foreground))] text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-500 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add resource
        </button>
      )}
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

function BulkImportModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const imp = useMutation({
    mutationFn: async () => {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const subjects = lines.map((name) => ({ name, difficulty: 3, weekly_hours_target: 3 }));
      await api.post("/subjects/bulk-import", { subjects });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subjects imported!");
      onClose();
    },
    onError: () => toast.error("Import failed."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-medium p-6 w-full max-w-md mx-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-brand-500" />
            <h2 className="font-display font-semibold text-[rgb(var(--foreground))]">Bulk import subjects</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-raised))] text-surface-400"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-surface-400 mb-3">One subject name per line. All will be added with default settings (difficulty 3, 3h/week).</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"Mathematics\nPhysics\nHistory\nEnglish Literature"}
          className="w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 text-[rgb(var(--foreground))] placeholder:text-surface-300 resize-none font-mono"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => imp.mutate()}
            disabled={imp.isPending || !text.trim()}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
          >
            {imp.isPending ? "Importing..." : `Import ${text.split("\n").filter((l) => l.trim()).length} subjects`}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[rgb(var(--border-subtle))] text-sm text-surface-400 hover:text-[rgb(var(--foreground))] transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ExamPrepModal({ subject, onClose }: { subject: Subject; onClose: () => void }) {
  const [prep, setPrep] = useState<ExamPrep | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ExamPrep>(`/schedule/exam-prep/${subject.id}`)
      .then((r) => setPrep(r.data))
      .catch(() => toast.error("Failed to generate exam prep."))
      .finally(() => setLoading(false));
  }, [subject.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-medium p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-accent-500" />
            <h2 className="font-display font-semibold text-[rgb(var(--foreground))]">Exam Prep — {subject.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-raised))] text-surface-400"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4].map((i) => <div key={i} className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-full" />)}
          </div>
        ) : prep ? (
          <div className="space-y-5">
            <div className="flex gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-semibold">{prep.days_until}d until exam</span>
              <span className="px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">{prep.daily_hours}h/day recommended</span>
              <span className="px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 capitalize">{prep.priority} priority</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckSquare className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Checklist</span>
              </div>
              <ul className="space-y-2">
                {prep.checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[rgb(var(--foreground))]">
                    <span className="w-5 h-5 rounded-full border-2 border-brand-300 dark:border-brand-700 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {prep.tips.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-accent-500" />
                  <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Tips</span>
                </div>
                <ul className="space-y-1.5">
                  {prep.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-surface-500 flex items-start gap-2">
                      <span className="text-accent-400 mt-0.5">·</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-surface-400">Could not generate exam prep. Make sure the subject has an exam date set.</p>
        )}
      </div>
    </div>
  );
}
