import { TodoistApi, Task as TodoistTask } from '@doist/todoist-api-typescript';

export interface Task {
  id: string | number;
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
  focusedTaskId: string | number | null = null;
  
  private todoistApi: TodoistApi | null = null;
  private syncInterval: number | null = null;

  constructor() {
    this.loadState();
    this.initTodoist();
  }

  initTodoist() {
    const token = localStorage.getItem('todoist_api_token');
    if (token) {
      this.todoistApi = new TodoistApi(token);
      this.startSync();
    }
  }

  startSync() {
    this.syncWithTodoist();
    if (this.syncInterval) clearInterval(this.syncInterval);
    // Sync automatically every 60 seconds
    this.syncInterval = window.setInterval(() => this.syncWithTodoist(), 60000);
  }

  async syncWithTodoist() {
    if (!this.todoistApi) return;
    try {
      // V3 SDK fix: getTasks() returns an object with a 'results' array
      const response = await this.todoistApi.getTasks();
      let hasUpdates = false;

      response.results.forEach((tt: TodoistTask) => {
        const existing = this.tasks.find(t => t.id.toString() === tt.id);
        
        // Map Todoist labels to categories, default to General
        const mappedCategory = tt.labels && tt.labels.length > 0 ? tt.labels[0] : "General";
        const mappedDate = tt.due?.date || null;

        if (existing) {
          if (
            existing.text !== tt.content ||
            existing.priority !== tt.priority ||
            existing.dueDate !== mappedDate ||
            existing.category !== mappedCategory ||
            existing.completed !== tt.checked // V3 SDK fix: 'checked' replaces 'isCompleted'
          ) {
            existing.text = tt.content;
            existing.priority = tt.priority;
            existing.dueDate = mappedDate;
            existing.category = mappedCategory;
            existing.completed = tt.checked;
            hasUpdates = true;
          }
        } else {
          this.tasks.push({
            id: tt.id,
            text: tt.content,
            priority: tt.priority,
            dueDate: mappedDate,
            category: mappedCategory,
            estimatedPomos: 1,
            completedPomos: 0,
            completed: tt.checked,
            completedAt: tt.checked ? Date.now() : null,
            createdAt: Date.now()
          });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        this.saveState();
        window.dispatchEvent(new Event('tasks-updated'));
      }
    } catch (error) {
      console.error("Failed to sync with Todoist:", error);
    }
  }

  async addTask(task: Task) {
    this.tasks.push(task);
    this.saveState();

    if (this.todoistApi) {
      try {
        const createdTask = await this.todoistApi.addTask({
          content: task.text,
          dueString: task.dueDate || undefined,
          priority: task.priority,
          labels: task.category !== "General" ? [task.category] : undefined
        });
        const localTask = this.tasks.find(t => t.id === task.id);
        if (localTask) {
          localTask.id = createdTask.id;
          this.saveState();
          window.dispatchEvent(new Event('tasks-updated'));
        }
      } catch (e) {
        console.error("Failed to create task in Todoist", e);
      }
    }
  }

  async toggleTask(id: string | number) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? Date.now() : null;
      this.saveState();

      if (this.todoistApi && typeof task.id === 'string') {
        try {
          if (task.completed) {
            await this.todoistApi.closeTask(task.id);
          } else {
            await this.todoistApi.reopenTask(task.id);
          }
        } catch (e) {
          console.error("Failed to toggle task status in Todoist", e);
        }
      }
    }
  }

  async deleteTask(id: string | number) {
    const taskToDelete = this.tasks.find(t => t.id === id);
    if (taskToDelete) {
      const isAlreadyArchived = this.archivedTasks.some(t => t.id === id);
      if (!isAlreadyArchived) {
        this.archivedTasks.push({ ...taskToDelete, completedAt: Date.now() });
      }
      this.tasks = this.tasks.filter(t => t.id !== id);
      if (this.focusedTaskId === id) this.focusedTaskId = null;
      this.saveState();

      if (this.todoistApi && typeof id === 'string') {
        try {
          await this.todoistApi.deleteTask(id);
        } catch (e) {
          console.error("Failed to delete task in Todoist", e);
        }
      }
    }
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

  getSortedTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...this.tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const dateA = a.dueDate ? new Date(a.dueDate + 'T00:00').getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate + 'T00:00').getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.completed && b.completed) return (b.completedAt || 0) - (a.completedAt || 0);
      return 0;
    });
  }
}

// Export a singleton instance to be used across the entire app
export const taskStore = new TaskStore();