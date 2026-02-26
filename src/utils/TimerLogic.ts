import { settingsStore } from '../store/SettingsStore';

const timerAudio = typeof Audio !== "undefined" ? new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3") : null;

export type TimerMode = 'focus' | 'short' | 'long';

export class TimerLogic {
  public mode: TimerMode = 'focus';
  public timeLeft: number = 0;
  public initialDuration: number = 0;
  public isActive: boolean = false;
  public isIntermission: boolean = false;
  
  private endTime: number | null = null;
  private intervalId: number | null = null;
  
  // Callbacks
  private onComplete: (mode: TimerMode, isFocusSession: boolean) => void;
  private onTick?: (timeLeft: number, progress: number) => void;

  constructor(
    onComplete: (mode: TimerMode, isFocusSession: boolean) => void,
    onTick?: (timeLeft: number, progress: number) => void
  ) {
    this.onComplete = onComplete;
    this.onTick = onTick;
    this.syncWithSettings();
  }

  // Set the UI update callback (useful for attaching vanilla DOM elements later)
  public setOnTick(onTick: (timeLeft: number, progress: number) => void) {
    this.onTick = onTick;
  }

  // Syncs initial time with current settings if the timer isn't running
  public syncWithSettings() {
    if (!this.isActive && !this.isIntermission) {
      const settings = settingsStore.getState();
      const dur = settings.durations[this.mode] * 60;
      this.timeLeft = dur;
      this.initialDuration = dur;
      this.notifyTick();
    }
  }

  public startTimer() {
    this.isIntermission = false;
    this.endTime = Date.now() + this.timeLeft * 1000;
    this.isActive = true;
    this.startLoop();
  }

  public pauseTimer() {
    this.isActive = false;
    this.endTime = null;
    this.stopLoop();
  }

  public setMode(newMode: TimerMode) {
    this.mode = newMode;
    this.syncWithSettings();
  }

  public startSession(newMode: TimerMode) {
    const settings = settingsStore.getState();
    this.mode = newMode;
    const dur = settings.durations[newMode] * 60;
    
    this.timeLeft = dur;
    this.initialDuration = dur;
    this.endTime = Date.now() + dur * 1000;
    this.isActive = true;
    this.isIntermission = false;
    
    this.startLoop();
  }

  public finishIntermission(action: 'extend' | 'break', nextMode: TimerMode = 'short') {
    const settings = settingsStore.getState();
    this.isIntermission = false;

    if (action === 'extend') {
      const extra = settings.flowDuration * 60;
      this.timeLeft = extra;
      this.initialDuration = extra;
      this.endTime = Date.now() + extra * 1000;
      this.isActive = true;
      this.startLoop();
    } else if (action === 'break') {
      this.mode = nextMode;
      const dur = settings.durations[nextMode] * 60;
      this.timeLeft = dur;
      this.initialDuration = dur;
      
      if (settings.autoStartBreaks) {
        this.endTime = Date.now() + dur * 1000;
        this.isActive = true;
        this.startLoop();
      } else {
        this.notifyTick();
      }
    }
  }

  public calculateProgress(): number {
    if (this.initialDuration === 0) return 0;
    return ((this.initialDuration - this.timeLeft) / this.initialDuration) * 100;
  }

  private startLoop() {
    this.stopLoop(); // Ensure no overlapping intervals
    this.intervalId = window.setInterval(() => {
      if (!this.isActive || !this.endTime) return;

      const now = Date.now();
      const diff = Math.ceil((this.endTime - now) / 1000);

      if (diff <= 0) {
        this.timeLeft = 0;
        this.isActive = false;
        this.endTime = null;
        this.stopLoop();
        this.notifyTick();
        this.handleCompletion();
      } else if (this.timeLeft !== diff) {
        this.timeLeft = diff;
        this.notifyTick();
      }
    }, 200); // 200ms for high-accuracy checks without heavy CPU load
  }

  private stopLoop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private handleCompletion() {
    if (timerAudio) {
        timerAudio.play().catch(e => console.error("Audio play failed:", e));
    }
    this.onComplete(this.mode, this.mode === 'focus');
  }

  private notifyTick() {
    if (this.onTick) {
      this.onTick(this.timeLeft, this.calculateProgress());
    }
  }
}