import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ScheduleEntry, SessionFeedback, SessionStats } from "@/types/api";

export const SCHEDULE_KEY = ["schedule"];
export const STATS_KEY = ["session-stats"];

export function useSchedule(start?: string, end?: string) {
  return useQuery({
    queryKey: [...SCHEDULE_KEY, start, end],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const res = await api.get<ScheduleEntry[]>("/schedule", { params });
      return res.data;
    },
  });
}

export function useGenerateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (start_date?: string) => {
      const res = await api.post<ScheduleEntry[]>("/schedule/generate", { start_date });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEDULE_KEY }),
  });
}

export function useAdaptSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (start_date?: string) => {
      const res = await api.post<ScheduleEntry[]>("/schedule/adapt", { start_date });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEDULE_KEY }),
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      actual_duration_min?: number;
      energy_rating?: number;
      difficulty_rating?: number;
      completion_pct?: number;
      notes?: string;
    }) => {
      const res = await api.patch<SessionFeedback>(`/sessions/${id}/complete`, data);
      return res.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: SCHEDULE_KEY });
      const previous = qc.getQueryData(SCHEDULE_KEY);
      qc.setQueryData(SCHEDULE_KEY, (old: ScheduleEntry[] | undefined) =>
        old?.map((e) => (e.id === id ? { ...e, status: "completed" } : e))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(SCHEDULE_KEY, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SCHEDULE_KEY });
      qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}

export function useSkipSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/sessions/${id}/skip`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SCHEDULE_KEY }),
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: async () => {
      const res = await api.get<SessionStats>("/sessions/stats");
      return res.data;
    },
  });
}
