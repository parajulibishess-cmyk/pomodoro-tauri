import { initTimerUI } from './components/Timer/Timer';
import { initTasksUI } from './components/Tasks/Tasks';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize App Modules
  initTimerUI();
  initTasksUI();
});