import { timerState, subscribeTimer, MODES } from '../../store/TimerStore';
import { toggleTimer, setMode } from '../../utils/TimerLogic';
import { formatTime } from '../../utils/TimeFormat';

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

  // Render function that runs whenever the timer store updates
  function render() {
    timeDisplay.textContent = formatTime(timerState.timeLeft);
    
    if (progressCircle) {
      const totalTime = MODES[timerState.currentMode];
      const progress = timerState.timeLeft / totalTime;
      const dashoffset = circumference * (1 - progress);
      progressCircle.style.strokeDashoffset = `${dashoffset}`;
    }

    startPauseBtn.textContent = timerState.isRunning ? 'Pause' : 'Start';
    startPauseBtn.style.background = timerState.isRunning ? '#f39c12' : '#78b159';

    modeLabel.textContent = timerState.currentMode === 'focus' ? 'Focus Session' : `${timerState.currentMode} Break`;

    modeBtns.forEach((btn) => {
      const b = btn as HTMLButtonElement;
      b.style.background = b.dataset.mode === timerState.currentMode ? 'rgba(255,255,255,0.8)' : 'transparent';
    });
  }

  // Event Listeners
  startPauseBtn.addEventListener('click', toggleTimer);

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const mode = target.dataset.mode as keyof typeof MODES;
      setMode(mode);
    });
  });

  // Subscribe to store updates and trigger initial render
  subscribeTimer(render);
  render(); 
}