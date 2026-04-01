"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import api from "@/lib/api";
import FloatingTimer from "@/components/study/FloatingTimer";
import TutorialOverlay from "@/components/layout/TutorialOverlay";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (user) {
      setChecked(true);
      return;
    }

    api
      .get("/users/me")
      .then((res) => {
        setUser(res.data);
        setChecked(true);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.replace("/login");
      });
  }, [hydrated, user, router, setUser]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {children}
      <FloatingTimer />
      <TutorialOverlay />
    </>
  );
}
