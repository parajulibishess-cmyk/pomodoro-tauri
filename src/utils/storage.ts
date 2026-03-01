export interface Task {
  id: string;
  text: string;
  priority: string;
  category: string;
  estimate: string;
  completed: boolean;
}

const TASKS_KEY = 'pomodoro_tasks';

export function loadTasks(): Task[] {
  const stored = localStorage.getItem(TASKS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}