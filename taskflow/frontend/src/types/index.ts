export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  target_date?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  task_count?: number;
  completed_task_count?: number;
  tasks?: Task[];
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  deadline?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  goal_id?: number;
  created_at: string;
  completed_at?: string;
}

export interface Routine {
  id: number;
  name: string;
  description?: string;
  schedule_days: string;
  active: boolean;
  created_at: string;
  today_completed?: boolean;
}

export interface RoutineOccurrence {
  routine_id: number;
  routine_name: string;
  occurrence_date: string;
  completed: boolean;
  completed_at?: string;
}

export interface Reminder {
  id: number;
  task_id?: number;
  routine_id?: number;
  due_at: string;
  enabled: boolean;
  task_title?: string;
  routine_name?: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  read_at?: string;
}

export interface DailyMissions {
  date: string;
  tasks: Task[];
  routine_occurrences: RoutineOccurrence[];
  summary: {
    total: number;
    completed: number;
  };
}

export interface ProgressSummary {
  tasks_total: number;
  tasks_completed: number;
  tasks_pending: number;
  routines_total_occurrences: number;
  routines_completed_occurrences: number;
  completion_rate_tasks: number;
  completion_rate_routines: number;
  daily_breakdown: Array<{
    date: string;
    tasks_completed: number;
    routines_completed: number;
  }>;
}

export interface FocusSuggestion {
  suggestion: string;
  tip: string;
  task_title?: string;
}

// Request and helper types
export interface AuthResponse {
  access_token?: string;
  token?: string;
  user?: User;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  goal_id?: number | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'completed';
  deadline?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  goal_id?: number | null;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  target_date?: string | null;
  status?: 'active' | 'completed' | 'archived';
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  target_date?: string | null;
  status?: 'active' | 'completed' | 'archived';
}

export interface CreateRoutineInput {
  name: string;
  description?: string;
  schedule_days: string;
  active?: boolean;
}

export interface UpdateRoutineInput {
  name?: string;
  description?: string;
  schedule_days?: string;
  active?: boolean;
}

export interface CreateReminderInput {
  task_id?: number | null;
  routine_id?: number | null;
  due_at: string;
  enabled?: boolean;
}
