import { NookFocusAnalytics } from './AnalyticsTypes';

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
    flowScore: 100, 
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

const ANALYTICS_STORAGE_KEY = 'pomodoro_analytics_data';

export function loadAnalytics(): NookFocusAnalytics {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!stored) return DEFAULT_ANALYTICS;
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