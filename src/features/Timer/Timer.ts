// src/features/Timer/Timer.ts
import { timerState, subscribeTimer, Mode } from './TimerStore.ts';
import { toggleTimer, setMode, finishEarly } from './TimerLogic.ts';
import { formatTime } from './TimeFormat.ts';
import { settingsManager } from '../Settings/SettingsManager.ts';
import { taskStore } from '../Tasks/TaskStore.ts';

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
      const dashoffset = circumference * (1 - progress);
      progressCircle.style.strokeDashoffset = `${dashoffset}`;
    }

    startPauseBtn.textContent = timerState.isRunning ? 'Stop' : 'Start';
    startPauseBtn.style.background = timerState.isRunning ? '#ff6b6b' : '#78b159';

    modeLabel.textContent = timerState.currentMode === 'focus' ? 'Focus Session' : `${timerState.currentMode} Break`;

    if (settingsManager.autoStartBreaks) {
      if (modeSwitcher) modeSwitcher.style.display = 'none';
    } else {
      if (modeSwitcher) modeSwitcher.style.display = 'flex';
      modeBtns.forEach((btn) => {
        const b = btn as HTMLButtonElement;
        b.style.background = b.dataset.mode === timerState.currentMode ? 'rgba(255,255,255,0.8)' : 'transparent';
      });
    }

    // Check if focused task is completed
    const focusedTask = taskStore.focusedTaskId ? taskStore.tasks.find(t => t.id === taskStore.focusedTaskId) : null;
    let finishEarlyBtn = document.getElementById('finish-early-btn');
    const parentContainer = startPauseBtn.parentElement!;
    
    if (timerState.currentMode === 'focus' && timerState.isRunning && focusedTask?.completed) {
      if (!finishEarlyBtn) {
        finishEarlyBtn = document.createElement('button');
        finishEarlyBtn.id = 'finish-early-btn';
        
        // Add a nice checkmark SVG and improved typography inside the button
        finishEarlyBtn.innerHTML = `
          <div class="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span>Finish early</span>
          </div>
        `;
        
        // Add robust base styling + nice transition/hover effects
        finishEarlyBtn.className = startPauseBtn.className + " shadow-md hover:brightness-105 active:scale-95 transition-all duration-200"; 
        
        // Override the background for the pastel blue & set core styles
        finishEarlyBtn.style.backgroundColor = '#74b9ff'; 
        finishEarlyBtn.style.color = 'white';
        finishEarlyBtn.style.border = 'none';
        finishEarlyBtn.style.padding = '0.75rem 1.25rem';
        finishEarlyBtn.style.borderRadius = '1rem';
        finishEarlyBtn.style.fontWeight = '800';
        
        finishEarlyBtn.onclick = finishEarly;

        parentContainer.insertBefore(finishEarlyBtn, startPauseBtn.nextSibling);
      }
      
      // Allow it to flow naturally in the DOM
      finishEarlyBtn.style.display = ''; 
      
      // Clean, non-stretching flex layout for the parent container
      parentContainer.style.display = 'flex';
      parentContainer.style.justifyContent = 'center';
      parentContainer.style.alignItems = 'center'; // Prevents vertical stretching
      parentContainer.style.gap = '1rem'; // Adds nice spacing between the buttons
      
      // Strictly prevent them from stretching horizontally to fill the screen
      startPauseBtn.style.flex = 'none';
      finishEarlyBtn.style.flex = 'none';
      
    } else {
      if (finishEarlyBtn) {
        finishEarlyBtn.style.display = 'none';
      }
      // Revert the parent layout when Finish Early is hidden
      parentContainer.style.display = ''; 
      parentContainer.style.justifyContent = '';
      parentContainer.style.alignItems = '';
      parentContainer.style.gap = '';
      startPauseBtn.style.flex = '';
    }
  }

  // Event Listeners
  startPauseBtn.addEventListener('click', toggleTimer);

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const mode = target.dataset.mode as Mode;
      setMode(mode);
    });
  });

  window.addEventListener('settings-changed', () => {
     if(!timerState.isRunning) {
         timerState.timeLeft = settingsManager.getDurationForMode(timerState.currentMode);
     }
     render();
  });

  // Re-render timer when tasks change to potentially inject the Finish early button
  window.addEventListener('tasks-updated', render);

  subscribeTimer(render);
  render(); 
}