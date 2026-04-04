// src/features/Settings/SettingsManager.ts
export interface NookSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  glassOpacity: number;
}

const DEFAULT_SETTINGS: NookSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  glassOpacity: 0.6 
};
export class SettingsManager {

  settings: NookSettings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.load();
  }

  applyTheme() {
    document.documentElement.style.setProperty('--glass-opacity', this.settings.glassOpacity.toString());
  }

  load() {
    const saved = localStorage.getItem('nook_settings');
    if (saved) {
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
    this.applyTheme();
  }

  save() {
    localStorage.setItem('nook_settings', JSON.stringify(this.settings));
    this.applyTheme(); // Apply immediately on save
    window.dispatchEvent(new Event('settings-changed'));
  }
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