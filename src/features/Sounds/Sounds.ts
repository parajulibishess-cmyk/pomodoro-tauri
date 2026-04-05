// src/features/Sounds/Sounds.ts
import { invoke } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';
import Hls from 'hls.js';

let currentLiveAudio: HTMLMediaElement | null = null;
let hlsInstance: Hls | null = null;

let activeAmbientStreams: Record<string, HTMLMediaElement> = {};
let activeAmbientHls: Record<string, Hls> = {};

interface MediaItem { id: string; name: string; url: string; category: string; }

const defaultAmbient = [
  { id: 'rain', name: 'Rain', icon: '🌧️', color: '#5bc0eb', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Rain_on_roof_and_thunder.ogg' },
  { id: 'fire', name: 'Fireplace', icon: '🔥', color: '#f1a25e', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Crackling_fire.ogg' },
  { id: 'cafe', name: 'Cafe', icon: '☕', color: '#fdcb58', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Restaurant_ambience.ogg' },
  { id: 'forest', name: 'Forest', icon: '🌲', color: '#78b159', url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Wind_in_the_trees.ogg' }
];

class TauriHlsLoader {
  context: any;
  config: any;
  callbacks: any;
  stats: any; 

  constructor(config: any) {
    this.config = config;
    this.stats = this.getDefaultStats();
  }
  
  getDefaultStats() {
    return {
      aborted: false, loaded: 0, total: 0, retry: 0, chunkCount: 0, bwEstimate: 0,
      loading: { start: 0, first: 0, end: 0 },
      parsing: { start: 0, end: 0 },
      buffering: { start: 0, first: 0, end: 0 }
    };
  }

  async load(context: any, _config: any, callbacks: any) {
    this.context = context;
    this.callbacks = callbacks;
    this.stats = { ...this.getDefaultStats(), ...(context.stats || {}) };
    
    if (!this.stats.loading) this.stats.loading = { start: 0, first: 0, end: 0 };
    if (!this.stats.parsing) this.stats.parsing = { start: 0, end: 0 };
    if (!this.stats.buffering) this.stats.buffering = { start: 0, first: 0, end: 0 };
    
    this.stats.loading.start = performance.now();
    context.stats = this.stats;

    try {
      const response = await fetch(context.url, { method: 'GET' });
      this.stats.loading.first = Math.max(performance.now(), this.stats.loading.start);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      let data: string | ArrayBuffer;
      
      // FIX 1: Strictly rely on HLS.js requested responseType to prevent binary corruption
      if (context.responseType === 'arraybuffer') {
        data = await response.arrayBuffer();
      } else {
        data = await response.text();
      }
      
      this.stats.loading.end = Math.max(performance.now(), this.stats.loading.first);
      const dataSize = typeof data === 'string' ? data.length : data.byteLength;
      this.stats.loaded = dataSize;
      this.stats.total = dataSize;
      
      callbacks.onSuccess({ url: context.url, data: data }, this.stats, context);
    } catch (e: any) {
      console.error("TauriHlsLoader Error:", e);
      callbacks.onError({ code: e.status || 500, text: e.message }, context, null);
    }
  }
  
  abort() { if (this.stats) this.stats.aborted = true; }
  destroy() {}
}

export function initSoundsUI() {
  const soundsBtn = document.getElementById('top-sounds-btn');
  const modalRoot = document.getElementById('sounds-modal-root');
  if (!soundsBtn || !modalRoot) return;
  soundsBtn.addEventListener('click', () => renderSoundsModal(modalRoot));
}

function renderSoundsModal(root: HTMLElement) {
  root.innerHTML = `
    <div id="sounds-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-[#594a42]/30 backdrop-blur-sm transition-opacity p-4 opacity-0">
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

  const overlay = document.getElementById('sounds-overlay');
  const inner = document.getElementById('sounds-inner');
  if (overlay && inner) {
    void overlay.offsetWidth;
    overlay.classList.remove('opacity-0');
    inner.classList.remove('scale-95');
    inner.classList.add('scale-100');
  }

  const switchTab = (targetId: string) => {
    root.querySelectorAll('.nav-btn').forEach(b => {
      const isActive = b.getAttribute('data-target') === targetId;
      b.className = `nav-btn flex-shrink-0 w-full text-left px-5 py-3 rounded-xl text-lg font-black transition-all border-2 ${isActive ? 'active bg-white shadow-sm border-white/80 text-[#594a42]' : 'text-[#8e8070] hover:bg-white/50 border-transparent'}`;
    });
    root.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(targetId)?.classList.remove('hidden');
  };
  root.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', (e) => switchTab((e.currentTarget as HTMLElement).getAttribute('data-target')!)));

  const playPauseBtn = document.getElementById('btn-play-pause');
  const statusBadge = document.getElementById('status-badge');
  const svgPlay = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  const svgPause = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

  const setPlayIcon = (isPlaying: boolean) => { if (playPauseBtn) playPauseBtn.innerHTML = isPlaying ? svgPause : svgPlay; };
  const updateStatus = (text: string | null, isLive: boolean = false) => {
    if (!statusBadge) return;
    if (text) {
      statusBadge.classList.remove('hidden');
      statusBadge.innerText = text;
      statusBadge.className = `absolute top-6 left-6 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md ${isLive ? 'bg-red-500 animate-pulse' : 'bg-[#5bc0eb]'}`;
    } else {
      statusBadge.classList.add('hidden');
    }
  };

  const toggleLiveUI = (isLive: boolean) => {
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

  const playStream = async (ytUrl: string, name: string) => {
    switchTab('tab-player');
    document.getElementById('player-title')!.innerText = name;
    document.getElementById('player-subtitle')!.innerText = 'Fetching stream...';
    updateStatus('Loading...', false);
    
    if (playPauseBtn) { playPauseBtn.classList.add('opacity-50', 'cursor-not-allowed'); setPlayIcon(false); }

    try {
      const streamUrl = await invoke<string>('get_youtube_stream_url', { url: ytUrl });
      const isHls = streamUrl.includes('.m3u8');
      
      toggleLiveUI(isHls);
      updateStatus(isHls ? 'Live' : null, isHls);
      document.getElementById('player-subtitle')!.innerText = isHls ? 'YouTube Live Stream' : 'YouTube Audio Stream';

      if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
      if (currentLiveAudio) { currentLiveAudio.pause(); currentLiveAudio.removeAttribute('src'); }
      
      // FIX 2: Create a hidden <video> element, but DO NOT use display: none
      let mediaEl = document.getElementById('core-media-player') as HTMLVideoElement;
      if (!mediaEl) {
        mediaEl = document.createElement('video'); 
        mediaEl.id = 'core-media-player';
        mediaEl.style.position = 'absolute';
        mediaEl.style.width = '1px';
        mediaEl.style.height = '1px';
        mediaEl.style.opacity = '0';
        mediaEl.style.pointerEvents = 'none';
        mediaEl.playsInline = true;
        document.body.appendChild(mediaEl);
      }
      currentLiveAudio = mediaEl;
      
      // Ensure it starts unmuted
      currentLiveAudio.muted = false;
      const volSlider = document.getElementById('music-volume') as HTMLInputElement;
      currentLiveAudio.volume = volSlider ? Number(volSlider.value) / 100 : 0.5;

      if (isHls && Hls.isSupported()) {
        hlsInstance = new Hls({ loader: TauriHlsLoader });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(currentLiveAudio);
        
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          currentLiveAudio?.play().catch((err) => {
            console.warn("Autoplay blocked by browser.", err);
            updateStatus('Paused (Click Play)', isHls);
            setPlayIcon(false);
          });
        });
      } else {
        currentLiveAudio.src = streamUrl;
        currentLiveAudio.play().catch((err) => {
           console.warn("Autoplay blocked by browser.", err);
           updateStatus('Paused (Click Play)', isHls);
           setPlayIcon(false);
        });
      }

      currentLiveAudio.onplay = () => { setPlayIcon(true); if (isHls) updateStatus('Live', true); };
      currentLiveAudio.onpause = () => setPlayIcon(false);
      
      if (playPauseBtn) playPauseBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    } catch (e) {
      console.error(e);
      document.getElementById('player-subtitle')!.innerText = 'Error loading stream.';
      updateStatus('Error', true);
    }
  };

  const renderLibrary = async () => {
    const library: MediaItem[] = await invoke('get_library');
    
    const listEl = document.getElementById('storage-list');
    if (listEl) {
      listEl.innerHTML = library.length === 0 ? `<p class="text-xs text-center text-[#8e8070] mt-4">Library is empty.</p>` : '';
      library.forEach(f => {
        const div = document.createElement('div');
        div.className = "bg-white/80 p-2.5 rounded-xl border border-white flex justify-between items-center shadow-sm";
        div.innerHTML = `
           <div class="truncate mr-2">
             <p class="text-xs font-bold text-[#594a42] truncate" title="${f.name}">${f.name}</p>
             <p class="text-[10px] font-bold text-[#8e8070]">${f.category.toUpperCase()}</p>
           </div>
           <button class="text-[#ff6b6b] hover:text-[#ff5252] font-bold px-2 py-1 transition-transform hover:scale-110 active:scale-90" title="Remove">✕</button>
        `;
        div.querySelector('button')?.addEventListener('click', async () => {
          await invoke('remove_from_library', { id: f.id });
          renderLibrary(); 
        });
        listEl.appendChild(div);
      });
    }

    const musicGrid = document.getElementById('music-grid');
    const upNextList = document.getElementById('up-next-list');
    const musicFiles = library.filter(f => f.category === 'music');
    
    if (musicGrid) musicGrid.innerHTML = '';
    if (upNextList) upNextList.innerHTML = '';

    musicFiles.forEach(f => {
      const card = document.createElement('div');
      card.className = "cursor-pointer bg-white/60 p-6 rounded-3xl border-2 border-white/50 shadow-sm flex flex-col gap-5 hover:bg-white/90 hover:scale-[1.02] active:scale-95 transition-all";
      card.innerHTML = `<div class="w-full aspect-square bg-[#5bc0eb]/20 rounded-2xl flex items-center justify-center text-5xl shadow-inner border border-white">🎧</div><div><h4 class="font-black text-[#594a42] text-xl truncate">${f.name}</h4></div>`;
      card.addEventListener('click', () => playStream(f.url, f.name));
      musicGrid?.appendChild(card);

      const unCard = document.createElement('div');
      unCard.className = "bg-white/80 p-3 rounded-xl border-2 border-white flex items-center gap-4 cursor-pointer shadow-sm hover:bg-white transition-all";
      unCard.innerHTML = `<div class="w-8 h-8 bg-[#5bc0eb]/20 rounded-lg flex items-center justify-center text-sm">🎧</div><div class="flex-1 truncate"><div class="text-sm font-bold text-[#594a42] truncate">${f.name}</div></div>`;
      unCard.addEventListener('click', () => card.click());
      upNextList?.appendChild(unCard);
    });

    if (musicFiles.length === 0 && musicGrid && upNextList) {
      musicGrid.innerHTML = `<p class="text-[#8e8070] font-bold">No music saved yet. Head to Settings!</p>`;
      upNextList.innerHTML = `<p class="text-xs text-[#8e8070] font-bold text-center mt-4">Queue is empty</p>`;
    }

    const ambientGrid = document.getElementById('ambient-grid');
    const ambientFiles = library.filter(f => f.category === 'ambient');
    
    if (ambientGrid) {
      ambientGrid.innerHTML = '';
      
      defaultAmbient.forEach(a => {
        const div = document.createElement('div');
        div.className = "bg-white/60 p-6 rounded-3xl border-2 border-white/50 shadow-sm flex flex-col gap-5 hover:bg-white/80 transition-all";
        div.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="bg-[${a.color}]/20 text-[${a.color}] w-16 h-16 flex items-center justify-center rounded-2xl text-2xl shadow-inner border border-white">${a.icon}</div>
            <div class="flex-1"><span class="block font-black text-[#594a42] text-lg">${a.name}</span></div>
          </div>
          <input type="range" class="w-full custom-slider" style="--thumb-color: ${a.color}; height: 6px;" value="${activeAmbientStreams[a.id]?.volume ? activeAmbientStreams[a.id].volume * 100 : 0}">
        `;
        div.querySelector('input')?.addEventListener('input', (e) => {
          const vol = Number((e.target as HTMLInputElement).value) / 100;
          if (!activeAmbientStreams[a.id]) {
             // FIX 2: Same display technique for ambient streams
             const audio = document.createElement('video');
             audio.style.position = 'absolute';
             audio.style.width = '1px';
             audio.style.height = '1px';
             audio.style.opacity = '0';
             audio.style.pointerEvents = 'none';
             audio.playsInline = true;
             audio.src = a.url;
             audio.loop = true;
             document.body.appendChild(audio);
             activeAmbientStreams[a.id] = audio;
          }
          activeAmbientStreams[a.id].volume = vol;
          activeAmbientStreams[a.id].muted = false;
          if (vol > 0 && activeAmbientStreams[a.id].paused) activeAmbientStreams[a.id].play().catch(console.error);
          else if (vol === 0 && !activeAmbientStreams[a.id].paused) activeAmbientStreams[a.id].pause();
        });
        ambientGrid.appendChild(div);
      });

      ambientFiles.forEach(f => {
        const div = document.createElement('div');
        div.className = "bg-white/60 p-6 rounded-3xl border-2 border-white/50 shadow-sm flex flex-col gap-5 hover:bg-white/80 transition-all";
        div.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="bg-[#9b5de5]/20 text-[#9b5de5] w-16 h-16 flex items-center justify-center rounded-2xl text-2xl shadow-inner border border-white">🎶</div>
            <div class="flex-1 truncate"><span class="block font-black text-[#594a42] text-lg truncate">${f.name}</span><span class="text-[10px] font-bold text-[#8e8070]">(Stream)</span></div>
          </div>
          <input type="range" class="w-full custom-slider" style="--thumb-color: #9b5de5; height: 6px;" value="${activeAmbientStreams[f.id]?.volume ? activeAmbientStreams[f.id].volume * 100 : 0}">
        `;
        div.querySelector('input')?.addEventListener('change', async (e) => {
          const target = e.target as HTMLInputElement;
          const vol = Number(target.value) / 100;
          
          if (!activeAmbientStreams[f.id]) {
             target.disabled = true; 
             try {
                const streamUrl = await invoke<string>('get_youtube_stream_url', { url: f.url });
                const mediaEl = document.createElement('video');
                mediaEl.style.position = 'absolute';
                mediaEl.style.width = '1px';
                mediaEl.style.height = '1px';
                mediaEl.style.opacity = '0';
                mediaEl.style.pointerEvents = 'none';
                mediaEl.playsInline = true;
                mediaEl.loop = true;
                document.body.appendChild(mediaEl);
                
                if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
                    const hls = new Hls({ loader: TauriHlsLoader });
                    hls.loadSource(streamUrl); 
                    hls.attachMedia(mediaEl);
                    activeAmbientHls[f.id] = hls;
                } else {
                    mediaEl.src = streamUrl;
                }
                
                activeAmbientStreams[f.id] = mediaEl;
             } catch (err) {
                console.error(err); alert("Failed to fetch ambient stream.");
                target.value = "0"; target.disabled = false; return;
             }
             target.disabled = false;
          }

          activeAmbientStreams[f.id].volume = vol;
          activeAmbientStreams[f.id].muted = false;
          if (vol > 0 && activeAmbientStreams[f.id].paused) activeAmbientStreams[f.id].play().catch(console.error);
          else if (vol === 0 && !activeAmbientStreams[f.id].paused) activeAmbientStreams[f.id].pause();
        });
        ambientGrid.appendChild(div);
      });
    }
  };

  renderLibrary();

  const urlInput = document.getElementById('import-url') as HTMLInputElement;
  const typeSelect = document.getElementById('import-type') as HTMLSelectElement;
  const nameInput = document.getElementById('import-name') as HTMLInputElement;

  document.getElementById('btn-add-library')?.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return alert("Please enter a YouTube URL.");
    const item: MediaItem = { id: url, url: url, name: nameInput.value.trim() || 'Saved Stream', category: typeSelect.value };
    try { await invoke('add_to_library', { item }); urlInput.value = ''; nameInput.value = ''; alert("Added to library!"); renderLibrary(); } catch (err) { console.error(err); }
  });

  playPauseBtn?.addEventListener('click', () => {
    if (currentLiveAudio) {
      if (currentLiveAudio.paused) currentLiveAudio.play().catch(console.error);
      else currentLiveAudio.pause();
    }
  });

  document.getElementById('music-volume')?.addEventListener('input', (e) => {
     if (currentLiveAudio) currentLiveAudio.volume = Number((e.target as HTMLInputElement).value) / 100;
  });

  document.getElementById('btn-clear-cache')?.addEventListener('click', async () => {
    if(confirm("Delete all saved library items?")) {
      await invoke('clear_library');
      Object.values(activeAmbientStreams).forEach(a => { a.pause(); a.remove(); });
      Object.values(activeAmbientHls).forEach(h => h.destroy());
      activeAmbientStreams = {};
      activeAmbientHls = {};
      if (currentLiveAudio) { currentLiveAudio.pause(); currentLiveAudio.remove(); currentLiveAudio = null; }
      if (hlsInstance) hlsInstance.destroy();
      renderLibrary();
    }
  });

  const closeModal = () => {
    if (overlay && inner) {
      overlay.classList.add('opacity-0');
      inner.classList.remove('scale-100');
      inner.classList.add('scale-95');
      setTimeout(() => { root.innerHTML = ''; }, 300);
    }
  };

  document.getElementById('close-sounds-btn')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}