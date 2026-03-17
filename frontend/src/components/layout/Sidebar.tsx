"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/subjects", label: "Subjects" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAppStore((s) => s.logout);

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-100 flex flex-col py-6 px-4">
      <div className="mb-8">
        <span className="text-xl font-bold text-brand-500">FlowPlan</span>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
              pathname.startsWith(href)
                ? "bg-brand-50 text-brand-600"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={logout}
        className="text-sm text-slate-400 hover:text-slate-600 text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition"
      >
        Sign out
      </button>
    </aside>
  );
}
