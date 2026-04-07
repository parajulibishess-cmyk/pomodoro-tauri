// src/features/Tasks/TaskStore.ts
import { invoke } from '@tauri-apps/api/core';
import { settingsManager } from '../Settings/SettingsManager.ts';

export interface Task {
  id: number;
  todoistId?: string;
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

interface TodoistTask {
  id: string;
  content: string;
  description: string;
  checked: boolean;
  due?: { date: string };
  priority: number;
  section_id?: string | null;
}

interface TodoistSection {
  id: string;
  name: string;
}

class TaskStore {
  tasks: Task[] = [];
  focusedTaskId: number | null = null;
  private syncInterval: number | null = null;

  constructor() {
    this.load();
    this.setupTodoistSync();
    
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

  setupTodoistSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    const token = settingsManager.todoistToken;
    if (token) {
      this.syncTodoist();
      this.syncInterval = window.setInterval(() => this.syncTodoist(), 2 * 60 * 1000);
    }
  }

  async syncTodoist() {
    const token = settingsManager.todoistToken;
    if (!token) return;

    try {
      // Fetch Tasks and Sections concurrently
      const [todoistTasks, todoistSections] = await Promise.all([
        invoke<TodoistTask[]>('get_todoist_tasks', { token }),
        invoke<TodoistSection[]>('get_todoist_sections', { token }).catch(() => [])
      ]);
      
      const sectionMap: Record<string, string> = {};
      todoistSections.forEach(s => sectionMap[s.id] = s.name);

      let hasChanges = false;

      todoistTasks.forEach(tTask => {
        const exists = this.tasks.find(t => t.todoistId === tTask.id);
        
        let category = "General";
        let text = tTask.content;
        
        // 1. Assign category using the native Todoist Section ID
        if (tTask.section_id && sectionMap[tTask.section_id]) {
            const sName = sectionMap[tTask.section_id];
            if (["Study", "Creative", "Work", "Reading", "General"].includes(sName)) {
                category = sName;
            }
        }

        // 2. Fallback legacy string parsing
        const categories = ["Study", "Creative", "Work", "Reading", "General"];
        for (const cat of categories) {
          if (text.includes(`/${cat}`)) {
            category = cat;
            text = text.replace(`/${cat}`, '').trim();
            break;
          }
        }

        const mappedPriority = tTask.priority; 
        const isCompleted = tTask.checked; 

        if (!exists) {
          this.tasks.push({
            id: Date.now() + Math.floor(Math.random() * 10000), 
            todoistId: tTask.id,
            text: text,
            priority: mappedPriority, 
            dueDate: tTask.due?.date || null,
            category: category,
            estimatedPomos: 1, 
            completedPomos: 0,
            completed: isCompleted,
            completedAt: isCompleted ? Date.now() : null,
            createdAt: Date.now(),
            note: tTask.description || undefined
          });
          hasChanges = true;
        } else {
          // --- FIX 1: Two-Way Sync for all properties ---
          if (exists.completed !== isCompleted) {
            exists.completed = isCompleted;
            exists.completedAt = isCompleted ? Date.now() : null;
            hasChanges = true;
          }
          if (exists.text !== text) {
            exists.text = text;
            hasChanges = true;
          }
          if (exists.category !== category) {
            exists.category = category;
            hasChanges = true;
          }
          if (exists.priority !== mappedPriority) {
            exists.priority = mappedPriority;
            hasChanges = true;
          }
          const incomingDueDate = tTask.due?.date || null;
          if (exists.dueDate !== incomingDueDate) {
            exists.dueDate = incomingDueDate;
            hasChanges = true;
          }
          const incomingNote = tTask.description || undefined;
          if (exists.note !== incomingNote) {
            exists.note = incomingNote;
            hasChanges = true;
          }
        }
      });

      // --- FIX 2: Detect tasks completed remotely in Todoist ---
      // If a task exists locally with a todoistId, is NOT completed, but is 
      // missing from the active todoistTasks list, it means it was checked off in Todoist.
      const incomingTodoistIds = new Set(todoistTasks.map(t => t.id));
      
      this.tasks.forEach(localTask => {
        if (localTask.todoistId && !localTask.completed) {
          if (!incomingTodoistIds.has(localTask.todoistId)) {
            localTask.completed = true;
            localTask.completedAt = Date.now();
            hasChanges = true;
          }
        }
      });

      if (hasChanges) this.save();
    } catch (error) {
      console.error("Todoist background sync failed:", error);
    }
  }

  async addTask(task: Task) {
    this.tasks.push(task);
    this.save(); // Save locally immediately for fast UI feedback

    const token = settingsManager.todoistToken;
    if (token) {
      try {
        const tTask = await invoke<TodoistTask>('add_todoist_task', {
          token,
          content: task.text,
          dueString: task.dueDate || null,
          priority: task.priority,
          description: task.note || "",
          category: task.category
        });
        
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
          if (task.completed) {
            await invoke('close_todoist_task', { token: settingsManager.todoistToken, id: task.todoistId });
          } else {
            await invoke('reopen_todoist_task', { token: settingsManager.todoistToken, id: task.todoistId });
          }
        } catch(err) {
          console.error("Failed to sync toggle status to Todoist", err);
        }
      }
    }
  }

  async deleteTask(id: number) {
    // --- FIX 3: Local-only deletion ---
    // The invoke('delete_todoist_task') has been removed so Todoist/Calendar records are preserved.
    const task = this.tasks.find(t => t.id === id);
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.focusedTaskId === id) {
      this.focusedTaskId = null;
    }
    this.save();
  }
  
  async updateTaskNote(id: number, note: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.note = note;
      this.save();

      if (task.todoistId && settingsManager.todoistToken) {
        try {
          await invoke('update_todoist_task', { 
            token: settingsManager.todoistToken, 
            id: task.todoistId, 
            description: note 
          });
        } catch(err) {
          console.error("Failed to sync note to Todoist", err);
        }
      }
    }
  }

  getSortedTasks() {
    return [...this.tasks].sort((a, b) => {
      // 1. Completed tasks always go to the very bottom
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      // Helper to convert "YYYY-MM-DD" to a timestamp. 
      // Tasks with no due date get pushed to the end (Infinity).
      const getTime = (dateStr: string | null) => {
        if (!dateStr) return Infinity;
        return new Date(dateStr + 'T00:00').getTime();
      };

      const timeA = getTime(a.dueDate);
      const timeB = getTime(b.dueDate);

      // 2. Sort by date ascending (Overdue first -> Today -> Tomorrow -> ...)
      if (timeA !== timeB) {
        return timeA - timeB; 
      }

      // 3. If the dates are the exact same (or both have no due date), 
      // sort by Priority descending (Todoist Priority 4 is Highest, 1 is Lowest)
      return b.priority - a.priority;
    });
  }
}

export const taskStore = new TaskStore();