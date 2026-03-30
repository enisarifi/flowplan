"use client";

import dynamic from "next/dynamic";

const CalendarInner = dynamic(() => import("./CalendarInner"), {
  ssr: false,
  loading: () => (
    <div className="glass rounded-2xl shadow-soft p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-surface-200 dark:bg-surface-800 rounded-lg w-40" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 bg-surface-200 dark:bg-surface-800 rounded-xl w-20" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px mb-3">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-xs text-surface-400 py-2 font-medium uppercase tracking-wider opacity-60">{d}</div>
        ))}
      </div>
      <div className="h-[550px] bg-[rgb(var(--surface-raised))] rounded-xl" />
    </div>
  ),
});

export default function CalendarView() {
  return <CalendarInner />;
}
