import { state, subscribe, MODES } from '../store/store';
import { toggleTimer, setMode } from '../logic/timerLogic';
import { formatTime } from '../utils/timeFormat';

export function initTimerUI() {
  const timeDisplay = document.getElementById('time-display')!;
  const startPauseBtn = document.getElementById('start-pause-btn')!;
  const modeBtns = document.querySelectorAll('.mode-btn');
  const progressCircle = document.getElementById('progress-circle') as SVGCircleElement | null;
  const modeLabel = document.getElementById('mode-label')!;

  const circleRadius = 115;
  const circumference = 2 * Math.PI * circleRadius;
  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference}`;
  }

  // The render function that runs whenever the timer data changes
  function render() {
    timeDisplay.textContent = formatTime(state.timeLeft);
    
    if (progressCircle) {
      const totalTime = MODES[state.currentMode];
      const progress = state.timeLeft / totalTime;
      const dashoffset = circumference * (1 - progress);
      progressCircle.style.strokeDashoffset = `${dashoffset}`;
    }

    startPauseBtn.textContent = state.isRunning ? 'Pause' : 'Start';
    startPauseBtn.style.background = state.isRunning ? '#f39c12' : '#78b159';

    modeLabel.textContent = state.currentMode === 'focus' ? 'Focus Session' : `${state.currentMode} Break`;

    modeBtns.forEach((btn) => {
      const b = btn as HTMLButtonElement;
      b.style.background = b.dataset.mode === state.currentMode ? 'rgba(255,255,255,0.8)' : 'transparent';
    });
  }

  // DOM Event Listeners
  startPauseBtn.addEventListener('click', toggleTimer);

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const mode = target.dataset.mode as keyof typeof MODES;
      setMode(mode);
    });
  });

  // Subscribe to store updates and do an initial render
  subscribe('timer', render);
  render(); 
}