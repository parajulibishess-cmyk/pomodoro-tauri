// src/features/Timer/TimerLogic.ts
import { timerState, notifyTimer, Mode } from './TimerStore.ts';
import { settingsManager } from '../Settings/SettingsManager.ts';
import { AnalyticsEngine } from '../Analytics/AnalyticsEngine.ts';
import { taskStore } from '../Tasks/TaskStore.ts';

let timerId: number | null = null;

// --- Analytics Tracking State ---
let sessionStartTime: Date | null = null;
let sessionPauses: number[] = [];

// Helper to map Timer mode to Analytics Engine mode
function mapModeForAnalytics(mode: Mode): 'focus' | 'shortBreak' | 'longBreak' {
  if (mode === 'short') return 'shortBreak';
  if (mode === 'long') return 'longBreak';
  return 'focus';
}

function tick() {
  if (timerState.timeLeft > 0) {
    timerState.timeLeft--;
    notifyTimer(); 
  } else {
    handleCycleComplete();
  }
}

function handleCycleComplete() {
  let sessionTaskData = undefined;

  // 1. Process Task Analytics & Fix Visual Bug BEFORE transitioning
  if (timerState.currentMode === 'focus' && taskStore.focusedTaskId !== null) {
    const task = taskStore.tasks.find(t => t.id === taskStore.focusedTaskId);
    if (task) {
      task.completedPomos += 1;
      taskStore.save(); 
      
      sessionTaskData = {
        id: task.id.toString(),
        category: task.category,
        priority: `P${task.priority}`, 
        estimatedPomodoros: task.estimatedPomos,
        actualPomodoros: task.completedPomos,
        justCompleted: task.completed, 
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      };
    }
  }

  // 2. Record the successfully completed session
  if (sessionStartTime) {
    const now = new Date();
    const elapsedMs = now.getTime() - sessionStartTime.getTime();
    const durationMinutes = Math.max(1, Math.round(elapsedMs / 60000));
    
    AnalyticsEngine.recordSession({
      type: mapModeForAnalytics(timerState.currentMode),
      durationMinutes: durationMinutes,
      completed: true,
      startTime: sessionStartTime,
      endTime: now,
      pauses: sessionPauses,
      task: sessionTaskData 
    });
    
    sessionStartTime = null;
    sessionPauses = [];
  }

  pauseTimerForTransition();
  
  if (timerState.currentMode === 'focus') {
    timerState.pomodoroCount++;
    if (timerState.pomodoroCount % settingsManager.longBreakInterval === 0) {
      setMode('long');
    } else {
      setMode('short');
    }
    if (settingsManager.autoStartBreaks) {
      startTimer();
    }
  } else if (timerState.currentMode === 'short') {
    setMode('focus');
    if (settingsManager.autoStartBreaks) {
      startTimer();
    }
  } else if (timerState.currentMode === 'long') {
    timerState.pomodoroCount = 0; 
    setMode('focus');
  }
}

function pauseTimerForTransition() {
  if (!timerState.isRunning) return;
  timerState.isRunning = false;
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

export function startTimer() {
  if (timerState.isRunning) return;
  
  if (!sessionStartTime) {
    sessionStartTime = new Date();
    sessionPauses = [];
  }

  timerState.isRunning = true;
  notifyTimer();
  timerId = window.setInterval(tick, 1000);
}

export function pauseTimer() {
  if (!timerState.isRunning) return;
  pauseTimerForTransition();

  // Record as an abandoned/paused session for analytics
  if (sessionStartTime) {
    const now = new Date();
    const elapsedMs = now.getTime() - sessionStartTime.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    if (elapsedMinutes > 0) {
      AnalyticsEngine.recordSession({
        type: mapModeForAnalytics(timerState.currentMode),
        durationMinutes: elapsedMinutes,
        completed: false, // Mark as abandoned
        startTime: sessionStartTime,
        endTime: now,
        pauses: sessionPauses
      });
    }
    
    sessionStartTime = null;
    sessionPauses = [];
  }

  // Feature: If auto-start breaks is enabled, any pause resets the session completely to the start
  if (settingsManager.autoStartBreaks) {
     timerState.pomodoroCount = 0; 
     timerState.currentMode = 'focus';
     timerState.timeLeft = settingsManager.getDurationForMode('focus');
  } else {
     // Otherwise just set it to 0 as an abandoned timer
     timerState.timeLeft = 0;
  }

  notifyTimer();
}

export function toggleTimer() {
  if (timerState.isRunning) pauseTimer();
  else startTimer();
}

export function setMode(mode: Mode) {
  if (sessionStartTime) {
    if (timerState.isRunning) {
      const now = new Date();
      const elapsedMs = now.getTime() - sessionStartTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      if (elapsedMinutes > 0) {
        AnalyticsEngine.recordSession({
          type: mapModeForAnalytics(timerState.currentMode),
          durationMinutes: elapsedMinutes,
          completed: false,
          startTime: sessionStartTime,
          endTime: now,
          pauses: sessionPauses
        });
      }
    }
    
    sessionStartTime = null;
    sessionPauses = [];
  }

  pauseTimerForTransition();
  timerState.currentMode = mode;
  timerState.timeLeft = settingsManager.getDurationForMode(mode);
  notifyTimer();
}

export function finishEarly() {
  if (timerState.currentMode === 'focus' && timerState.isRunning) {
    
    let sessionTaskData = undefined;
    let isTaskCompletedSuccess = false;

    if (taskStore.focusedTaskId !== null) {
      const task = taskStore.tasks.find(t => t.id === taskStore.focusedTaskId);
      if (task && task.completed) {
         isTaskCompletedSuccess = true;
         task.completedPomos += 1; 
         taskStore.save();

         sessionTaskData = {
          id: task.id.toString(),
            category: task.category,
            priority: `P${task.priority}`,
            estimatedPomodoros: task.estimatedPomos,
            actualPomodoros: task.completedPomos,
            justCompleted: true, 
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined
         };

         taskStore.focusedTaskId = null;
         taskStore.save();
      }
    }

    if (sessionStartTime) {
      const now = new Date();
      const elapsedMs = now.getTime() - sessionStartTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      if (elapsedMinutes > 0) {
        AnalyticsEngine.recordSession({
          type: 'focus',
          durationMinutes: elapsedMinutes,
          completed: isTaskCompletedSuccess ? true : false, 
          startTime: sessionStartTime,
          endTime: now,
          pauses: sessionPauses,
          task: sessionTaskData
        });
      }
      sessionStartTime = null;
      sessionPauses = [];
    }

    pauseTimerForTransition(); 
    timerState.pomodoroCount = 0; 
    timerState.currentMode = 'focus';
    timerState.timeLeft = settingsManager.getDurationForMode('focus');
    
    notifyTimer();
  }
}