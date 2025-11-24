<!--
Copyright 2025 Asher Buk
SPDX-License-Identifier: Apache-2.0
-->

## Internal Layer: Go 1.25+ (goroutines, embed, encoding/json)
## GUI Layer:      HTML5 + CSS3 + Vanilla JavaScript (ES6+)
## Desktop:        Wails v2 (webview wrapper, Go-JS bridge)
## Storage:        JSON files (texts, sessions, settings)
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
├── app/                       # Application layer (Wails bindings)
│   └── app.go                 # Main app struct (exports to GUI via Wails)
│
├── internal/                  # Internal layer (domain + storage)
│   ├── text.go                # Text, Category, TextLibrary models
│   ├── session.go             # TypingSession, SessionPayload models
│   ├── settings.go            # Settings model + defaults
│   ├── keyboard.go            # KeyboardLayout model
│   ├── stats.go               # Statistics models
│   └── storage/               # Persistence layer
│       ├── storage.go         # Storage manager + embedded defaults
│       ├── texts.go           # Text repository
│       ├── sessions.go        # Session repository
│       ├── settings.go        # Settings repository
│       └── paths.go           # XDG data directory paths
│
├── data/                      # User data (~/.local/share/fingergo/)
│   ├── texts/                 # Text library
│   │   ├── index.json         # Categories and text metadata
│   │   └── content/           # Text content files
│   │       └── {id}.txt
│   ├── sessions.json          # Typing session history
│   └── settings.json          # User preferences
│
├── gui/                       # GUI Layer
│   ├── dist/                  # Built assets (Wails embeds this, auto-generated)
│   ├── src/
│   │   ├── index.html
│   │   ├── styles/
│   │   │   ├── main.css
│   │   │   ├── modals.css
│   │   │   ├── keyboard.css
│   │   │   ├── theme-dark.css
│   │   │   └── theme-light.css
│   │   ├── js/
│   │   │   ├── events.js         # Event bus (pub/sub for module communication)
│   │   │   ├── utils.js          # Key normalization utilities
│   │   │   ├── layouts.js        # Keyboard layout registry system
│   │   │   ├── layouts/          # Modular keyboard layout definitions
│   │   │   │   └── en-qwerty.js  # EN QWERTY layout data
│   │   │   ├── keyboard.js       # Keyboard highlighting + finger mapping
│   │   │   ├── typing.js         # Typing engine (WPM, accuracy, mistakes)
│   │   │   ├── modals.js         # Modal dialogs (session summary, color settings)
│   │   │   ├── ui.js             # Text rendering and stats updates
│   │   │   ├── stats.js          # Statistics visualization
│   │   │   ├── colors.js         # Color customization manager
│   │   │   └── app.js            # Main app controller (orchestration)
│   │   ├── wailsjs/              # Auto-generated Wails runtime (not in repo)
│   │   │   └── runtime/
│   │   │       └── runtime.js    # Wails Go-JS bridge
│   │   └── assets/               # Static assets (TODO)
│   │       └── icons/            # Category icons (text, code languages)
│   └── package.json              # Optional (if using bundler)
│
└── build/                        # Build configurations
    └── linux/
    └── mac/



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
│   GUI LAYER      │◄──── Wails ──────►  │  INTERNAL LAYER      │
│  HTML/CSS/JS     │      Bridge         │         GO           │
└──────────────────┘                     └──────────────────────┘
        │                                            │
        │                                            │
        ├─ Core Infrastructure                       │
        │  ├─ EventBus (events.js)                   ├─ App API
        │  └─ LayoutRegistry (layouts.js)            │  └─ app.go (Wails bindings)                             │
        │                                            │
        ├─ UI Components                             ├─ Domain Models
        │  ├─ KeyboardUI (keyboard.js)               │  ├─ internal/text.go                                      │  │ 
        │  ├─ TypingEngine (typing.js)               │  ├─ internal/session.go                                   │  │
        │  ├─ ModalManager (modals.js)               │  ├─ internal/settings.go                                  │  │
        │  ├─ UIManager (ui.js)                      │  ├─ internal/keyboard.go                                  │  │
        │  ├─ StatsManager (stats.js)                │  └─ internal/stats.go                                     │
        │  └─ ColorManager (colors.js)               │
        │                                            ├─ Storage Layer
        ├─ Layout Data                               │  ├─ storage/storage.go                                   │  │
        │  └─ layouts/en-qwerty.js                   │  ├─ storage/texts.go                                     │  │
        │                                            │  ├─ storage/sessions.go                                  │  │
        └─ Orchestration                             │  ├─ storage/settings.go
           └─ app.js (main controller)               │  └─ storage/paths.go
                                                     ▼
                                          ┌────────────────────────┐
                                          │   FILE STORAGE         │
                                          │ ~/.local/share/fingergo│
                                          └────────────────────────┘
                                                     │
                                         ┌───────────┼───────────┐
                                         │           │           │
                                         ▼           ▼           ▼
                                      texts/   sessions.json  settings.json
                                    (library)   (history)    (preferences)
```

### Frontend vs. Backend Responsibilities
FingerGo's architecture leverages the Wails framework, which provides a bridge between a Go backend and a web frontend (HTML/CSS/JS). This allows for a flexible division of responsibilities.

Due to the critical need for immediate UI responsiveness in a typing application, the core typing engine logic, keyboard interaction (highlighting, input processing), and real-time statistics calculation (WPM, accuracy during a session) are primarily implemented in the **GUI Layer (JavaScript)**. This ensures minimal latency and a fluid user experience.

**GUI**
*   `gui/src/js/keyboard.js`: Handles virtual keyboard rendering, key state, and visual feedback.
*   `gui/src/js/typing.js`: Orchestrates the typing session, manages text progression, and tracks immediate typing performance.
*   `gui/src/js/stats.js`: Performs real-time calculation and display of typing statistics within a session.

**Internal Layer**
*   **Text Library Management:** Loading text content and metadata from `texts/` directory via `TextRepository`.
*   **Session Data Storage:** Persisting completed typing sessions to `sessions.json` via `SessionRepository`.
*   **Settings Management:** User preferences (theme, zenMode, showKeyboard) persisted in `settings.json` via `SettingsRepository`.
*   **Keyboard Layout Management:** Managing, loading, and serving keyboard layout definitions from Go backend for dynamic and extendable layout support.