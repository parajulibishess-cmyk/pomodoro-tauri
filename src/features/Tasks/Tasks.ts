import { Task, taskStore } from './TaskStore.ts';
// SVGs for Vanilla JS
const icons = {
  Plus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  CheckSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`,
  Flag: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
  CalendarDays: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
  Target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  Trash2: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  AlertCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
};

const categories = [
  { name: "General", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`, color: "text-[#a4b0be]" },
  { name: "Work", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`, color: "text-[#54a0ff]" },
  { name: "Study", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`, color: "text-[#fdcb58]" },
  { name: "Creative", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`, color: "text-[#ff6b6b]" },
  { name: "Reading", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`, color: "text-[#78b159]" }
];

export class TaskSectionUI {
  store = taskStore;
  root: HTMLElement;
  
  // Form State
  newTask: string = "";
  newPriority: number = 1;
  newDueDate: string = "";
  newCategory: string = "General";
  newEstimate: number = 1;
  
  showCalendar: boolean = false;
  showCategorySelect: boolean = false;
  editingNoteId: number | null = null;

  constructor(rootId: string) {
    const rootEl = document.getElementById(rootId);
    if (!rootEl) throw new Error(`Root element ${rootId} not found`);
    this.root = rootEl;
    this.render();
    
    // Listen for background sync updates
    window.addEventListener('tasks-updated', () => this.render());
  }

  getPriorityColor(p: number) {
    if (p === 4) return "text-[#ff6b6b]";
    if (p === 3) return "text-[#fdcb58]";
    if (p === 2) return "text-[#54a0ff]";
    return "text-[#a4b0be]";
  }

  checkOverdue(dateStr: string | null) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00');
    return due < today;
  }

  handleFormSubmit(e: Event) {
    e.preventDefault();
    if (!this.newTask.trim()) return;

    const taskObj: Task = {
      id: Date.now(),
      text: this.newTask,
      priority: this.newPriority,
      dueDate: this.newDueDate,
      category: this.newCategory,
      estimatedPomos: this.newEstimate,
      completedPomos: 0,
      completed: false,
      completedAt: null,
      createdAt: Date.now()
    };

    this.store.addTask(taskObj);
    
    // Reset Form
    this.newTask = "";
    this.newPriority = 1;
    this.newDueDate = "";
    this.newCategory = "General";
    this.newEstimate = 1;
    this.showCalendar = false;
    
    this.render();
  }

  render() {
    // 1. SAVE the current scroll position before we clear the DOM
    const existingList = this.root.querySelector('ul');
    const savedScroll = existingList ? existingList.scrollTop : 0;

    this.root.innerHTML = '';
    
    const completedCount = this.store.tasks.filter(t => t.completed).length;
    
    // Header for Tasks
    this.root.innerHTML += `
      <div class="flex items-center justify-between shrink-0 mb-1">
        <h2 class="text-2xl font-black flex items-center gap-3 m-0 text-[#594a42]">
          <span class="bg-[#fdcb58] w-3 h-8 rounded-full shadow-sm"></span>Today's Tasks
        </h2>
        <span class="text-xs font-bold bg-[#f1f2f6] px-3 py-1.5 rounded-full text-[#8e8070] border border-[#e6e2d0]">
          ${completedCount} / ${this.store.tasks.length}
        </span>
      </div>
    `;

    // TOP & MIDDLE: Form, Input & Attributes
    this.root.appendChild(this.renderForm());

    // BOTTOM: Flex-grow Task List wrapper (This allows scrolling independently inside the aside)
    const listWrap = document.createElement('div');
    listWrap.className = "flex-grow overflow-hidden relative";
    
    const taskList = document.createElement('ul');
    taskList.className = "hide-scrollbar absolute inset-0 overflow-y-auto space-y-3 pr-2 m-0 p-0 list-none";
    
    this.store.getSortedTasks().forEach(task => {
      taskList.appendChild(this.renderTaskItem(task));
    });

    listWrap.appendChild(taskList);
    this.root.appendChild(listWrap);

    // 2. RESTORE the scroll position smoothly after the new elements are in the DOM
    if (savedScroll > 0) {
      requestAnimationFrame(() => {
        taskList.scrollTop = savedScroll;
      });
    }
  }

  renderForm(): HTMLFormElement {
    const form = document.createElement('form');
    // Top & Middle encapsulated inside .nook-glass-inner
    form.className = "nook-glass-inner bg-white/60 backdrop-blur-md border-2 border-white/70 rounded-2xl p-3 flex flex-col gap-3 shrink-0 shadow-sm focus-within:border-[#78b159] transition-colors relative z-30";
    form.onsubmit = (e) => this.handleFormSubmit(e);

    const activeCat = categories.find(c => c.name === this.newCategory) || categories[0];
    const displayDate = this.newDueDate ? new Date(this.newDueDate + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Due Date';

    form.innerHTML = `
      <input type="text" placeholder="What are you working on?" value="${this.newTask}" class="w-full bg-transparent p-1 outline-none font-bold text-[#594a42] placeholder-[#a4b0be] text-base" id="task-input" />
      
      <div class="flex flex-wrap items-center justify-between mt-1 gap-2">
        <div class="flex flex-wrap gap-2 relative z-20">
          <button type="button" id="btn-priority" class="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white transition-all shadow-sm flex items-center gap-1 ${this.getPriorityColor(this.newPriority)}">
            ${icons.Flag}
            <span class="text-xs font-black">P${5 - this.newPriority}</span>
          </button>
          
          <div class="relative">
             <button type="button" id="btn-calendar" class="px-3 py-1.5 rounded-xl bg-white/80 transition-all shadow-sm flex items-center gap-2 ${this.newDueDate ? 'bg-[#78b159]/10 text-[#78b159]' : 'text-[#a4b0be] hover:bg-white'}">
              ${icons.CalendarDays}
              <span class="text-xs font-bold">${displayDate}</span>
            </button>
            <div id="dropdown-calendar" class="${this.showCalendar ? 'block' : 'hidden'} absolute top-full left-0 mt-2 z-50 drop-shadow-2xl">
              </div>
          </div>

          <button type="button" id="btn-estimate" class="flex items-center gap-1 bg-[#f1f2f6] rounded-xl px-3 py-1.5 text-[#594a42] font-bold text-xs cursor-pointer hover:bg-[#e6e2d0] shadow-sm transition-colors">
            <span>🍅</span> ${this.newEstimate}
          </button>

          <div class="relative">
            <button type="button" id="btn-category" class="bg-white/80 text-xs font-bold text-[#8e8070] px-3 py-1.5 shadow-sm hover:bg-white rounded-xl flex items-center gap-1">
              <span class="${activeCat.color} w-4 h-4">${activeCat.icon}</span> ${this.newCategory}
            </button>
            <div id="dropdown-category" class="${this.showCategorySelect ? 'block' : 'hidden'} absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border-2 border-[#f1f2f6] p-2 z-50 w-40 flex flex-col gap-1">
              ${categories.map(c => `
                <button type="button" class="btn-select-category flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors w-full text-left hover:bg-[#f1f2f6]" data-category="${c.name}">
                  <span class="${c.color} w-3.5 h-3.5">${c.icon}</span> ${c.name}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <button type="submit" class="bg-[#78b159] text-white p-2 rounded-xl hover:bg-[#6aa34b] shadow-md active:scale-95 transition-transform">
          ${icons.Plus}
        </button>
      </div>
    `;

    // Attaching listeners SYNCHRONOUSLY directly to the created form elements
    // This entirely prevents the double-firing / race condition bug.
    const taskInput = form.querySelector('#task-input') as HTMLInputElement;
    const btnPriority = form.querySelector('#btn-priority') as HTMLButtonElement;
    const btnEstimate = form.querySelector('#btn-estimate') as HTMLButtonElement;
    const btnCategory = form.querySelector('#btn-category') as HTMLButtonElement;
    const btnCalendar = form.querySelector('#btn-calendar') as HTMLButtonElement;
    const dropdownCalendar = form.querySelector('#dropdown-calendar') as HTMLElement;

    taskInput?.addEventListener('input', (e) => this.newTask = (e.target as HTMLInputElement).value);
    
    btnPriority?.addEventListener('click', () => { 
      this.newPriority = this.newPriority >= 4 ? 1 : this.newPriority + 1; 
      this.render(); 
    });
    
    btnEstimate?.addEventListener('click', () => { 
      this.newEstimate = this.newEstimate >= 10 ? 1 : this.newEstimate + 1; 
      this.render(); 
    });
    
    btnCategory?.addEventListener('click', () => { 
      this.showCategorySelect = !this.showCategorySelect; 
      this.showCalendar = false; 
      this.render(); 
    });

    form.querySelectorAll('.btn-select-category').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-category');
        if (cat) this.newCategory = cat;
        this.showCategorySelect = false;
        this.render();
      });
    });

    btnCalendar?.addEventListener('click', () => { 
      this.showCalendar = !this.showCalendar; 
      this.showCategorySelect = false; 
      this.render(); 
    });

    if (this.showCalendar && dropdownCalendar) {
      dropdownCalendar.appendChild(this.renderCalendar());
    }

    return form;
  }

  renderTaskItem(task: Task): HTMLElement {
    const isFocused = this.store.focusedTaskId === task.id;
    const isOverdue = !task.completed && this.checkOverdue(task.dueDate);
    const isEditingNote = this.editingNoteId === task.id;
    
    let opacityClass = task.completed ? 'opacity-60 bg-[#f1f2f6] border-transparent' : 'bg-white opacity-100 border-[#f1f2f6] hover:border-[#78b159] hover:shadow-md';
    if (isOverdue && !task.completed) opacityClass = 'bg-[#ff6b6b]/5 border-[#ff6b6b]/30 hover:border-[#ff6b6b]';

    const div = document.createElement('li');
    div.className = `group flex items-start gap-4 p-4 rounded-3xl border-2 transition-all duration-300 ${opacityClass}`;

    const noteHtml = isEditingNote
      ? `<textarea class="task-note-input w-full mt-2 p-2.5 rounded-xl bg-white/70 border-2 border-[#78b159]/60 focus:border-[#78b159] text-xs font-medium text-[#594a42] outline-none resize-none shadow-inner transition-all" placeholder="Jot down a quick note... (Press Esc to cancel, click away to save)" rows="2">${task.note || ''}</textarea>`
      : (task.note ? `
          <div class="mt-2 text-[11px] text-[#8e8070] bg-[#f1f2f6]/50 p-2.5 rounded-xl border border-[#e6e2d0] leading-relaxed flex items-start gap-2 shadow-sm">
             <span class="mt-0.5 opacity-70">統</span>
             <span class="whitespace-pre-wrap">${task.note}</span>
          </div>` : '');

    div.innerHTML = `
      <button class="btn-toggle-task shrink-0 mt-0.5 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-[#78b159] border-[#78b159]' : 'border-[#d1d8e0] bg-white'} active:scale-90">
        ${task.completed ? `<span class="text-white">${icons.CheckSquare}</span>` : ''}
      </button>
      
      <div class="flex-1 min-w-0 task-content-area cursor-pointer rounded-xl transition-colors hover:bg-[#f1f2f6]/50 p-1 -ml-1 -mt-1" title="Double-click to add or edit note">
        <div class="flex items-start sm:items-center gap-2 flex-wrap">
          <span class="font-bold text-base break-words flex-1 min-w-[120px] ${task.completed ? 'line-through text-[#a4b0be]' : (isOverdue ? 'text-[#ff6b6b]' : 'text-[#594a42]')}">
            ${task.text}
          </span>
          <div class="flex items-center gap-2 shrink-0 mt-1 sm:mt-0">
             ${task.priority > 1 ? `<span class="${this.getPriorityColor(task.priority)}">${icons.Flag}</span>` : ''}
             ${isOverdue && !task.completed ? `<span class="text-[10px] font-black bg-[#ff6b6b] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">${icons.AlertCircle} OVERDUE</span>` : ''}
          </div>
        </div>
        
        <div class="flex items-center gap-2 mt-1.5 flex-wrap">
          <span class="text-[10px] font-bold text-[#8e8070] bg-[#f1f2f6] px-2 py-1 rounded-lg border border-[#e6e2d0]">${task.category}</span>
          <span class="text-[10px] font-bold text-[#fdcb58] bg-[#fff8e1] px-2 py-1 rounded-lg border border-[#ffe082]/50">🍅 ${task.completedPomos}/${task.estimatedPomos}</span>
          ${task.dueDate ? `<span class="text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${isOverdue && !task.completed ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/20' : 'text-[#78b159] bg-[#f0fff4] border-[#78b159]/20'}">${icons.CalendarDays} ${new Date(task.dueDate + 'T00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>` : ''}
        </div>
        ${noteHtml}
      </div>
      
      <div class="flex gap-1 shrink-0">
        <button class="btn-focus-task p-2 rounded-xl transition-colors ${isFocused ? 'bg-[#78b159] text-white shadow-md' : 'text-[#a4b0be] hover:bg-[#f1f2f6]'} hover:scale-110">
          ${icons.Target}
        </button>
        <button class="btn-delete-task opacity-0 group-hover:opacity-100 text-[#ff6b6b] hover:bg-[#fff0f0] p-2 rounded-xl transition-opacity hover:scale-110">
          ${icons.Trash2}
        </button>
      </div>
    `;

    // Standard Buttons
    div.querySelector('.btn-toggle-task')?.addEventListener('click', () => { this.store.toggleTask(task.id); this.render(); });
    div.querySelector('.btn-focus-task')?.addEventListener('click', () => { this.store.focusedTaskId = this.store.focusedTaskId === task.id ? null : task.id; this.render(); });
    div.querySelector('.btn-delete-task')?.addEventListener('click', () => { this.store.deleteTask(task.id); this.render(); });

    // Double Click Note Logic
    const contentArea = div.querySelector('.task-content-area');
    contentArea?.addEventListener('dblclick', (e) => {
      // Prevent triggering if they double click the textarea itself
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      
      this.editingNoteId = task.id;
      this.render();
      
      // Auto-focus the text area and place cursor at the end
      setTimeout(() => {
        const ta = this.root.querySelector('.task-note-input') as HTMLTextAreaElement;
        if (ta) { 
          ta.focus(); 
          ta.selectionStart = ta.value.length; 
        }
      }, 0);
    });

    // Save/Cancel Note Logic
    if (isEditingNote) {
      const textarea = div.querySelector('.task-note-input') as HTMLTextAreaElement;
      
      // Save on click away
      textarea?.addEventListener('blur', () => {
        const val = textarea.value.trim();
        this.store.updateTaskNote(task.id, val);
        this.editingNoteId = null;
        this.render();
      });

      // Cancel on Escape
      textarea?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.editingNoteId = null;
          this.render(); // Re-render without saving
        }
      });
    }

    return div;
  }

  renderCalendar(): HTMLElement {
    const calendarRoot = document.createElement('div');
    calendarRoot.className = "bg-white rounded-3xl border-4 border-[#e6e2d0] shadow-2xl w-72 h-80 flex flex-col select-none overflow-hidden relative z-50 opacity-100";
    calendarRoot.addEventListener('click', (e) => e.stopPropagation());

    const scrollArea = document.createElement('div');
    scrollArea.className = "flex-1 overflow-y-auto px-4 py-4 hide-scrollbar space-y-6";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    for (let i = 0; i < 60; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();

      let monthHtml = `
        <div>
          <h3 class="font-black text-base text-[#78b159] mb-2 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10 border-b border-[#f1f2f6]">${monthNames[month]} ${year}</h3>
          <div class="grid grid-cols-7 gap-1 mb-1 text-center">
            ${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<div class="text-[10px] font-bold text-[#a4b0be] uppercase">${d}</div>`).join('')}
          </div>
          <div class="grid grid-cols-7 gap-1">
      `;

      for (let j = 0; j < firstDay; j++) monthHtml += `<div class="aspect-square"></div>`;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isPast = date < today;
        const localIso = date.toLocaleDateString('en-CA');
        const isSelected = this.newDueDate === localIso;

        const classes = isSelected 
          ? 'bg-[#fdcb58] text-[#594a42] shadow-sm transform scale-110' 
          : (isPast ? 'text-gray-200 cursor-default' : 'text-[#594a42] hover:bg-[#c2f2d0] hover:text-[#78b159] hover:scale-110 active:scale-90');

        monthHtml += `
          <button type="button" class="btn-cal-day aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 ${classes}" data-date="${localIso}" ${isPast ? 'disabled' : ''}>
            ${day}
          </button>
        `;
      }

      monthHtml += `</div></div>`;
      scrollArea.insertAdjacentHTML('beforeend', monthHtml);
    }

    scrollArea.querySelectorAll('.btn-cal-day').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateStr = (e.currentTarget as HTMLElement).getAttribute('data-date');
        if (dateStr) { this.newDueDate = dateStr; this.showCalendar = false; this.render(); }
      });
    });

    calendarRoot.appendChild(scrollArea);

    const footer = document.createElement('div');
    footer.className = "px-4 py-3 border-t border-[#e6e2d0] flex justify-center bg-white";
    footer.innerHTML = `<button class="text-xs font-bold text-[#ff6b6b] hover:bg-[#fff0f0] px-4 py-2 rounded-full transition-colors active:scale-95">Close</button>`;
    footer.querySelector('button')?.addEventListener('click', () => { this.showCalendar = false; this.render(); });
    calendarRoot.appendChild(footer);

    return calendarRoot;
  }
}