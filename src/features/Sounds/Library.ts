// src/features/Sounds/Library.ts

import { invoke } from '@tauri-apps/api/core';
import Hls from 'hls.js';
import { MediaItem, defaultAmbient } from './Types';
import { soundState, playStream } from './AudioEngine';
import { TauriHlsLoader } from './TauriHlsLoader';

export const renderLibrary = async () => {
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
        <input type="range" class="w-full custom-slider" style="--thumb-color: ${a.color}; height: 6px;" value="${soundState.activeAmbientStreams[a.id]?.volume ? soundState.activeAmbientStreams[a.id].volume * 100 : 0}">
      `;
      div.querySelector('input')?.addEventListener('input', (e) => {
        const vol = Number((e.target as HTMLInputElement).value) / 100;
        if (!soundState.activeAmbientStreams[a.id]) {
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
           soundState.activeAmbientStreams[a.id] = audio;
        }
        soundState.activeAmbientStreams[a.id].volume = vol;
        soundState.activeAmbientStreams[a.id].muted = false;
        if (vol > 0 && soundState.activeAmbientStreams[a.id].paused) soundState.activeAmbientStreams[a.id].play().catch(console.error);
        else if (vol === 0 && !soundState.activeAmbientStreams[a.id].paused) soundState.activeAmbientStreams[a.id].pause();
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
        <input type="range" class="w-full custom-slider" style="--thumb-color: #9b5de5; height: 6px;" value="${soundState.activeAmbientStreams[f.id]?.volume ? soundState.activeAmbientStreams[f.id].volume * 100 : 0}">
      `;
      div.querySelector('input')?.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        const vol = Number(target.value) / 100;
        
        if (!soundState.activeAmbientStreams[f.id]) {
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
                  soundState.activeAmbientHls[f.id] = hls;
              } else {
                  mediaEl.src = streamUrl;
              }
              
              soundState.activeAmbientStreams[f.id] = mediaEl;
           } catch (err) {
              console.error(err);
              alert("Failed to fetch ambient stream.");
              target.value = "0"; target.disabled = false; return;
           }
           target.disabled = false;
        }

        soundState.activeAmbientStreams[f.id].volume = vol;
        soundState.activeAmbientStreams[f.id].muted = false;
        if (vol > 0 && soundState.activeAmbientStreams[f.id].paused) soundState.activeAmbientStreams[f.id].play().catch(console.error);
        else if (vol === 0 && !soundState.activeAmbientStreams[f.id].paused) soundState.activeAmbientStreams[f.id].pause();
      });
      ambientGrid.appendChild(div);
    });
  }
};

export const setupImportLogic = () => {
  const urlInput = document.getElementById('import-url') as HTMLInputElement;
  const typeSelect = document.getElementById('import-type') as HTMLSelectElement;
  const nameInput = document.getElementById('import-name') as HTMLInputElement;

  document.getElementById('btn-add-library')?.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return alert("Please enter a YouTube URL.");
    const item: MediaItem = { id: url, url: url, name: nameInput.value.trim() || 'Saved Stream', category: typeSelect.value };
    try { 
      await invoke('add_to_library', { item }); 
      urlInput.value = ''; nameInput.value = ''; 
      alert("Added to library!"); 
      renderLibrary(); 
    } catch (err) { console.error(err); }
  });
};