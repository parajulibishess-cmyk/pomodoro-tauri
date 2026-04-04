import { NookFocusAnalytics, SessionResult } from './AnalyticsTypes';
import { loadAnalytics, saveAnalytics } from './AnalyticsStorage';

export class AnalyticsEngine {
  
  static recordSession(session: SessionResult): void {
    const data = loadAnalytics();
    const todayStr = this.formatDate(new Date());
    const monthStr = this.formatMonth(new Date());

    this.updateBehavioralMetrics(data, session);

    if (session.type === 'focus' && session.completed) {
      data.core.sessionCounts.focus += 1;
      data.core.minutes += session.durationMinutes;
      
      data.core.dailyHistory[todayStr] = (data.core.dailyHistory[todayStr] || 0) + session.durationMinutes;
      data.core.todayMinutes = data.core.dailyHistory[todayStr];
      
      data.core.monthlyVelocity[monthStr] = (data.core.monthlyVelocity[monthStr] || 0) + (session.durationMinutes / 60);

      this.calculateStreaks(data);
      this.calculateDailyAverage(data);

      if (session.task) {
        this.updateTaskMetrics(data, session);
      }
    } else if (session.completed) {
      if (session.type === 'shortBreak') data.core.sessionCounts.shortBreak += 1;
      if (session.type === 'longBreak') data.core.sessionCounts.longBreak += 1;
    }

    saveAnalytics(data);
  }

  private static updateBehavioralMetrics(data: NookFocusAnalytics, session: SessionResult) {
    const totalSessions = data.core.sessionCounts.focus + (session.type === 'focus' ? 1 : 0);
    
    if (session.type === 'focus') {
      const previouslyAbandoned = (data.behavioral.abandonmentRate / 100) * (totalSessions - 1);
      const newAbandoned = session.completed ? 0 : 1;
      data.behavioral.abandonmentRate = totalSessions > 0 ? ((previouslyAbandoned + newAbandoned) / totalSessions) * 100 : 0;
      data.behavioral.flowScore = 100 - data.behavioral.abandonmentRate;
    }

    if (!session.completed || session.type !== 'focus') return;

    const startHour = session.startTime.getHours();
    const dayOfWeek = session.startTime.getDay(); 
    
    data.behavioral.weeklyHourly[dayOfWeek][startHour] += session.durationMinutes;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      data.behavioral.weekSplit.weekend += session.durationMinutes;
    } else {
      data.behavioral.weekSplit.weekday += session.durationMinutes;
    }

    const isNightOwl = startHour >= 22 || startHour < 2;
    if (isNightOwl && data.core.minutes > 0) {
      const previousNightMinutes = (data.behavioral.nightOwlScore / 100) * (data.core.minutes - session.durationMinutes);
      data.behavioral.nightOwlScore = ((previousNightMinutes + session.durationMinutes) / data.core.minutes) * 100;
    }

    if (session.pauses.length > 0) {
      const qSize = session.durationMinutes / 4;
      session.pauses.forEach(pauseMin => {
        if (pauseMin <= qSize) data.behavioral.pauseDist.q1++;
        else if (pauseMin <= qSize * 2) data.behavioral.pauseDist.q2++;
        else if (pauseMin <= qSize * 3) data.behavioral.pauseDist.q3++;
        else data.behavioral.pauseDist.q4++;
      });
      
      const totalPausesEver = data.behavioral.flowDepth * (totalSessions - 1) + session.pauses.length;
      data.behavioral.flowDepth = totalPausesEver / totalSessions;
    }

    this.calculateGoldenHour(data);
  }

  private static updateTaskMetrics(data: NookFocusAnalytics, session: SessionResult) {
    const task = session.task!;
    
    const cat = task.category || 'Uncategorized';
    data.tasks.categoryDist[cat] = (data.tasks.categoryDist[cat] || 0) + session.durationMinutes;

    data.tasks.categoryChampion = Object.keys(data.tasks.categoryDist).reduce((a, b) => 
      data.tasks.categoryDist[a] > data.tasks.categoryDist[b] ? a : b
    );

    if (task.priority === 'P1' || task.priority === 'P2') {
      const prevPriorityMins = (data.tasks.priorityFocus / 100) * (data.core.minutes - session.durationMinutes);
      data.tasks.priorityFocus = data.core.minutes > 0 ? ((prevPriorityMins + session.durationMinutes) / data.core.minutes) * 100 : 0;
    }

    if (task.justCompleted) {
       const accuracy = task.actualPomodoros <= task.estimatedPomodoros 
        ? 100 
        : Math.max(0, 100 - ((task.actualPomodoros - task.estimatedPomodoros) * 10)); 
       
       data.tasks.estimationAccuracy = data.tasks.estimationAccuracy === 0 
         ? accuracy 
         : (data.tasks.estimationAccuracy + accuracy) / 2;

       if (task.dueDate) {
          const diffTime = Math.abs(session.endTime.getTime() - task.dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          data.tasks.procrastinationIndex = data.tasks.procrastinationIndex === 0
            ? diffDays
            : (data.tasks.procrastinationIndex + diffDays) / 2;
       }
    }
  }

  private static calculateStreaks(data: NookFocusAnalytics) {
    const dates = Object.keys(data.core.dailyHistory).sort();
    if (dates.length <= 1) {
      data.core.streak = 1;
      data.core.bestStreak = 1;
      return;
    }

    let currentStreak = 0;
    let maxStreak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1; 
        }
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    }

    data.core.streak = currentStreak;
    data.core.bestStreak = maxStreak;
  }

  private static calculateGoldenHour(data: NookFocusAnalytics) {
    let bestHour = 0;
    let maxVolume = 0;

    for (let hour = 0; hour < 24; hour++) {
      let hourTotal = 0;
      for (let day = 0; day < 7; day++) {
        hourTotal += data.behavioral.weeklyHourly[day][hour];
      }
      if (hourTotal > maxVolume) {
        maxVolume = hourTotal;
        bestHour = hour;
      }
    }
    
    data.behavioral.goldenHour = `${bestHour.toString().padStart(2, '0')}:00`;
  }

  private static calculateDailyAverage(data: NookFocusAnalytics) {
    const install = new Date(data.installDate);
    const today = new Date();
    const daysSinceInstall = Math.max(1, Math.ceil((today.getTime() - install.getTime()) / (1000 * 3600 * 24)));
    data.core.dailyAverage = Math.round(data.core.minutes / daysSinceInstall);
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; 
  }

  private static formatMonth(date: Date): string {
    return date.toISOString().substring(0, 7); 
  }
}