import { BaseStore } from './BaseStore';
import { settingsStore } from './SettingsStore';
import { statsStore } from './StatsStore';
import { taskStore } from './TaskStore';

// You will need to convert useTimer.js into a plain class/object (e.g. `TimerLogic`)
import { TimerLogic } from '../utils/TimerLogic'; 

export interface TimerState {
  showFlowExtend: boolean;
  isExtension: boolean;
  triggerAutoStart: boolean;
}

class TimerStore extends BaseStore<TimerState> {
  public timer: TimerLogic;

  constructor() {
    super({
      showFlowExtend: false,
      isExtension: false,
      triggerAutoStart: false,
    });

    // Pass the completion handler directly to your Timer logic class
    this.timer = new TimerLogic(this.handleTimerComplete.bind(this));
  }

  public handleTimerComplete = (mode: string, isFocusSession: boolean) => {
    const settings = settingsStore.getState();
    const statsState = statsStore.getState();
    const tasksState = taskStore.getState();

    // 1. UPDATE SESSION COUNTS
    statsStore.setState(prev => ({
        stats: {
          ...prev.stats,
          sessionCounts: {
              ...prev.stats.sessionCounts,
              [mode]: (prev.stats.sessionCounts?.[mode] || 0) + 1
          }
        }
    }));

    if (isFocusSession) {
      this.setState({ showFlowExtend: true });
      
      const durationToAdd = this.state.isExtension ? settings.flowDuration : settings.durations.focus;
      const sessionIncrement = this.state.isExtension ? 0 : 1;
      const seedIncrement = this.state.isExtension ? 0 : 1;
      
      if (seedIncrement > 0) {
          statsStore.setState(prev => ({ seeds: prev.seeds + seedIncrement }));
      }
      
      const now = new Date();
      const today = now.toLocaleDateString('en-CA'); 
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      
      statsStore.setState(prev => {
        const stats = prev.stats;
        const newHistory = { ...stats.dailyHistory }; 
        const oldTodayTotal = newHistory[today] || 0;
        const newTodayTotal = oldTodayTotal + durationToAdd;
        newHistory[today] = newTodayTotal; 
        
        const newHourly = [...stats.hourlyActivity]; 
        newHourly[hour] += durationToAdd;

        const newWeeklyHourly = stats.weeklyHourly ? stats.weeklyHourly.map(row => [...row]) : Array.from({length:7}, () => new Array(24).fill(0));
        newWeeklyHourly[dayOfWeek][hour] += durationToAdd;
        
        let newStreak = stats.streak;
        if (stats.lastActiveDate !== today) { 
            const y = new Date(now); 
            y.setDate(y.getDate() - 1); 
            const yesterday = y.toLocaleDateString('en-CA');
            if (stats.lastActiveDate === yesterday) newStreak += 1; 
            else if (stats.lastActiveDate !== today) newStreak = 1; 
        }

        const newBestStreak = Math.max(stats.bestStreak || 0, newStreak);
        const perfectDaysIncrement = (!(oldTodayTotal >= settings.dailyGoal) && (newTodayTotal >= settings.dailyGoal)) ? 1 : 0;

        const activeTask = tasksState.tasks.find(t => t.id === tasksState.focusedTaskId);
        const activeCategory = activeTask?.category || "General";
        const activePriority = activeTask?.priority || 1;

        const newCategoryDist = { ...stats.categoryDist }; 
        newCategoryDist[activeCategory] = (newCategoryDist[activeCategory] || 0) + durationToAdd;

        const newPriorityDist = { ...stats.priorityDist };
        if (activeTask) {
             newPriorityDist[activePriority] = (newPriorityDist[activePriority] || 0) + durationToAdd;
        }

        return { 
          stats: {
            ...stats, 
            sessions: stats.sessions + sessionIncrement, 
            minutes: stats.minutes + durationToAdd, 
            dailyHistory: newHistory, 
            hourlyActivity: newHourly,
            weeklyHourly: newWeeklyHourly, 
            categoryDist: newCategoryDist, 
            priorityDist: newPriorityDist,
            streak: newStreak,
            lastActiveDate: today,
            bestStreak: newBestStreak,
            perfectDays: (stats.perfectDays || 0) + perfectDaysIncrement
          }
        };
      });

      if (tasksState.focusedTaskId && sessionIncrement > 0) {
        taskStore.setState(prev => ({
          tasks: prev.tasks.map(t => t.id === tasksState.focusedTaskId ? { ...t, completedPomos: (t.completedPomos || 0) + 1 } : t)
        }));
      }
    } else { 
        statsStore.setState(prev => ({ stats: { ...prev.stats, breaksCompleted: (prev.stats.breaksCompleted || 0) + 1 } })); 

        if (settings.autoStartBreaks && mode === 'short') {
            this.timer.startSession('focus');
        } else if (mode === 'long') {
            this.timer.setMode('focus');
        }
    }
  };

  public pauseSession = () => {
    if (this.timer.mode === 'focus' && this.timer.isActive) {
        const progress = this.timer.calculateProgress();
        const tasksState = taskStore.getState();
        const activeTask = tasksState.tasks.find(t => t.id === tasksState.focusedTaskId);
        const isTaskCompleted = activeTask?.completed;

        statsStore.setState(prev => {
            let bucket = "0-25";
            if (progress > 75) bucket = "75-100";
            else if (progress > 50) bucket = "50-75";
            else if (progress > 25) bucket = "25-50";

            return {
                stats: {
                  ...prev.stats,
                  totalPauses: (prev.stats.totalPauses || 0) + 1,
                  abandonedSessions: !isTaskCompleted ? (prev.stats.abandonedSessions || 0) + 1 : (prev.stats.abandonedSessions || 0),
                  pauseDist: {
                      ...(prev.stats.pauseDist || { "0-25": 0, "25-50": 0, "50-75": 0, "75-100": 0 }),
                      [bucket]: ((prev.stats.pauseDist?.[bucket] || 0) + 1)
                  }
                }
            };
        });
    }
    this.timer.pauseTimer();
  };

  public cancelSession = () => {
    this.timer.pauseTimer();
    this.timer.setMode(this.timer.mode); 
    
    const tasksState = taskStore.getState();
    const activeTask = tasksState.tasks.find(t => t.id === tasksState.focusedTaskId);
    
    if (this.timer.mode === 'focus' && !activeTask?.completed) {
      statsStore.setState(prev => ({ stats: { ...prev.stats, abandonedSessions: (prev.stats.abandonedSessions || 0) + 1 }}));
    }
  };

  public finishSession = () => {
    this.setState({ showFlowExtend: false, isExtension: false });
    
    const statsState = statsStore.getState();
    const settings = settingsStore.getState();
    const isLongBreak = statsState.stats.sessions > 0 && (statsState.stats.sessions % settings.longBreakInterval === 0);
    
    this.timer.finishIntermission('break', isLongBreak ? 'long' : 'short'); 
  };

  public extendSession = () => {
    this.setState({ showFlowExtend: false, isExtension: true });
    this.timer.finishIntermission('extend');
    statsStore.setState(prev => ({ stats: { ...prev.stats, flowExtensions: (prev.stats.flowExtensions || 0) + 1 } }));
  };
}

export const timerStore = new TimerStore();