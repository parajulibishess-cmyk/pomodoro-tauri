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

type Listener = () => void;
const listeners: Listener[] = [];

export function subscribeTimer(listener: Listener) {
  listeners.push(listener);
}

export function notifyTimer() {
  listeners.forEach(listener => listener());
}