import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Subject } from "@/types/api";

export const SUBJECTS_KEY = ["subjects"];

export function useSubjects() {
  return useQuery({
    queryKey: SUBJECTS_KEY,
    queryFn: async () => {
      const res = await api.get<Subject[]>("/subjects");
      return res.data;
    },
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Subject>) => {
      const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "" && v !== null && v !== undefined));
      const res = await api.post<Subject>("/subjects", clean);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBJECTS_KEY }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Subject> & { id: string }) => {
      const res = await api.patch<Subject>(`/subjects/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBJECTS_KEY }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subjects/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBJECTS_KEY }),
  });
}
