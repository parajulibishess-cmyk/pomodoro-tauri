// src/store/TimerStore.ts

export const MODES = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export type Mode = keyof typeof MODES;

export const timerState = {
  currentMode: 'focus' as Mode,
  timeLeft: MODES['focus'],
  isRunning: false,
};

// 1. Update the Listener type to expect the state parameter
type Listener = (state: typeof timerState) => void;
const listeners: Listener[] = [];

export function subscribeTimer(listener: Listener) {
  listeners.push(listener);
}

export function notifyTimer() {
  // 2. Pass the timerState object to the listeners
  listeners.forEach(listener => listener(timerState));
}