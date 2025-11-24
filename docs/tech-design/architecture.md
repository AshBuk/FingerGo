<!--
Copyright 2025 Asher Buk
SPDX-License-Identifier: Apache-2.0
-->

## Internal Layer: Go 1.25+ (goroutines, embed, encoding/json)
## GUI Layer:      HTML5 + CSS3 + Vanilla JavaScript (ES6+)
## Desktop:        Wails v2 (webview wrapper, Go-JS bridge)
## Storage:        JSON files (texts, stats, config)
## Package:        Flatpak (Linux native distribution)
## Language:       English (UI and documentation)


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
├── app/                         # Application layer (Wails bindings)
│   └── app.go                  # Main app struct (exports to GUI via Wails)
│
├── internal/                    # Internal layer (domain + storage)
│   ├── domain/                 # Core domain models
│   │   ├── text.go            # Text, Category models
│   │   ├── session.go         # TypingSession model
│   │   ├── keyboard.go        # KeyboardLayout model
│   │   └── stats.go           # Statistics models
│   └── storage/                # Persistence layer
│       ├── manager.go         # Storage manager
│       ├── texts.go           # Text repository
│       ├── sessions.go        # Session repository
│       ├── paths.go           # Data directory paths
│       └── defaults.go        # Embedded defaults
│
├── data/                        # User data (runtime, not in repo)
│   ├── texts/                  # User's text library (folders/subfolders)
│   │   └── .gitkeep
│   ├── stats.json              # All typing sessions
│   └── config.json             # User settings
│
├── gui/                         # GUI Layer
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
│   │   │   ├── colors.js       # Color customization manager
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
│   GUI LAYER      │◄──── Wails ────────►│  INTERNAL LAYER      │
│  HTML/CSS/JS     │      Bridge         │   Business Logic     │
└──────────────────┘                     └──────────────────────┘
        │                                            │
        │                                            │
        ├─ Core Infrastructure                       ├─ App API
        │  ├─ EventBus (events.js)                   │  └─ app.go (Wails bindings)
        │  └─ LayoutRegistry (layouts.js)            │
        │                                            ├─ Domain Models
        ├─ UI Components                             │  ├─ domain/text.go
        │  ├─ KeyboardUI (keyboard.js)               │  ├─ domain/session.go
        │  ├─ TypingEngine (typing.js)               │  ├─ domain/keyboard.go
        │  ├─ ModalManager (modals.js)               │  └─ domain/stats.go
        │  ├─ UIManager (ui.js)                      │
        │  ├─ StatsManager (stats.js)                ├─ Storage Layer
        │  └─ ColorManager (colors.js)               │  ├─ storage/manager.go
        │                                            │  ├─ storage/texts.go
        ├─ Layout Data                               │  └─ storage/sessions.go
        │  └─ layouts/en-qwerty.js                   │
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