// src/features/Analytics/AnalyticsCalcs.ts

// Fallback interface in case AnalyticsTypes isn't fully defined yet
export interface SessionData {
  type: 'focus' | 'shortBreak' | 'longBreak';
  durationMinutes: number;
  completed: boolean;
  startTime: Date | string;
  endTime: Date | string;
  pauses: number[];
}

export const AnalyticsCalcs = {
  getTodayFocusTime(sessions: SessionData[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sessions
      .filter(s => s.type === 'focus')
      .filter(s => new Date(s.startTime).setHours(0, 0, 0, 0) === today.getTime())
      .reduce((total, s) => total + s.durationMinutes, 0);
  },

  getCompletionRate(sessions: SessionData[]): number {
    const focusSessions = sessions.filter(s => s.type === 'focus');
    if (focusSessions.length === 0) return 0;
    
    const completedCount = focusSessions.filter(s => s.completed).length;
    return Math.round((completedCount / focusSessions.length) * 100);
  },

  getTotalSessionsCompleted(sessions: SessionData[]): number {
    return sessions.filter(s => s.type === 'focus' && s.completed).length;
  }
};