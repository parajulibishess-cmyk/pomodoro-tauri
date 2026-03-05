import './styles.css'; // Make sure your styles are imported
import { initTimerUI } from './components/Timer/Timer';
import { initTasksUI } from './components/Tasks/Tasks';
import { initSettings } from './components/Settings/Settings';

// Wait for the HTML to fully load before running our scripts
document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize App Modules (Notice: No arguments needed!)
  initTimerUI();
  initTasksUI();
  
  // Initialize the settings modal
  initSettings(); 
  
});