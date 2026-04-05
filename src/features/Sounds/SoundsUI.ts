// src/features/Sounds/SoundsUI.ts
import { MusicTab } from "./MusicTab";
import { AmbientTab } from "./AmbientTab";

export class SoundsUI {
  private activeTab: 'music' | 'ambient' = 'music';
  private musicTab!: MusicTab;
  private ambientTab!: AmbientTab;

  constructor() {
    this.buildModalHTML();      // 1. Build the HTML first
    this.initMainModalToggle(); // 2. Hook up the Open/Close logic
    this.initTabStructure();    // 3. Add edit icons
    
    this.musicTab = new MusicTab();
    this.ambientTab = new AmbientTab();
    
    this.bindTabSwitching();
    this.render();
  }

  // --- NEW: Builds the modal inside your empty <div id="sounds-modal-root"> ---
  private buildModalHTML() {
    const root = document.getElementById('sounds-modal-root');
    if (!root) {
      console.error("Could not find #sounds-modal-root in index.html");
      return;
    }

    // Only build if it doesn't already exist
    if (!document.getElementById('sounds-overlay')) {
      root.innerHTML = `
        <div id="sounds-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center opacity-0 transition-opacity duration-300">
          <div id="sounds-inner" class="bg-[#fcfcf7] rounded-[32px] shadow-2xl border-4 border-white/50 w-[900px] max-w-[90vw] h-[700px] max-h-[90vh] flex flex-col scale-95 transition-transform duration-300 overflow-hidden relative">
            
            <div class="flex justify-between items-center p-6 border-b-2 border-gray-200/50 bg-white/40">
              <h2 class="text-3xl font-bold text-[#594a42]">Sounds</h2>
              <button id="btn-close-sounds" class="text-gray-500 hover:text-gray-800 text-3xl font-bold cursor-pointer transition-colors">&times;</button>
            </div>

            <div class="flex gap-4 p-4 bg-white/20 border-b-2 border-gray-200/50">
              <button id="music-tab-header" class="px-6 py-2 font-bold text-lg rounded-2xl transition-all flex items-center gap-2 cursor-pointer text-[#594a42]">Music</button>
              <button id="ambient-tab-header" class="px-6 py-2 font-bold text-lg rounded-2xl transition-all flex items-center gap-2 cursor-pointer text-[#594a42]">Ambient</button>
            </div>

            <div class="flex-1 overflow-auto p-6 relative bg-white/30">
              <div id="music-content" class="flex flex-col h-full">
                <div id="music-player-container" class="mb-6 w-full bg-white rounded-2xl shadow-sm border-2 border-white/50 p-4"></div>
                <h3 class="font-bold text-xl mb-3 text-[#594a42]">Library</h3>
                <div id="music-list-container" class="flex flex-col gap-2 flex-1 overflow-auto"></div>
                <div id="up-next-container" class="mt-4 p-4 bg-white/60 rounded-2xl border-2 border-white/50 hidden flex-col gap-2">
                  <h3 class="font-bold text-lg text-[#594a42]">Up Next</h3>
                </div>
              </div>
              
              <div id="ambient-content" class="hidden h-full">
                <div id="ambient-list-container" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
              </div>
            </div>

          </div>
        </div>
      `;
    }
  }

  private initMainModalToggle() {
    // Note: Corrected to match index.html
    const btnSounds = document.getElementById('top-sounds-btn'); 
    
    const overlay = document.getElementById('sounds-overlay'); 
    const inner = document.getElementById('sounds-inner');
    const btnClose = document.getElementById('btn-close-sounds');

    const closeModal = () => {
      if (overlay && inner) {
        overlay.classList.add('opacity-0');
        inner.classList.remove('scale-100');
        inner.classList.add('scale-95');
        setTimeout(() => {
          overlay.classList.add('hidden');
          overlay.classList.remove('flex');
        }, 300);
      }
    };

    btnSounds?.addEventListener('click', () => {
      if (overlay && inner) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        void overlay.offsetWidth; // trigger reflow for Tailwind transitions
        overlay.classList.remove('opacity-0');
        inner.classList.remove('scale-95');
        inner.classList.add('scale-100');
      }
    });

    btnClose?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  private initTabStructure() {
    const musicHeader = document.querySelector("#music-tab-header") as HTMLElement;
    const ambientHeader = document.querySelector("#ambient-tab-header") as HTMLElement;

    // Appends the edit icon (...) inside the buttons
    if (musicHeader) musicHeader.innerHTML = `Music <span class="bg-black/10 hover:bg-black/20 rounded px-2 pb-1 leading-none ml-2 text-sm" id="music-tab-edit">...</span>`;
    if (ambientHeader) ambientHeader.innerHTML = `Ambient <span class="bg-black/10 hover:bg-black/20 rounded px-2 pb-1 leading-none ml-2 text-sm" id="ambient-tab-edit">...</span>`;
  }

  private bindTabSwitching() {
    document.querySelector("#music-tab-header")?.addEventListener("click", (e) => {
      // Prevent switching tabs if they just clicked the edit (...) button
      if ((e.target as HTMLElement).id !== 'music-tab-edit') this.switchTab('music');
    });
    
    document.querySelector("#ambient-tab-header")?.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id !== 'ambient-tab-edit') this.switchTab('ambient');
    });
  }

  private switchTab(tab: 'music' | 'ambient') {
    this.activeTab = tab;
    this.render();
  }

  public render() {
    const musicContainer = document.getElementById("music-content");
    const ambientContainer = document.getElementById("ambient-content");
    const musicHeader = document.getElementById("music-tab-header");
    const ambientHeader = document.getElementById("ambient-tab-header");

    if (this.activeTab === 'music') {
      musicContainer?.classList.remove("hidden");
      musicContainer?.classList.add("flex");
      ambientContainer?.classList.add("hidden");
      
      musicHeader?.classList.add("bg-white/60", "shadow-sm");
      ambientHeader?.classList.remove("bg-white/60", "shadow-sm");
      
      this.musicTab.render();
    } else {
      musicContainer?.classList.add("hidden");
      musicContainer?.classList.remove("flex");
      ambientContainer?.classList.remove("hidden");
      
      ambientHeader?.classList.add("bg-white/60", "shadow-sm");
      musicHeader?.classList.remove("bg-white/60", "shadow-sm");
      
      this.ambientTab.render();
    }
  }
}