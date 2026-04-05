// src/features/Sounds/AudioEngine.ts

import { invoke } from '@tauri-apps/api/core';
import Hls from 'hls.js';
import { TauriHlsLoader } from './TauriHlsLoader';
import { updateStatus, setPlayIcon, toggleLiveUI, switchTab } from './SoundsUI';
import { MediaItem } from './Types';

export const soundState = {
  currentLiveAudio: null as HTMLVideoElement | null,
  hlsInstance: null as Hls | null,
  activeAmbientStreams: {} as Record<string, HTMLMediaElement>,
  activeAmbientHls: {} as Record<string, Hls>,
  queue: [] as MediaItem[],
  currentIndex: -1,
  isRepeat: false,
  isLiveStream: false,
  pomodoroSyncActive: false
};

// Properly formats videos over an hour long
const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const sStr = s < 10 ? `0${s}` : s.toString();
  if (h > 0) {
    const mStr = m < 10 ? `0${m}` : m.toString();
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
};

window.addEventListener('pomodoro-timer-complete', () => {
  if (soundState.pomodoroSyncActive && soundState.currentLiveAudio && !soundState.currentLiveAudio.paused) {
    soundState.currentLiveAudio.pause();
  }
});

export const togglePomodoroSync = () => {
  soundState.pomodoroSyncActive = !soundState.pomodoroSyncActive;
  const btn = document.getElementById('btn-pomodoro-sync');
  if (btn) {
    btn.style.color = soundState.pomodoroSyncActive ? '#5bc0eb' : '#8e8070';
    btn.style.backgroundColor = soundState.pomodoroSyncActive ? 'rgba(91, 192, 235, 0.1)' : 'transparent';
    btn.style.borderRadius = '8px';
  }
};

export const playStream = async (item: MediaItem) => {
  switchTab(document.getElementById('sounds-modal-root')!, 'tab-player');
  
  const titleEl = document.getElementById('player-title');
  const artistEl = document.getElementById('player-artist');
  const timeCurrentEl = document.getElementById('player-time-current');
  const timeRemainEl = document.getElementById('player-time-remain');
  
  const thumbEl = document.getElementById('player-thumbnail') as HTMLImageElement;
  const iconEl = document.getElementById('player-icon');
  const iconContainer = document.getElementById('player-icon-container');
  const glowEl = document.getElementById('player-bg-glow');
  const sliderEl = document.getElementById('playback-slider') as HTMLInputElement;
  const playPauseBtn = document.getElementById('btn-play-pause');

  const activeColor = item.color || '#5bc0eb';
  const activeTitleColor = item.titleColor || '#594a42';

  if (titleEl) {
    titleEl.innerText = item.name;
    titleEl.style.color = activeTitleColor;
  }
  if (artistEl) artistEl.innerText = item.artist || 'YouTube Stream';
  
  if (timeCurrentEl) timeCurrentEl.innerText = '0:00';
  if (timeRemainEl) timeRemainEl.innerText = '- 0:00';
  
  if (sliderEl) sliderEl.style.setProperty('--thumb-color', activeColor);
  if (playPauseBtn) playPauseBtn.style.backgroundColor = activeColor;
  if (glowEl) glowEl.style.backgroundColor = activeColor;

  // Toggle Art Box between Rectangle and Square
  const setRectangleMode = () => {
    iconContainer?.classList.remove('aspect-square', 'max-w-[360px]', 'rounded-[32px]');
    iconContainer?.classList.add('aspect-video', 'max-w-[480px]', 'rounded-[24px]');
  };
  
  const setSquareMode = () => {
    iconContainer?.classList.remove('aspect-video', 'max-w-[480px]', 'rounded-[24px]');
    iconContainer?.classList.add('aspect-square', 'max-w-[360px]', 'rounded-[32px]');
  };

  if (item.thumbnail && thumbEl && iconEl && iconContainer) {
    thumbEl.src = item.thumbnail;
    thumbEl.classList.remove('hidden');
    iconEl.classList.add('hidden');
    iconContainer.style.backgroundColor = `${activeColor}33`; 
    
    setRectangleMode();

    thumbEl.onerror = () => {
      thumbEl.classList.add('hidden');
      iconEl.classList.remove('hidden');
      iconEl.innerText = item.icon || '🎧';
      iconEl.style.color = activeColor;
      setSquareMode();
    };
  } else if (thumbEl && iconEl && iconContainer) {
    thumbEl.classList.add('hidden');
    iconEl.classList.remove('hidden');
    iconContainer.style.backgroundColor = `${activeColor}33`;
    iconEl.innerText = item.icon || '🎧';
    iconEl.style.color = activeColor;
    setSquareMode();
  }

  updateStatus('Loading...', false);
  if (playPauseBtn) { 
    playPauseBtn.classList.add('opacity-50', 'cursor-not-allowed'); 
    setPlayIcon(false); 
  }

  document.getElementById('btn-pomodoro-sync')?.addEventListener('click', togglePomodoroSync);

  try {
    const streamUrl = await invoke<string>('get_youtube_stream_url', { url: item.url });
    const isHls = streamUrl.includes('.m3u8');
    soundState.isLiveStream = isHls;
    
    const repeatBtn = document.getElementById('btn-repeat');
    if (repeatBtn) {
      if (isHls) repeatBtn.classList.add('hidden');
      else repeatBtn.classList.remove('hidden');
    }

    toggleLiveUI(isHls, soundState.queue.length > 1);
    updateStatus(isHls ? 'Live' : null, isHls);

    if (soundState.hlsInstance) { soundState.hlsInstance.destroy(); soundState.hlsInstance = null; }
    if (soundState.currentLiveAudio) { soundState.currentLiveAudio.pause(); soundState.currentLiveAudio.removeAttribute('src'); }
    
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
    soundState.currentLiveAudio = mediaEl;
    soundState.currentLiveAudio.muted = false;
    
    const volSlider = document.getElementById('music-volume') as HTMLInputElement;
    soundState.currentLiveAudio.volume = volSlider ? Number(volSlider.value) / 100 : 0.5;

    soundState.currentLiveAudio.ontimeupdate = () => {
      if (!soundState.currentLiveAudio) return;
      const curr = soundState.currentLiveAudio.currentTime;
      const dur = soundState.currentLiveAudio.duration;
      
      if (soundState.isLiveStream || dur === Infinity) {
        if (timeCurrentEl) timeCurrentEl.innerText = `Live`;
        if (timeRemainEl) timeRemainEl.innerText = `Stream`;
        if (sliderEl) { sliderEl.value = "100"; sliderEl.disabled = true; }
      } else {
        if (timeCurrentEl) timeCurrentEl.innerText = formatTime(curr);
        if (timeRemainEl) timeRemainEl.innerText = `- ${formatTime(dur - curr)}`;
        if (sliderEl && !sliderEl.disabled && dur > 0) {
          sliderEl.value = ((curr / dur) * 100).toString();
        }
      }
    };

    soundState.currentLiveAudio.onended = () => {
      if (soundState.isRepeat) soundState.currentLiveAudio?.play();
      else playNext();
    };

    if (sliderEl) {
      sliderEl.disabled = isHls;
      sliderEl.oninput = (e) => {
        const val = Number((e.target as HTMLInputElement).value);
        if (soundState.currentLiveAudio && soundState.currentLiveAudio.duration > 0) {
          soundState.currentLiveAudio.currentTime = (val / 100) * soundState.currentLiveAudio.duration;
        }
      };
    }

    if (isHls && Hls.isSupported()) {
      soundState.hlsInstance = new Hls({ loader: TauriHlsLoader });
      soundState.hlsInstance.loadSource(streamUrl);
      soundState.hlsInstance.attachMedia(soundState.currentLiveAudio);
      
      soundState.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        soundState.currentLiveAudio?.play().catch(() => {
          updateStatus('Paused', isHls);
          setPlayIcon(false);
        });
      });
    } else {
      soundState.currentLiveAudio.src = streamUrl;
      soundState.currentLiveAudio.play().catch(() => {
         updateStatus('Paused', isHls);
         setPlayIcon(false);
      });
    }

    soundState.currentLiveAudio.onplay = () => { 
      setPlayIcon(true); 
      if (isHls) updateStatus('Live', true); 
    };
    soundState.currentLiveAudio.onpause = () => {
      setPlayIcon(false);
    };
    
    if (playPauseBtn) playPauseBtn.classList.remove('opacity-50', 'cursor-not-allowed');

  } catch (e) {
    if (timeRemainEl) timeRemainEl.innerText = 'Error loading';
    updateStatus('Error', true);
  }
};

export const togglePlayPause = () => {
  if (soundState.currentLiveAudio) {
    if (soundState.currentLiveAudio.paused) soundState.currentLiveAudio.play().catch(console.error);
    else soundState.currentLiveAudio.pause();
  }
};

export const setMainVolume = (vol: number) => {
  if (soundState.currentLiveAudio) soundState.currentLiveAudio.volume = vol;
};

export const addToQueue = (item: MediaItem) => {
  soundState.queue.push(item);
  renderQueue();
  toggleLiveUI(soundState.isLiveStream, soundState.queue.length > 1);
};

export const playNext = () => {
  if (soundState.queue.length > 0 && soundState.currentIndex + 1 < soundState.queue.length) {
    soundState.currentIndex++;
    playStream(soundState.queue[soundState.currentIndex]);
  }
};

export const playPrev = () => {
  if (soundState.currentIndex > 0) {
    soundState.currentIndex--;
    playStream(soundState.queue[soundState.currentIndex]);
  } else if (soundState.currentLiveAudio) {
    soundState.currentLiveAudio.currentTime = 0; 
  }
};

export const toggleRepeat = () => {
  soundState.isRepeat = !soundState.isRepeat;
  const btn = document.getElementById('btn-repeat');
  const activeColor = soundState.currentIndex >= 0 ? (soundState.queue[soundState.currentIndex]?.color || '#5bc0eb') : '#5bc0eb';
  if (btn) btn.style.color = soundState.isRepeat ? activeColor : '#8e8070';
};

const renderQueue = () => {
  const list = document.getElementById('up-next-list');
  if (!list) return;
  list.innerHTML = '';
  
  if (soundState.queue.length <= 1) {
    toggleLiveUI(soundState.isLiveStream, false);
    return;
  }

  soundState.queue.forEach((f, idx) => {
    const unCard = document.createElement('div');
    const isActive = idx === soundState.currentIndex;
    const activeColor = f.color || '#5bc0eb';
    
    unCard.className = `bg-white/80 p-3 rounded-xl border-2 flex items-center gap-4 cursor-pointer shadow-sm hover:bg-white transition-all ${isActive ? 'border-gray-800' : 'border-white'}`;
    unCard.style.borderColor = isActive ? activeColor : 'transparent';
    
    unCard.innerHTML = `<div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style="background-color: ${activeColor}33; color: ${activeColor};">${f.icon || '🎧'}</div><div class="flex-1 truncate"><div class="text-sm font-bold text-[#594a42] truncate">${f.name}</div></div>`;
    
    unCard.addEventListener('click', () => {
      soundState.currentIndex = idx;
      playStream(f);
    });
    list.appendChild(unCard);
  });
};

export const clearAllAudio = async () => {
  await invoke('clear_library');
  const keys = Object.keys(localStorage);
  keys.forEach(k => { if(k.startsWith('meta_')) localStorage.removeItem(k); });
  Object.values(soundState.activeAmbientStreams).forEach(a => { a.pause(); a.remove(); });
  Object.values(soundState.activeAmbientHls).forEach(h => h.destroy());
  soundState.activeAmbientStreams = {};
  soundState.activeAmbientHls = {};
  if (soundState.currentLiveAudio) { soundState.currentLiveAudio.pause(); soundState.currentLiveAudio.remove(); soundState.currentLiveAudio = null; }
  if (soundState.hlsInstance) soundState.hlsInstance.destroy();
  soundState.queue = [];
  soundState.currentIndex = -1;
  renderQueue();
  toggleLiveUI(soundState.isLiveStream, false);
};