import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { TokenResponse } from "@/types/api";

export function useLogin() {
  const setUser = useAppStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<TokenResponse>("/auth/login", data);
      return res.data;
    },
    onSuccess: async (tokens) => {
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      const me = await api.get("/users/me");
      setUser(me.data);
    },
  });
}

export function useRegister() {
  const setUser = useAppStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (data: { email: string; display_name: string; password: string }) => {
      const res = await api.post<TokenResponse>("/auth/register", data);
      return res.data;
    },
    onSuccess: async (tokens) => {
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      const me = await api.get("/users/me");
      setUser(me.data);
    },
  });
}
