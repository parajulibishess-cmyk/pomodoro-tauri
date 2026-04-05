// src/features/Sounds/SoundsUI.ts

// Notice the slight negative margin on the play icon to visually center the triangle
export const svgPlay = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 256 256" style="margin-left: -2px;"><path fill="currentColor" d="M232.31,114.34l-128-74.32A15.93,15.93,0,0,0,80,53.91V202.09a15.94,15.94,0,0,0,24.31,13.89l128-74.32a15.89,15.89,0,0,0,0-27.32Z"></path></svg>`;
export const svgPause = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 256 256"><path fill="currentColor" d="M216,48V208a16,16,0,0,1-16,16H152a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h48A16,16,0,0,1,216,48ZM96,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z"></path></svg>`;
export const svgNext = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256"><path fill="currentColor" d="M208,40V216a8,8,0,0,1-16,0V139.46L76.54,206.56A15.92,15.92,0,0,1,52.2,192.05V63.95A15.92,15.92,0,0,1,76.54,49.44L192,116.54V40a8,8,0,0,1,16,0Z"></path></svg>`;
export const svgPrev = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256"><path fill="currentColor" d="M203.8,49.44A15.92,15.92,0,0,0,179.46,50L64,116.54V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0V139.46L179.46,206A15.92,15.92,0,0,0,203.8,192.05V63.95A15.93,15.93,0,0,0,203.8,49.44Z"></path></svg>`;
export const svgRepeat = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M240,160a8,8,0,0,1-8,8H192v24a8,8,0,0,1-13.66,5.66l-48-48a8,8,0,0,1,0-11.32l48-48A8,8,0,0,1,192,96v24h40A8,8,0,0,1,240,160ZM134.34,58.34l-48-48A8,8,0,0,0,72,16V40H24A8,8,0,0,0,16,48v88a8,8,0,0,0,16,0V56H72V80a8,8,0,0,0,13.66,5.66l48-48A8,8,0,0,0,134.34,58.34Z"></path></svg>`;
export const svgVolume = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><path fill="currentColor" d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32ZM144,207.64,88,164.09V91.91l56-43.55Zm47.78-135A8,8,0,0,0,180.4,83.89,64,64,0,0,1,180.4,172.1a8,8,0,1,0,11.38,11.23,80,80,0,0,0,0-110.66ZM240,128a111.45,111.45,0,0,1-32.55,79,8,8,0,0,0,11.38,11.25,127.35,127.35,0,0,0,37.21-90.28,127.15,127.15,0,0,0-37.16-90.22,8,8,0,1,0-11.34,11.28A111.38,111.38,0,0,1,240,128Z"></path></svg>`;
export const svgSleep = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M216.71,205.29A8,8,0,0,1,205.29,216.71l-16-16a88,88,0,1,1,11.42-11.42ZM128,200a72,72,0,1,0-72-72A72.08,72.08,0,0,0,128,200ZM176,32a8,8,0,0,0-16,0V44.49A88,88,0,0,0,96,32a8,8,0,0,0,0,16,71.55,71.55,0,0,1,42.44,13.88L88.25,124A8,8,0,0,0,96,136h64a8,8,0,0,0,5.66-13.66l-50.18-50.18A71.55,71.55,0,0,1,160,58.44V72a8,8,0,0,0,16,0Z"></path></svg>`;

export const setPlayIcon = (isPlaying: boolean) => { 
  const playPauseBtn = document.getElementById('btn-play-pause');
  if (playPauseBtn) playPauseBtn.innerHTML = isPlaying ? svgPause : svgPlay; 
};

export const updateStatus = (text: string | null, isLive: boolean = false) => {
  const statusBadge = document.getElementById('status-badge');
  if (!statusBadge) return;
  if (text) {
    statusBadge.classList.remove('hidden');
    statusBadge.innerText = text;
    statusBadge.className = `absolute top-6 left-6 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md z-20 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-[#5bc0eb]'}`;
  } else {
    statusBadge.classList.add('hidden');
  }
};

export const toggleLiveUI = (isLive: boolean, hasQueue: boolean = false) => {
  const upNext = document.getElementById('up-next-container');
  const playerCol = document.getElementById('player-left-col');
  const playerCard = document.getElementById('player-card');
  
  if (isLive || !hasQueue) {
    if (upNext) { upNext.classList.add('hidden'); upNext.classList.remove('flex'); }
    if (playerCol) { playerCol.className = "w-full h-full flex flex-col transition-all duration-500 justify-center"; }
    if (playerCard) { playerCard.classList.remove('border-2'); playerCard.classList.add('border-[3px]'); }
  } else {
    if (upNext) { upNext.classList.remove('hidden'); upNext.classList.add('flex'); }
    if (playerCol) { playerCol.className = "w-full lg:w-[60%] h-full flex flex-col transition-all duration-500 justify-center shrink-0"; }
    if (playerCard) { playerCard.classList.remove('border-[3px]'); playerCard.classList.add('border-2'); }
  }
};

export const switchTab = (root: HTMLElement, targetId: string) => {
  root.querySelectorAll('.nav-btn').forEach(b => {
    const isActive = b.getAttribute('data-target') === targetId;
    b.className = `nav-btn flex-shrink-0 w-full text-left px-5 py-3 rounded-xl text-lg font-black transition-all border-2 ${isActive ? 'active bg-white shadow-sm border-white/80 text-[#594a42]' : 'text-[#8e8070] hover:bg-white/50 border-transparent'}`;
  });
  root.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.getElementById(targetId)?.classList.remove('hidden');
};

export const renderSoundsModalHTML = (root: HTMLElement) => {
  if (root.innerHTML.trim() !== '') return;
  
  root.innerHTML = `
    <style>
      #music-volume::-webkit-slider-thumb { 
        width: 12px !important; 
        height: 12px !important; 
        margin-top: -4px !important; 
      }
      #music-volume::-moz-range-thumb { 
        width: 12px !important; 
        height: 12px !important; 
      }
    </style>

    <div id="sounds-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-[#594a42]/30 backdrop-blur-sm transition-all duration-300 p-4 opacity-0 pointer-events-none">
      <div id="sounds-inner" class="nook-glass w-full max-w-6xl h-[80vh] min-h-[600px] max-h-[850px] flex flex-col md:flex-row border-[4px] border-white/50 shadow-2xl rounded-[32px] overflow-hidden relative transform scale-95 transition-all duration-300">
        
        <aside class="w-full md:w-64 bg-white/40 border-b md:border-b-0 md:border-r border-white/50 p-6 flex flex-col gap-6 shrink-0 z-10">
          <h2 class="text-2xl font-black text-[#594a42] flex items-center gap-3"><span class="bg-[#5bc0eb]/20 text-[#5bc0eb] p-2 rounded-xl text-lg">🎵</span> Sounds</h2>
          <nav class="flex md:flex-col gap-3 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            <button class="nav-btn active flex-shrink-0 w-full text-left px-5 py-3 rounded-xl text-lg font-black text-[#594a42] transition-all bg-white shadow-sm border-2 border-white/80" data-target="tab-player">📻 Player</button>
            <button class="nav-btn flex-shrink-0 w-full text-left px-5 py-3 rounded-xl text-lg font-black text-[#8e8070] transition-all hover:bg-white/50 border-2 border-transparent" data-target="tab-music">🎧 Music</button>
            <button class="nav-btn flex-shrink-0 w-full text-left px-5 py-3 rounded-xl text-lg font-black text-[#8e8070] transition-all hover:bg-white/50 border-2 border-transparent" data-target="tab-ambient">🌿 Ambient</button>
            <button class="nav-btn flex-shrink-0 w-full text-left px-5 py-3 rounded-xl text-lg font-black text-[#8e8070] transition-all hover:bg-white/50 border-2 border-transparent" data-target="tab-settings">⚙️ Settings</button>
          </nav>
          <div class="mt-auto hidden md:block text-center">
            <button id="close-sounds-btn" class="bg-white/60 hover:bg-white text-[#594a42] text-lg font-bold rounded-2xl px-5 py-3 border-2 border-white/50 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer w-full">Close</button>
          </div>
        </aside>

        <main class="flex-1 overflow-hidden bg-white/20 relative p-6">
          <div id="tab-player" class="tab-content flex gap-6 h-full overflow-hidden transition-all duration-500">
            
            <div id="player-left-col" class="w-full h-full flex flex-col transition-all duration-500 justify-center items-center">
              <div id="player-card" class="w-full h-full bg-white/60 rounded-[32px] p-8 border-white/50 shadow-sm flex flex-col relative overflow-hidden transition-all duration-500">
                <div id="player-bg-glow" class="absolute inset-0 opacity-[0.15] transition-colors duration-1000 z-0 mix-blend-multiply"></div>
                
                <div class="w-full flex items-center justify-end gap-5 mb-4 z-10 relative shrink-0">
                   <div id="status-badge" class="hidden absolute left-0 top-0 bg-[#5bc0eb] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md z-20">Loading...</div>
                   
                   <div class="flex items-center gap-2 text-[#8e8070]">
                      ${svgVolume}
                      <input id="music-volume" type="range" class="w-24 custom-slider" style="--thumb-color: #8e8070; height: 4px;" value="50">
                   </div>
                   <button id="btn-pomodoro-sync" class="text-[#8e8070] hover:text-[#5bc0eb] transition-colors p-1" title="Sync with Pomodoro Timer">
                      ${svgSleep}
                   </button>
                </div>

                <div class="flex-1 flex items-center justify-center min-h-[150px] z-10 w-full mb-6">
                    <div id="player-icon-container" class="aspect-square w-full max-w-[360px] max-h-full bg-white/80 rounded-[32px] shadow-lg border-[3px] border-white/90 flex items-center justify-center overflow-hidden relative transition-all duration-500">
                        <span id="player-icon" class="text-8xl">📻</span>
                        <img id="player-thumbnail" class="absolute inset-0 w-full h-full object-cover hidden" src="" alt="Thumbnail" />
                    </div>
                </div>
                
                <div class="w-full flex flex-col items-center justify-end z-10 shrink-0 pb-4">
                    <h4 id="player-title" class="font-black text-3xl w-full px-4 mb-2 truncate text-center text-[#594a42] transition-colors drop-shadow-sm">Ready to Focus</h4>
                    <p id="player-artist" class="text-sm font-bold text-[#8e8070] mb-8 truncate w-full text-center tracking-wider">Select a track to start</p>
                    
                    <div class="w-full max-w-[480px] mb-8 relative">
                        <input id="playback-slider" type="range" class="w-full custom-slider cursor-pointer" style="--thumb-color: #5bc0eb; height: 6px;" value="0" step="0.1">
                        <div class="flex justify-between items-center mt-3 px-1">
                            <span id="player-time-current" class="text-xs font-black text-[#8e8070]">0:00</span>
                            <span id="player-time-remain" class="text-xs font-black text-[#8e8070]">- 0:00</span>
                        </div>
                    </div>

                    <div class="w-full max-w-[480px] relative flex items-center justify-center">
                        <div class="flex items-center gap-10 z-10">
                            <button id="btn-prev" class="text-[#8e8070] hover:text-[#594a42] transition-transform hover:scale-110 active:scale-90">${svgPrev}</button>
                            <button id="btn-play-pause" class="w-[84px] h-[84px] bg-[#5bc0eb] text-white rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 opacity-50 cursor-not-allowed">
                                ${svgPlay}
                            </button>
                            <button id="btn-next" class="text-[#8e8070] hover:text-[#594a42] transition-transform hover:scale-110 active:scale-90">${svgNext}</button>
                        </div>
                        <button id="btn-repeat" class="absolute right-4 text-[#8e8070] hover:text-[#5bc0eb] transition-colors" title="Repeat">${svgRepeat}</button>
                    </div>
                </div>
              </div>
            </div>

            <div id="up-next-container" class="w-full lg:w-[40%] flex-col h-full transition-all duration-500 hidden shrink-0">
              <div class="bg-white/60 rounded-[32px] p-6 border-2 border-white/50 shadow-sm flex flex-col h-full">
                <h3 class="font-black text-[#594a42] text-lg uppercase tracking-wider border-b-2 border-white/50 pb-3 mb-4">Up Next</h3>
                <div id="up-next-list" class="flex flex-col gap-3 overflow-y-auto hide-scrollbar flex-1 pr-2"></div>
              </div>
            </div>
          </div>

          <div id="tab-music" class="tab-content hidden h-full overflow-y-auto hide-scrollbar pr-2 relative">
            <h2 class="text-3xl font-black text-[#594a42] mb-6">Your Music</h2>
            <div id="music-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"></div>
          </div>

          <div id="tab-ambient" class="tab-content hidden h-full overflow-y-auto hide-scrollbar pr-2 relative">
            <h2 class="text-3xl font-black text-[#594a42] mb-6">Ambient Mixer</h2>
            <div id="ambient-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"></div>
          </div>

          <div id="tab-settings" class="tab-content hidden flex flex-col lg:flex-row gap-6 h-full overflow-hidden pb-2">
            <div class="w-full lg:w-[65%] bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col gap-4 overflow-y-auto hide-scrollbar">
              <div class="border-b-2 border-white/50 pb-2">
                <h3 class="font-black text-[#594a42] text-xl flex items-center gap-2"><span class="text-red-500">▶️</span> Import Media</h3>
              </div>
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-black text-[#594a42] uppercase tracking-wider">YouTube URL</label>
                  <input id="import-url" type="text" placeholder="https://youtube.com/..." class="w-full bg-white/80 border-2 border-white/80 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#5bc0eb] transition-colors">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-black text-[#594a42] uppercase tracking-wider">Add to</label>
                  <select id="import-type" class="w-full bg-white/80 border-2 border-white/80 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#5bc0eb] transition-colors cursor-pointer">
                    <option value="music">📻 Music Library</option>
                    <option value="ambient">🌿 Ambient Mixer</option>
                  </select>
                </div>
                <div class="flex flex-col gap-1">
                 <label class="text-[10px] font-black text-[#594a42] uppercase tracking-wider">Custom Name (Optional)</label>
                  <input id="import-name" type="text" placeholder="e.g., Lofi Stream" class="w-full bg-white/80 border-2 border-white/80 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#5bc0eb] transition-colors">
                </div>
                <button id="btn-add-library" class="mt-2 w-full bg-[#78b159] hover:bg-[#6a9e4e] text-white font-black text-sm py-3 rounded-xl shadow-md transition-all active:scale-95">Save to Library</button>
              </div>
            </div>
            <div class="w-full lg:w-[35%] bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col h-full gap-4">
              <div class="border-b-2 border-white/50 pb-2 flex justify-between items-end">
                <h3 class="font-black text-[#594a42] text-lg flex items-center gap-2">🗄️ Library</h3>
                <button id="btn-clear-cache" class="bg-[#8e8070] hover:bg-[#ff6b6b] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95">Clear All</button>
              </div>
              <div id="storage-list" class="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2"></div>
            </div>
          </div>
        </main>
      </div>

      <div id="generic-editor-modal" class="hidden absolute z-50 bg-white/95 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border-[4px] border-white flex-col gap-4 w-[540px] max-w-[95vw] max-h-[90vh]">
         <h3 class="font-black text-[#594a42] text-xl border-b-2 border-[#8e8070]/20 pb-2 shrink-0">Edit Media Elements</h3>
         
         <div class="flex flex-col gap-1 shrink-0">
            <label class="text-[10px] font-black text-[#8e8070] uppercase tracking-wider">Name</label>
            <input id="edit-name" type="text" placeholder="Media Name" class="bg-white/80 border-2 border-[#8e8070]/30 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#5bc0eb] transition-colors w-full text-[#594a42]">
         </div>
         
         <div class="flex gap-4 shrink-0">
           <div class="flex-1 flex flex-col gap-1">
             <label class="text-[10px] font-black text-[#8e8070] uppercase tracking-wider">Track Accent</label>
             <div id="edit-color-selector" class="flex flex-wrap gap-1.5 bg-black/5 p-2 rounded-xl content-start"></div>
           </div>
           <div class="flex-1 flex flex-col gap-1">
             <label class="text-[10px] font-black text-[#8e8070] uppercase tracking-wider">Title Text Color</label>
             <div id="edit-title-color-selector" class="flex flex-wrap gap-1.5 bg-black/5 p-2 rounded-xl content-start"></div>
           </div>
         </div>

         <div class="flex flex-col gap-1 min-h-0 flex-1">
           <label class="text-[10px] font-black text-[#8e8070] uppercase tracking-wider">Fallback Icon</label>
           <div id="edit-icon-selector" class="flex flex-wrap gap-2 text-2xl bg-black/5 p-3 rounded-xl overflow-y-auto hide-scrollbar content-start"></div>
         </div>

         <div class="flex flex-col gap-1.5 bg-black/5 p-3 rounded-xl shrink-0">
            <label class="text-[10px] font-black text-[#8e8070] uppercase tracking-wider">Thumbnail Source</label>
            <div class="flex gap-2">
              <input id="edit-thumb-url" type="text" placeholder="Direct Image URL (Optional)" class="flex-1 bg-white/80 border-2 border-[#8e8070]/30 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-[#5bc0eb] w-full text-[#594a42]">
              <button id="btn-auto-extract-thumb" class="bg-[#5bc0eb]/20 text-[#5bc0eb] hover:bg-[#5bc0eb] hover:text-white transition-colors text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 whitespace-nowrap">
                🔄 Extract YT
              </button>
            </div>
         </div>
         
         <div class="flex gap-3 justify-end mt-1 shrink-0">
            <button id="btn-close-editor" class="text-xs text-[#8e8070] px-4 py-2 rounded-xl hover:bg-black/5 font-bold transition-all">Cancel</button>
            <button id="btn-save-editor" class="text-xs bg-[#5bc0eb] text-white px-5 py-2 rounded-xl hover:bg-[#4aa0c7] font-black shadow-md transition-all active:scale-95">Save Changes</button>
         </div>
      </div>

    </div>
  `;
};