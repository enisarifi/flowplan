"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  TrendingUp,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  FileText,
  History,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.user);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5 px-3">
        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-brand-sm">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-display font-bold text-brand-600 dark:text-brand-400">FlowPlan</span>
      </div>

      {/* Separator */}
      <div className="mx-3 mb-4 h-px bg-[rgb(var(--border-subtle))]" />

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 shadow-soft"
                  : "text-surface-600 dark:text-surface-400 hover:bg-[rgb(var(--surface-raised))] hover:text-[rgb(var(--foreground))]"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-full" />
              )}
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 pt-4 border-t border-[rgb(var(--border-subtle))] mx-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-surface-500 hover:bg-[rgb(var(--surface-raised))] hover:text-[rgb(var(--foreground))] transition-all"
        >
          {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {darkMode ? "Light mode" : "Dark mode"}
        </button>

        {/* User info */}
        {user && (
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-[rgb(var(--foreground))] truncate">{user.display_name}</p>
            <p className="text-xs text-surface-500 truncate">{user.email}</p>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[rgb(var(--surface))] shadow-medium border border-[rgb(var(--border-subtle))] md:hidden"
      >
        <Menu className="w-5 h-5 text-surface-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[rgb(var(--surface))] border-r border-[rgb(var(--border-subtle))] flex flex-col py-6 px-3 transform transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[rgb(var(--surface-raised))]"
        >
          <X className="w-5 h-5 text-surface-400" />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 h-screen glass border-r border-[rgb(var(--border-subtle))] flex-col py-6 px-3 sticky top-0 overflow-y-auto">
        {navContent}
      </aside>
    </>
  );
}
