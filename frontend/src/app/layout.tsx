"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const darkMode = useAppStore((s) => s.darkMode);
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <html lang="en" className={darkMode ? "dark" : ""} suppressHydrationWarning>
      <head>
        <title>FlowPlan — AI Study Planner</title>
        <meta name="description" content="AI-powered personalized study planning that adapts to how you actually learn." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[rgb(var(--background))] text-[rgb(var(--foreground))] antialiased font-sans" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
        <Toaster
          position="bottom-right"
          richColors
          theme={darkMode ? "dark" : "light"}
        />
      </body>
    </html>
  );
}
