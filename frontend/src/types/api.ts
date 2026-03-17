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

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
