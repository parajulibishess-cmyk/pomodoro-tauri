import { BaseStore } from './BaseStore';

export interface Task {
  id: string;
  text: string;
  priority: number;
  category: string;
  completed: boolean;
  isSyncing: boolean;
  dueDate: string | null;
  estimatedPomos: number;
  completedPomos?: number;
  createdAt: string;
  archivedAt?: number;
}

export interface TaskState {
  tasks: Task[];
  archivedTasks: Task[];
  focusedTaskId: string | null;
  todoistToken: string;
  isSyncing: boolean;
  todoistSections: Record<string, string>;
}

class TaskStore extends BaseStore<TaskState> {
  private syncInterval: number | null = null;

  constructor() {
    super({
      tasks: JSON.parse(localStorage.getItem('nook_tasks') || '[]'),
      archivedTasks: JSON.parse(localStorage.getItem('nook_archived_tasks') || '[]'),
      focusedTaskId: null,
      todoistToken: localStorage.getItem('nook_todoist_token') || "",
      isSyncing: false,
      todoistSections: {}
    });

    if (this.state.todoistToken) this.startSync();
  }

  protected onStateChange(prevState: TaskState) {
    if (prevState.tasks !== this.state.tasks) {
      // Simple debounce for localStorage
      setTimeout(() => localStorage.setItem('nook_tasks', JSON.stringify(this.state.tasks)), 500);
    }
    if (prevState.archivedTasks !== this.state.archivedTasks) localStorage.setItem('nook_archived_tasks', JSON.stringify(this.state.archivedTasks));
    
    if (prevState.todoistToken !== this.state.todoistToken) {
      localStorage.setItem('nook_todoist_token', this.state.todoistToken);
      if (this.state.todoistToken) {
        this.startSync();
      } else if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }
    }
  }

  public deleteTask(taskId: string) {
    this.setState((prev) => {
      const taskToDelete = prev.tasks.find(t => t.id === taskId);
      const newArchived = taskToDelete && !prev.archivedTasks.find(a => a.id === taskId) 
        ? [...prev.archivedTasks, { ...taskToDelete, archivedAt: Date.now() }] 
        : prev.archivedTasks;
      
      return {
        archivedTasks: newArchived,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      };
    });
  }

  public async fetchTodoistTasks() {
    const token = this.state.todoistToken;
    if (!token) return;
    
    this.setState({ isSyncing: true });
    try {
      const sectionsRes = await fetch('https://api.todoist.com/rest/v2/sections', { 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      let sectionIdToName: Record<string, string> = {};
      let nameToId: Record<string, string> = {};
      
      if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          sectionsData.forEach((s: any) => {
              sectionIdToName[s.id] = s.name;
              nameToId[s.name] = s.id;
          });
          this.setState({ todoistSections: nameToId });
      }

      const res = await fetch('https://api.todoist.com/rest/v2/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
          const data = await res.json();
          const remoteTasks = data.map((t: any) => {
            let content = t.content;
            let category = "General";
            const categoryMatch = content.match(/(?:^|\s)\/(\w+)(?:\s|$)/);
            
            if (categoryMatch) {
                category = categoryMatch[1];
                content = content.replace(categoryMatch[0], ' ').trim();
            } else if (t.section_id && sectionIdToName[t.section_id]) {
                const secName = sectionIdToName[t.section_id];
                if (["Work", "Study", "Creative", "Reading"].includes(secName)) {
                    category = secName;
                }
            }

            return { 
                id: t.id, text: content, priority: t.priority, category: category, 
                completed: t.is_completed, isSyncing: false, dueDate: t.due ? t.due.date : null, 
                estimatedPomos: 1, createdAt: t.created_at 
            };
          });
          
          this.setState(prev => {
            const prevMap = new Map(prev.tasks.map(t => [t.id, t]));
            const mergedRemoteTasks = remoteTasks.map((nt: any) => {
                if (prevMap.has(nt.id)) {
                    const existing = prevMap.get(nt.id)!;
                    const finalCategory = (nt.category !== "General") ? nt.category : existing.category;
                    return { 
                        ...existing, ...nt, category: finalCategory, 
                        estimatedPomos: existing.estimatedPomos || 1,
                        completedPomos: existing.completedPomos || 0,
                        createdAt: existing.createdAt || nt.createdAt,
                        completed: existing.completed || nt.completed
                    };
                }
                return nt;
            });

            const remoteIds = new Set(remoteTasks.map((t: any) => t.id));
            const preservedTasks = prev.tasks.filter(t => 
                (t.completed && !remoteIds.has(t.id)) || 
                (t.isSyncing && !remoteIds.has(t.id))
            );

            return { tasks: [...mergedRemoteTasks, ...preservedTasks] };
          });
      }
    } catch(e) { 
      console.error(e); 
    } finally { 
      this.setState({ isSyncing: false }); 
    }
  }

  private startSync() {
    this.fetchTodoistTasks();
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = window.setInterval(() => this.fetchTodoistTasks(), 60000);
  }
}

export const taskStore = new TaskStore();