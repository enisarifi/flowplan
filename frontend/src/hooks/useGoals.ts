import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Goal } from "@/types/api";

const GOALS_KEY = ["goals"];

export function useGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: async () => {
      const res = await api.get<Goal[]>("/goals");
      return res.data;
    },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; target_type: string; target_value: number; subject_id?: string; deadline?: string }) => {
      const res = await api.post<Goal>("/goals", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await api.patch<Goal>(`/goals/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/goals/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}
