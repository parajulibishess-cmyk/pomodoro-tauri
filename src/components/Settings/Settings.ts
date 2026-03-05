// Define Types
interface BgPreset {
  name: string;
  url: string;
  type: string;
  isCustom?: boolean;
}

const DEFAULT_PRESETS: BgPreset[] = [
  { name: 'Morning', url: 'https://vijiatjack.github.io/nookoffice/video-feed/bg_1.gif', type: 'image' },
  { name: 'Afternoon', url: 'https://vijiatjack.github.io/nookoffice/video-feed/bg_2.gif', type: 'image' },
  { name: 'Evening', url: 'https://vijiatjack.github.io/nookoffice/video-feed/bg_3.gif', type: 'image' },
  { name: 'Night', url: 'https://vijiatjack.github.io/nookoffice/video-feed/bg_4.gif', type: 'image' },
  { name: 'Rainy', url: 'https://vijiatjack.github.io/nookoffice/video-feed/bg_5.gif', type: 'image' },
  { name: 'Coffee', url: 'https://vijiatjack.github.io/nookoffice/video-feed/bg_6.gif', type: 'image' },
  { name: 'Snowy', url: 'https://vijiatjack.github.io/nookoffice/video-feed/bg_7.gif', type: 'image' },
];

export function initSettings() {
  const ls = window.localStorage;
  
  // Timer settings
  if (!ls.getItem('focusDuration')) ls.setItem('focusDuration', '25');
  if (!ls.getItem('shortBreakDuration')) ls.setItem('shortBreakDuration', '5');
  if (!ls.getItem('longBreakDuration')) ls.setItem('longBreakDuration', '15');
  
  if (!ls.getItem('dailyFocusGoal')) ls.setItem('dailyFocusGoal', '120');
  if (!ls.getItem('breathingDuration')) ls.setItem('breathingDuration', '10');
  if (!ls.getItem('longBreakInterval')) ls.setItem('longBreakInterval', '4');
  
  if (!ls.getItem('autoStartBreaks')) ls.setItem('autoStartBreaks', 'false');
  if (!ls.getItem('deepFocusMode')) ls.setItem('deepFocusMode', 'false');
  if (!ls.getItem('showTimerPercentage')) ls.setItem('showTimerPercentage', 'false');

  // Atmosphere Settings: Set index 3 (Night) as default!
  if (!ls.getItem('nook_bg_url')) ls.setItem('nook_bg_url', DEFAULT_PRESETS[3].url); 
  if (!ls.getItem('nook_bg_opacity')) ls.setItem('nook_bg_opacity', '0.4');
  if (!ls.getItem('nook_bg_presets')) ls.setItem('nook_bg_presets', JSON.stringify(DEFAULT_PRESETS));

  // --- WALLPAPER RENDERER FIX ---
  // A function to paint the chosen background onto the body
  function applyBackground() {
    const bgUrl = ls.getItem('nook_bg_url');
    const bgOpacity = ls.getItem('nook_bg_opacity') || '0.4';
    
    const bgEl = document.getElementById('dynamic-bg');
    const overlayEl = document.getElementById('dynamic-bg-overlay');
    
    if (bgEl && overlayEl) {
      bgEl.style.backgroundImage = `url('${bgUrl}')`;
      // Overlay dictates how faded the wallpaper gets
      overlayEl.style.opacity = bgOpacity; 
    }
  }

  // Trigger it on boot, and whenever settings change the background
  applyBackground();
  window.addEventListener('nook-bg-changed', applyBackground);

  // Modal Container
  const modalOverlay = document.createElement('div');
  modalOverlay.className = "fixed inset-0 bg-[#594a42]/30 backdrop-blur-sm z-50 hidden flex items-center justify-center opacity-0 transition-opacity duration-300";
  modalOverlay.innerHTML = `
    <div class="w-full max-w-5xl h-[85vh] bg-[#faf8f5] rounded-[3rem] border-4 border-white shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),_0_10px_25px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden relative transform scale-95 transition-transform duration-300">
      
      <div class="px-8 pt-8 pb-4 border-b border-[#594a42]/10 flex justify-between items-center bg-white/50">
        <div>
          <h2 class="text-3xl font-bold text-[#594a42]">Settings</h2>
          <p class="text-[#594a42]/60 font-medium">Customize your island</p>
        </div>
        <button id="closeSettings" class="p-3 bg-white rounded-full text-[#594a42] shadow-sm hover:bg-[#f3f0ea] transition-colors border border-[#594a42]/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="flex flex-1 overflow-hidden">
        
        <div class="w-64 bg-white/40 border-r border-[#594a42]/10 p-4 space-y-2">
          <button id="tab-timer" class="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-semibold transition-all text-[#78b159] bg-[#78b159]/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Timer & Focus</span>
          </button>
          <button id="tab-atmosphere" class="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-semibold transition-all text-[#594a42]/60 hover:bg-[#594a42]/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Atmosphere</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto modal-scroll p-8 bg-[#faf8f5]">
          
          <div id="content-timer" class="space-y-10">
            <section>
              <h3 class="text-xl font-bold text-[#594a42] mb-4">Timer Durations</h3>
              <div class="grid grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                  <label class="text-sm font-bold text-[#594a42]/60 mb-2 uppercase tracking-wider">Focus</label>
                  <input type="number" id="inp-focus" value="${ls.getItem('focusDuration')}" class="text-center text-3xl font-black text-[#594a42] bg-transparent outline-none w-20">
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                  <label class="text-sm font-bold text-[#594a42]/60 mb-2 uppercase tracking-wider">Short</label>
                  <input type="number" id="inp-short" value="${ls.getItem('shortBreakDuration')}" class="text-center text-3xl font-black text-[#594a42] bg-transparent outline-none w-20">
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                  <label class="text-sm font-bold text-[#594a42]/60 mb-2 uppercase tracking-wider">Long</label>
                  <input type="number" id="inp-long" value="${ls.getItem('longBreakDuration')}" class="text-center text-3xl font-black text-[#594a42] bg-transparent outline-none w-20">
                </div>
              </div>
            </section>

            <section class="space-y-6">
              <h3 class="text-xl font-bold text-[#594a42] mb-4">Goals & Targets</h3>
              <div class="bg-white p-5 rounded-3xl shadow-sm">
                <div class="flex justify-between items-center mb-3">
                  <span class="font-bold text-[#594a42]">Daily Focus Goal</span>
                  <span id="lbl-daily" class="font-bold text-[#ff6b6b]"></span>
                </div>
                <input type="range" id="sl-daily" min="0" max="480" step="15" value="${ls.getItem('dailyFocusGoal')}" class="custom-slider w-full" style="--thumb-color: #ff6b6b;">
              </div>
              <div class="bg-white p-5 rounded-3xl shadow-sm">
                <div class="flex justify-between items-center mb-3">
                  <span class="font-bold text-[#594a42]">Breathing Duration</span>
                  <span id="lbl-breath" class="font-bold text-[#54a0ff]"></span>
                </div>
                <input type="range" id="sl-breath" min="0" max="60" step="5" value="${ls.getItem('breathingDuration')}" class="custom-slider w-full" style="--thumb-color: #54a0ff;">
              </div>
              <div class="bg-white p-5 rounded-3xl shadow-sm">
                <div class="flex justify-between items-center mb-3">
                  <span class="font-bold text-[#594a42]">Long Break Interval</span>
                  <span id="lbl-interval" class="font-bold text-[#78b159]"></span>
                </div>
                <input type="range" id="sl-interval" min="2" max="8" step="1" value="${ls.getItem('longBreakInterval')}" class="custom-slider w-full" style="--thumb-color: #78b159;">
              </div>
            </section>

            <section>
              <h3 class="text-xl font-bold text-[#594a42] mb-4">Behavior</h3>
              <div class="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-[#594a42]/5">
                ${createToggle('Auto-start Breaks', 'tg-auto', ls.getItem('autoStartBreaks') === 'true')}
                ${createToggle('Deep Focus Mode', 'tg-deep', ls.getItem('deepFocusMode') === 'true')}
                ${createToggle('Show Timer Percentage', 'tg-pct', ls.getItem('showTimerPercentage') === 'true')}
              </div>
            </section>
          </div>

          <div id="content-atmosphere" class="hidden space-y-10">
            <section>
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-[#594a42]">Backgrounds</h3>
              </div>
              <div id="bg-grid" class="grid grid-cols-2 md:grid-cols-3 gap-4">
                </div>
            </section>

            <section class="bg-white p-5 rounded-3xl shadow-sm">
              <div class="flex justify-between items-center mb-3">
                <span class="font-bold text-[#594a42]">Overlay Opacity</span>
                <span id="lbl-opacity" class="font-bold text-[#fdcb58]"></span>
              </div>
              <input type="range" id="sl-opacity" min="0" max="0.95" step="0.05" value="${ls.getItem('nook_bg_opacity')}" class="custom-slider w-full" style="--thumb-color: #fdcb58;">
            </section>

            <section class="bg-white p-6 rounded-3xl shadow-sm border border-[#594a42]/10">
              <h4 class="font-bold text-[#594a42] mb-3">Add Custom Background</h4>
              <div class="flex space-x-3">
                <input type="text" id="add-bg-name" placeholder="Name" class="flex-1 bg-[#f3f0ea] rounded-xl px-4 py-2 outline-none text-[#594a42]">
                <input type="text" id="add-bg-url" placeholder="Image URL or YouTube ID" class="flex-[2] bg-[#f3f0ea] rounded-xl px-4 py-2 outline-none text-[#594a42]">
                <button id="btn-add-bg" class="bg-[#fdcb58] text-[#594a42] font-bold px-6 py-2 rounded-xl hover:bg-[#ffb02e] transition-colors">Add</button>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  const modalInner = modalOverlay.firstElementChild as HTMLElement;

  // --- Helper Functions ---
  function createToggle(label: string, id: string, checked: boolean) {
    return `
      <div class="flex items-center justify-between p-5">
        <span class="font-bold text-[#594a42]">${label}</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="${id}" class="sr-only peer" ${checked ? 'checked' : ''}>
          <div class="w-12 h-7 bg-[#e5e7eb] rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-[#78b159]"></div>
        </label>
      </div>
    `;
  }

  function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // --- Logic & Bindings ---
  
  // Tab Switching
  const tabTimer = document.getElementById('tab-timer');
  const tabAtmos = document.getElementById('tab-atmosphere');
  const contentTimer = document.getElementById('content-timer');
  const contentAtmos = document.getElementById('content-atmosphere');

  if (tabTimer && tabAtmos && contentTimer && contentAtmos) {
    tabTimer.addEventListener('click', () => {
      tabTimer.className = "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-semibold transition-all text-[#78b159] bg-[#78b159]/10";
      tabAtmos.className = "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-semibold transition-all text-[#594a42]/60 hover:bg-[#594a42]/5";
      contentTimer.classList.remove('hidden');
      contentAtmos.classList.add('hidden');
    });

    tabAtmos.addEventListener('click', () => {
      tabAtmos.className = "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-semibold transition-all text-[#fdcb58] bg-[#fdcb58]/10";
      tabTimer.className = "w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-semibold transition-all text-[#594a42]/60 hover:bg-[#594a42]/5";
      contentAtmos.classList.remove('hidden');
      contentTimer.classList.add('hidden');
    });
  }

  // Modal Open/Close - Using the new button in the Top Navigation Bar
  const settingsBtn = document.getElementById('top-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('hidden');
      setTimeout(() => {
        modalOverlay.classList.remove('opacity-0');
        modalInner.classList.remove('scale-95');
        modalInner.classList.add('scale-100');
      }, 10);
    });
  }

  const closeBtn = document.getElementById('closeSettings');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSettings);
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeSettings();
  });

  function closeSettings() {
    modalOverlay.classList.add('opacity-0');
    modalInner.classList.remove('scale-100');
    modalInner.classList.add('scale-95');
    setTimeout(() => {
      modalOverlay.classList.add('hidden');
    }, 300);
  }

  // --- Timer Interactions ---
  ['focus', 'short', 'long'].forEach(type => {
    const el = document.getElementById(`inp-${type}`) as HTMLInputElement | null;
    if (el) {
      el.addEventListener('change', (e) => {
        ls.setItem(`${type}Duration`, (e.target as HTMLInputElement).value);
      });
    }
  });

  const slDaily = document.getElementById('sl-daily') as HTMLInputElement | null;
  const lblDaily = document.getElementById('lbl-daily');
  if (slDaily && lblDaily) {
    const updateDaily = () => {
      const val = parseInt(slDaily.value);
      lblDaily.innerText = `${Math.floor(val / 60)}h ${val % 60}m`;
      ls.setItem('dailyFocusGoal', val.toString());
    };
    slDaily.addEventListener('input', updateDaily); updateDaily();
  }

  const slBreath = document.getElementById('sl-breath') as HTMLInputElement | null;
  const lblBreath = document.getElementById('lbl-breath');
  if (slBreath && lblBreath) {
    const updateBreath = () => {
      lblBreath.innerText = `${slBreath.value}s`;
      ls.setItem('breathingDuration', slBreath.value);
    };
    slBreath.addEventListener('input', updateBreath); updateBreath();
  }

  const slInterval = document.getElementById('sl-interval') as HTMLInputElement | null;
  const lblInterval = document.getElementById('lbl-interval');
  if (slInterval && lblInterval) {
    const updateInterval = () => {
      lblInterval.innerText = slInterval.value;
      ls.setItem('longBreakInterval', slInterval.value);
    };
    slInterval.addEventListener('input', updateInterval); updateInterval();
  }

  // Toggles
  ['autoStartBreaks', 'deepFocusMode', 'showTimerPercentage'].forEach(key => {
    const idMap: any = { autoStartBreaks: 'tg-auto', deepFocusMode: 'tg-deep', showTimerPercentage: 'tg-pct' };
    const cb = document.getElementById(idMap[key]) as HTMLInputElement | null;
    if (cb) {
      cb.addEventListener('change', () => ls.setItem(key, cb.checked.toString()));
    }
  });


  // --- Atmosphere Interactions ---
  const slOpacity = document.getElementById('sl-opacity') as HTMLInputElement | null;
  const lblOpacity = document.getElementById('lbl-opacity');
  if (slOpacity && lblOpacity) {
    const updateOpacity = () => {
      lblOpacity.innerText = `${Math.round(parseFloat(slOpacity.value) * 100)}%`;
      ls.setItem('nook_bg_opacity', slOpacity.value);
      applyBackground(); // Dynamically update body background overlay opacity when dragging
    };
    slOpacity.addEventListener('input', updateOpacity); updateOpacity();
  }

  // Grid Rendering
  function renderGrid() {
    const grid = document.getElementById('bg-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const presets: BgPreset[] = JSON.parse(ls.getItem('nook_bg_presets') || '[]');
    const activeUrl = ls.getItem('nook_bg_url');

    presets.forEach((preset, index) => {
      const isYoutube = preset.url.includes('youtube.com') || preset.url.includes('youtu.be');
      const ytId = isYoutube ? getYouTubeId(preset.url) : null;
      const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : preset.url;
      const isActive = activeUrl === preset.url;

      const item = document.createElement('div');
      item.className = `group relative aspect-video rounded-3xl overflow-hidden cursor-pointer bg-[#e5e7eb] transition-all hover:scale-[1.02] ${isActive ? 'ring-4 ring-[#78b159] ring-offset-2 ring-offset-[#faf8f5]' : ''}`;
      
      item.innerHTML = `
        <img src="${thumbUrl}" class="w-full h-full object-cover" alt="${preset.name}" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
          <span class="text-white font-bold drop-shadow-md">${preset.name}</span>
        </div>
        ${preset.isCustom ? `
          <button class="delete-btn absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm" data-idx="${index}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        ` : ''}
      `;

      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.delete-btn')) return;
        ls.setItem('nook_bg_url', preset.url);
        renderGrid();
        // Dispatch a custom event so the main app knows the background changed
        window.dispatchEvent(new Event('nook-bg-changed'));
      });

      grid.appendChild(item);
    });

    // Attach delete listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx')!);
        presets.splice(idx, 1);
        ls.setItem('nook_bg_presets', JSON.stringify(presets));
        renderGrid();
      });
    });
  }
  
  renderGrid();

  // Add Background
  const btnAddBg = document.getElementById('btn-add-bg');
  if (btnAddBg) {
    btnAddBg.addEventListener('click', () => {
      const nameInp = document.getElementById('add-bg-name') as HTMLInputElement;
      const urlInp = document.getElementById('add-bg-url') as HTMLInputElement;
      if (nameInp.value && urlInp.value) {
        const presets: BgPreset[] = JSON.parse(ls.getItem('nook_bg_presets') || '[]');
        presets.push({
          name: nameInp.value,
          url: urlInp.value,
          type: urlInp.value.includes('youtu') ? 'youtube' : 'image',
          isCustom: true
        });
        ls.setItem('nook_bg_presets', JSON.stringify(presets));
        nameInp.value = ''; urlInp.value = '';
        renderGrid();
      }
    });
  }
}