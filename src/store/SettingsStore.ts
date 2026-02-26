import { BaseStore } from './BaseStore';

export interface SettingsState {
  durations: { focus: number; short: number; long: number };
  autoStartBreaks: boolean;
  longBreakInterval: number;
  isDeepFocus: boolean;
  dailyGoal: number;
  breathingDuration: number;
  showPercentage: boolean;
  flowDuration: number;
  intermissionDuration: number;
  allowedDomains: string[];
}

class SettingsStore extends BaseStore<SettingsState> {
  constructor() {
    super({
      durations: JSON.parse(localStorage.getItem('nook_durations') || '{"focus":25,"short":5,"long":15}'),
      autoStartBreaks: localStorage.getItem('nook_auto_start') === 'true',
      longBreakInterval: parseInt(localStorage.getItem('nook_interval') || '4', 10),
      isDeepFocus: localStorage.getItem('nook_deep_focus') === 'true',
      dailyGoal: parseInt(localStorage.getItem('nook_daily_goal') || '120', 10),
      breathingDuration: parseInt(localStorage.getItem('nook_breathing_duration') || '10', 10),
      showPercentage: localStorage.getItem('nook_show_percentage') === 'true',
      flowDuration: 15, // Was not persisted in Context
      intermissionDuration: 15, // Was not persisted in Context
      allowedDomains: JSON.parse(localStorage.getItem('nook_allowed_domains') || '["spotify.com", "todoist.com", "youtube.com"]')
    });
  }

  protected onStateChange(prevState: SettingsState) {
    if (prevState.durations !== this.state.durations) localStorage.setItem('nook_durations', JSON.stringify(this.state.durations));
    if (prevState.autoStartBreaks !== this.state.autoStartBreaks) localStorage.setItem('nook_auto_start', this.state.autoStartBreaks.toString());
    if (prevState.longBreakInterval !== this.state.longBreakInterval) localStorage.setItem('nook_interval', this.state.longBreakInterval.toString());
    if (prevState.isDeepFocus !== this.state.isDeepFocus) localStorage.setItem('nook_deep_focus', this.state.isDeepFocus.toString());
    if (prevState.showPercentage !== this.state.showPercentage) localStorage.setItem('nook_show_percentage', this.state.showPercentage.toString());
    if (prevState.dailyGoal !== this.state.dailyGoal) localStorage.setItem('nook_daily_goal', this.state.dailyGoal.toString());
    if (prevState.breathingDuration !== this.state.breathingDuration) localStorage.setItem('nook_breathing_duration', this.state.breathingDuration.toString());
    if (prevState.allowedDomains !== this.state.allowedDomains) localStorage.setItem('nook_allowed_domains', JSON.stringify(this.state.allowedDomains));
  }
}

export const settingsStore = new SettingsStore();