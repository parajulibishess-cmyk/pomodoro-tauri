import { BaseStore } from './BaseStore';

export interface JournalState {
  entries: any[]; // Replace 'any' with your actual Entry type
}

class JournalStore extends BaseStore<JournalState> {
  constructor() {
    const stored = localStorage.getItem('nook_journal');
    super({
      entries: stored ? JSON.parse(stored) : []
    });
  }

  protected onStateChange() {
    localStorage.setItem('nook_journal', JSON.stringify(this.state.entries));
  }
}

export const journalStore = new JournalStore();