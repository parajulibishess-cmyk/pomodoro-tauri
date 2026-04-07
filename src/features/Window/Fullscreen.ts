import { getCurrentWindow } from '@tauri-apps/api/window';

export function initFullscreenToggle(buttonId: string) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  const appWindow = getCurrentWindow();

  // SVG for enter/exit fullscreen
  const iconMaximize = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
  const iconMinimize = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`;

  btn.innerHTML = iconMaximize;
  
  // Added duration-300 for a smooth fade, and default hidden classes (opacity-0, pointer-events-none)
  btn.className = "p-2 text-[#8e8070] hover:bg-white/50 rounded-xl transition-all duration-300 active:scale-95 border-2 border-transparent hover:border-white/50 shadow-sm opacity-0 pointer-events-none";

  btn.addEventListener('click', async () => {
    try {
      const isFullscreen = await appWindow.isFullscreen();
      await appWindow.setFullscreen(!isFullscreen);
      btn.innerHTML = !isFullscreen ? iconMinimize : iconMaximize;
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  });

  // Show button when Ctrl is pressed down
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
      btn.classList.remove('opacity-0', 'pointer-events-none');
      btn.classList.add('opacity-100', 'pointer-events-auto');
    }
  });

  // Hide button when Ctrl is released
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
      btn.classList.remove('opacity-100', 'pointer-events-auto');
      btn.classList.add('opacity-0', 'pointer-events-none');
    }
  });

  // Failsafe: Hide button if the app loses focus while Ctrl is being held
  window.addEventListener('blur', () => {
    btn.classList.remove('opacity-100', 'pointer-events-auto');
    btn.classList.add('opacity-0', 'pointer-events-none');
  });
}