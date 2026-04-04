// src/main.ts
import { initTimerUI } from './features/Timer/Timer.ts';
import { TaskSectionUI } from './features/Tasks/Tasks.ts';
import { initSettings } from './features/Settings/Settings.ts';
import { initAnalytics } from './features/Analytics/Analytics.ts';
import { initSoundsUI } from './features/Sounds/Sounds.ts'; 

document.addEventListener('DOMContentLoaded', () => {
  initTimerUI();
  new TaskSectionUI('task-section-root');
  initSettings();
  initAnalytics();
  initSoundsUI();
});