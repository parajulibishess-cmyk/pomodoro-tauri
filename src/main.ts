import './styles.css'; 
import { initTimerUI } from './components/Timer/Timer';
import { TaskSectionUI } from './components/Tasks/Tasks';
import { initSettings } from './components/Settings/Settings';
import { initCalendar } from './components/Calendar/Calendar'; 
import { initAnalytics } from './components/Analytics/Analytics';

document.addEventListener('DOMContentLoaded', () => {
  initTimerUI();
  new TaskSectionUI('task-section-root');
  initSettings(); 
  
  // Initialize
  initCalendar(); 
  initAnalytics();
});