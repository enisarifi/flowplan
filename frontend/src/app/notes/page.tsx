"use client";

import { useState } from "react";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/useNotes";
import { useSubjects } from "@/hooks/useSubjects";
import { Note } from "@/types/api";
import { toast } from "sonner";
import { FileText, Plus, Search, X, Pencil, Trash2, Save, BookOpen } from "lucide-react";
import { format } from "date-fns";

const inputClass = "w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[rgb(var(--foreground))] placeholder:text-surface-400 transition-all";

export default function NotesPage() {
  const { data: subjects = [] } = useSubjects();
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: notes = [], isLoading } = useNotes(filterSubject || undefined);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");

  const filteredNotes = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createNote.mutateAsync({
        title: newTitle.trim(),
        content: newContent,
        subject_id: newSubjectId || undefined,
      });
      toast.success("Note created");
      setNewTitle("");
      setNewContent("");
      setNewSubjectId("");
      setShowCreate(false);
    } catch {
      toast.error("Failed to create note.");
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteNote.mutate(id, {
      onSuccess: () => toast.success("Note deleted"),
      onError: () => toast.error("Failed to delete note."),
    });
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-500" />
          <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">Notes</h1>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            showCreate
              ? "border border-[rgb(var(--border-strong))] text-surface-600"
              : "bg-brand-500 hover:bg-brand-600 text-white shadow-brand-sm"
          }`}
        >
          {showCreate ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New note</>}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className={`${inputClass} w-48`}
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass rounded-2xl shadow-soft p-6 mb-6 space-y-4 animate-fade-up">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title"
            className={inputClass}
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your notes here..."
            rows={5}
            className={`${inputClass} resize-none`}
          />
          <div className="flex gap-3 items-center">
            <select
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
              className={`${inputClass} w-48`}
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              disabled={createNote.isPending || !newTitle.trim()}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm"
            >
              <Save className="w-4 h-4" />
              {createNote.isPending ? "Saving..." : "Save note"}
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-48 mb-2" />
              <div className="h-3 bg-surface-200 dark:bg-surface-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass rounded-2xl shadow-soft p-16 text-center">
          <BookOpen className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
          <h3 className="font-display font-bold text-[rgb(var(--foreground))] mb-2">No notes yet</h3>
          <p className="text-surface-400 text-sm">Create your first note to keep track of what you&apos;re learning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) =>
            editingId === note.id ? (
              <EditNoteForm
                key={note.id}
                note={note}
                subjects={subjects}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div key={note.id} className="glass rounded-xl p-5 group hover:shadow-medium transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[rgb(var(--foreground))] text-sm truncate">{note.title}</h3>
                      {note.subject_name && (
                        <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 text-xs font-medium rounded-full shrink-0">
                          {note.subject_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-500 line-clamp-2 mb-2">{note.content || "No content"}</p>
                    <p className="text-xs text-surface-400">{format(new Date(note.updated_at), "MMM d, yyyy 'at' HH:mm")}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                    <button onClick={() => setEditingId(note.id)} className="p-2 rounded-lg text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(note.id, note.title)} className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function EditNoteForm({ note, subjects, onDone }: { note: Note; subjects: any[]; onDone: () => void }) {
  const updateNote = useUpdateNote();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSave = async () => {
    try {
      await updateNote.mutateAsync({ id: note.id, title, content });
      toast.success("Note updated");
      onDone();
    } catch {
      toast.error("Failed to save.");
    }
  };

  return (
    <div className="glass rounded-xl border-2 border-brand-200 dark:border-brand-800 p-5 space-y-3 animate-fade-up">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className={`${inputClass} resize-none`} />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={updateNote.isPending} className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60">
          <Save className="w-4 h-4" />
          {updateNote.isPending ? "Saving..." : "Save"}
        </button>
        <button onClick={onDone} className="border border-[rgb(var(--border-strong))] text-surface-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}
