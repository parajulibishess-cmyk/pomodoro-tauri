// src/features/Settings/SettingsManager.ts

export class SettingsManager {
  get focusDuration(): number { 
    return parseInt(localStorage.getItem('focusDuration') || '25', 10); 
  }
  
  get shortBreakDuration(): number { 
    return parseInt(localStorage.getItem('shortBreakDuration') || '5', 10); 
  }
  
  get longBreakDuration(): number { 
    return parseInt(localStorage.getItem('longBreakDuration') || '15', 10); 
  }
  
  get longBreakInterval(): number { 
    return parseInt(localStorage.getItem('longBreakInterval') || '4', 10); 
  }
  
  get autoStartBreaks(): boolean { 
    return localStorage.getItem('autoStartBreaks') === 'true'; 
  }
  
  get deepFocusMode(): boolean { 
    return localStorage.getItem('deepFocusMode') === 'true'; 
  }
  
  get todoistToken(): string { 
    return localStorage.getItem('todoist_api_token') || ''; 
  }
  
  set todoistToken(token: string) { 
    localStorage.setItem('todoist_api_token', token); 
  }

  // Returns duration in seconds for the timer logic
  getDurationForMode(mode: 'focus' | 'short' | 'long'): number {
    switch (mode) {
      case 'focus': return this.focusDuration * 60;
      case 'short': return this.shortBreakDuration * 60;
      case 'long': return this.longBreakDuration * 60;
      default: return 25 * 60;
    }
  }
}

export const settingsManager = new SettingsManager();