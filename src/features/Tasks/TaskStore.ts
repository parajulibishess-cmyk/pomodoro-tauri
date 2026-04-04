// src/store/TaskStore.ts

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
  note?: string;
}

class TaskStore {
  tasks: Task[] = [];
  focusedTaskId: number | null = null;

  constructor() {
    this.load();
  }

  load() {
    const saved = localStorage.getItem('nook_tasks');
    if (saved) {
      this.tasks = JSON.parse(saved);
    }
  }

  save() {
    localStorage.setItem('nook_tasks', JSON.stringify(this.tasks));
    window.dispatchEvent(new Event('tasks-updated'));
  }

  addTask(task: Task) {
    this.tasks.push(task);
    this.save();
  }

  toggleTask(id: number) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? Date.now() : null;
      
      this.save();
    }
  }

  deleteTask(id: number) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.focusedTaskId === id) {
      this.focusedTaskId = null;
    }
    this.save();
  }
  
  updateTaskNote(id: number, note: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.note = note;
      this.save();
    }
  }

  getSortedTasks() {
    return [...this.tasks].sort((a, b) => {
      // Completed tasks go to the bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Then sort by priority (1 is highest, 4 is lowest)
      return a.priority - b.priority;
    });
  }
}

export const taskStore = new TaskStore();