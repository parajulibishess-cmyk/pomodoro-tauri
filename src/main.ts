// Timer State
const MODES = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

let currentMode: keyof typeof MODES = 'focus';
let timeLeft = MODES[currentMode];
let timerId: number | null = null;
let isRunning = false;

// DOM Elements - Timer
const timeDisplay = document.getElementById('time-display')!;
const startPauseBtn = document.getElementById('start-pause-btn')!;
const modeBtns = document.querySelectorAll('.mode-btn');
const progressCircle = document.getElementById('progress-circle') as SVGCircleElement | null;
const modeLabel = document.getElementById('mode-label')!;

// SVG Circle setup for progress
const circleRadius = 115; // from your SVG r="115"
const circumference = 2 * Math.PI * circleRadius;
if (progressCircle) {
  progressCircle.style.strokeDasharray = `${circumference}`;
  progressCircle.style.strokeDashoffset = '0';
}

// DOM Elements - Tasks
const taskForm = document.getElementById('task-form') as HTMLFormElement;
const taskInput = document.getElementById('task-input') as HTMLInputElement;
const taskPriority = document.getElementById('task-priority') as HTMLSelectElement;
const taskCategory = document.getElementById('task-category') as HTMLSelectElement;
const taskEstimate = document.getElementById('task-estimate') as HTMLInputElement;
const taskList = document.getElementById('task-list')!;
const taskCount = document.getElementById('task-count')!;

let totalTasks = 0;

// --- Timer Logic ---

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  timeDisplay.textContent = `${minutes}:${seconds}`;

  // Update progress ring
  if (progressCircle) {
    const totalTime = MODES[currentMode];
    const progress = timeLeft / totalTime;
    const dashoffset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = `${dashoffset}`;
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startPauseBtn.textContent = 'Pause';
  startPauseBtn.style.background = '#f39c12'; // Change color to indicate pause

  timerId = window.setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      pauseTimer();
      alert(`${currentMode.toUpperCase()} session complete!`);
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  startPauseBtn.textContent = 'Start';
  startPauseBtn.style.background = '#78b159'; // Revert to green
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

// Timer Event Listeners
startPauseBtn.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

modeBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const target = e.target as HTMLButtonElement;
    const mode = target.dataset.mode as keyof typeof MODES;

    // Update active styles
    modeBtns.forEach((b) => {
      (b as HTMLElement).style.background = 'transparent';
    });
    target.style.background = 'rgba(255,255,255,0.8)';

    // Update state
    currentMode = mode;
    timeLeft = MODES[mode];
    modeLabel.textContent = mode === 'focus' ? 'Focus Session' : `${mode} Break`;
    
    pauseTimer();
    updateDisplay();
  });
});

// --- Task List Logic ---

function updateTaskCount() {
  taskCount.textContent = `${taskList.children.length} Tasks`;
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const text = taskInput.value.trim();
  if (!text) return;

  const priority = taskPriority.options[taskPriority.selectedIndex].text;
  const category = taskCategory.value;
  const estimate = taskEstimate.value;

  // Create list item
  const li = document.createElement('li');
  li.style.display = 'flex';
  li.style.justifyContent = 'space-between';
  li.style.alignItems = 'center';
  li.style.padding = '12px 16px';
  li.style.background = 'white';
  li.style.border = '2px solid #f1f2f6';
  li.style.borderRadius = '16px';

  // Task details
  const detailsDiv = document.createElement('div');
  detailsDiv.innerHTML = `
    <div style="font-weight: 900; color: #594a42; font-size: 16px;">${text}</div>
    <div style="font-size: 12px; color: #8e8070; margin-top: 4px; display: flex; gap: 8px;">
      <span style="background: #f1f2f6; padding: 2px 8px; border-radius: 8px;">${category}</span>
      <span style="background: #f1f2f6; padding: 2px 8px; border-radius: 8px;">${priority}</span>
      <span style="background: #f1f2f6; padding: 2px 8px; border-radius: 8px;">Est: ${estimate}</span>
    </div>
  `;

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Done';
  deleteBtn.style.padding = '8px 16px';
  deleteBtn.style.borderRadius = '12px';
  deleteBtn.style.border = 'none';
  deleteBtn.style.background = '#e6e2d0';
  deleteBtn.style.color = '#594a42';
  deleteBtn.style.fontWeight = 'bold';
  deleteBtn.style.cursor = 'pointer';

  deleteBtn.addEventListener('click', () => {
    li.remove();
    updateTaskCount();
  });

  li.appendChild(detailsDiv);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);

  // Reset form
  taskInput.value = '';
  updateTaskCount();
});

// Initialize app
updateDisplay();
// Set default active mode style
(document.querySelector('[data-mode="focus"]') as HTMLElement).style.background = 'rgba(255,255,255,0.8)';