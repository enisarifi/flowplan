import { create } from "zustand";

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  darkMode: boolean;
  hydrated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  toggleDarkMode: () => void;
  hydrate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  darkMode: false,
  hydrated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  },
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem("darkMode", String(next));
      return { darkMode: next };
    }),
  hydrate: () => {
    const token = localStorage.getItem("access_token");
    const stored = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored !== null ? stored === "true" : prefersDark;
    set({
      isAuthenticated: !!token,
      darkMode: dark,
      hydrated: true,
    });
  },
}));
