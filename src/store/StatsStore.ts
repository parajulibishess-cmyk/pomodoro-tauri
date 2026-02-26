import { BaseStore } from './BaseStore';

export interface StatsData {
  sessions: number;
  minutes: number;
  tasksCompleted: number;
  breaksCompleted: number;
  dailyHistory: Record<string, number>;
  hourlyActivity: number[];
  categoryDist: Record<string, number>;
  streak: number;
  lastActiveDate: string | null;
  flowExtensions: number;
  bestStreak: number;
  perfectDays: number;
  sessionCounts: { focus: number; short: number; long: number };
  installDate: string;
  priorityDist: Record<number, number>;
  totalPauses: number;
  abandonedSessions: number;
  pauseDist: Record<string, number>;
  weeklyHourly: number[][];
}

export interface StatsState {
  stats: StatsData;
  seeds: number;
  postcards: any[];
}

class StatsStore extends BaseStore<StatsState> {
  constructor() {
    const storedStatsRaw = localStorage.getItem('nook_stats');
    const storedStats = storedStatsRaw ? JSON.parse(storedStatsRaw) : null;
    
    const defaults: StatsData = {
      sessions: 0, minutes: 0, tasksCompleted: 0, breaksCompleted: 0,
      dailyHistory: {}, hourlyActivity: new Array(24).fill(0), categoryDist: { "General": 0 },
      streak: 0, lastActiveDate: null, flowExtensions: 0, bestStreak: 0, perfectDays: 0,
      sessionCounts: { focus: 0, short: 0, long: 0 },
      installDate: new Date().toISOString(),
      priorityDist: { 4: 0, 3: 0, 2: 0, 1: 0 },
      totalPauses: 0, abandonedSessions: 0,
      pauseDist: { "0-25": 0, "25-50": 0, "50-75": 0, "75-100": 0 },
      weeklyHourly: Array.from({ length: 7 }, () => new Array(24).fill(0))
    };

    let mergedStats = defaults;
    if (storedStats) {
      const validWeeklyHourly = (Array.isArray(storedStats.weeklyHourly) && storedStats.weeklyHourly.length === 7) 
          ? storedStats.weeklyHourly 
          : defaults.weeklyHourly;

      mergedStats = {
        ...defaults,
        ...storedStats,
        sessionCounts: { ...defaults.sessionCounts, ...(storedStats.sessionCounts || {}) },
        priorityDist: { ...defaults.priorityDist, ...(storedStats.priorityDist || {}) },
        pauseDist: { ...defaults.pauseDist, ...(storedStats.pauseDist || {}) },
        weeklyHourly: validWeeklyHourly
      };
    }

    super({
      stats: mergedStats,
      seeds: parseInt(localStorage.getItem('nook_seeds') || '0', 10),
      postcards: JSON.parse(localStorage.getItem('nook_postcards') || '[]')
    });
  }

  protected onStateChange(prevState: StatsState) {
    if (prevState.stats !== this.state.stats) localStorage.setItem('nook_stats', JSON.stringify(this.state.stats));
    if (prevState.seeds !== this.state.seeds) localStorage.setItem('nook_seeds', this.state.seeds.toString());
    if (prevState.postcards !== this.state.postcards) localStorage.setItem('nook_postcards', JSON.stringify(this.state.postcards));
  }
}

export const statsStore = new StatsStore();