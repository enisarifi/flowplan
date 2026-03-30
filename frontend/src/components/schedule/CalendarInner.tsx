"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useSchedule } from "@/hooks/useSchedule";
import { useSubjects } from "@/hooks/useSubjects";
import { ScheduleEntry, Subject } from "@/types/api";
import FeedbackModal from "./FeedbackModal";
import { Calendar, ArrowRight, Check, X as XIcon, Clock } from "lucide-react";
import Link from "next/link";

function statusColor(status: string): string {
  switch (status) {
    case "completed": return "#22c55e";
    case "skipped": return "#ef4444";
    default: return "#6c5ce7";
  }
}

export default function CalendarInner() {
  const { data: entries = [], isLoading } = useSchedule();
  const { data: subjects = [] } = useSubjects();
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  const subjectMap = Object.fromEntries(subjects.map((s: Subject) => [s.id, s]));

  const sessionEvents = entries.map((entry) => {
    const subject = subjectMap[entry.subject_id];
    const color = entry.status === "planned"
      ? (subject?.color_hex ?? "#6c5ce7")
      : statusColor(entry.status);

    return {
      id: entry.id,
      title: entry.title,
      start: entry.start_time,
      end: entry.end_time,
      backgroundColor: color,
      borderColor: "transparent",
      textColor: "#ffffff",
      extendedProps: { entry, subject, type: "session" },
      classNames: entry.status !== "planned" ? ["fc-event-done"] : [],
    };
  });

  const examEvents = subjects
    .filter((s: Subject) => s.exam_date)
    .map((s: Subject) => ({
      id: `exam-${s.id}`,
      title: `Exam: ${s.name}`,
      start: s.exam_date!,
      allDay: true,
      backgroundColor: "#ef4444",
      borderColor: "#dc2626",
      textColor: "#ffffff",
      extendedProps: { type: "exam", subject: s },
    }));

  const events = [...sessionEvents, ...examEvents];

  const handleEventClick = ({ event }: any) => {
    if (event.extendedProps.type === "exam") return;
    const entry: ScheduleEntry = event.extendedProps.entry;
    if (entry.status === "planned") setSelectedEntry(entry);
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl shadow-soft p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-surface-200 dark:bg-surface-800 rounded w-32" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-surface-200 dark:bg-surface-800 rounded-xl w-20" />
            ))}
          </div>
        </div>
        <div className="h-[550px] bg-[rgb(var(--surface-raised))] rounded-xl" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass rounded-2xl shadow-soft p-16 text-center">
        <Calendar className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
        <h3 className="font-display font-bold text-[rgb(var(--foreground))] mb-2">No schedule yet</h3>
        <p className="text-surface-500 text-sm mb-5 max-w-sm mx-auto">Generate a study schedule from the Dashboard and it will appear here.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-brand-sm"
        >
          Go to Dashboard
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl shadow-soft p-5">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay,dayGridMonth",
        }}
        events={events}
        eventClick={handleEventClick}
        height="auto"
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        allDaySlot={true}
        nowIndicator={true}
        eventDisplay="block"
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventContent={(arg) => {
          if (arg.event.extendedProps.type === "exam") {
            return (
              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="font-semibold text-xs truncate">{arg.event.title}</span>
              </div>
            );
          }

          const entry = arg.event.extendedProps.entry as ScheduleEntry;
          const isDone = entry.status === "completed" || entry.status === "skipped";

          return (
            <div className={`p-1.5 h-full flex flex-col ${isDone ? "opacity-75" : ""}`}>
              <div className="flex items-center gap-1 mb-0.5">
                {entry.status === "completed" && <Check className="w-3 h-3 shrink-0" />}
                {entry.status === "skipped" && <XIcon className="w-3 h-3 shrink-0" />}
                {entry.status === "planned" && <Clock className="w-3 h-3 shrink-0 opacity-70" />}
                <span className="font-semibold text-xs leading-tight truncate">{arg.event.title}</span>
              </div>
              {entry.ai_suggested_topic && (
                <span className="text-[10px] opacity-70 leading-tight truncate mt-auto">{entry.ai_suggested_topic}</span>
              )}
            </div>
          );
        }}
      />
      {selectedEntry && (
        <FeedbackModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
