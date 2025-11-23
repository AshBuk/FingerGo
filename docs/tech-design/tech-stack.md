<!--
Copyright 2025 Asher Buk
SPDX-License-Identifier: Apache-2.0
-->

## Backend:  Go 1.25+ (goroutines, embed, encoding/json)
## Frontend: HTML5 + CSS3 + Vanilla JavaScript (ES6+)
## Desktop:  Wails v2 (webview wrapper, Go-JS bridge)
## Storage:  JSON files (texts, stats, config)
## Package:  Flatpak (Linux native distribution)
## Language: English (UI and documentation)


---

## Project Structure
```
fingergo/
├── main.go                      # Wails app entry point
├── wails.json                   # Wails configuration
├── go.mod
├── go.sum
├── README.md
├── LICENSE
│
├── app/                         # Go backend logic
│   ├── app.go                  # Main app struct (Wails bindings)
│   ├── text_manager.go         # Text loading/saving/import
│   ├── stats_manager.go        # Statistics tracking
│   └── keyboard_layouts.go     # Keyboard layout data (EN only)
│
├── internal/
│   └── models/
│       ├── text.go             # Text, Category structs
│       ├── session.go          # TypingSession struct
│       ├── keyboard.go         # KeyboardLayout struct
│       └── stats.go            # Statistics models
│
├── data/                        # User data (runtime, not in repo)
│   ├── texts/                  # User's text library (folders/subfolders)
│   │   └── .gitkeep
│   ├── stats.json              # All typing sessions
│   └── config.json             # User settings
│
├── frontend/                    # Web UI
│   ├── dist/                   # Built assets (Wails embeds this, auto-generated)
│   ├── src/
│   │   ├── index.html
│   │   ├── styles/
│   │   │   ├── main.css
│   │   │   ├── modals.css
│   │   │   ├── keyboard.css
│   │   │   ├── theme-dark.css
│   │   │   └── theme-light.css
│   │   ├── js/
│   │   │   ├── events.js       # Event bus (pub/sub for module communication)
│   │   │   ├── utils.js        # Key normalization utilities
│   │   │   ├── layouts.js      # Keyboard layout registry system
│   │   │   ├── layouts/        # Modular keyboard layout definitions
│   │   │   │   └── en-qwerty.js  # EN QWERTY layout data
│   │   │   ├── keyboard.js     # Keyboard highlighting + finger mapping
│   │   │   ├── typing.js       # Typing engine (WPM, accuracy, mistakes)
│   │   │   ├── modals.js       # Modal dialogs (session summary, color settings)
│   │   │   ├── ui.js           # Text rendering and stats updates
│   │   │   ├── stats.js        # Statistics visualization
│   │   │   ├── settings.js     # Settings management
│   │   │   └── app.js          # Main app controller (orchestration)
│   │   ├── wailsjs/            # Auto-generated Wails runtime (not in repo)
│   │   │   └── runtime/
│   │   │       └── runtime.js  # Wails Go-JS bridge
│   │   └── assets/             # Static assets (TODO)
│   │       └── icons/          # Category icons (text, code languages)
│   └── package.json            # Optional (if using bundler)
│
└── build/                       # Build configurations
    └── linux/
        ├── fingerg.desktop
        └── flatpak.yml
```

---

## Architecture Overview

### High-Level Component Diagram
```
┌────────────────────────────────────────────────────────────────┐
│                          FingerGo                              │
│                     (Wails Desktop App)                        │
└────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
        ▼                                            ▼
┌──────────────────┐                     ┌──────────────────────┐
│  FRONTEND (UI)   │◄──── Wails ────────►│   BACKEND (Go)       │
│  HTML/CSS/JS     │      Bridge         │   Business Logic     │
└──────────────────┘                     └──────────────────────┘
        │                                            │
        │                                            │
        ├─ Core Infrastructure                       ├─ App Layer
        │  ├─ EventBus (events.js)                   │  └─ app.go (Wails bindings)
        │  └─ LayoutRegistry (layouts.js)            │
        │                                            ├─ Models (internal/models/)
        ├─ UI Components                             │  ├─ text.go
        │  ├─ KeyboardUI (keyboard.js)               │  ├─ session.go
        │  ├─ TypingEngine (typing.js)               │  ├─ keyboard.go
        │  ├─ ModalManager (modals.js)               │  └─ stats.go
        │  ├─ UIManager (ui.js)                      │
        │  ├─ StatsManager (stats.js)                ├─ Managers
        │  └─ SettingsManager (settings.js)          │
        │                                            │  ├─ TextManager
        ├─ Layout Data                               │  ├─ StatsManager
        │  └─ layouts/en-qwerty.js                   │  └─ KeyboardLayouts
        │                                            │
        └─ Orchestration                             ▼
           └─ app.js (main controller)   ┌────────────────────────┐
                                         │   FILE STORAGE         │
                                         │   (User Data Dir)      │
                                         └────────────────────────┘
                                                      │
                                      ┌───────────────┼────────────────┐
                                      │               │                │
                                      ▼               ▼                ▼
                                  texts/         stats.json      config.json
                                (folders)      (sessions)       (settings)