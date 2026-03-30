"use client";

import CalendarView from "@/components/schedule/CalendarView";
import { useSessionStats, useExportIcal } from "@/hooks/useSchedule";
import { Calendar, Download, BarChart3, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SchedulePage() {
  const { data: stats } = useSessionStats();
  const exportIcal = useExportIcal();

  const handleExport = async () => {
    try {
      await exportIcal();
      toast.success("Schedule exported!");
    } catch {
      toast.error("Failed to export.");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-500" />
          <h1 className="font-display text-2xl font-bold text-[rgb(var(--foreground))]">Schedule</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick stats */}
          {stats && (
            <div className="flex items-center gap-4 mr-2">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-surface-500">{stats.completed_sessions}</span>
                <span className="text-surface-400 text-xs">done</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <BarChart3 className="w-4 h-4 text-brand-500" />
                <span className="text-surface-500">{stats.completion_rate}%</span>
                <span className="text-surface-400 text-xs">rate</span>
              </div>
            </div>
          )}

          {/* Export */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 border border-[rgb(var(--border-strong))] text-[rgb(var(--foreground))] hover:border-brand-300 dark:hover:border-brand-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-soft hover:shadow-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <CalendarView />
    </div>
  );
}
