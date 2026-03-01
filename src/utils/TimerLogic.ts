import { timerState, MODES, notifyTimer, Mode } from '../store/TimerStore';

let timerId: number | null = null;

function tick() {
  if (timerState.timeLeft > 0) {
    timerState.timeLeft--;
    notifyTimer(); // Tell the UI to update
  } else {
    pauseTimer();
    alert(`${timerState.currentMode.toUpperCase()} session complete!`);
    // Future: Trigger Flow State Modal here
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
  timerState.timeLeft = MODES[mode];
  notifyTimer();
}