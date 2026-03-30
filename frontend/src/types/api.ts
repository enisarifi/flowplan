export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  available_hours_day: number;
  energy_peak: "morning" | "afternoon" | "evening";
  preferred_session_len_min: number;
  break_len_min: number;
  study_days: string[];
  timezone: string;
  blocked_hours_start: string;
  blocked_hours_end: string;
  max_sessions_per_day: number;
  min_break_between_min: number;
  pomodoro_work_min: number;
  pomodoro_break_min: number;
  sound_enabled: boolean;
  calendar_default_view: string;
  compact_mode: boolean;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  difficulty: number;
  color_hex: string;
  exam_date: string | null;
  weekly_hours_target: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ScheduleEntry {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  status: "planned" | "completed" | "skipped" | "rescheduled";
  ai_suggested_topic: string | null;
  created_at: string;
}

export interface SessionFeedback {
  id: string;
  schedule_entry_id: string;
  actual_duration_min: number | null;
  energy_rating: number | null;
  difficulty_rating: number | null;
  completion_pct: number | null;
  notes: string | null;
  submitted_at: string;
}

export interface SessionStats {
  total_sessions: number;
  completed_sessions: number;
  skipped_sessions: number;
  completion_rate: number;
  avg_energy_rating: number | null;
  avg_difficulty_rating: number | null;
}

export interface SubjectStatsItem {
  subject_id: string;
  subject_name: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  total_minutes_studied: number;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  total_sessions: number;
  completed_sessions: number;
  skipped_sessions: number;
  total_hours_studied: number;
  completion_rate: number;
  avg_energy: number | null;
  top_subject: string | null;
  weakest_subject: string | null;
  ai_summary: string | null;
  ai_tips: string[] | null;
}

export interface WeeklyTrendItem {
  date: string;
  sessions: number;
  minutes: number;
}

export interface EnergyHeatmapItem {
  day: number;
  hour: number;
  avg_energy: number;
  count: number;
}

export interface Note {
  id: string;
  user_id: string;
  subject_id: string | null;
  schedule_entry_id: string | null;
  title: string;
  content: string;
  subject_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  entry_id: string;
  title: string;
  subject_name: string | null;
  subject_color: string | null;
  planned_min: number;
  actual_min: number | null;
  energy: number | null;
  difficulty: number | null;
  completion_pct: number | null;
  completed_at: string;
}

export interface HistoryDay {
  date: string;
  total_minutes: number;
  session_count: number;
  entries: HistoryEntry[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
