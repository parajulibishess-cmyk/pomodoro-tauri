// src/features/Timer/TimerLogic.ts
import { timerState, notifyTimer, Mode } from './TimerStore.ts';
import { settingsManager } from '../Settings/SettingsManager.ts';
import { AnalyticsEngine } from '../Analytics/AnalyticsEngine.ts';

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
  // 1. Record the successfully completed session before transitioning
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
      pauses: sessionPauses
    });
    
    // Reset analytics state for the next session
    sessionStartTime = null;
    sessionPauses = [];
  }

  // Use a private pause mechanism so we don't trigger the reset rule
  pauseTimerForTransition();
  
  if (timerState.currentMode === 'focus') {
    timerState.pomodoroCount++;
    // Check if long break interval is reached
    if (timerState.pomodoroCount % settingsManager.longBreakInterval === 0) {
      setMode('long');
    } else {
      setMode('short');
    }
    // Auto start breaks if setting is enabled
    if (settingsManager.autoStartBreaks) {
      startTimer();
    }
  } else if (timerState.currentMode === 'short') {
    // Break is over -> Go to Focus
    setMode('focus');
    if (settingsManager.autoStartBreaks) {
      startTimer();
    }
  } else if (timerState.currentMode === 'long') {
    // End of full cycle -> Reset count to 0, return to focus mode, strictly NO auto start
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
  
  // Initialize analytics variables if this is a fresh start
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

  // No Pausing Rule: Reset on Stop for Focus sessions
  if (timerState.currentMode === 'focus') {
    // This is treated as an abandoned session!
    if (sessionStartTime) {
      const now = new Date();
      const elapsedMs = now.getTime() - sessionStartTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      if (elapsedMinutes > 0) {
        AnalyticsEngine.recordSession({
          type: 'focus',
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

    timerState.timeLeft = settingsManager.getDurationForMode('focus');
  } else {
    // If pausing is allowed (e.g., during breaks), just record the pause timestamp
    if (sessionStartTime) {
      const elapsedMs = new Date().getTime() - sessionStartTime.getTime();
      sessionPauses.push(Math.floor(elapsedMs / 60000));
    }
  }

  notifyTimer();
}

export function toggleTimer() {
  if (timerState.isRunning) pauseTimer();
  else startTimer();
}

export function setMode(mode: Mode) {
  // If user switches modes, record the current session as abandoned
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
  // Always fetch dynamic duration from SettingsManager upon switching modes
  timerState.timeLeft = settingsManager.getDurationForMode(mode);
  notifyTimer();
}

export function finishEarly() {
  if (timerState.currentMode === 'focus' && timerState.isRunning) {
    // Handle the early abandonment analytics
    if (sessionStartTime) {
      const now = new Date();
      const elapsedMs = now.getTime() - sessionStartTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      if (elapsedMinutes > 0) {
        AnalyticsEngine.recordSession({
          type: 'focus',
          durationMinutes: elapsedMinutes,
          completed: false,
          startTime: sessionStartTime,
          endTime: now,
          pauses: sessionPauses
        });
      }
      sessionStartTime = null;
      sessionPauses = [];
    }

    pauseTimerForTransition(); // Stops the timer under the hood
    
    // End the entire session completely and return to the Start Screen 
    timerState.pomodoroCount = 0; 
    timerState.currentMode = 'focus';
    timerState.timeLeft = settingsManager.getDurationForMode('focus');
    
    notifyTimer();
  }
}