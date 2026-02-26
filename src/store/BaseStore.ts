export type Listener<T> = (state: T) => void;

export class BaseStore<T> {
  protected state: T;
  private listeners: Set<Listener<T>> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  public getState(): T {
    return this.state;
  }

  public setState(updater: Partial<T> | ((prev: T) => Partial<T>)) {
    const changes = typeof updater === 'function' ? updater(this.state) : updater;
    const prevState = this.state;
    this.state = { ...this.state, ...changes };
    this.onStateChange(prevState);
    this.notify();
  }

  public subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    // Return an unsubscribe function
    return () => this.listeners.delete(listener);
  }

  protected notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Override this in child classes to handle localStorage saving
  protected onStateChange(_prevState: T) {}
}