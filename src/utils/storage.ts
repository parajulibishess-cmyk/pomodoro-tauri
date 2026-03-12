// 1. Interfaces & Types

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
  dailyHistory: Record<string, number>; // Maps YYYY-MM-DD to total focus minutes
  monthlyVelocity: Record<string, number>; // Maps YYYY-MM to total focus hours
}

export interface BehavioralMetrics {
  flowScore: number; 
  abandonmentRate: number; 
  goldenHour: string; // e.g., "09:00" or "14:00" representing the start of the 1-hour window
  flowDepth: number;
  pauseDist: {
    q1: number; // 0-25%
    q2: number; // 25-50%
    q3: number; // 50-75%
    q4: number; // 75-100%
  };
  nightOwlScore: number; 
  weekSplit: {
    weekday: number; // Total weekday minutes
    weekend: number; // Total weekend minutes
  };
  weeklyHourly: number[][]; // 7x24 grid (Day 0-6 x Hour 0-23)
}

export interface TaskAnalytics {
  completionRate: number;
  estimationAccuracy: number;
  priorityFocus: number;
  procrastinationIndex: number; // tracked in days or hours
  categoryDist: Record<string, number>; // Maps Category name to total focus minutes
  categoryChampion: string; // Category string
}

export interface NookFocusAnalytics {
  installDate: string; // ISO String
  core: CoreFocusStats;
  behavioral: BehavioralMetrics;
  tasks: TaskAnalytics;
}

// 2. Default Initial State

const DEFAULT_ANALYTICS: NookFocusAnalytics = {
  installDate: new Date().toISOString(),
  core: {
    minutes: 0,
    dailyAverage: 0,
    todayMinutes: 0,
    streak: 0,
    bestStreak: 0,
    perfectDays: 0,
    sessionCounts: { focus: 0, shortBreak: 0, longBreak: 0 },
    dailyHistory: {},
    monthlyVelocity: {}
  },
  behavioral: {
    flowScore: 100, // Starts at 100%
    abandonmentRate: 0,
    goldenHour: "N/A",
    flowDepth: 0,
    pauseDist: { q1: 0, q2: 0, q3: 0, q4: 0 },
    nightOwlScore: 0,
    weekSplit: { weekday: 0, weekend: 0 },
    weeklyHourly: Array.from({ length: 7 }, () => Array(24).fill(0))
  },
  tasks: {
    completionRate: 0,
    estimationAccuracy: 0,
    priorityFocus: 0,
    procrastinationIndex: 0,
    categoryDist: {},
    categoryChampion: "N/A"
  }
};

// 3. Storage & Boilerplate Functions

const ANALYTICS_STORAGE_KEY = 'pomodoro_analytics_data';

export function loadAnalytics(): NookFocusAnalytics {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!stored) return DEFAULT_ANALYTICS;
    
    // Merge stored with default to ensure new properties are never undefined upon app updates
    return { ...DEFAULT_ANALYTICS, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to parse NookFocus analytics data. Returning defaults.", error);
    return DEFAULT_ANALYTICS;
  }
}

export function saveAnalytics(data: NookFocusAnalytics): void {
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save NookFocus analytics data.", error);
  }
}