// src/features/Sounds/Library.ts

import { invoke } from '@tauri-apps/api/core';
import Hls from 'hls.js';
import { MediaItem } from './Types';
import { soundState, playStream, addToQueue } from './AudioEngine';
import { TauriHlsLoader } from './TauriHlsLoader';

let isAltPressed = false;
let currentEditItem: MediaItem | null = null;
let editSelectedIcon = '🎶';
let editSelectedColor = '#5bc0eb';
let editSelectedTitleColor = '#594a42';

// Unified exact 19-Color Palette
const universalColors = [
  '#594a42', '#3a2d27', '#1c1714', '#5bc0eb', '#4aa0c7', 
  '#f1a25e', '#d98b47', '#fdcb58', '#e3b547', '#78b159', 
  '#619346', '#9b5de5', '#7d45c2', '#ff6b6b', '#e65555', 
  '#8e8070', '#e84855', '#ffffff', '#000000'
];

const iconSet = [
  '🎧','📻','🎙️','🎵','🎶','🎹','🎸','🎺','🥁','🌧️','⛈️','🌊','💧',
  '🔥','🏕️','☕','🍵','🌲','🌿','🍃','🐦','🦉','🌙','🌌','⚡','💻',
  '📚','🚀','🔮','🌸','✨','💭','🫧','🍔','🍕','🍣','🎮','🎲','🏆',
  '🎬','🎨','🧩','🚗','✈️'
];

const getExtendedMeta = (id: string): Partial<MediaItem> => JSON.parse(localStorage.getItem(`meta_${id}`) || '{}');
const setExtendedMeta = (id: string, meta: Partial<MediaItem>) => localStorage.setItem(`meta_${id}`, JSON.stringify(meta));
const removeExtendedMeta = (id: string) => localStorage.removeItem(`meta_${id}`);

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const fetchYouTubeArtist = async (url: string): Promise<string> => {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return data.author_name || 'YouTube Stream';
    }
  } catch (e) { console.warn("oEmbed fetch failed", e); }
  return 'YouTube Stream';
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Alt') {
    isAltPressed = true;
    document.querySelectorAll('.media-edit-btn').forEach(btn => btn.classList.remove('hidden'));
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'Alt') {
    isAltPressed = false;
    document.querySelectorAll('.media-edit-btn').forEach(btn => btn.classList.add('hidden'));
  }
});

const renderIconSelector = () => {
  const container = document.getElementById('edit-icon-selector');
  if (!container) return;
  container.innerHTML = '';
  iconSet.forEach(icon => {
    const btn = document.createElement('button');
    btn.innerText = icon;
    btn.className = `p-1 rounded-xl transition-all ${icon === editSelectedIcon ? 'bg-white shadow-md scale-110' : 'hover:bg-black/10 opacity-70 hover:opacity-100'}`;
    btn.onclick = () => { editSelectedIcon = icon; renderIconSelector(); };
    container.appendChild(btn);
  });
};

const renderColorSelector = () => {
  const container = document.getElementById('edit-color-selector');
  if (!container) return;
  container.innerHTML = '';
  universalColors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = `w-5 h-5 rounded-full transition-all border-2 ${color === editSelectedColor ? 'border-gray-800 scale-125 shadow-md' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-110'}`;
    btn.style.backgroundColor = color;
    btn.onclick = () => { editSelectedColor = color; renderColorSelector(); };
    container.appendChild(btn);
  });
};

const renderTitleColorSelector = () => {
  const container = document.getElementById('edit-title-color-selector');
  if (!container) return;
  container.innerHTML = '';
  universalColors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = `w-5 h-5 rounded-full transition-all border-2 ${color === editSelectedTitleColor ? 'border-gray-400 scale-125 shadow-md' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-110'}`;
    btn.style.backgroundColor = color;
    btn.onclick = () => { editSelectedTitleColor = color; renderTitleColorSelector(); };
    container.appendChild(btn);
  });
};

const openEditor = (item: MediaItem, e: MouseEvent) => {
  e.stopPropagation();
  currentEditItem = item;
  const modal = document.getElementById('generic-editor-modal');
  const nameInput = document.getElementById('edit-name') as HTMLInputElement;
  const thumbUrlInput = document.getElementById('edit-thumb-url') as HTMLInputElement;
  
  if (modal && nameInput && thumbUrlInput) {
    nameInput.value = item.name;
    thumbUrlInput.value = item.thumbnail || '';
    
    editSelectedIcon = item.icon || (item.category === 'ambient' ? '🌿' : '🎧');
    editSelectedColor = item.color || '#5bc0eb';
    editSelectedTitleColor = item.titleColor || '#594a42';
    
    renderIconSelector();
    renderColorSelector();
    renderTitleColorSelector();
    
    modal.style.left = `${Math.min(e.pageX, window.innerWidth - 560)}px`;
    modal.style.top = `${Math.max(20, e.pageY - 200)}px`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};

const closeEditor = () => {
  const modal = document.getElementById('generic-editor-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentEditItem = null;
  }
};

export const renderLibrary = async () => {
  let rawLibrary: MediaItem[] = await invoke('get_library');
  
  const library: MediaItem[] = rawLibrary.map(item => ({
    ...item,
    ...getExtendedMeta(item.id)
  }));
  
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
        removeExtendedMeta(f.id);
        renderLibrary(); 
      });
      listEl.appendChild(div);
    });
  }

  const musicGrid = document.getElementById('music-grid');
  const musicFiles = library.filter(f => f.category === 'music');
  
  if (musicGrid) musicGrid.innerHTML = '';
  
  musicFiles.forEach(f => {
    const card = document.createElement('div');
    card.className = "relative cursor-pointer bg-white/60 p-6 rounded-[32px] border-2 border-white/50 shadow-sm flex flex-col gap-5 hover:bg-white/90 hover:scale-[1.02] active:scale-95 transition-all group";
    
    const editBtn = document.createElement('button');
    editBtn.className = `media-edit-btn absolute top-2 left-2 bg-white w-8 h-8 flex items-center justify-center rounded-full shadow border border-[#8e8070]/20 text-xs z-10 hover:scale-110 ${isAltPressed ? '' : 'hidden'}`;
    editBtn.innerText = '✏️';
    editBtn.onclick = (e) => openEditor(f, e);

    const queueBtn = document.createElement('button');
    queueBtn.className = `absolute bottom-2 right-2 text-white px-3 py-1.5 font-bold rounded-xl shadow-md text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 active:scale-95`;
    queueBtn.innerText = '+ Queue';
    queueBtn.style.backgroundColor = f.color || '#5bc0eb';
    queueBtn.onclick = (e) => { e.stopPropagation(); addToQueue(f); };

    const thumbHtml = f.thumbnail 
      ? `<img src="${f.thumbnail}" class="w-full h-full object-cover rounded-[24px]" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="hidden w-full h-full items-center justify-center text-5xl opacity-80" style="color: ${f.color || '#5bc0eb'}">${f.icon || '🎧'}</div>`
      : `<div class="w-full h-full flex items-center justify-center text-5xl opacity-80" style="color: ${f.color || '#5bc0eb'}">${f.icon || '🎧'}</div>`;

    card.innerHTML = `<div class="w-full aspect-square rounded-[24px] shadow-inner border-[3px] border-white relative overflow-hidden flex items-center justify-center" style="background-color: ${(f.color || '#5bc0eb')}33;">${thumbHtml}</div><div><h4 class="font-black text-xl truncate transition-colors" style="color: ${f.titleColor || '#594a42'};">${f.name}</h4><p class="text-[10px] font-bold text-[#8e8070] truncate">${f.artist || 'YouTube Stream'}</p></div>`;
    
    card.appendChild(editBtn);
    card.appendChild(queueBtn);
    card.addEventListener('click', () => {
      soundState.queue = [f];
      soundState.currentIndex = 0;
      playStream(f);
    });
    musicGrid?.appendChild(card);
  });

  if (musicFiles.length === 0 && musicGrid) {
    musicGrid.innerHTML = `<p class="text-[#8e8070] font-bold">No music saved yet. Head to Settings!</p>`;
  }

  const ambientGrid = document.getElementById('ambient-grid');
  const ambientFiles = library.filter(f => f.category === 'ambient');

  if (ambientGrid) {
    ambientGrid.innerHTML = '';
    ambientFiles.forEach(f => {
      const div = document.createElement('div');
      div.className = "relative bg-white/60 p-6 rounded-[32px] border-2 border-white/50 shadow-sm flex flex-col gap-5 hover:bg-white/80 transition-all";
      
      const editBtn = document.createElement('button');
      editBtn.className = `media-edit-btn absolute -top-2 -right-2 bg-white w-8 h-8 flex items-center justify-center rounded-full shadow border border-[#8e8070]/20 text-xs z-10 hover:scale-110 ${isAltPressed ? '' : 'hidden'}`;
      editBtn.innerText = '✏️';
      editBtn.onclick = (e) => openEditor(f, e);
      div.appendChild(editBtn);

      const aColor = f.color || '#9b5de5';
      const aTitleColor = f.titleColor || '#594a42';
      const aIcon = f.icon || '🎶';

      div.insertAdjacentHTML('beforeend', `
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 flex items-center justify-center rounded-2xl text-2xl shadow-inner border border-white shrink-0" style="background-color: ${aColor}33; color: ${aColor};">${aIcon}</div>
          <div class="flex-1 min-w-0"><span class="block font-black text-lg truncate transition-colors" style="color: ${aTitleColor};">${f.name}</span><span class="text-[10px] font-bold text-[#8e8070] truncate">${f.artist || 'Stream'}</span></div>
        </div>
        <input type="range" class="w-full custom-slider" style="--thumb-color: ${aColor}; height: 6px;" value="${soundState.activeAmbientStreams[f.id]?.volume ? soundState.activeAmbientStreams[f.id].volume * 100 : 0}">
      `);
      
      div.querySelector('input')?.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        const vol = Number(target.value) / 100;
        
        if (!soundState.activeAmbientStreams[f.id]) {
           target.disabled = true;
           try {
              const streamUrl = await invoke<string>('get_youtube_stream_url', { url: f.url });
              const mediaEl = document.createElement('video');
              mediaEl.style.position = 'absolute'; mediaEl.style.opacity = '0'; mediaEl.loop = true;
              document.body.appendChild(mediaEl);
              
              if (streamUrl.includes('.m3u8') && Hls.isSupported()) {
                  const hls = new Hls({ loader: TauriHlsLoader });
                  hls.loadSource(streamUrl); hls.attachMedia(mediaEl);
                  soundState.activeAmbientHls[f.id] = hls;
              } else { mediaEl.src = streamUrl; }
              
              soundState.activeAmbientStreams[f.id] = mediaEl;
           } catch (err) {
              console.error(err); alert("Failed to fetch ambient stream.");
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
    
    const isMusic = typeSelect.value === 'music';
    const item: MediaItem = { 
      id: url, 
      url: url, 
      name: nameInput.value.trim() || 'Saved Stream', 
      category: typeSelect.value
    };
    
    const ytId = getYouTubeId(url);
    const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : undefined;
    const authorName = await fetchYouTubeArtist(url);

    const defaultMeta = {
      thumbnail: autoThumb,
      icon: isMusic ? '📻' : '🌿',
      color: isMusic ? '#5bc0eb' : '#9b5de5',
      titleColor: '#594a42',
      artist: authorName
    };

    try { 
      await invoke('add_to_library', { item }); 
      setExtendedMeta(item.id, defaultMeta);
      
      urlInput.value = ''; nameInput.value = ''; 
      renderLibrary(); 
    } catch (err) { console.error(err); }
  });

  document.getElementById('btn-auto-extract-thumb')?.addEventListener('click', () => {
     if (!currentEditItem) return;
     const ytId = getYouTubeId(currentEditItem.url);
     if (ytId) {
       const thumbInput = document.getElementById('edit-thumb-url') as HTMLInputElement;
       if (thumbInput) thumbInput.value = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
     }
  });

  document.getElementById('btn-close-editor')?.addEventListener('click', closeEditor);
  document.getElementById('btn-save-editor')?.addEventListener('click', async () => {
    if (currentEditItem) {
      const newName = (document.getElementById('edit-name') as HTMLInputElement).value;
      const finalThumb = (document.getElementById('edit-thumb-url') as HTMLInputElement).value;

      await invoke('remove_from_library', { id: currentEditItem.id });
      const updatedItem = { ...currentEditItem, name: newName };
      await invoke('add_to_library', { item: updatedItem });
      
      setExtendedMeta(updatedItem.id, {
        thumbnail: finalThumb || undefined,
        icon: editSelectedIcon,
        color: editSelectedColor,
        titleColor: editSelectedTitleColor,
        artist: currentEditItem.artist
      });
      
      closeEditor();
      renderLibrary();
    }
  });
};