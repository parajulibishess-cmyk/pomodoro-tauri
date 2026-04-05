// src/features/Sounds/AudioEngine.ts

import { invoke } from '@tauri-apps/api/core';
import Hls from 'hls.js';
import { TauriHlsLoader } from './TauriHlsLoader';
import { updateStatus, setPlayIcon, toggleLiveUI, switchTab } from './SoundsUI';

export const soundState = {
  currentLiveAudio: null as HTMLMediaElement | null,
  hlsInstance: null as Hls | null,
  activeAmbientStreams: {} as Record<string, HTMLMediaElement>,
  activeAmbientHls: {} as Record<string, Hls>
};

export const playStream = async (ytUrl: string, name: string) => {
  switchTab(document.getElementById('sounds-modal-root')!, 'tab-player');
  document.getElementById('player-title')!.innerText = name;
  document.getElementById('player-subtitle')!.innerText = 'Fetching stream...';
  updateStatus('Loading...', false);
  
  const playPauseBtn = document.getElementById('btn-play-pause');
  if (playPauseBtn) { playPauseBtn.classList.add('opacity-50', 'cursor-not-allowed'); setPlayIcon(false); }

  try {
    const streamUrl = await invoke<string>('get_youtube_stream_url', { url: ytUrl });
    const isHls = streamUrl.includes('.m3u8');
    
    toggleLiveUI(isHls);
    updateStatus(isHls ? 'Live' : null, isHls);
    document.getElementById('player-subtitle')!.innerText = isHls ? 'YouTube Live Stream' : 'YouTube Audio Stream';

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

    if (isHls && Hls.isSupported()) {
      soundState.hlsInstance = new Hls({ loader: TauriHlsLoader });
      soundState.hlsInstance.loadSource(streamUrl);
      soundState.hlsInstance.attachMedia(soundState.currentLiveAudio);
      
      soundState.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        soundState.currentLiveAudio?.play().catch((err) => {
          console.warn("Autoplay blocked by browser.", err);
          updateStatus('Paused (Click Play)', isHls);
          setPlayIcon(false);
        });
      });
    } else {
      soundState.currentLiveAudio.src = streamUrl;
      soundState.currentLiveAudio.play().catch((err) => {
         console.warn("Autoplay blocked by browser.", err);
         updateStatus('Paused (Click Play)', isHls);
         setPlayIcon(false);
      });
    }

    soundState.currentLiveAudio.onplay = () => { setPlayIcon(true); if (isHls) updateStatus('Live', true); };
    soundState.currentLiveAudio.onpause = () => setPlayIcon(false);
    
    if (playPauseBtn) playPauseBtn.classList.remove('opacity-50', 'cursor-not-allowed');

  } catch (e) {
    console.error(e);
    document.getElementById('player-subtitle')!.innerText = 'Error loading stream.';
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

export const clearAllAudio = async () => {
  await invoke('clear_library');
  Object.values(soundState.activeAmbientStreams).forEach(a => { a.pause(); a.remove(); });
  Object.values(soundState.activeAmbientHls).forEach(h => h.destroy());
  soundState.activeAmbientStreams = {};
  soundState.activeAmbientHls = {};
  if (soundState.currentLiveAudio) { soundState.currentLiveAudio.pause(); soundState.currentLiveAudio.remove(); soundState.currentLiveAudio = null; }
  if (soundState.hlsInstance) soundState.hlsInstance.destroy();
};