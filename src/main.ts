// --- TYPES & SETTINGS ---
type TimerMode = 'focus' | 'short' | 'long';

const SETTINGS = {
  durations: { focus: 25, short: 5, long: 15 },
  flowDuration: 15, // Extension time in minutes
  longBreakInterval: 4
};

const COLORS = {
  focus: '#78b159',
  short: '#fdcb58',
  long: '#54a0ff'
};

// --- STATE ---
let currentMode: TimerMode = 'focus';
let timeLeft = SETTINGS.durations.focus * 60;
let initialDuration = timeLeft;
let isActive = false;
let endTime: number | null = null;
let timerInterval: number | null = null;
let completedSessions = 0;
let intentionText = "";

// --- DOM ELEMENTS ---
const timeDisplay = document.getElementById('time-display')!;
const modeLabel = document.getElementById('mode-label')!;
const progressCircle = document.getElementById('progress-circle') as unknown as SVGCircleElement;
const startPauseBtn = document.getElementById('start-pause-btn') as HTMLButtonElement;
const modeButtons = document.querySelectorAll('.mode-btn');

// Modals & Extras
const modeSwitcher = document.getElementById('mode-switcher')!;
const intentionModal = document.getElementById('intention-modal')!;
const intentionInput = document.getElementById('intention-input') as HTMLInputElement;
const activeIntention = document.getElementById('active-intention')!;
const intentionDisplayText = document.getElementById('intention-display-text')!;
const flowModal = document.getElementById('flow-modal')!;

// SVG Setup
const radius = 115;
const circumference = 2 * Math.PI * radius;
progressCircle.style.strokeDasharray = `${circumference}`;
progressCircle.style.strokeDashoffset = '0';

// --- CORE LOGIC ---

function startTimer() {
  if (isActive) return;
  isActive = true;
  endTime = Date.now() + timeLeft * 1000;
  
  // Hide UI elements during focus
  modeSwitcher.style.opacity = '0';
  modeSwitcher.style.pointerEvents = 'none';
  
  if (currentMode === 'focus' && intentionText) {
    activeIntention.style.display = 'block';
    intentionDisplayText.textContent = intentionText;
  }

  // Use setInterval but calculate against Date.now() for high accuracy
  timerInterval = window.setInterval(tick, 200);
  updateUI();
}

function pauseTimer() {
  isActive = false;
  endTime = null;
  if (timerInterval) clearInterval(timerInterval);
  updateUI();
}

function tick() {
  if (!endTime) return;
  const now = Date.now();
  const diff = Math.ceil((endTime - now) / 1000);

  if (diff <= 0) {
    timeLeft = 0;
    handleCompletion();
  } else {
    // Only update DOM if the integer second changed
    if (timeLeft !== diff) {
      timeLeft = diff;
      updateUI();
    }
  }
}

function handleCompletion() {
  pauseTimer();
  
  // Play sound here if desired
  // new Audio("your-sound-url.mp3").play();

  if (currentMode === 'focus') {
    completedSessions++;
    activeIntention.style.display = 'none';
    document.getElementById('main-controls')!.style.display = 'none';
    flowModal.style.display = 'flex'; // Show Extend/Break prompt
  } else {
    // Break finished, reset to focus
    setMode('focus');
    modeSwitcher.style.opacity = '1';
    modeSwitcher.style.pointerEvents = 'auto';
  }
}

function setMode(mode: TimerMode) {
  pauseTimer();
  currentMode = mode;
  timeLeft = SETTINGS.durations[mode] * 60;
  initialDuration = timeLeft;
  intentionText = ""; // Clear intention on mode change
  
  // Update UI modes
  modeButtons.forEach(btn => {
    if (btn.getAttribute('data-mode') === mode) {
      btn.classList.add('active');
      (btn as HTMLElement).style.background = 'white';
      (btn as HTMLElement).style.color = '#594a42';
    } else {
      btn.classList.remove('active');
      (btn as HTMLElement).style.background = 'transparent';
      (btn as HTMLElement).style.color = '#8e8070';
    }
  });

  modeLabel.textContent = mode === 'focus' ? 'Focus Session' : mode === 'short' ? 'Short Break' : 'Long Break';
  progressCircle.style.stroke = COLORS[mode];
  updateUI();
}

// --- UI UPDATES ---

function updateUI() {
  // Update Time Text
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  timeDisplay.textContent = `${m}:${s}`;

  // Update SVG Progress
  const progress = initialDuration === 0 ? 0 : ((initialDuration - timeLeft) / initialDuration);
  const offset = circumference - (progress * circumference);
  progressCircle.style.strokeDashoffset = offset.toString();

  // Update Buttons
  startPauseBtn.textContent = isActive ? 'Pause' : 'Start';
  startPauseBtn.style.background = isActive ? '#e6e2d0' : COLORS[currentMode];
  startPauseBtn.style.color = isActive ? '#594a42' : 'white';
}

// --- EVENT LISTENERS ---

// 1. Mode Switchers
modeButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const mode = (e.target as HTMLElement).getAttribute('data-mode') as TimerMode;
    setMode(mode);
  });
});

// 2. Main Start/Pause Button
startPauseBtn.addEventListener('click', () => {
  if (isActive) {
    pauseTimer();
  } else {
    // If it's a brand new focus session, ask for intention first
    if (currentMode === 'focus' && timeLeft === SETTINGS.durations.focus * 60) {
      intentionModal.style.display = 'flex';
      intentionInput.focus();
    } else {
      startTimer();
    }
  }
});

// 3. Intention Modal Buttons
document.getElementById('cancel-intention-btn')!.addEventListener('click', () => {
  intentionModal.style.display = 'none';
});

document.getElementById('start-intention-btn')!.addEventListener('click', () => {
  const val = intentionInput.value.trim();
  if (!val) return;
  intentionText = val;
  intentionModal.style.display = 'none';
  startTimer();
});

// Allow hitting Enter in the input
intentionInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('start-intention-btn')!.click();
});

// 4. Flow Extend Modal Buttons
document.getElementById('extend-btn')!.addEventListener('click', () => {
  flowModal.style.display = 'none';
  document.getElementById('main-controls')!.style.display = 'block';
  timeLeft = SETTINGS.flowDuration * 60;
  initialDuration = timeLeft;
  startTimer();
});

document.getElementById('break-btn')!.addEventListener('click', () => {
  flowModal.style.display = 'none';
  document.getElementById('main-controls')!.style.display = 'block';
  modeSwitcher.style.opacity = '1';
  modeSwitcher.style.pointerEvents = 'auto';
  
  const isLongBreak = completedSessions > 0 && (completedSessions % SETTINGS.longBreakInterval === 0);
  setMode(isLongBreak ? 'long' : 'short');
  startTimer(); // Auto-start the break
});
// --- TODO LOGIC ---
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

let tasks: Task[] = [];
const taskForm = document.getElementById('task-form') as HTMLFormElement;
const taskInput = document.getElementById('task-input') as HTMLInputElement;
const taskList = document.getElementById('task-list')!;

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask: Task = { id: Date.now(), text, completed: false };
  tasks.push(newTask);
  taskInput.value = '';
  renderTasks();
});

function renderTasks() {
  taskList.innerHTML = '';
  
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '12px';
    li.style.padding = '12px 16px';
    li.style.background = 'rgba(255,255,255,0.7)';
    li.style.borderRadius = '16px';
    li.style.border = '2px solid rgba(255,255,255,0.5)';
    li.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
    li.style.transition = 'all 0.2s ease';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    checkbox.style.accentColor = '#78b159';
    checkbox.style.cursor = 'pointer';
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Task Text
    const span = document.createElement('span');
    span.textContent = task.text;
    span.style.flex = '1';
    span.style.fontWeight = 'bold';
    span.style.textDecoration = task.completed ? 'line-through' : 'none';
    span.style.color = task.completed ? '#8e8070' : '#594a42';
    span.style.cursor = task.completed ? 'default' : 'pointer';
    
    // Feature: Click text to pre-fill the intention input
    span.addEventListener('click', () => {
      if (!task.completed) {
         intentionInput.value = task.text;
         // Quick visual feedback blink
         span.style.color = '#54a0ff';
         setTimeout(() => span.style.color = '#594a42', 300);
      }
    });

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.border = 'none';
    deleteBtn.style.color = '#ff6b6b';
    deleteBtn.style.fontWeight = '900';
    deleteBtn.style.fontSize = '16px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function toggleTask(id: number) {
  const task = tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  renderTasks();
}

function deleteTask(id: number) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

// Initialize first render
updateUI();