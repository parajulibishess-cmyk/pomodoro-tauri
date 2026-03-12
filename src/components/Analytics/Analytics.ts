// src/components/Analytics/Analytics.ts
import { loadAnalytics, NookFocusAnalytics } from '../../utils/AnalyticsCalcs';

export function initAnalytics() {
  const analyticsBtn = document.getElementById('top-analytics-btn');
  const modalRoot = document.getElementById('analytics-modal-root');

  if (!analyticsBtn || !modalRoot) {
    console.error('Analytics button or modal root not found.');
    return;
  }

  analyticsBtn.addEventListener('click', () => {
    renderAnalyticsModal(modalRoot);
  });
}

function renderAnalyticsModal(root: HTMLElement) {
  const data = loadAnalytics();
  const DAILY_GOAL_MINUTES = 120; // Example goal, can be wired to settings later

  // Format Helpers
  const formatTime = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getEstLabel = (acc: number) => {
    if (acc >= 90) return "Spot on! 🎯";
    if (acc < 50) return "Underestimating 🐢";
    return "Overestimating 🐇";
  };

  const flowDepthBadge = data.behavioral.flowDepth < 1.0 
    ? `<span class="bg-[#78b159] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm inline-block mt-2">✨ Deep Focus Master!</span>` 
    : '';

  // Chart Generators
  const renderCategoryBars = (dist: Record<string, number>) => {
    const categories = Object.keys(dist);
    if (categories.length === 0) return `<div class="text-sm text-[#8e8070] text-center italic py-4">No categorised sessions yet!</div>`;
    const max = Math.max(...Object.values(dist));
    return categories.map(cat => `
      <div class="flex items-center gap-3 text-sm font-bold text-[#594a42]">
        <span class="w-20 truncate text-right">${cat}</span>
        <div class="flex-1 bg-white/50 rounded-full h-4 overflow-hidden border border-white/40">
          <div class="bg-[#f1a25e] h-full rounded-full" style="width: ${(dist[cat] / max) * 100}%"></div>
        </div>
        <span class="w-12 text-xs text-[#8e8070]">${formatTime(dist[cat])}</span>
      </div>
    `).join('');
  };

  const renderPauseDist = (pauses: {q1: number, q2: number, q3: number, q4: number}) => {
    const max = Math.max(pauses.q1, pauses.q2, pauses.q3, pauses.q4, 1);
    const cols = [
      { label: '0-25%', val: pauses.q1 },
      { label: '25-50%', val: pauses.q2 },
      { label: '50-75%', val: pauses.q3 },
      { label: '75-100%', val: pauses.q4 }
    ];
    return cols.map(c => `
      <div class="flex flex-col items-center justify-end gap-2 h-32 w-12">
        <span class="text-xs font-bold text-[#8e8070]">${c.val}</span>
        <div class="w-8 bg-[#f28482] rounded-t-xl transition-all" style="height: ${(c.val / max) * 100}%"></div>
        <span class="text-[10px] font-bold text-[#594a42] text-center leading-tight">${c.label}</span>
      </div>
    `).join('');
  };

  const renderHeatmap = (grid: number[][]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = `<div class="grid grid-cols-[auto_repeat(24,minmax(0,1fr))] gap-1 items-center">`;
    // Header row
    html += `<div></div>` + Array.from({length: 24}, (_, i) => `<div class="text-[8px] text-center font-bold text-[#8e8070]">${i}</div>`).join('');
    
    grid.forEach((dayArr, dayIdx) => {
      const maxInDay = Math.max(...dayArr, 1);
      html += `<div class="text-[10px] font-bold text-[#594a42] pr-2">${days[dayIdx]}</div>`;
      html += dayArr.map(val => `
        <div class="aspect-square rounded-sm bg-[#78b159]" style="opacity: ${val > 0 ? 0.2 + ((val/maxInDay) * 0.8) : 0.05}"></div>
      `).join('');
    });
    return html + `</div>`;
  };

  root.innerHTML = `
    <div id="analytics-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-[#594a42]/30 backdrop-blur-sm transition-opacity p-4">
      <div class="nook-glass w-full max-w-6xl h-[85vh] flex flex-col md:flex-row border-[4px] border-white/50 shadow-2xl rounded-[32px] overflow-hidden relative">
        
        <aside class="w-full md:w-64 bg-white/40 border-b md:border-b-0 md:border-r border-white/50 p-6 flex flex-col gap-8 shrink-0">
          
          <div class="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50">
            <div class="bg-[#f1a25e]/20 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#f1a25e" stroke="#f1a25e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9z"/><path d="M12 4c-4.97 0-9 4.03-9 9 4.97 0 9-4.03 9-9z"/><path d="M12 4c4.97 0 9 4.03 9 9-4.97 0-9-4.03-9-9z"/><circle cx="12" cy="13" r="3" fill="#fff"/></svg>
            </div>
            <div>
              <span class="block text-xs font-bold text-[#8e8070] uppercase">Current Streak</span>
              <span class="block text-2xl font-black text-[#594a42]">${data.core.streak} Days</span>
            </div>
          </div>

          <nav class="flex md:flex-col gap-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            <button class="nav-btn active flex-shrink-0 w-full text-left px-5 py-3 rounded-xl font-bold text-[#594a42] transition-all bg-white shadow-sm border-2 border-white/80" data-target="tab-overview">📊 Overview</button>
            <button class="nav-btn flex-shrink-0 w-full text-left px-5 py-3 rounded-xl font-bold text-[#8e8070] transition-all hover:bg-white/50 border-2 border-transparent" data-target="tab-tasks">✅ Task Insights</button>
            <button class="nav-btn flex-shrink-0 w-full text-left px-5 py-3 rounded-xl font-bold text-[#8e8070] transition-all hover:bg-white/50 border-2 border-transparent" data-target="tab-trends">🔍 Deep Trends</button>
          </nav>

          <div class="mt-auto hidden md:block text-center">
            <button id="close-analytics-btn" class="bg-white/60 hover:bg-white text-[#594a42] font-bold rounded-2xl px-6 py-3 border-2 border-white/50 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer w-full">
              Close Island Office
            </button>
          </div>
        </aside>

        <main class="flex-1 overflow-y-auto hide-scrollbar p-6 md:p-8 bg-white/20">
          
          <div id="tab-overview" class="tab-content flex flex-col gap-6">
            <h2 class="text-3xl font-black text-[#594a42] mb-2">Overview</h2>
            
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
                <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-1">Total Focus</span>
                <span class="text-3xl font-black text-[#78b159] drop-shadow-sm">${formatTime(data.core.minutes)}</span>
                <span class="text-xs font-bold text-[#8e8070] mt-2">Avg: ${formatTime(data.core.dailyAverage)}/day</span>
              </div>
              <div class="bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
                <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-1">Flow Score</span>
                <span class="text-3xl font-black text-[#5bc0eb] drop-shadow-sm">${data.behavioral.flowScore.toFixed(0)}%</span>
              </div>
              <div class="bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
                <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-1">Best Streak</span>
                <span class="text-3xl font-black text-[#f1a25e] drop-shadow-sm">${data.core.bestStreak}</span>
              </div>
              <div class="bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
                <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-1">Perfect Days</span>
                <span class="text-3xl font-black text-[#f28482] drop-shadow-sm">${data.core.perfectDays}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div class="flex flex-col gap-4">
                <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm">
                  <div class="flex justify-between items-end mb-4">
                    <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider">Daily Goal</span>
                    <span class="text-lg font-black text-[#594a42]">${formatTime(data.core.todayMinutes)} / ${formatTime(DAILY_GOAL_MINUTES)}</span>
                  </div>
                  <div class="w-full bg-white/50 rounded-full h-6 border-2 border-white/60 overflow-hidden shadow-inner">
                    <div class="bg-[#78b159] h-full rounded-full transition-all duration-1000" style="width: ${Math.min((data.core.todayMinutes / DAILY_GOAL_MINUTES) * 100, 100)}%"></div>
                  </div>
                </div>

                <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex justify-between items-center">
                  <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider">Golden Hour</span>
                  <div class="flex items-center gap-2">
                    <span class="text-2xl font-black text-[#f1a25e]">${data.behavioral.goldenHour}</span>
                    <span class="text-xl">☀️</span>
                  </div>
                </div>

                <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span class="block text-[10px] font-bold text-[#8e8070] uppercase">Focus</span>
                    <span class="block text-xl font-black text-[#78b159]">${data.core.sessionCounts.focus}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold text-[#8e8070] uppercase">Short Brk</span>
                    <span class="block text-xl font-black text-[#5bc0eb]">${data.core.sessionCounts.shortBreak}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold text-[#8e8070] uppercase">Long Brk</span>
                    <span class="block text-xl font-black text-[#9b5de5]">${data.core.sessionCounts.longBreak}</span>
                  </div>
                </div>
              </div>

              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col">
                <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider mb-6 block">Focus Distribution</span>
                <div class="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 hide-scrollbar">
                  ${renderCategoryBars(data.tasks.categoryDist)}
                </div>
              </div>

            </div>
          </div>

          <div id="tab-tasks" class="tab-content hidden flex flex-col gap-6">
            <h2 class="text-3xl font-black text-[#594a42] mb-2">Task Insights</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col gap-2">
                <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider">Estimation Accuracy</span>
                <span class="text-4xl font-black text-[#594a42]">${data.tasks.estimationAccuracy.toFixed(0)}%</span>
                <span class="text-sm font-bold text-[#f1a25e] bg-white px-3 py-1 rounded-full w-max border border-white mt-2">${getEstLabel(data.tasks.estimationAccuracy)}</span>
                <p class="text-xs text-[#8e8070] mt-2 leading-relaxed">Compares planned pomodoros versus actual sessions taken.</p>
              </div>

              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col gap-2">
                <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider">Procrastination Index</span>
                <div class="flex items-end gap-2">
                  <span class="text-4xl font-black text-[#f28482]">${data.tasks.procrastinationIndex.toFixed(1)}</span>
                  <span class="text-lg font-bold text-[#8e8070] mb-1">Days</span>
                </div>
                <p class="text-xs text-[#8e8070] mt-auto leading-relaxed">Average time between a task's due date and actual completion.</p>
              </div>

              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div class="flex flex-col justify-center text-center p-4 bg-white/40 rounded-2xl">
                  <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-2">Completion Rate</span>
                  <div class="relative w-24 h-24 mx-auto mb-2 flex items-center justify-center rounded-full border-[6px] border-[#78b159]">
                    <span class="text-xl font-black text-[#594a42]">${data.tasks.completionRate}%</span>
                  </div>
                </div>

                <div class="flex flex-col justify-center text-center p-4 bg-white/40 rounded-2xl">
                  <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-2">High Priority Focus</span>
                  <span class="text-4xl font-black text-[#f28482]">${data.tasks.priorityFocus.toFixed(0)}%</span>
                  <span class="text-[10px] font-bold text-[#8e8070] mt-1">P1 & P2 Tasks</span>
                </div>

                <div class="flex flex-col justify-center text-center p-4 bg-white/40 rounded-2xl">
                  <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-2">Category Champ</span>
                  <span class="text-2xl font-black text-[#9b5de5] break-words">${data.tasks.categoryChampion}</span>
                  <span class="text-[10px] font-bold text-[#8e8070] mt-1">Most Completed Tasks</span>
                </div>

              </div>
            </div>
          </div>

          <div id="tab-trends" class="tab-content hidden flex flex-col gap-6">
            <h2 class="text-3xl font-black text-[#594a42] mb-2">Deep Trends</h2>
            
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center col-span-2 lg:col-span-1">
                <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-1">Flow Depth (Pauses)</span>
                <span class="text-4xl font-black text-[#594a42]">${data.behavioral.flowDepth.toFixed(1)}</span>
                ${flowDepthBadge}
              </div>
              <div class="bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
                <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-1">Abandon Rate</span>
                <span class="text-3xl font-black text-[#f28482]">${data.behavioral.abandonmentRate.toFixed(1)}%</span>
              </div>
              <div class="bg-white/60 rounded-3xl p-5 border-2 border-white/50 shadow-sm flex flex-col items-center justify-center text-center">
                <span class="text-xs font-bold text-[#8e8070] uppercase tracking-wider mb-1">Night Owl</span>
                <span class="text-3xl font-black text-[#9b5de5]">${data.behavioral.nightOwlScore.toFixed(1)}%</span>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col">
                <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider mb-4 block">Interruption Pattern</span>
                <div class="flex justify-around items-end h-full pt-4 border-b-2 border-[#8e8070]/20 pb-2">
                  ${renderPauseDist(data.behavioral.pauseDist)}
                </div>
              </div>

              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm flex flex-col">
                <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider mb-4 block">Work Week Balance</span>
                
                <div class="flex-1 flex flex-col justify-center gap-4">
                  <div class="flex justify-between items-end">
                    <span class="text-xs font-bold text-[#5bc0eb]">Weekday: ${formatTime(data.behavioral.weekSplit.weekday)}</span>
                    <span class="text-xs font-bold text-[#f1a25e]">Weekend: ${formatTime(data.behavioral.weekSplit.weekend)}</span>
                  </div>
                  
                  <div class="w-full h-8 rounded-xl overflow-hidden flex shadow-inner border-2 border-white/60 bg-white/30">
                    ${data.behavioral.weekSplit.weekday === 0 && data.behavioral.weekSplit.weekend === 0 
                      ? `<div class="w-full bg-[#8e8070]/20"></div>`
                      : `
                      <div class="bg-[#5bc0eb] h-full" style="width: ${(data.behavioral.weekSplit.weekday / (data.behavioral.weekSplit.weekday + data.behavioral.weekSplit.weekend)) * 100}%"></div>
                      <div class="bg-[#f1a25e] h-full" style="width: ${(data.behavioral.weekSplit.weekend / (data.behavioral.weekSplit.weekday + data.behavioral.weekSplit.weekend)) * 100}%"></div>
                    `}
                  </div>
                </div>
              </div>

              <div class="bg-white/60 rounded-3xl p-6 border-2 border-white/50 shadow-sm lg:col-span-2 overflow-x-auto hide-scrollbar">
                <span class="text-sm font-bold text-[#8e8070] uppercase tracking-wider mb-4 block">Weekly Focus Heatmap</span>
                ${renderHeatmap(data.behavioral.weeklyHourly)}
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  `;

  // --- Interaction Logic ---

  // 1. Tab Switching
  const navBtns = root.querySelectorAll('.nav-btn');
  const tabContents = root.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Reset all buttons
      navBtns.forEach(b => {
        b.classList.remove('active', 'bg-white', 'shadow-sm', 'border-white/80', 'text-[#594a42]');
        b.classList.add('text-[#8e8070]', 'border-transparent');
      });
      // Set active button
      const targetBtn = e.currentTarget as HTMLElement;
      targetBtn.classList.remove('text-[#8e8070]', 'border-transparent');
      targetBtn.classList.add('active', 'bg-white', 'shadow-sm', 'border-white/80', 'text-[#594a42]');

      // Hide all tabs
      tabContents.forEach(tab => tab.classList.add('hidden'));
      
      // Show target tab
      const targetId = targetBtn.getAttribute('data-target');
      if (targetId) document.getElementById(targetId)?.classList.remove('hidden');
    });
  });

  // 2. Closing the Modal
  const closeBtn = document.getElementById('close-analytics-btn');
  const overlay = document.getElementById('analytics-overlay');

  const closeModal = () => {
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        root.innerHTML = '';
      }, 300);
    }
  };

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}