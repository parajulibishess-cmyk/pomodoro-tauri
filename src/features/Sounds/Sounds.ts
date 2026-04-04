// src/features/Sounds/Sounds.ts

export function initSoundsUI() {
  const soundsBtn = document.getElementById('top-sounds-btn');
  const modalRoot = document.getElementById('sounds-modal-root');

  if (!soundsBtn || !modalRoot) {
    console.error('Sounds button or modal root not found.');
    return;
  }

  soundsBtn.addEventListener('click', () => {
    renderSoundsModal(modalRoot);
  });
}

function renderSoundsModal(root: HTMLElement) {
  root.innerHTML = `
    <div id="sounds-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-[#594a42]/30 backdrop-blur-sm transition-opacity p-4 opacity-0">
      <div id="sounds-inner" class="dynamic-glass w-full max-w-4xl flex flex-col border-[4px] border-white/50 shadow-2xl rounded-[32px] overflow-hidden relative transform scale-95 transition-all duration-300">
        
        <header class="p-6 border-b border-white/50 flex justify-between items-center bg-white/40">
          <h2 class="text-2xl font-black text-[#594a42] flex items-center gap-3">
            <span class="bg-[#5bc0eb]/20 text-[#5bc0eb] p-2 rounded-xl">🎵</span> 
            Island Sounds
          </h2>
          <button id="close-sounds-btn" class="bg-white/60 hover:bg-[#ff6b6b] hover:text-white text-[#594a42] font-bold rounded-xl px-4 py-2 border-2 border-white/50 shadow-sm transition-all active:scale-95 cursor-pointer">
            Close
          </button>
        </header>

        <main class="flex-1 p-6 md:p-8 flex flex-col md:flex-row gap-8 bg-white/20">
           
           <div class="flex-1 flex flex-col gap-4">
             <h3 class="font-black text-[#594a42] text-xl px-2">Music Player</h3>
             
             <div class="bg-white/60 rounded-3xl border-2 border-white/50 p-6 shadow-sm flex flex-col items-center justify-center text-center flex-1">
               <div class="w-40 h-40 bg-white/80 rounded-2xl mb-6 shadow-inner border border-white/50 flex items-center justify-center overflow-hidden">
                  <span class="text-6xl">📻</span>
               </div>
               
               <h4 class="font-black text-[#594a42] text-2xl">Lofi Island Radio</h4>
               <p class="text-sm font-bold text-[#8e8070] mb-8 mt-1">beats to relax/study to</p>

               <div class="flex items-center gap-4 mb-8">
                  <button class="p-3 bg-white/80 hover:bg-white text-[#8e8070] rounded-xl transition-all shadow-sm active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                  </button>
                  <button class="p-5 bg-[#78b159] hover:bg-[#6a9e4e] text-white rounded-2xl transition-all shadow-md active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </button>
                  <button class="p-3 bg-white/80 hover:bg-white text-[#8e8070] rounded-xl transition-all shadow-sm active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                  </button>
               </div>

               <div class="w-full flex items-center gap-3 px-4">
                  <span class="text-sm text-[#8e8070]">🔉</span>
                  <input type="range" class="w-full custom-slider" style="--thumb-color: #78b159;" value="50">
                  <span class="text-sm text-[#8e8070]">🔊</span>
               </div>
             </div>
           </div>

           <div class="flex-1 flex flex-col gap-4">
             <h3 class="font-black text-[#594a42] text-xl px-2">Ambient Mixer</h3>
             
             <div class="flex flex-col gap-3">
               
               <div class="bg-white/60 p-4 rounded-2xl border-2 border-white/50 shadow-sm flex items-center gap-4 transition-all hover:bg-white/80">
                  <div class="bg-[#5bc0eb]/20 text-[#5bc0eb] p-3 rounded-xl text-xl">🌧️</div>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1.5">
                       <span class="text-sm font-bold text-[#594a42]">Soft Rain</span>
                       <span class="text-xs font-bold text-[#8e8070]">0%</span>
                    </div>
                    <input type="range" class="w-full custom-slider" style="--thumb-color: #5bc0eb;" value="0">
                  </div>
               </div>

               <div class="bg-white/60 p-4 rounded-2xl border-2 border-white/50 shadow-sm flex items-center gap-4 transition-all hover:bg-white/80">
                  <div class="bg-[#f1a25e]/20 text-[#f1a25e] p-3 rounded-xl text-xl">🔥</div>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1.5">
                       <span class="text-sm font-bold text-[#594a42]">Cozy Fireplace</span>
                       <span class="text-xs font-bold text-[#8e8070]">0%</span>
                    </div>
                    <input type="range" class="w-full custom-slider" style="--thumb-color: #f1a25e;" value="0">
                  </div>
               </div>

               <div class="bg-white/60 p-4 rounded-2xl border-2 border-white/50 shadow-sm flex items-center gap-4 transition-all hover:bg-white/80">
                  <div class="bg-[#fdcb58]/20 text-[#fdcb58] p-3 rounded-xl text-xl">☕</div>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1.5">
                       <span class="text-sm font-bold text-[#594a42]">Bustling Cafe</span>
                       <span class="text-xs font-bold text-[#8e8070]">0%</span>
                    </div>
                    <input type="range" class="w-full custom-slider" style="--thumb-color: #fdcb58;" value="0">
                  </div>
               </div>

               <div class="bg-white/60 p-4 rounded-2xl border-2 border-white/50 shadow-sm flex items-center gap-4 transition-all hover:bg-white/80">
                  <div class="bg-[#78b159]/20 text-[#78b159] p-3 rounded-xl text-xl">🌲</div>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1.5">
                       <span class="text-sm font-bold text-[#594a42]">Windy Forest</span>
                       <span class="text-xs font-bold text-[#8e8070]">0%</span>
                    </div>
                    <input type="range" class="w-full custom-slider" style="--thumb-color: #78b159;" value="0">
                  </div>
               </div>

             </div>
           </div>

        </main>
      </div>
    </div>
  `;

  // Entrance Animation
  const overlay = document.getElementById('sounds-overlay');
  const inner = document.getElementById('sounds-inner');
  
  if (overlay && inner) {
    // Trigger reflow
    void overlay.offsetWidth;
    overlay.classList.remove('opacity-0');
    inner.classList.remove('scale-95');
    inner.classList.add('scale-100');
  }

  // Interaction Logic for Closing
  const closeBtn = document.getElementById('close-sounds-btn');

  const closeModal = () => {
    if (overlay && inner) {
      overlay.classList.add('opacity-0');
      inner.classList.remove('scale-100');
      inner.classList.add('scale-95');
      setTimeout(() => {
        root.innerHTML = '';
      }, 300);
    }
  };

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}