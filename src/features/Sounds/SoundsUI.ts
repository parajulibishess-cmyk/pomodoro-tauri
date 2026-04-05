// src/features/Sounds/SoundsUI.ts

export const svgPlay = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
export const svgPause = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

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
    statusBadge.className = `absolute top-6 left-6 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md ${isLive ? 'bg-red-500 animate-pulse' : 'bg-[#5bc0eb]'}`;
  } else {
    statusBadge.classList.add('hidden');
  }
};

export const toggleLiveUI = (isLive: boolean) => {
  const upNext = document.getElementById('up-next-container');
  const playerCol = document.getElementById('player-left-col');
  if (isLive) {
    if (upNext) { upNext.classList.add('hidden'); upNext.classList.remove('flex'); }
    if (playerCol) { playerCol.classList.remove('lg:w-3/5'); playerCol.classList.add('lg:w-full'); }
  } else {
    if (upNext) { upNext.classList.remove('hidden'); upNext.classList.add('flex'); }
    if (playerCol) { playerCol.classList.add('lg:w-3/5'); playerCol.classList.remove('lg:w-full'); }
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
  if (root.innerHTML.trim() !== '') return; // Prevent overwriting DOM if it already exists
  
  root.innerHTML = `
    <div id="sounds-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-[#594a42]/30 backdrop-blur-sm transition-all duration-300 p-4 opacity-0 pointer-events-none">
      <div id="sounds-inner" class="nook-glass w-full max-w-6xl h-[75vh] min-h-[600px] max-h-[800px] flex flex-col md:flex-row border-[4px] border-white/50 shadow-2xl rounded-[32px] overflow-hidden relative transform scale-95 transition-all duration-300">
        
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
            <div id="player-left-col" class="w-full lg:w-3/5 h-full flex flex-col transition-all duration-500">
              <div class="bg-white/60 rounded-3xl p-8 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center h-full relative">
                <div id="status-badge" class="hidden absolute top-6 left-6 bg-[#5bc0eb] text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">Loading...</div>
                <div class="w-48 h-48 bg-white/80 rounded-[32px] mb-6 shadow-inner border border-white/50 flex items-center justify-center overflow-hidden"><span id="player-icon" class="text-7xl">📻</span></div>
                <h4 id="player-title" class="font-black text-[#594a42] text-3xl truncate w-full px-4">Ready to Focus</h4>
                <p id="player-subtitle" class="text-lg font-bold text-[#8e8070] mt-1 mb-8 truncate w-full">Select a track from Music</p>
                <div class="flex items-center justify-center gap-4 mb-8">
                  <button id="btn-play-pause" class="p-5 bg-[#5bc0eb] hover:bg-[#4aa0c7] text-white rounded-3xl transition-all shadow-md active:scale-90 opacity-50 cursor-not-allowed">
                    <svg id="icon-play" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </button>
                </div>
                <div class="w-full max-w-[250px] flex items-center gap-3">
                  <span class="text-sm text-[#8e8070]">🔉</span>
                  <input id="music-volume" type="range" class="w-full custom-slider" style="--thumb-color: #8e8070; height: 6px;" value="50">
                  <span class="text-sm text-[#8e8070]">🔊</span>
                </div>
              </div>
            </div>
            <div id="up-next-container" class="w-full lg:w-2/5 flex flex-col h-full transition-all duration-500">
              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col h-full">
                <h3 class="font-black text-[#594a42] text-lg uppercase tracking-wider border-b-2 border-white/50 pb-3 mb-4">Up Next</h3>
                <div id="up-next-list" class="flex flex-col gap-3 overflow-y-auto hide-scrollbar flex-1"></div>
              </div>
            </div>
          </div>

          <div id="tab-music" class="tab-content hidden h-full overflow-y-auto hide-scrollbar pr-2">
            <h2 class="text-3xl font-black text-[#594a42] mb-6">Your Music</h2>
            <div id="music-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"></div>
          </div>

          <div id="tab-ambient" class="tab-content hidden h-full overflow-y-auto hide-scrollbar pr-2">
            <h2 class="text-3xl font-black text-[#594a42] mb-6">Ambient Mixer</h2>
            <div id="ambient-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"></div>
          </div>

          <div id="tab-settings" class="tab-content hidden flex flex-col lg:flex-row gap-6 h-full overflow-hidden pb-2">
            <div class="w-full lg:w-[65%] bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col gap-4 overflow-y-auto hide-scrollbar">
              <div class="border-b-2 border-white/50 pb-2">
                <h3 class="font-black text-[#594a42] text-xl flex items-center gap-2"><span class="text-red-500">▶️</span> Import Media</h3>
                <p class="text-xs font-bold text-[#8e8070] mt-1">Add YouTube streams to your library. 0MB downloaded.</p>
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
    </div>
  `;
};