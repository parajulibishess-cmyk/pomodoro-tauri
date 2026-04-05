// src/features/Sounds/Sounds.ts

import { renderSoundsModalHTML, switchTab } from './SoundsUI';
import { renderLibrary, setupImportLogic } from './Library';
import { 
  togglePlayPause, 
  setMainVolume, 
  clearAllAudio,
  playNext,
  playPrev,
  toggleRepeat
} from './AudioEngine';

export function initSoundsUI() {
  const soundsBtn = document.getElementById('top-sounds-btn');
  const modalRoot = document.getElementById('sounds-modal-root');

  if (!soundsBtn || !modalRoot) return;

  // 1. Inject the HTML into the DOM ONCE when the app starts, but keep it invisible
  renderSoundsModalHTML(modalRoot);

  // 2. Fetch library items and setup standard listeners immediately
  renderLibrary();
  setupImportLogic();

  // 3. Attach core audio controls
  document.getElementById('btn-play-pause')?.addEventListener('click', togglePlayPause);
  document.getElementById('btn-next')?.addEventListener('click', playNext);
  document.getElementById('btn-prev')?.addEventListener('click', playPrev);
  document.getElementById('btn-repeat')?.addEventListener('click', toggleRepeat);
  
  document.getElementById('music-volume')?.addEventListener('input', (e) => {
    setMainVolume(Number((e.target as HTMLInputElement).value) / 100);
  });
  
  document.getElementById('btn-clear-cache')?.addEventListener('click', async () => {
    if(confirm("Delete all saved library items?")) {
      await clearAllAudio();
      renderLibrary();
    }
  });

  // 4. Attach Tabs Navigation
  modalRoot.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(modalRoot, (e.currentTarget as HTMLElement).getAttribute('data-target')!);
    });
  });

  // 5. Manage Open/Close Visibility
  const overlay = document.getElementById('sounds-overlay');
  const inner = document.getElementById('sounds-inner');

  const closeModal = () => {
    if (overlay && inner) {
      overlay.classList.add('opacity-0', 'pointer-events-none');
      inner.classList.remove('scale-100');
      inner.classList.add('scale-95');
    }
  };

  document.getElementById('close-sounds-btn')?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  soundsBtn.addEventListener('click', () => {
    if (overlay && inner) {
      overlay.classList.remove('pointer-events-none');
      void overlay.offsetWidth; // Force a CSS repaint
      overlay.classList.remove('opacity-0');
      inner.classList.remove('scale-95');
      inner.classList.add('scale-100');
    }
  });
}