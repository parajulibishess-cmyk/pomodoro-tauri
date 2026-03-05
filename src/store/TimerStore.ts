// src/store/TimerStore.ts
import { settingsManager } from './SettingsManager';

export type Mode = 'focus' | 'short' | 'long';

export const timerState = {
  currentMode: 'focus' as Mode,
  timeLeft: settingsManager.focusDuration,
  isRunning: false,
  pomodoroCount: 0,
};

type Listener = (state: typeof timerState) => void;
const listeners: Listener[] = [];

export function subscribeTimer(listener: Listener) {
  listeners.push(listener);
}

export function notifyTimer() {
  listeners.forEach(listener => listener(timerState));
}