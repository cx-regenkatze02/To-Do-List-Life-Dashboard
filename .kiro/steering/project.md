# Life Dashboard — Project Steering

## Project Overview
A To-Do List Life Dashboard built as a standalone web page.
No frameworks, no backend, no build tools — just HTML, CSS, and vanilla JavaScript.

## Tech Stack
- **HTML** — semantic structure (`header`, `main`, `section`, `footer`)
- **CSS** — custom properties, CSS Grid + Flexbox, responsive at 768px breakpoint
- **JavaScript** — vanilla JS, no libraries or frameworks
- **Storage** — browser `localStorage` only, no server required

## Folder Structure
```
KiroProjects/
├── index.html          # Main entry point
├── css/
│   └── style.css       # All styles (one file only)
└── js/
    └── app.js          # All JavaScript (one file only)
```

## Features
1. **Greeting** — live clock (updates every second), current date, time-based greeting
2. **Focus Timer** — 25-minute Pomodoro countdown with Start / Stop / Reset
3. **To-Do List** — add, inline-edit (double-click), complete, delete; sorted by Default / A→Z / Z→A / Done Last
4. **Quick Links** — add/delete link cards that open in a new tab; defaults: Google, YouTube, GitHub
5. **Light / Dark mode** — toggle button in the header, preference saved to localStorage
6. **Custom name** — ✏️ button lets the user set their name in the greeting (e.g. "Good Morning, Alex ☀️")

## localStorage Keys
| Key                | Purpose                        |
|--------------------|-------------------------------|
| `dashboard_tasks`  | Saved to-do list tasks         |
| `dashboard_links`  | Saved quick links              |
| `dashboard_theme`  | Light or dark preference       |
| `dashboard_username` | User's display name          |
| `dashboard_sort`   | Active task sort preference    |

## Coding Conventions
- CSS custom properties (variables) defined in `:root` for all colors and spacing
- Light theme overrides defined under `html[data-theme="light"]`
- JS functions are single-responsibility and clearly commented
- Sort operations always use a `[...tasks]` spread copy — the source array is never mutated
- No inline styles; all styling lives in `style.css`

## Accessibility
- Semantic HTML elements used throughout
- All icon buttons have `aria-label` attributes
- Active sort button contrast ratio meets WCAG AA (≥4.5:1)
- Keyboard-navigable: Enter to add tasks/links, Escape to cancel edits

## Browser Compatibility
Works in all modern browsers: Chrome, Firefox, Edge, Safari.
Can be used as a standalone web app or set as a browser homepage.
