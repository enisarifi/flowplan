import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Resource } from "@/types/api";

const RESOURCES_KEY = ["resources"];

export function useResources(subjectId?: string) {
  return useQuery({
    queryKey: [...RESOURCES_KEY, subjectId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (subjectId) params.subject_id = subjectId;
      const res = await api.get<Resource[]>("/resources", { params });
      return res.data;
    },
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { subject_id: string; title: string; url: string; type?: string; page_ref?: string }) => {
      const res = await api.post<Resource>("/resources", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCES_KEY }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/resources/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCES_KEY }),
  });
}
