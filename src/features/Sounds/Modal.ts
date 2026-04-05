// src/Sounds/Modal.ts (New shared utility)
export class Modal {
  private container: HTMLDivElement;
  private content: HTMLDivElement;

  constructor() {
    this.container = document.createElement("div");
    this.container.className = "sounds-modal-container hidden"; // Add hidden class by default in CSS

    this.content = document.createElement("div");
    this.content.className = "sounds-modal-content";

    this.container.appendChild(this.content);
    document.body.appendChild(this.container);

    // Close on click overlay
    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }

  public open(innerHtml: string, onSave: (data: any) => void) {
    this.content.innerHTML = `
      <div class="modal-header">
        <span class="close-btn">&times;</span>
      </div>
      <div class="modal-body">
        ${innerHtml}
      </div>
      <div class="modal-footer">
        <button id="modal-save-btn">Save Changes</button>
      </div>
    `;

    // Bind internal events
    this.content.querySelector(".close-btn")?.addEventListener("click", () => this.close());
    this.content.querySelector("#modal-save-btn")?.addEventListener("click", () => {
      const data = this.collectFormData();
      onSave(data);
      this.close();
    });

    this.container.classList.remove("hidden");
  }

  public close() {
    this.container.classList.add("hidden");
  }

  private collectFormData(): any {
    // Basic generic logic: find inputs/selects and pack values
    const data: any = {};
    const inputs = this.content.querySelectorAll("input, select, textarea");
    inputs.forEach((input: any) => {
      if (input.name) {
        data[input.name] = input.type === "checkbox" ? input.checked : input.value;
      }
    });
    return data;
  }
}

// Global modal instance for efficiency
export const soundsModal = new Modal();