// src/utils/TimerLogic.ts
import { timerState, notifyTimer, Mode } from '../store/TimerStore';
import { settingsManager } from '../store/SettingsManager';

let timerId: number | null = null;

function tick() {
  if (timerState.timeLeft > 0) {
    timerState.timeLeft--;
    notifyTimer(); 
  } else {
    handleCycleComplete();
  }
}

function handleCycleComplete() {
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
    clearInterval(timerId);
    timerId = null;
  }
}

export function startTimer() {
  if (timerState.isRunning) return;
  timerState.isRunning = true;
  notifyTimer();
  timerId = window.setInterval(tick, 1000);
}

export function pauseTimer() {
  if (!timerState.isRunning) return;
  pauseTimerForTransition();

  // No Pausing Rule: Reset on Stop for Focus sessions
  if (timerState.currentMode === 'focus') {
    timerState.timeLeft = settingsManager.getDurationForMode('focus');
  }

  notifyTimer();
}

export function toggleTimer() {
  if (timerState.isRunning) pauseTimer();
  else startTimer();
}

export function setMode(mode: Mode) {
  pauseTimerForTransition();
  timerState.currentMode = mode;
  // Always fetch dynamic duration from SettingsManager upon switching modes
  timerState.timeLeft = settingsManager.getDurationForMode(mode);
  notifyTimer();
}

export function finishEarly() {
  if (timerState.currentMode === 'focus' && timerState.isRunning) {
    pauseTimerForTransition(); // Stops the timer under the hood
    
    // End the entire session completely and return to the Start Screen 
    timerState.pomodoroCount = 0; 
    timerState.currentMode = 'focus';
    timerState.timeLeft = settingsManager.getDurationForMode('focus');
    
    notifyTimer();
  }
}