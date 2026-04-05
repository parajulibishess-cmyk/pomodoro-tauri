// src/Sounds/MusicTab.ts (Rewritten)
import { soundsModal } from "./Modal";
import { appState } from "./Sounds";
import { MediaPlayer } from "./MediaPlayer";

export class MusicTab {
  private player: MediaPlayer;

  constructor() {
    this.initTabContainer();
    this.player = new MediaPlayer("music-player-container");
    this.bindGlobalEvents();
  }

  private initTabContainer() {
    // Add edit icon to tab header in SoundsUI.ts
  }

  public render() {
    this.renderMusicList();
    this.renderUpNext(); // Conditional render
  }

  private renderMusicList() {
    const listContainer = document.getElementById("music-list-container");
    if (!listContainer) return;
    listContainer.innerHTML = appState.sounds.music.map(sound => `
      <div class="sound-item ${sound.id === appState.activeSoundId ? 'active' : ''}">
        ${sound.name}
      </div>
    `).join('');
  }

  private renderUpNext() {
    const queueContainer = document.getElementById("up-next-container");
    if (!queueContainer) return;

    // [UX Fix: Conditional Remove Up Next]
    if (appState.queue.length > 1) {
      queueContainer.classList.remove("hidden");
      queueContainer.innerHTML = appState.queue.slice(1).map(sound => `
        <div class="queue-item">${sound.title}</div>
      `).join('');
    } else {
      queueContainer.classList.add("hidden");
    }
  }

  private bindGlobalEvents() {
    // Tab edit button (ellipsis) opens modal
    document.querySelector("#music-tab-edit")?.addEventListener("click", () => this.openEditor());
  }

  private openEditor() {
    const modalHtml = `
      <h3>Music Settings</h3>
      <div class="config-section">
        <label>Icon Style (Pick Generic Icon)</label>
        <div class="icon-picker">
          <div class="icon-option ${appState.sounds.music[0].settings?.genericIcon === 'lofi' ? 'selected' : ''}" data-icon="lofi"><i class="icon-music-lofi"></i> Lo-Fi Focus</div>
          <div class="icon-option" data-icon="classical"><i class="icon-music-classical"></i> Classical</div>
        </div>
      </div>
      
      <div class="config-section">
        <label>Thumbnail Setting (Music Tab)</label>
        <select name="thumbnailOption">
          <option value="video" ${appState.sounds.music[0].settings?.thumbnail === 'video' ? 'selected' : ''}>Use Video Thumbnail</option>
          <option value="custom">Upload Custom Image</option>
        </select>
      </div>

      <div class="config-section checkbox-section">
        <label>
          <input type="checkbox" name="rotatingTitle" ${appState.sounds.music[0].settings?.rotatingTitle ? 'checked' : ''}>
          Rotating Title (Marquee)
        </label>
      </div>

      <div class="config-section action-section">
        <button id="add-video-queue-btn">Add Another Video to Queue</button>
      </div>
    `;

    soundsModal.open(modalHtml, (data) => {
      // Logic to update appState and re-render
      appState.sounds.music[0].settings = { ...appState.sounds.music[0].settings, ...data };
      this.render();
    });

    // Handle new "Add to Queue" interaction inside modal
    document.querySelector("#add-video-queue-btn")?.addEventListener("click", () => {
      appState.queue.push({ title: "New Queued Video", id: "sample", name: "queued", url: "" });
      alert("Video added to queue!");
    });
  }
}