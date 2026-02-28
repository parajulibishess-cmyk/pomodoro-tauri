import { TimerDisplay } from './components/TimerDisplay';
import { TaskSection } from './components/TaskSection';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize tasks first so the timer can access the selected task for intentions
    const taskSection = new TaskSection();
    const timerDisplay = new TimerDisplay(taskSection);
});