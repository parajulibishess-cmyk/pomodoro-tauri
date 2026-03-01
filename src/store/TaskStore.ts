import { Task, loadTasks, saveTasks } from '../utils/storage';

export const taskState = {
  tasks: loadTasks()
};

type Listener = () => void;
const listeners: Listener[] = [];

export function subscribeTasks(listener: Listener) {
  listeners.push(listener);
}

export function notifyTasks() {
  saveTasks(taskState.tasks);
  listeners.forEach(listener => listener());
}

export function addTask(task: Task) {
  taskState.tasks.push(task);
  notifyTasks();
}

export function removeTask(id: string) {
  taskState.tasks = taskState.tasks.filter(t => t.id !== id);
  notifyTasks();
}