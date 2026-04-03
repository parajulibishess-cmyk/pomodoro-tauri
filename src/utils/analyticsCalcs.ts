// 1. Add 'export' to your interface/type
export interface NookFocusAnalytics {
  core: {
    streak: number;
    minutes: number;
    dailyAverage: number;
    bestStreak: number;
    perfectDays: number;
    todayMinutes: number;
    sessionCounts: {
      focus: number;
      shortBreak: number;
      longBreak: number;
    };
  };
  behavioral: {
    flowScore: number;
    goldenHour: string;
    flowDepth: number;
    abandonmentRate: number;
    nightOwlScore: number;
    pauseDist: {
      q1: number;
      q2: number;
      q3: number;
      q4: number;
    };
    weekSplit: {
      weekday: number;
      weekend: number;
    };
    weeklyHourly: number[][];
  };
  tasks: {
    categoryDist: Record<string, number>;
    estimationAccuracy: number;
    procrastinationIndex: number;
    completionRate: number;
    priorityFocus: number;
    categoryChampion: string;
  };
}

// 2. Add 'export' to your function
export function loadAnalytics(): NookFocusAnalytics {
  // TODO: Replace with actual analytics calculation logic parsing stored app data
  return {
    core: {
      streak: 0,
      minutes: 0,
      dailyAverage: 0,
      bestStreak: 0,
      perfectDays: 0,
      todayMinutes: 0,
      sessionCounts: { focus: 0, shortBreak: 0, longBreak: 0 }
    },
    behavioral: {
      flowScore: 0,
      goldenHour: "09:00",
      flowDepth: 0,
      abandonmentRate: 0,
      nightOwlScore: 0,
      pauseDist: { q1: 0, q2: 0, q3: 0, q4: 0 },
      weekSplit: { weekday: 0, weekend: 0 },
      weeklyHourly: Array.from({ length: 7 }, () => Array(24).fill(0))
    },
    tasks: {
      categoryDist: {},
      estimationAccuracy: 0,
      procrastinationIndex: 0,
      completionRate: 0,
      priorityFocus: 0,
      categoryChampion: "-"
    }
  };
}
