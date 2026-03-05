// src/components/Timer/Timer.ts
import { timerState, subscribeTimer, Mode } from '../../store/TimerStore';
import { toggleTimer, setMode } from '../../utils/TimerLogic';
import { formatTime } from '../../utils/TimeFormat'; // Adjust casing if your file is timeFormat.ts
import { settingsManager } from '../../store/SettingsManager';

export function initTimerUI() {
  const timeDisplay = document.getElementById('time-display')!;
  const startPauseBtn = document.getElementById('start-pause-btn')!;
  const modeBtns = document.querySelectorAll('.mode-btn');
  const progressCircle = document.getElementById('progress-circle') as SVGCircleElement | null;
  const modeLabel = document.getElementById('mode-label')!;
  const modeSwitcher = document.getElementById('mode-switcher')!;

  // Using a 100x100 viewBox where radius is 45
  const circleRadius = 45;
  const circumference = 2 * Math.PI * circleRadius;
  
  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference}`;
  }

  function render() {
    timeDisplay.textContent = formatTime(timerState.timeLeft);
    
    if (progressCircle) {
      const totalTime = settingsManager.getDurationForMode(timerState.currentMode);
      const progress = timerState.timeLeft / totalTime;
      // Progress calculation
      const dashoffset = circumference * (1 - progress);
      progressCircle.style.strokeDashoffset = `${dashoffset}`;
    }

    startPauseBtn.textContent = timerState.isRunning ? 'Pause' : 'Start';
    startPauseBtn.style.background = timerState.isRunning ? '#f39c12' : '#78b159';

    modeLabel.textContent = timerState.currentMode === 'focus' ? 'Focus Session' : `${timerState.currentMode} Break`;

    // Dynamic UI State logic based on Auto-start Settings
    if (settingsManager.autoStartBreaks) {
      if (modeSwitcher) modeSwitcher.style.display = 'none';
    } else {
      if (modeSwitcher) modeSwitcher.style.display = 'flex';
      modeBtns.forEach((btn) => {
        const b = btn as HTMLButtonElement;
        b.style.background = b.dataset.mode === timerState.currentMode ? 'rgba(255,255,255,0.8)' : 'transparent';
      });
    }
  }

  // Event Listeners
  startPauseBtn.addEventListener('click', toggleTimer);

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const mode = target.dataset.mode as Mode;
      setMode(mode);
    });
  });

  // Listen for custom settings events to refresh the UI immediately when updated in settings Modal
  window.addEventListener('settings-changed', () => {
     if(!timerState.isRunning) {
         timerState.timeLeft = settingsManager.getDurationForMode(timerState.currentMode);
     }
     render();
  });

  // Subscribe to store updates and trigger initial render
  subscribeTimer(render);
  render(); 
}