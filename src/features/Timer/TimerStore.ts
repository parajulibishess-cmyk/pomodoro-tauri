// src/features/Timer/TimerStore.ts
import { settingsManager } from '../Settings/SettingsManager';

export type Mode = 'focus' | 'short' | 'long';

export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  currentMode: Mode;
  pomodoroCount: number;
}

// Initialize with the saved focus duration
export const timerState: TimerState = {
  timeLeft: settingsManager.getDurationForMode('focus'),
  isRunning: false,
  currentMode: 'focus',
  pomodoroCount: 0
};

// Simple observer pattern to trigger UI re-renders
const listeners: Set<() => void> = new Set();

export function subscribeTimer(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function notifyTimer() {
  listeners.forEach(cb => cb());
}