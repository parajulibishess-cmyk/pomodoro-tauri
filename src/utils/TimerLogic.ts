import { settingsStore } from '../store/SettingsStore';

export type TimerMode = 'focus' | 'short' | 'long';
export type TimerAction = 'extend' | 'break';

const timerAudio = typeof Audio !== "undefined" ? new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3") : null;

export class TimerLogic {
  public mode: TimerMode = 'focus';
  public timeLeft: number = 0;
  public initialDuration: number = 0;
  public isActive: boolean = false;
  public isIntermission: boolean = false;
  
  private endTime: number | null = null;
  private intervalId: number | null = null;
  private onComplete: (mode: TimerMode, isFocusSession: boolean) => void;

  // Callback to update the vanilla DOM when the timer ticks
  private onTickCallback?: (timeLeft: number, isActive: boolean) => void;

  constructor(onComplete: (mode: TimerMode, isFocusSession: boolean) => void) {
    this.onComplete = onComplete;
    this.init();
  }

  private init() {
    const settings = settingsStore.getState();
    this.initialDuration = settings.durations.focus * 60;
    this.timeLeft = this.initialDuration;
  }

  // Subscribe UI to tick events
  public onTick(cb: (timeLeft: number, isActive: boolean) => void) {
    this.onTickCallback = cb;
  }

  private notifyTick() {
    if (this.onTickCallback) {
      this.onTickCallback(this.timeLeft, this.isActive);
    }
  }

  public startTimer() {
    this.isIntermission = false;
    this.endTime = Date.now() + this.timeLeft * 1000;
    this.isActive = true;
    this.runInterval();
  }

  public pauseTimer() {
    this.isActive = false;
    this.endTime = null;
    this.clearInterval();
    this.notifyTick();
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
    this.runInterval();
  }

  public setMode(newMode: TimerMode) {
    const settings = settingsStore.getState();
    this.mode = newMode;
    const dur = settings.durations[newMode] * 60;
    this.timeLeft = dur;
    this.initialDuration = dur;
    this.isActive = false;
    this.endTime = null;
    this.clearInterval();
    this.notifyTick();
  }

  public finishIntermission(action: TimerAction, nextMode: TimerMode = 'short') {
    const settings = settingsStore.getState();
    this.isIntermission = false;

    if (action === 'extend') {
      const extra = settings.flowDuration * 60;
      this.timeLeft = extra;
      this.initialDuration = extra;
      this.endTime = Date.now() + extra * 1000;
      this.isActive = true;
      this.runInterval();
    } else if (action === 'break') {
      this.mode = nextMode;
      const dur = settings.durations[nextMode] * 60;
      this.timeLeft = dur;
      this.initialDuration = dur;
      
      if (settings.autoStartBreaks) {
        this.endTime = Date.now() + dur * 1000;
        this.isActive = true;
        this.runInterval();
      } else {
        this.isActive = false;
        this.notifyTick();
      }
    }
  }

  public calculateProgress(): number {
    if (this.initialDuration === 0) return 0;
    return ((this.initialDuration - this.timeLeft) / this.initialDuration) * 100;
  }

  private runInterval() {
    this.clearInterval();
    this.notifyTick(); // initial tick update
    
    this.intervalId = window.setInterval(() => {
      if (!this.isActive || !this.endTime) return;

      const now = Date.now();
      const diff = Math.ceil((this.endTime - now) / 1000);

      if (diff <= 0) {
        this.timeLeft = 0;
        this.isActive = false;
        this.endTime = null;
        this.clearInterval();
        this.notifyTick();
        this.handleCompletion();
      } else {
        // Optimization: Only notify UI if the exact second changed
        if (this.timeLeft !== diff) {
          this.timeLeft = diff;
          this.notifyTick();
        }
      }
    }, 200);
  }

  private clearInterval() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private handleCompletion() {
    if (timerAudio) timerAudio.play().catch(e => console.error(e));
    this.onComplete(this.mode, this.mode === 'focus');
  }
}