// Add addTask and removeTask to the imports
import { taskState, subscribeTasks, addTask, removeTask } from '../../store/TaskStore';
import { timerState, subscribeTimer } from '../../store/TimerStore'; 

let focusedTaskId: string | null = null;
let isTimerActive = false;

export function initTasksUI() {
  const taskList = document.getElementById('task-list');
  const taskContainer = document.getElementById('task-container');
  const activeTaskPill = document.getElementById('active-task-pill');
  const activeTaskName = document.getElementById('active-task-name');

  // Input elements
  const taskInput = document.getElementById('new-task-input') as HTMLInputElement;
  const taskEstimate = document.getElementById('new-task-estimate') as HTMLInputElement;
  const addBtn = document.getElementById('add-task-btn');

  if (!taskList || !taskContainer || !activeTaskPill || !activeTaskName) return;

  // --- NEW: Add Task Logic ---
  if (addBtn && taskInput && taskEstimate) {
    addBtn.addEventListener('click', () => {
      const text = taskInput.value.trim();
      const est = taskEstimate.value || '1'; // Default to 1 pomodoro
      if (text) {
        addTask({
          id: Date.now().toString(),
          text,
          estimate: est,
          priority: 'normal',
          category: 'work',
          completed: false
        });
        taskInput.value = '';
        taskEstimate.value = '';
      }
    });

    // Also allow pressing "Enter" to add a task
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  // Subscribe to Timer state to trigger intense focus mode visuals
  subscribeTimer((state: any) => {
    isTimerActive = state.isRunning;
    render();
    
    if (isTimerActive && focusedTaskId) {
        taskContainer.classList.remove('nook-glass');
        taskContainer.style.background = 'transparent';
        taskContainer.style.backdropFilter = 'none';
        taskContainer.style.border = '2px solid transparent';
        taskContainer.style.boxShadow = 'none';
        
        const activeTask = taskState.tasks.find(t => t.id === focusedTaskId);
        if (activeTask) {
            activeTaskName.textContent = activeTask.text;
            activeTaskPill.style.opacity = '1';
            activeTaskPill.style.transform = 'translateY(0)';
        }
    } else {
        taskContainer.style.background = '';
        taskContainer.style.backdropFilter = '';
        taskContainer.style.border = '';
        taskContainer.style.boxShadow = '';
        taskContainer.classList.add('nook-glass');
        
        activeTaskPill.style.opacity = '0';
        activeTaskPill.style.transform = 'translateY(10px)';
    }
  });

  function render() {
    if (!taskList) return;
    taskList.innerHTML = '';

    // If there are no tasks, show a placeholder message
    if (taskState.tasks.length === 0) {
      taskList.innerHTML = `<div style="text-align: center; color: var(--color-muted); padding: 40px 0; font-weight: bold; opacity: 0.6;">No tasks yet. Add one below!</div>`;
      return;
    }

    taskState.tasks.forEach((task: any) => {
      const isFocused = task.id === focusedTaskId;
      const li = document.createElement('li');
      
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '16px';
      li.style.padding = '16px';
      li.style.background = '#ffffff';
      li.style.border = '2px solid #f1f2f6';
      li.style.borderRadius = '1.5rem'; 
      li.style.cursor = 'pointer';
      li.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      li.style.position = 'relative'; // Required for absolute positioning of the delete button
      
      // APPLY FOCUS MODE LOGIC
      if (isTimerActive) {
          if (isFocused) {
              li.style.opacity = '1';
              li.style.transform = 'scale(1.02)';
              li.style.borderColor = 'var(--color-green)';
              li.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
              li.style.zIndex = '20';
          } else {
              li.style.opacity = '0.4';
              li.style.transform = 'scale(0.95)';
              li.style.filter = 'blur(0.5px) grayscale(100%)';
              li.style.pointerEvents = 'none'; 
          }
      } else {
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
         
         if (isFocused) {
            li.style.borderColor = 'var(--color-green)';
         }
      }

      // Click to focus (Only trigger if we aren't clicking the delete button)
      li.addEventListener('click', (e) => {
          if (!isTimerActive && !(e.target as HTMLElement).closest('.delete-task-btn')) {
             focusedTaskId = isFocused ? null : task.id; 
             render();
          }
      });

      // Add a delete button (visible on hover) to use your removeTask function
      li.innerHTML = `
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 900; color: var(--color-text); font-size: 16px;">${task.text}</div>
            <div style="font-size: 10px; font-weight: bold; color: var(--color-muted); margin-top: 4px;">🍅 ${task.estimate} Pomodoros</div>
        </div>
        
        <button class="delete-task-btn" data-id="${task.id}" style="background: transparent; border: none; cursor: pointer; opacity: 0.4; transition: opacity 0.2s; color: var(--color-red); padding: 5px;">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>

        <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${isFocused ? 'var(--color-green)' : '#e6e2d0'}; background: ${isFocused ? 'var(--color-green)' : 'transparent'}; margin-left: 8px;"></div>
      `;

      taskList.appendChild(li);
    });

    // Attach event listeners to the new delete buttons
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) {
          if (focusedTaskId === id) focusedTaskId = null; // Unfocus if deleted
          removeTask(id);
        }
      });
      // Simple hover effect for the trashcan
      btn.addEventListener('mouseenter', (e) => (e.currentTarget as HTMLElement).style.opacity = '1');
      btn.addEventListener('mouseleave', (e) => (e.currentTarget as HTMLElement).style.opacity = '0.4');
    });
  }

  // Subscribe to changes and run initial render
  subscribeTasks(render);
  render();
}