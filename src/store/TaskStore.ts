// src/store/TaskStore.ts
import { TodoistApi, Task as TodoistTask } from '@doist/todoist-api-typescript';

interface TodoistProject {
  id: string;
  name: string;
}

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
  
  // 3. Use the local interface here
  private projects: TodoistProject[] = []; 

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

  async fetchProjects() {
    if (!this.todoistApi) return;
    try {
      const response: any = await this.todoistApi.getProjects();
      // Ensure we extract the projects array correctly whether it's wrapped or not
      this.projects = Array.isArray(response) ? response : (response.results || []);
    } catch (e) {
      console.error("Failed to fetch Todoist projects", e);
    }
  }

  startSync() {
    this.syncWithTodoist();
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = window.setInterval(() => this.syncWithTodoist(), 60000);
  }

  async syncWithTodoist() {
    if (!this.todoistApi) return;
    try {
      if (this.projects.length === 0) await this.fetchProjects();

      const response: any = await this.todoistApi.getTasks();
      const fetchedTasks = Array.isArray(response) ? response : (response.results || []);
      let hasUpdates = false;

      fetchedTasks.forEach((tt: TodoistTask) => {
        const existing = this.tasks.find(t => t.id.toString() === tt.id);
        
        // Match project ID from Todoist mapping it into standard NookFocus Categories
        let mappedCategory = "General"; // Default to General for the Inbox
        
        if (tt.projectId) {
          const project = this.projects.find(p => p.id === tt.projectId);
          if (project) {
            const validCategories = ["General", "Work", "Study", "Creative", "Reading"];
            
            // If the project is literally the Inbox, mark it General. Otherwise, use exact name matching.
            if ((project as any).isInboxProject || project.name === "Inbox") {
              mappedCategory = "General";
            } else if (validCategories.includes(project.name)) {
              mappedCategory = project.name;
            }
          }
        }
        
        const mappedDate = tt.due?.date || null;

        if (existing) {
          if (
            existing.text !== tt.content ||
            existing.priority !== tt.priority ||
            existing.dueDate !== mappedDate ||
            existing.category !== mappedCategory ||
            existing.completed !== tt.checked 
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
        if (this.projects.length === 0) await this.fetchProjects();
        
        let targetProjectId: string | undefined = undefined;
        
        // 1. First, see if there is an exact matching project name in Todoist
        const matchingProj = this.projects.find(p => p.name.toLowerCase() === task.category.toLowerCase());
        if (matchingProj) {
          targetProjectId = matchingProj.id;
        } else if (task.category === "General") {
          // 2. If it's "General" and no "General" project exists, strictly find the Todoist Inbox
          const inboxProj = this.projects.find(p => (p as any).isInboxProject || p.name === "Inbox");
          if (inboxProj) {
             targetProjectId = inboxProj.id;
          }
        }

        const createdTask = await this.todoistApi.addTask({
          content: task.text,
          dueString: task.dueDate || undefined,
          priority: task.priority,
          projectId: targetProjectId,
          labels: [task.category] // Also add it as a label so it shows up in Inbox tags!
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
      
      // Dispatch instantly so Timer module can react for the Finish Early logic
      window.dispatchEvent(new Event('tasks-updated'));

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
      window.dispatchEvent(new Event('tasks-updated'));

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

export const taskStore = new TaskStore();