// src/features/Tasks/TaskStore.ts
import { TodoistApi } from '@doist/todoist-api-typescript';
import { settingsManager } from '../Settings/SettingsManager.ts';

export interface Task {
  id: number;
  todoistId?: string; // Added to map to Todoist's remote ID
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
  private syncInterval: number | null = null;

  constructor() {
    this.load();
    this.setupTodoistSync();
    
    // Listen for token changes from Settings to re-initiate sync
    window.addEventListener('settings-changed', () => {
      this.setupTodoistSync();
    });
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

  // --- Todoist Sync Logic ---
  
  setupTodoistSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    const token = settingsManager.todoistToken;
    if (token) {
      this.syncTodoist(); // Initial pull on load
      
      // Auto-sync every 2 minutes (120,000 ms)
      this.syncInterval = window.setInterval(() => this.syncTodoist(), 2 * 60 * 1000);
    }
  }

  async syncTodoist() {
    const token = settingsManager.todoistToken;
    if (!token) return;

    try {
      const api = new TodoistApi(token);
      
      const response = await api.getTasks();
      const todoistTasks = response.results; 
      
      let hasChanges = false;

      todoistTasks.forEach(tTask => {
        const exists = this.tasks.find(t => t.todoistId === tTask.id);
        
        let category = "General";
        let text = tTask.content;
        
        // Parse category from the content text
        const categories = ["Study", "Creative", "Work", "Reading", "General"];
        for (const cat of categories) {
          if (text.includes(`/${cat}`)) {
            category = cat;
            text = text.replace(`/${cat}`, '').trim();
            break;
          }
        }

        const mappedPriority = 5 - tTask.priority; 

        if (!exists) {
          // Add newly found remote tasks to local store using tTask.checked
          this.tasks.push({
            id: Date.now() + Math.floor(Math.random() * 10000), 
            todoistId: tTask.id,
            text: text,
            priority: mappedPriority, 
            dueDate: tTask.due?.date || null,
            category: category,
            estimatedPomos: 1, 
            completedPomos: 0,
            completed: tTask.checked,
            completedAt: tTask.checked ? Date.now() : null,
            createdAt: Date.now(),
            note: tTask.description || undefined
          });
          hasChanges = true;
        } else {
          // Update existing tasks if changed remotely using tTask.checked
          if (exists.completed !== tTask.checked) {
            exists.completed = tTask.checked;
            exists.completedAt = tTask.checked ? Date.now() : null;
            hasChanges = true;
          }
          if (exists.text !== text) {
            exists.text = text;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) this.save();
    } catch (error) {
      console.error("Todoist background sync failed:", error);
    }
  }

  // --- CRUD Methods ---

  async addTask(task: Task) {
    this.tasks.push(task);
    this.save(); // Save locally immediately for fast UI feedback

    const token = settingsManager.todoistToken;
    if (token) {
      try {
        const api = new TodoistApi(token);
        // Append tag so it categorizes correctly if synced back later
        const content = task.category !== 'General' ? `${task.text} /${task.category}` : task.text;
        
        const tTask = await api.addTask({
          content: content,
          dueString: task.dueDate || undefined,
          priority: 5 - task.priority,
          description: task.note || ""
        });
        
        // Update local task with remote ID
        task.todoistId = tTask.id;
        this.save();
      } catch (err) {
        console.error("Failed to push new task to Todoist", err);
      }
    }
  }

  async toggleTask(id: number) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? Date.now() : null;
      this.save();

      if (task.todoistId && settingsManager.todoistToken) {
        try {
          const api = new TodoistApi(settingsManager.todoistToken);
          if (task.completed) {
            await api.closeTask(task.todoistId);
          } else {
            await api.reopenTask(task.todoistId);
          }
        } catch(err) {
          console.error("Failed to sync toggle status to Todoist", err);
        }
      }
    }
  }

  async deleteTask(id: number) {
    const task = this.tasks.find(t => t.id === id);
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.focusedTaskId === id) {
      this.focusedTaskId = null;
    }
    this.save();

    if (task?.todoistId && settingsManager.todoistToken) {
      try {
        const api = new TodoistApi(settingsManager.todoistToken);
        await api.deleteTask(task.todoistId);
      } catch(err) {
        console.error("Failed to sync deletion to Todoist", err);
      }
    }
  }
  
  async updateTaskNote(id: number, note: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.note = note;
      this.save();

      if (task.todoistId && settingsManager.todoistToken) {
        try {
          const api = new TodoistApi(settingsManager.todoistToken);
          await api.updateTask(task.todoistId, { description: note });
        } catch(err) {
          console.error("Failed to sync note to Todoist", err);
        }
      }
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