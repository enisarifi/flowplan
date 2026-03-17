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

function statusColor(status: string): string {
  switch (status) {
    case "completed": return "#22c55e";
    case "skipped": return "#ef4444";
    default: return "#6366f1";
  }
}

export default function CalendarView() {
  const { data: entries = [], isLoading } = useSchedule();
  const { data: subjects = [] } = useSubjects();
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  const subjectMap = Object.fromEntries(subjects.map((s: Subject) => [s.id, s]));

  const events = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    start: entry.start_time,
    end: entry.end_time,
    backgroundColor: subjectMap[entry.subject_id]?.color_hex ?? statusColor(entry.status),
    borderColor: "transparent",
    extendedProps: { entry },
  }));

  const handleEventClick = ({ event }: any) => {
    const entry: ScheduleEntry = event.extendedProps.entry;
    if (entry.status === "planned") setSelectedEntry(entry);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-48 mb-4" />
        <div className="h-96 bg-slate-50 rounded" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <p className="text-slate-400 text-sm">No schedule yet — go to Dashboard and click <span className="font-medium text-slate-500">Generate new schedule</span>.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
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
        allDaySlot={false}
      />
      {selectedEntry && (
        <FeedbackModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
