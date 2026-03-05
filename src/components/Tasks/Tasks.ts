import { taskState, subscribeTasks } from '../../store/TaskStore';
import { timerState, subscribeTimer } from '../../store/TimerStore'; // Assume TimerStore gives active status

let focusedTaskId: string | null = null;
let isTimerActive = false;

export function initTasksUI() {
  const taskList = document.getElementById('task-list')!;
  const taskContainer = document.getElementById('task-container')!;
  const activeTaskPill = document.getElementById('active-task-pill')!;
  const activeTaskName = document.getElementById('active-task-name')!;

  // Subscribe to Timer state to trigger intense focus mode visuals
  subscribeTimer((state: any) => {
    isTimerActive = state.isRunning;
    render();
    
    // Manage Container Transparency & Pill visibility
    if (isTimerActive && focusedTaskId) {
        taskContainer.style.background = 'transparent';
        taskContainer.style.backdropFilter = 'none';
        taskContainer.style.border = '2px solid transparent';
        taskContainer.style.boxShadow = 'none';
        
        // Show Pill
        const activeTask = taskState.tasks.find(t => t.id === focusedTaskId);
        if (activeTask) {
            activeTaskName.textContent = activeTask.text;
            activeTaskPill.style.opacity = '1';
            activeTaskPill.style.transform = 'translateY(0)';
        }
    } else {
        // Reset to normal nook-glass
        taskContainer.style.background = 'rgba(255, 253, 245, 0.65)';
        taskContainer.style.backdropFilter = 'blur(20px)';
        taskContainer.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        
        // Hide Pill
        activeTaskPill.style.opacity = '0';
        activeTaskPill.style.transform = 'translateY(10px)';
    }
  });

  function render() {
    taskList.innerHTML = '';

    taskState.tasks.forEach((task: any) => {
      const isFocused = task.id === focusedTaskId;
      const li = document.createElement('li');
      
      // Base Styling - Heavily Rounded Blocks
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '16px';
      li.style.padding = '16px';
      li.style.background = '#ffffff';
      li.style.border = '2px solid #f1f2f6';
      li.style.borderRadius = '1.5rem'; // 24px heavily rounded
      li.style.cursor = 'pointer';
      li.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      
      // APPLY FOCUS MODE LOGIC
      if (isTimerActive) {
          if (isFocused) {
              // The Active Task Pop
              li.style.opacity = '1';
              li.style.transform = 'scale(1.02)';
              li.style.borderColor = 'var(--color-green)';
              li.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              li.style.zIndex = '20';
          } else {
              // The Blurred Background Tasks
              li.style.opacity = '0.4';
              li.style.transform = 'scale(0.95)';
              li.style.filter = 'blur(0.5px) grayscale(100%)';
              li.style.pointerEvents = 'none'; // Prevent interaction while focusing
          }
      } else {
         // Normal hover states when timer is OFF
         li.addEventListener('mouseenter', () => { 
             li.style.borderColor = 'var(--color-green)'; 
             li.style.boxShadow = '0 6px 15px rgba(0,0,0,0.05)';
             li.style.transform = 'translateY(-2px)';
         });
         li.addEventListener('mouseleave', () => { 
             li.style.borderColor = isFocused ? 'var(--color-green)' : '#f1f2f6'; 
             li.style.boxShadow = 'none';
             li.style.transform = 'translateY(0)';
         });
         
         // Keep focused task highlighted even when timer is off
         if (isFocused) li.style.borderColor = 'var(--color-green)';
      }

      // Click to focus
      li.addEventListener('click', () => {
          if (!isTimerActive) {
             focusedTaskId = isFocused ? null : task.id; // Toggle
             render();
          }
      });

      li.innerHTML = `
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 900; color: var(--color-text); font-size: 16px;">${task.text}</div>
            <div style="font-size: 10px; font-weight: bold; color: var(--color-muted); margin-top: 4px;">🍅 ${task.estimate} Pomodoros</div>
        </div>
        <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${isFocused ? 'var(--color-green)' : '#e6e2d0'}; background: ${isFocused ? 'var(--color-green)' : 'transparent'};"></div>
      `;

      taskList.appendChild(li);
    });
  }

  subscribeTasks(render);
  render();
}