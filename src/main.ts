import './styles.css'; 
import { initTimerUI } from './features/Timer/Timer';
import { TaskSectionUI } from './features/Tasks/Tasks';
import { initSettings } from './features/Settings/Settings';
import { initAnalytics } from './features/Analytics/Analytics';

document.addEventListener('DOMContentLoaded', () => {
  initTimerUI();
  new TaskSectionUI('task-section-root');
  initSettings(); 
  
  // Initialize
  initAnalytics();
});