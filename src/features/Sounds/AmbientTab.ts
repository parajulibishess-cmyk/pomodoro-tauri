// src/Sounds/AmbientTab.ts (Rewritten)
import { soundsModal } from "./Modal";
import { appState } from "./Sounds";

export class AmbientTab {
  constructor() {
    this.bindGlobalEvents();
  }

  public render() {
    const listContainer = document.getElementById("ambient-list-container");
    if (!listContainer) return;
    listContainer.innerHTML = appState.sounds.ambient.map(sound => `
      <div class="sound-item ${sound.id === appState.activeSoundId ? 'active' : ''}">
        ${sound.name}
      </div>
    `).join('');
  }

  private bindGlobalEvents() {
    // Tab edit button (ellipsis) opens modal
    document.querySelector("#ambient-tab-edit")?.addEventListener("click", () => this.openEditor());
  }

  private openEditor() {
    const modalHtml = `
      <h3>Ambient Settings</h3>
      <div class="config-section">
        <label>Generic Icon (Icon Picker)</label>
        <div class="icon-picker">
          <div class="icon-option" data-icon="rain"><i class="icon-ambient-rain"></i> Rain</div>
          <div class="icon-option" data-icon="cafe"><i class="icon-ambient-cafe"></i> Cafe</div>
          <div class="icon-option" data-icon="forest"><i class="icon-ambient-forest"></i> Forest</div>
          <div class="icon-option" data-icon="fireplace"><i class="icon-ambient-fireplace"></i> Fireplace</div>
        </div>
      </div>
    `;

    soundsModal.open(modalHtml, (data) => {
      this.render();
    });
  }
}