import { state, MODES, notify, Mode } from '../store/store';

let timerId: number | null = null;

function tick() {
  if (state.timeLeft > 0) {
    state.timeLeft--;
    notify('timer'); // Tell the UI to update
  } else {
    pauseTimer();
    alert(`${state.currentMode.toUpperCase()} session complete!`);
    // Future: Trigger Flow State Modal here
  }
}

export function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  notify('timer');
  timerId = window.setInterval(tick, 1000);
}

export function pauseTimer() {
  if (!state.isRunning) return;
  state.isRunning = false;
  notify('timer');
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

export function toggleTimer() {
    if (state.isRunning) pauseTimer();
    else startTimer();
}

export function setMode(mode: Mode) {
  pauseTimer();
  state.currentMode = mode;
  state.timeLeft = MODES[mode];
  notify('timer');
}