export interface CoreFocusStats {
  minutes: number;
  dailyAverage: number;
  todayMinutes: number;
  streak: number;
  bestStreak: number;
  perfectDays: number;
  sessionCounts: {
    focus: number;
    shortBreak: number;
    longBreak: number;
  };
  dailyHistory: Record<string, number>; 
  monthlyVelocity: Record<string, number>; 
}

export interface BehavioralMetrics {
  flowScore: number; 
  abandonmentRate: number; 
  goldenHour: string; 
  flowDepth: number;
  pauseDist: {
    q1: number; 
    q2: number; 
    q3: number; 
    q4: number; 
  };
  nightOwlScore: number; 
  weekSplit: {
    weekday: number; 
    weekend: number; 
  };
  weeklyHourly: number[][]; 
}

export interface TaskAnalytics {
  completionRate: number;
  estimationAccuracy: number;
  priorityFocus: number;
  procrastinationIndex: number; 
  categoryDist: Record<string, number>; 
  categoryChampion: string; 
}

export interface NookFocusAnalytics {
  installDate: string; 
  core: CoreFocusStats;
  behavioral: BehavioralMetrics;
  tasks: TaskAnalytics;
}

export interface SessionResult {
  type: 'focus' | 'shortBreak' | 'longBreak';
  durationMinutes: number;
  completed: boolean; 
  startTime: Date;
  endTime: Date;
  pauses: number[]; 
  task?: {
    id: string;
    category: string;
    priority: string; 
    estimatedPomodoros: number;
    actualPomodoros: number;
    dueDate?: Date;
    justCompleted: boolean;
  };
}