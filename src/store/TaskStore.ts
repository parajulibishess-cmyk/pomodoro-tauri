// src/store/TaskStore.ts
import { TodoistApi, Task as TodoistTask } from '@doist/todoist-api-typescript';

interface TodoistProject {
  id: string;
  name: string;
  isInboxProject?: boolean;
}

interface TodoistSection {
  id: string;
  projectId: string;
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
  
  private projects: TodoistProject[] = []; 
  private sections: TodoistSection[] = [];

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

  async fetchProjectsAndSections() {
    if (!this.todoistApi) return;
    try {
      const [projResponse, secResponse]: [any, any] = await Promise.all([
        this.todoistApi.getProjects(),
        this.todoistApi.getSections()
      ]);
      
      this.projects = Array.isArray(projResponse) ? projResponse : (projResponse.results || []);
      this.sections = Array.isArray(secResponse) ? secResponse : (secResponse.results || []);
    } catch (e) {
      console.error("Failed to fetch Todoist projects or sections", e);
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
      // Always fetch latest structure to catch newly created projects/sections
      await this.fetchProjectsAndSections();

      const response: any = await this.todoistApi.getTasks();
      const fetchedTasks = Array.isArray(response) ? response : (response.results || []);
      let hasUpdates = false;

      // 1. Process active tasks coming from Todoist
      fetchedTasks.forEach((tt: TodoistTask) => {
        const existing = this.tasks.find(t => t.id.toString() === tt.id);
        
        let mappedCategory = "General"; // Default to General
        const validCategories = ["General", "Work", "Study", "Creative", "Reading"];
        
        const labelCategory = validCategories.find(cat => tt.labels?.includes(cat));
        
        let sectionName = "";
        if (tt.sectionId) {
           const section = this.sections.find(s => s.id === tt.sectionId);
           if (section) sectionName = section.name;
        }

        if (validCategories.includes(sectionName)) {
           // 1. Prioritize Section name matching exactly (e.g., if placed in Inbox/Study)
           mappedCategory = sectionName;
        } else if (tt.projectId) {
          const project = this.projects.find(p => p.id === tt.projectId);
          if (project) {
            if ((project as any).isInboxProject || project.name === "Inbox") {
              // 2. If Inbox, rely on label fallback
              mappedCategory = labelCategory || "General";
            } else if (validCategories.includes(project.name)) {
              // 3. If in a dedicated project (e.g. "Study")
              mappedCategory = project.name;
            } else if (labelCategory) {
              // 4. Random project but has known label
              mappedCategory = labelCategory;
            }
          }
        } else if (labelCategory) {
           mappedCategory = labelCategory;
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

      // 2. Detect tasks completed in Todoist
      // If a task has a string ID (meaning it is tracked by Todoist) and is not completed locally,
      // but it is missing from `fetchedTasks` (which only returns active tasks), 
      // it means it was completed (or deleted) in Todoist. We complete it locally.
      this.tasks.forEach(localTask => {
        if (!localTask.completed && typeof localTask.id === 'string') {
          const existsInTodoist = fetchedTasks.some((tt: TodoistTask) => tt.id === localTask.id.toString());
          if (!existsInTodoist) {
            localTask.completed = true;
            localTask.completedAt = Date.now();
            hasUpdates = true;
          }
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
        await this.fetchProjectsAndSections(); // Ensure we have the latest projects/sections from Todoist
        
        let targetProjectId: string | undefined = undefined;
        let targetSectionId: string | undefined = undefined;
        
        // Look for exact matching Section (e.g., a "Study" section inside your Inbox)
        const matchingSection = this.sections.find(s => s.name.toLowerCase() === task.category.toLowerCase());
        
        // Look for exact matching Project
        const matchingProj = this.projects.find(p => p.name.toLowerCase() === task.category.toLowerCase());
        
        // Find Inbox project fallback
        const inboxProj = this.projects.find(p => (p as any).isInboxProject || p.name === "Inbox");

        if (matchingSection) {
          // If a Section called "Study" exists, put it in that specific section!
          targetSectionId = matchingSection.id;
          targetProjectId = matchingSection.projectId;
        } else if (matchingProj) {
          // If a dedicated Project called "Study" exists, put it there
          targetProjectId = matchingProj.id;
        } else if (inboxProj) {
          // Fallback to Inbox
          targetProjectId = inboxProj.id;
        }

        const createdTask = await this.todoistApi.addTask({
          content: task.text,
          dueString: task.dueDate || undefined,
          priority: task.priority,
          projectId: targetProjectId,
          sectionId: targetSectionId,
          labels: [task.category] // Still attach label as a fallback sync mechanism
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