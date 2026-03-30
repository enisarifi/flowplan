import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Note } from "@/types/api";

const NOTES_KEY = ["notes"];

export function useNotes(subjectId?: string) {
  return useQuery({
    queryKey: [...NOTES_KEY, subjectId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (subjectId) params.subject_id = subjectId;
      const res = await api.get<Note[]>("/notes", { params });
      return res.data;
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; content: string; subject_id?: string; schedule_entry_id?: string }) => {
      const res = await api.post<Note>("/notes", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; content?: string; subject_id?: string }) => {
      const res = await api.patch<Note>(`/notes/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}
