import { create } from "zustand";
import { ScheduleEntry } from "@/types/api";

export type TimerPhase = "idle" | "queue" | "work" | "feedback" | "break" | "done";

interface TimerState {
  phase: TimerPhase;
  queue: ScheduleEntry[];
  currentEntry: ScheduleEntry | null;
  currentIndex: number;
  secondsLeft: number;
  isRunning: boolean;
  sessionWorkedSeconds: number;
  dailyWorkedSeconds: number;
  completedToday: string[];
  breakMinutes: number;
  soundEnabled: boolean;

  // Actions
  loadQueue: (sessions: ScheduleEntry[], breakMin?: number) => void;
  startSession: (entry: ScheduleEntry, breakMin?: number) => void;
  startNext: () => void;
  togglePause: () => void;
  tick: () => void;
  enterFeedback: () => void;
  finishFeedback: () => void;
  skipToNext: () => void;
  stopAll: () => { dailyMinutes: number; sessionsCompleted: number };
  reset: () => void;
}

function playBeep(enabled: boolean) {
  if (!enabled) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 300);
  } catch {}
}

export const useTimerStore = create<TimerState>((set, get) => ({
  phase: "idle",
  queue: [],
  currentEntry: null,
  currentIndex: -1,
  secondsLeft: 0,
  isRunning: false,
  sessionWorkedSeconds: 0,
  dailyWorkedSeconds: 0,
  completedToday: [],
  breakMinutes: 5,
  soundEnabled: true,

  loadQueue: (sessions, breakMin = 5) => {
    const planned = sessions
      .filter((s) => s.status === "planned")
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    if (planned.length === 0) return;

    const first = planned[0];
    set({
      phase: "work",
      queue: planned,
      currentEntry: first,
      currentIndex: 0,
      secondsLeft: first.duration_min * 60,
      isRunning: true,
      sessionWorkedSeconds: 0,
      breakMinutes: breakMin,
    });
  },

  startSession: (entry, breakMin = 5) => {
    set({
      phase: "work",
      queue: [entry],
      currentEntry: entry,
      currentIndex: 0,
      secondsLeft: entry.duration_min * 60,
      isRunning: true,
      sessionWorkedSeconds: 0,
      breakMinutes: breakMin,
    });
  },

  startNext: () => {
    const { queue, currentIndex, breakMinutes } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      set({ phase: "done", isRunning: false, secondsLeft: 0 });
      return;
    }
    const next = queue[nextIndex];
    set({
      phase: "work",
      currentEntry: next,
      currentIndex: nextIndex,
      secondsLeft: next.duration_min * 60,
      isRunning: true,
      sessionWorkedSeconds: 0,
    });
  },

  togglePause: () => set((s) => ({ isRunning: !s.isRunning })),

  tick: () => {
    const { phase, secondsLeft, soundEnabled } = get();

    if (phase === "work") {
      set((s) => ({
        sessionWorkedSeconds: s.sessionWorkedSeconds + 1,
        dailyWorkedSeconds: s.dailyWorkedSeconds + 1,
      }));
    }

    if (secondsLeft <= 1) {
      playBeep(soundEnabled);

      if (phase === "work") {
        // Work done → go to feedback
        set({ phase: "feedback", isRunning: false, secondsLeft: 0 });
      } else if (phase === "break") {
        // Break done → auto-advance
        get().startNext();
      }
      return;
    }

    set({ secondsLeft: secondsLeft - 1 });
  },

  enterFeedback: () => {
    set({ phase: "feedback", isRunning: false });
  },

  finishFeedback: () => {
    const { currentEntry, breakMinutes, queue, currentIndex } = get();
    if (currentEntry) {
      set((s) => ({ completedToday: [...s.completedToday, currentEntry!.id] }));
    }

    // If more sessions, start break. Otherwise done.
    if (currentIndex + 1 < queue.length) {
      set({
        phase: "break",
        secondsLeft: breakMinutes * 60,
        isRunning: true,
        sessionWorkedSeconds: 0,
      });
    } else {
      set({ phase: "done", isRunning: false, secondsLeft: 0 });
    }
  },

  skipToNext: () => {
    const { queue, currentIndex } = get();
    if (currentIndex + 1 >= queue.length) {
      set({ phase: "done", isRunning: false, secondsLeft: 0 });
      return;
    }
    get().startNext();
  },

  stopAll: () => {
    const { dailyWorkedSeconds, completedToday } = get();
    const result = {
      dailyMinutes: Math.round(dailyWorkedSeconds / 60),
      sessionsCompleted: completedToday.length,
    };
    set({
      phase: "idle",
      queue: [],
      currentEntry: null,
      currentIndex: -1,
      secondsLeft: 0,
      isRunning: false,
      sessionWorkedSeconds: 0,
      dailyWorkedSeconds: 0,
      completedToday: [],
    });
    return result;
  },

  reset: () => {
    set({
      phase: "idle",
      queue: [],
      currentEntry: null,
      currentIndex: -1,
      secondsLeft: 0,
      isRunning: false,
      sessionWorkedSeconds: 0,
      completedToday: [],
    });
  },
}));
