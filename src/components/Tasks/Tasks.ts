import { taskState, addTask, removeTask, subscribeTasks } from '../../store/TaskStore';

export function initTasksUI() {
  const taskForm = document.getElementById('task-form') as HTMLFormElement;
  const taskInput = document.getElementById('task-input') as HTMLInputElement;
  const taskPriority = document.getElementById('task-priority') as HTMLSelectElement;
  const taskCategory = document.getElementById('task-category') as HTMLSelectElement;
  const taskEstimate = document.getElementById('task-estimate') as HTMLInputElement;
  const taskList = document.getElementById('task-list')!;
  const taskCount = document.getElementById('task-count')!;

  function render() {
    taskList.innerHTML = '';
    taskCount.textContent = `${taskState.tasks.length} Tasks`;

    taskState.tasks.forEach(task => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '12px 16px';
      li.style.background = 'white';
      li.style.border = '2px solid #f1f2f6';
      li.style.borderRadius = '16px';

      const detailsDiv = document.createElement('div');
      detailsDiv.innerHTML = `
        <div style="font-weight: 900; color: #594a42; font-size: 16px;">${task.text}</div>
        <div style="font-size: 12px; color: #8e8070; margin-top: 4px; display: flex; gap: 8px;">
          <span style="background: #f1f2f6; padding: 2px 8px; border-radius: 8px;">${task.category}</span>
          <span style="background: #f1f2f6; padding: 2px 8px; border-radius: 8px;">${task.priority}</span>
          <span style="background: #f1f2f6; padding: 2px 8px; border-radius: 8px;">Est: ${task.estimate}</span>
        </div>
      `;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Done';
      deleteBtn.style.padding = '8px 16px';
      deleteBtn.style.borderRadius = '12px';
      deleteBtn.style.border = 'none';
      deleteBtn.style.background = '#e6e2d0';
      deleteBtn.style.color = '#594a42';
      deleteBtn.style.fontWeight = 'bold';
      deleteBtn.style.cursor = 'pointer';

      deleteBtn.addEventListener('click', () => {
        removeTask(task.id);
      });

      li.appendChild(detailsDiv);
      li.appendChild(deleteBtn);
      taskList.appendChild(li);
    });
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    addTask({
      id: crypto.randomUUID(), 
      text,
      priority: taskPriority.options[taskPriority.selectedIndex].text,
      category: taskCategory.value,
      estimate: taskEstimate.value,
      completed: false
    });

    taskInput.value = '';
  });

  // Subscribe to task updates
  subscribeTasks(render);
  render();
}