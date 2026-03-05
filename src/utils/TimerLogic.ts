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
  pauseTimer();
  
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

export function startTimer() {
  if (timerState.isRunning) return;
  timerState.isRunning = true;
  notifyTimer();
  timerId = window.setInterval(tick, 1000);
}

export function pauseTimer() {
  if (!timerState.isRunning) return;
  timerState.isRunning = false;
  notifyTimer();
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

export function toggleTimer() {
  if (timerState.isRunning) pauseTimer();
  else startTimer();
}

export function setMode(mode: Mode) {
  pauseTimer();
  timerState.currentMode = mode;
  // Always fetch dynamic duration from SettingsManager upon switching modes
  timerState.timeLeft = settingsManager.getDurationForMode(mode);
  notifyTimer();
}