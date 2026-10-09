/**
 * Life Dashboard — app.js
 * Vanilla JavaScript, no frameworks.
 * Sections: Greeting, Focus Timer, To-Do List, Quick Links.
 * Features: Light/Dark theme toggle, Custom name in greeting, Sort tasks.
 */

// ============================================================
// localStorage keys
// ============================================================
const TASKS_KEY = 'dashboard_tasks';
const LINKS_KEY = 'dashboard_links';
const THEME_KEY = 'dashboard_theme';
const USERNAME_KEY = 'dashboard_username';
const SORT_KEY = 'dashboard_sort';

// ============================================================
// Default Quick Links (used when localStorage is empty)
// ============================================================
const DEFAULT_LINKS = [
  { id: 1, name: 'Google',  url: 'https://google.com' },
  { id: 2, name: 'YouTube', url: 'https://youtube.com' },
  { id: 3, name: 'GitHub',  url: 'https://github.com' },
];

// ============================================================
// ① THEME — Light / Dark mode toggle
// ============================================================

/**
 * Read the saved theme from localStorage and apply it.
 * Also wires up the toggle button so clicking it switches themes.
 */
function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem(THEME_KEY);

  // Apply theme that was already set by the no-flash inline script in <head>
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    btn.textContent = '☀️';
  } else {
    // Ensure dark is clean (attribute absent)
    document.documentElement.removeAttribute('data-theme');
    btn.textContent = '🌙';
  }

  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    if (isLight) {
      // Switch to dark
      document.documentElement.removeAttribute('data-theme');
      btn.textContent = '🌙';
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      // Switch to light
      document.documentElement.setAttribute('data-theme', 'light');
      btn.textContent = '☀️';
      localStorage.setItem(THEME_KEY, 'light');
    }
  });
}

// ============================================================
// ② GREETING — Clock, Date & Custom Name
// ============================================================

/** Module-level variable holding the user's custom name. */
let userName = '';

/**
 * Pad a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Return a greeting object with a base phrase and an emoji.
 * Splitting them lets us insert the user's name cleanly between them.
 * @param {number} hour  0-23
 * @returns {{ base: string, emoji: string }}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return { base: 'Good Morning',   emoji: '☀️' };
  if (hour >= 12 && hour <= 16) return { base: 'Good Afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour <= 20) return { base: 'Good Evening',   emoji: '🌇' };
  return { base: 'Good Night', emoji: '🌙' };
}

/**
 * Update the greeting section with the current time, date, and greeting text.
 * Inserts the custom name if one is saved.
 * Called once immediately and then every second.
 */
function updateGreeting() {
  const now = new Date();
  const hour   = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  // 12-hour AM/PM format
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const timeStr = `${pad2(h12)}:${pad2(minute)}:${pad2(second)} ${ampm}`;

  // Full date string, e.g. "Friday, October 9, 2026"
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build greeting with optional name: "Good Morning, Alex ☀️"
  const { base, emoji } = getGreeting(hour);
  const nameStr = userName ? ', ' + userName : '';
  document.getElementById('greeting-text').textContent = base + nameStr + ' ' + emoji;

  document.getElementById('current-time').textContent = timeStr;
  document.getElementById('current-date').textContent = dateStr;
}

/** Start the clock — updates every second. */
function initGreeting() {
  updateGreeting();
  setInterval(updateGreeting, 1000);
}

/**
 * Load the saved name and wire up the pencil edit button.
 * Clicking the button swaps the greeting span for an inline <input>.
 * Blur or Enter commits; Escape discards.
 */
function initName() {
  userName = localStorage.getItem(USERNAME_KEY) || '';

  const editBtn = document.getElementById('edit-name-btn');

  editBtn.addEventListener('click', () => {
    const greetingSpan = document.getElementById('greeting-text');
    const greetingLeft = document.getElementById('greeting-left');

    // Hide span and pencil button
    greetingSpan.style.display = 'none';
    editBtn.style.display = 'none';

    // Create inline input pre-filled with current name
    const input = document.createElement('input');
    input.id = 'greeting-name-input';
    input.type = 'text';
    input.value = userName;
    input.placeholder = 'Your name';
    input.setAttribute('aria-label', 'Enter your name');

    /** Commit the edit: save value, restore display. */
    function commitNameEdit() {
      const trimmed = input.value.trim();
      userName = trimmed;
      localStorage.setItem(USERNAME_KEY, userName);
      input.remove();
      greetingSpan.style.display = '';
      editBtn.style.display = '';
      updateGreeting();
    }

    /** Discard the edit: just restore display without saving. */
    function discardNameEdit() {
      input.remove();
      greetingSpan.style.display = '';
      editBtn.style.display = '';
    }

    input.addEventListener('blur', commitNameEdit);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Remove blur listener before programmatic blur to avoid double-fire
        input.removeEventListener('blur', commitNameEdit);
        commitNameEdit();
      }
      if (e.key === 'Escape') {
        input.removeEventListener('blur', commitNameEdit);
        discardNameEdit();
      }
    });

    greetingLeft.insertBefore(input, editBtn);
    input.focus();
    input.select();
  });
}

// ============================================================
// ③ FOCUS TIMER (Pomodoro)
// ============================================================

const TIMER_DURATION = 25 * 60; // 1500 seconds

let timerSeconds   = TIMER_DURATION;
let timerInterval  = null;
let timerRunning   = false;

/**
 * Render the current timer value to the display element.
 */
function renderTimer() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  document.getElementById('timer-display').textContent =
    `${pad2(mins)}:${pad2(secs)}`;
}

/**
 * Show a notification message inside the timer section.
 * Does NOT use alert().
 * @param {string} message
 */
function showTimerNotification(message) {
  const el = document.getElementById('timer-notification');
  el.textContent = message;
  el.classList.remove('hidden');
}

/** Hide the timer notification banner. */
function hideTimerNotification() {
  const el = document.getElementById('timer-notification');
  el.textContent = '';
  el.classList.add('hidden');
}

/** Tick handler — called every second while the timer runs. */
function timerTick() {
  timerSeconds -= 1;
  renderTimer();

  if (timerSeconds <= 0) {
    // Timer complete
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning  = false;
    showTimerNotification('Focus session complete! Take a break. 🎉');
    document.getElementById('timer-start').disabled = true;
  }
}

/** Start or resume the timer. */
function startTimer() {
  if (timerRunning || timerSeconds <= 0) return;
  timerRunning = true;
  timerInterval = setInterval(timerTick, 1000);
}

/** Pause the timer. */
function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
}

/** Reset the timer to 25:00 and clear any notification. */
function resetTimer() {
  stopTimer();
  timerSeconds = TIMER_DURATION;
  renderTimer();
  hideTimerNotification();
  document.getElementById('timer-start').disabled = false;
}

/** Bind timer button events and render initial state. */
function initTimer() {
  renderTimer();
  document.getElementById('timer-start').addEventListener('click', startTimer);
  document.getElementById('timer-stop').addEventListener('click', stopTimer);
  document.getElementById('timer-reset').addEventListener('click', resetTimer);
}

// ============================================================
// ④ TO-DO LIST
// ============================================================

/** @type {{ id: number, text: string, done: boolean }[]} */
let tasks = [];

/** Current sort mode — one of: 'default' | 'az' | 'za' | 'done-last' */
let currentSort = 'default';

/**
 * Return a sorted copy of the tasks array.
 * Never mutates the original `tasks` array.
 * @returns {{ id: number, text: string, done: boolean }[]}
 */
function getSortedTasks() {
  const copy = [...tasks]; // spread copy — never mutate the original
  switch (currentSort) {
    case 'az':
      return copy.sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }));
    case 'za':
      return copy.sort((a, b) => b.text.localeCompare(a.text, undefined, { sensitivity: 'base' }));
    case 'done-last':
      return copy.sort((a, b) => Number(a.done) - Number(b.done));
    default:
      return copy; // insertion order preserved
  }
}

/**
 * Load tasks array from localStorage.
 * Falls back to an empty array if nothing is stored.
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
  renderTasks();
}

/**
 * Serialize the tasks array to localStorage.
 */
function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

/**
 * Re-render the entire task list from the in-memory array.
 * Uses getSortedTasks() so the active sort order is always respected.
 * Clears the list element and rebuilds it.
 */
function renderTasks() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  getSortedTasks().forEach((task) => {
    list.appendChild(createTaskElement(task));
  });
}

/**
 * Build a <li> element for a single task.
 * @param {{ id: number, text: string, done: boolean }} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `todo-item${task.done ? ' done' : ''}`;
  li.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type    = 'checkbox';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Task text span (double-click to edit)
  const span = document.createElement('span');
  span.className   = 'task-text';
  span.textContent = task.text;
  span.addEventListener('dblclick', () => startEditTask(li, task));

  // Delete button
  const del = document.createElement('button');
  del.className   = 'delete-task';
  del.textContent = '✕';
  del.setAttribute('aria-label', 'Delete task');
  del.addEventListener('click', () => deleteTask(task.id));

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(del);
  return li;
}

/**
 * Add a new task from the input field.
 * Trims whitespace; ignores empty input.
 * Calls renderTasks() so the sort order is applied immediately.
 */
function addTask() {
  const input = document.getElementById('todo-input');
  const text  = input.value.trim();
  if (!text) return;

  const newTask = { id: Date.now(), text, done: false };
  tasks.push(newTask);
  saveTasks();

  // Full re-render preserves the active sort order
  renderTasks();

  input.value = '';
  input.focus();
}

/**
 * Toggle the done state of a task by id.
 * Calls renderTasks() so "Done Last" re-sorts correctly after a toggle.
 * @param {number} id
 */
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();

  // Full re-render so sort order (especially "Done Last") updates correctly
  renderTasks();
}

/**
 * Delete a task by id.
 * @param {number} id
 */
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  const li = document.querySelector(`#todo-list [data-id="${id}"]`);
  if (li) li.remove();
}

/**
 * Replace the task text span with an inline edit input.
 * Saves on blur or Enter key.
 * @param {HTMLLIElement} li
 * @param {{ id: number, text: string, done: boolean }} task
 */
function startEditTask(li, task) {
  const span = li.querySelector('.task-text');
  if (!span) return;

  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'task-edit-input';
  editInput.value     = task.text;

  /** Commit the edit: update model, save, restore span. */
  function commitEdit() {
    const newText = editInput.value.trim();
    if (newText) {
      task.text        = newText;
      span.textContent = newText;
      saveTasks();
    }
    li.replaceChild(span, editInput);
  }

  editInput.addEventListener('blur', commitEdit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editInput.blur(); // triggers commitEdit via blur
    }
    if (e.key === 'Escape') {
      li.replaceChild(span, editInput); // discard edit
    }
  });

  li.replaceChild(editInput, span);
  editInput.focus();
  editInput.select();
}

/**
 * Load the saved sort preference and wire up sort buttons.
 * Must be called before loadTasks() so the sort is set before first render.
 */
function initSort() {
  currentSort = localStorage.getItem(SORT_KEY) || 'default';

  // Apply active class to the matching button
  document.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sort === currentSort);

    btn.addEventListener('click', () => {
      currentSort = btn.dataset.sort;
      localStorage.setItem(SORT_KEY, currentSort);

      // Update active class across all buttons
      document.querySelectorAll('.sort-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.sort === currentSort);
      });

      renderTasks();
    });
  });
}

/** Bind to-do input and button events. */
function initTodo() {
  document.getElementById('todo-add').addEventListener('click', addTask);
  document.getElementById('todo-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
  loadTasks();
}

// ============================================================
// ⑤ QUICK LINKS
// ============================================================

/** @type {{ id: number, name: string, url: string }[]} */
let links = [];

/**
 * Load links from localStorage.
 * Pre-loads defaults if localStorage is empty.
 */
function loadLinks() {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    links = raw ? JSON.parse(raw) : [];
  } catch {
    links = [];
  }

  if (links.length === 0) {
    links = [...DEFAULT_LINKS];
    saveLinks();
  }

  renderLinks();
}

/**
 * Serialize the links array to localStorage.
 */
function saveLinks() {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

/**
 * Re-render the links grid from the in-memory array.
 */
function renderLinks() {
  const grid = document.getElementById('links-grid');
  grid.innerHTML = '';
  links.forEach((link) => {
    grid.appendChild(createLinkElement(link));
  });
}

/**
 * Build an anchor element for a single link.
 * @param {{ id: number, name: string, url: string }} link
 * @returns {HTMLAnchorElement}
 */
function createLinkElement(link) {
  const anchor = document.createElement('a');
  anchor.href   = link.url;
  anchor.target = '_blank';
  anchor.rel    = 'noopener noreferrer';
  anchor.className = 'link-card';
  anchor.dataset.id = link.id;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = link.name;

  const del = document.createElement('button');
  del.className   = 'delete-link';
  del.textContent = '✕';
  del.setAttribute('aria-label', `Delete ${link.name}`);
  // Prevent anchor navigation when clicking delete
  del.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteLink(link.id);
  });

  anchor.appendChild(nameSpan);
  anchor.appendChild(del);
  return anchor;
}

/**
 * Add a new link from the form fields.
 * Validates that both name and URL are non-empty.
 * @param {Event} e
 */
function addLink(e) {
  e.preventDefault();
  const nameInput = document.getElementById('link-name');
  const urlInput  = document.getElementById('link-url');

  const name = nameInput.value.trim();
  let   url  = urlInput.value.trim();

  if (!name || !url) return;

  // Ensure the URL has a protocol so it opens correctly
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const newLink = { id: Date.now(), name, url };
  links.push(newLink);
  saveLinks();

  const grid = document.getElementById('links-grid');
  grid.appendChild(createLinkElement(newLink));

  nameInput.value = '';
  urlInput.value  = '';
  nameInput.focus();
}

/**
 * Delete a link by id.
 * @param {number} id
 */
function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  const card = document.querySelector(`#links-grid [data-id="${id}"]`);
  if (card) card.remove();
}

/** Bind quick-links form events. */
function initLinks() {
  document.getElementById('link-form').addEventListener('submit', addLink);
  loadLinks();
}

// ============================================================
// INIT — wire everything up on DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();    // Feature 1: light/dark toggle
  initName();     // Feature 2: custom name (sets userName before greeting runs)
  initGreeting(); // Clock starts after name is loaded
  initTimer();
  initSort();     // Feature 3: sort preference loaded before tasks render
  initTodo();
  initLinks();
});
