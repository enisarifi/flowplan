import { create } from "zustand";

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: typeof window !== "undefined" && !!localStorage.getItem("access_token"),
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  },
}));
