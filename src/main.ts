import './styles.css'; 
import { initTimerUI } from './components/Timer/Timer';
import { TaskSectionUI } from './components/Tasks/Tasks';
import { initSettings } from './components/Settings/Settings';
import { initCalendar } from './components/Calendar/Calendar'; // Add this line

document.addEventListener('DOMContentLoaded', () => {
  initTimerUI();
  new TaskSectionUI('task-section-root');
  initSettings(); 
  
  // Initialize the calendar
  initCalendar(); 
});