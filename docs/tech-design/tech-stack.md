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
│   ├── dist/                   # Built assets (Wails embeds this)
│   ├── src/
│   │   ├── index.html
│   │   ├── styles/
│   │   │   ├── main.css
│   │   │   ├── keyboard.css
│   │   │   ├── theme-dark.css
│   │   │   └── theme-light.css
│   │   ├── js/
│   │   │   ├── app.js          # Main app controller
│   │   │   ├── keyboard.js     # Keyboard highlighting + finger mapping
│   │   │   ├── typing.js       # Typing engine (WPM, accuracy, mistakes)
│   │   │   ├── ui.js           # UI rendering and updates
│   │   │   ├── stats.js        # Statistics visualization
│   │   │   └── settings.js     # Settings management
│   │   └── assets/
│   │       └── icons/          # Category icons (text, code languages)
│   └── package.json             # Optional (if using bundler)
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
│                          FingerGo                               │
│                     (Wails Desktop App)                         │
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
        ├─ Components                                ├─ Managers
        │  ├─ Keyboard                               │  ├─ TextManager
        │  ├─ Typing Area                            │  ├─ StatsManager
        │  ├─ Text Library                           │  └─ KeyboardLayouts
        │  ├─ Statistics                             │
        │  └─ Settings                               │
                                                     │
                                                     ▼
                                        ┌────────────────────────┐
                                        │   FILE STORAGE         │
                                        │   (User Data Dir)      │
                                        └────────────────────────┘
                                                     │
                                     ┌───────────────┼────────────────┐
                                     │               │                │
                                     ▼               ▼                ▼
                                 texts/         stats.json      config.json
                               (folders)      (sessions)       (settings)