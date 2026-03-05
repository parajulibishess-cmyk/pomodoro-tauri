// src/store/SettingsManager.ts

export class SettingsManager {
  private ls = window.localStorage;

  get focusDuration(): number {
    return parseInt(this.ls.getItem('focusDuration') || '25') * 60;
  }

  get todoistToken(): string {
    return this.ls.getItem('todoistToken') || '';
  }

  set todoistToken(token: string) {
    this.ls.setItem('todoistToken', token);
  }

  get shortBreakDuration(): number {
    return parseInt(this.ls.getItem('shortBreakDuration') || '5') * 60;
  }

  get longBreakDuration(): number {
    return parseInt(this.ls.getItem('longBreakDuration') || '15') * 60;
  }

  get longBreakInterval(): number {
    return parseInt(this.ls.getItem('longBreakInterval') || '4');
  }

  get autoStartBreaks(): boolean {
    return this.ls.getItem('autoStartBreaks') === 'true';
  }

  getDurationForMode(mode: 'focus' | 'short' | 'long'): number {
    if (mode === 'focus') return this.focusDuration;
    if (mode === 'short') return this.shortBreakDuration;
    return this.longBreakDuration;
  }
}

export const settingsManager = new SettingsManager();