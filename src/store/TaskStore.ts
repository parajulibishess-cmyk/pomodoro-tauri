export interface Task {
  id: number;
  text: string;
  priority: number;
  dueDate: string | null;
  category: string;
  estimatedPomos: number;
  completedPomos: number;
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
}

export class TaskStore {
  tasks: Task[] = [];
  archivedTasks: Task[] = [];
  focusedTaskId: number | null = null;

  constructor() {
    this.loadState();
  }

  loadState() {
    const savedTasks = localStorage.getItem('nook_tasks');
    const savedArchived = localStorage.getItem('nook_archived_tasks');
    if (savedTasks) this.tasks = JSON.parse(savedTasks);
    if (savedArchived) this.archivedTasks = JSON.parse(savedArchived);
  }

  saveState() {
    localStorage.setItem('nook_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('nook_archived_tasks', JSON.stringify(this.archivedTasks));
  }

  addTask(task: Task) {
    this.tasks.push(task);
    this.saveState();
  }

  toggleTask(id: number) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? Date.now() : null;
      this.saveState();
    }
  }

  deleteTask(id: number) {
    const taskToDelete = this.tasks.find(t => t.id === id);
    if (taskToDelete) {
      const isAlreadyArchived = this.archivedTasks.some(t => t.id === id);
      if (!isAlreadyArchived) {
        this.archivedTasks.push({ ...taskToDelete, completedAt: Date.now() });
      }
      this.tasks = this.tasks.filter(t => t.id !== id);
      if (this.focusedTaskId === id) this.focusedTaskId = null;
      this.saveState();
    }
  }

  getSortedTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...this.tasks].sort((a, b) => {
      // 1. Completed tasks at the bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      
      const dateA = a.dueDate ? new Date(a.dueDate + 'T00:00').getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate + 'T00:00').getTime() : Infinity;
      
      // 2. Overdue/Due soon (Ascending sort by date)
      if (dateA !== dateB) return dateA - dateB;
      
      // 3. Priority (Higher priority first)
      if (b.priority !== a.priority) return b.priority - a.priority;
      
      // 4. Recently completed
      if (a.completed && b.completed) return (b.completedAt || 0) - (a.completedAt || 0);
      
      return 0;
    });
  }
}