// src/components/Calendar/Calendar.ts
import dayjs from 'dayjs';
import { taskStore } from '../../store/TaskStore';

export function initCalendar() {
  const btn = document.getElementById('top-calendar-btn');
  const root = document.getElementById('calendar-modal-root');
  if (!btn || !root) return;

  let isOpen = false;
  let selectedDate: string | null = null;
  let currentMonth = dayjs();

  // Re-render if tasks are added/completed while calendar is open
  window.addEventListener('tasks-updated', () => {
    if (isOpen) render();
  });

  btn.addEventListener('click', () => {
    isOpen = true;
    currentMonth = dayjs(); // Reset to current month on open
    render();
  });

  function render() {
    if (!isOpen) {
      root!.innerHTML = '';
      return;
    }

    const startOfMonth = currentMonth.startOf('month');
    const daysInMonth = currentMonth.daysInMonth();
    const firstDayOfWeek = startOfMonth.day(); // 0 (Sun) to 6 (Sat)

    const days = [];
    // Pad empty days at the start of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(currentMonth.date(i).format('YYYY-MM-DD'));
    }

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10 bg-[#594a42]/30 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
        <div class="bg-[#fffdf5] w-full max-w-7xl h-full max-h-[85vh] rounded-[32px] shadow-2xl border-[4px] border-white/80 flex flex-col overflow-hidden relative drop-shadow-2xl">
          
          <button id="close-calendar-btn" class="absolute top-6 right-6 z-20 bg-white/80 hover:bg-white text-[#ff6b6b] p-3 rounded-3xl shadow-sm border-2 border-white hover:scale-110 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <div class="flex w-full h-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            
            <div class="h-full flex flex-col p-6 sm:p-8 transition-all duration-500 ${selectedDate ? 'w-[70%]' : 'w-full'}">
              
              <div class="flex items-center gap-6 mb-6 px-4">
                <h2 class="text-4xl font-black text-[#78b159] tracking-tight">${currentMonth.format('MMMM YYYY')}</h2>
                <div class="flex gap-2">
                  <button id="prev-month-btn" class="bg-white p-2.5 rounded-2xl shadow-sm text-[#594a42] hover:bg-[#c2f2d0] hover:text-[#78b159] hover:-translate-y-1 transition-all border-2 border-[#f1f2f6]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button id="next-month-btn" class="bg-white p-2.5 rounded-2xl shadow-sm text-[#594a42] hover:bg-[#c2f2d0] hover:text-[#78b159] hover:-translate-y-1 transition-all border-2 border-[#f1f2f6]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-7 gap-2 sm:gap-4 mb-2 px-2">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `
                  <div class="text-center font-black text-[#a4b0be] uppercase tracking-wider text-xs sm:text-sm">${d}</div>
                `).join('')}
              </div>

              <div class="grid grid-cols-7 gap-2 sm:gap-4 flex-1 content-start auto-rows-[minmax(60px,_1fr)] overflow-y-auto hide-scrollbar p-2">
                ${days.map(dateStr => {
                  if (!dateStr) return `<div class="rounded-[24px]"></div>`;
                  
                  const dayNum = dayjs(dateStr).date();
                  const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                  const isSelected = dateStr === selectedDate;
                  
                  // Now grabs ALL tasks for the day, including completed ones
                  const dailyTasks = taskStore.tasks.filter(t => t.dueDate === dateStr);
                  
                  let bgClass = 'bg-white';
                  let borderClass = 'border-2 border-[#f1f2f6]';
                  let textClass = 'text-[#594a42]';
                  
                  if (isSelected) {
                    bgClass = 'bg-[#f0fff4]';
                    borderClass = 'border-4 border-[#78b159] shadow-md scale-105 z-10';
                    textClass = 'text-[#78b159]';
                  } else if (isToday) {
                    bgClass = 'bg-[#fff8e1]';
                    borderClass = 'border-4 border-[#fdcb58]';
                    textClass = 'text-[#d49a1c]';
                  }

                  return `
                    <button class="day-btn group relative flex flex-col items-center justify-start pt-2 sm:pt-3 pb-2 px-1 rounded-[20px] sm:rounded-[24px] ${bgClass} ${borderClass} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#78b159]/50 cursor-pointer" data-date="${dateStr}">
                      <span class="font-black text-lg sm:text-xl ${textClass}">${dayNum}</span>
                      
                      <div class="flex flex-wrap gap-1 sm:gap-1.5 mt-auto justify-center w-full px-2 h-[20px] sm:h-[24px] overflow-hidden">
                        ${dailyTasks.map(t => `
                          <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm ${t.completed ? 'bg-[#d1d8e0] opacity-50' : getDotColor(t.priority)}"></div>
                        `).join('')}
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="h-full bg-[#fcfcf7] border-l-[3px] border-[#f1f2f6] transition-all duration-500 ease-in-out flex flex-col relative ${selectedDate ? 'w-[30%] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-12 overflow-hidden border-transparent'}">
              ${selectedDate ? renderDayPreview(selectedDate) : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    root!.innerHTML = modalHtml;

    // Attach Interactivity
    document.getElementById('close-calendar-btn')?.addEventListener('click', () => {
      isOpen = false;
      selectedDate = null;
      render();
    });

    document.getElementById('prev-month-btn')?.addEventListener('click', () => {
      currentMonth = currentMonth.subtract(1, 'month');
      render();
    });

    document.getElementById('next-month-btn')?.addEventListener('click', () => {
      currentMonth = currentMonth.add(1, 'month');
      render();
    });

    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clickedDate = (e.currentTarget as HTMLElement).getAttribute('data-date');
        selectedDate = selectedDate === clickedDate ? null : clickedDate;
        render();
      });
    });
  }

  function renderDayPreview(dateStr: string) {
    const dailyTasks = taskStore.tasks.filter(t => t.dueDate === dateStr);
    const formattedDate = dayjs(dateStr).format('dddd, MMM D');
    
    const tasksHtml = dailyTasks.length === 0 
      ? `<div class="flex-1 flex flex-col items-center justify-center text-center opacity-60">
           <span class="text-5xl mb-3 drop-shadow-sm hover:animate-bounce">🏝️</span>
           <p class="font-bold text-[#8e8070] text-lg">Clear skies today!</p>
           <p class="text-xs text-[#a4b0be] mt-1">No tasks scheduled.</p>
         </div>`
      : `<div class="flex-1 overflow-y-auto hide-scrollbar space-y-3 pr-2 mt-4">
          ${dailyTasks.map(t => `
            <div class="bg-white p-4 rounded-3xl border-2 border-[#f1f2f6] shadow-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-md transition-all group ${t.completed ? 'opacity-50 grayscale bg-[#fcfcf7]' : ''}">
              <div class="flex justify-between items-start gap-2">
                <span class="font-bold text-base text-[#594a42] leading-tight ${t.completed ? 'line-through' : ''}">${t.text}</span>
                <span class="shrink-0 w-3 h-3 rounded-full mt-1 shadow-sm ${t.completed ? 'bg-[#d1d8e0]' : getDotColor(t.priority)}"></span>
              </div>
              <div class="flex flex-wrap gap-2 items-center mt-1">
                <span class="text-[10px] font-black uppercase text-[#8e8070] bg-[#e6e2d0]/40 px-2.5 py-1 rounded-xl border border-[#e6e2d0]">${t.category}</span>
                
                <span class="text-[10px] font-black uppercase text-[#8e8070] bg-[#f1f2f6] px-2.5 py-1 rounded-xl">P${5 - t.priority}</span>
                
                <span class="text-[10px] font-black text-[#fdcb58] bg-[#fff8e1] px-2.5 py-1 rounded-xl">🍅 ${t.completedPomos}/${t.estimatedPomos}</span>
              </div>
            </div>
          `).join('')}
         </div>`;

    return `
      <div class="p-6 sm:p-8 h-full flex flex-col w-full min-w-[280px]">
        <p class="text-[10px] font-black text-[#a4b0be] uppercase tracking-[0.2em] mb-1">Itinerary</p>
        <h3 class="font-black text-2xl text-[#78b159] leading-tight tracking-tight">${formattedDate}</h3>
        ${tasksHtml}
      </div>
    `;
  }

  // Matches the priorities defined in Tasks.ts (P4=High, P3=Med, P2=Low, P1=None)
  function getDotColor(priority: number) {
    switch (priority) {
      case 4: return 'bg-[#ff9999]'; // Pastel Red (High Priority)
      case 3: return 'bg-[#ffe599]'; // Pastel Yellow
      case 2: return 'bg-[#a4c2f4]'; // Pastel Blue
      default: return 'bg-[#d1d8e0]'; // Pastel Gray
    }
  }
}