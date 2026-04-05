// src/Sounds/MediaPlayer.ts (New shared player component)
import { appState, SoundItem } from "./Sounds"; // Assuming shared types in index.ts

export class MediaPlayer {
  private container: HTMLDivElement;
  private audioEl: HTMLAudioElement;

  constructor(containerId: string) {
    const parent = document.getElementById(containerId);
    if (!parent) throw new Error(`Parent container ${containerId} not found.`);

    this.container = document.createElement("div");
    this.container.className = "music-player-v2";

    this.audioEl = new Audio();
    this.initDOM();
    parent.appendChild(this.container);
    this.bindEvents();
  }

  private initDOM() {
    this.container.innerHTML = `
      <div class="player-info">
        <div class="title-container">
          <span class="marquee-title" id="player-title">--</span>
        </div>
        <div class="time-container">
          <span class="current-time" id="player-current">0:00</span>
          <span class="divider" id="player-divider"> / </span>
          <span class="total-duration" id="player-total">..:..</span>
          <span class="live-indicator hidden" id="player-live">.. / ..</span>
        </div>
      </div>
      
      <div class="scrubber-container">
        <input type="range" class="player-slider" id="player-slider" min="0" max="100" value="0">
      </div>

      <div class="player-controls">
        <button id="player-back" title="Back"><i class="icon-back"></i></button>
        <button id="player-play-pause" title="Play/Pause"><i class="icon-play"></i></button>
        <button id="player-next" title="Next"><i class="icon-next"></i></button>
        <button id="player-repeat" title="Repeat"><i class="icon-repeat"></i></button>
      </div>
    `;
  }

  public updatePlayer(sound: SoundItem, isLive: boolean) {
    const titleEl = this.container.querySelector("#player-title") as HTMLElement;
    const dividerEl = this.container.querySelector("#player-divider") as HTMLElement;
    const totalEl = this.container.querySelector("#player-total") as HTMLElement;
    const liveEl = this.container.querySelector("#player-live") as HTMLElement;

    titleEl.textContent = sound.title || sound.name;
    
    // Manage Marquee based on settings
    titleEl.classList.toggle("marquee", sound.settings?.rotatingTitle || false);

    // Handle Time Labels [UX Fix: Youtube Stream gone]
    if (isLive) {
      dividerEl.classList.add("hidden");
      totalEl.classList.add("hidden");
      liveEl.classList.remove("hidden");
    } else {
      dividerEl.classList.remove("hidden");
      totalEl.classList.remove("hidden");
      liveEl.classList.add("hidden");
      // Original logic would load audio src and set totalEl text on metadata load
    }
  }

  private bindEvents() {
    // Implement play/pause, seek, next/back/repeat logic here, updating appState
  }
}