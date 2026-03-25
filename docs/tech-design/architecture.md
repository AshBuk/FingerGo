<!--
Copyright 2025 Asher Buk
SPDX-License-Identifier: Apache-2.0
-->

#### Internal Layer: Go 1.25+ (goroutines, embed, encoding/json)
#### GUI Layer:      HTML5 + CSS3 + Vanilla JavaScript (ES6+)
#### Desktop:        Wails v2 (webview wrapper, Go-JS bridge)
#### Storage:        JSON files (texts, sessions, settings)
#### Platforms:      Linux, macOS, Windows (cross-platform)
#### Language:       English (UI and documentation)


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
│   ├── domain/                # Domain models
│   │   ├── text.go            # Text, Category, TextLibrary models
│   │   ├── session.go         # TypingSession, SessionPayload models
│   │   └── settings.go        # Settings model + defaults
│   └── storage/               # Persistence layer implementations
│       ├── storage.go         # Storage manager + embedded defaults
│       ├── texts.go           # Text repository implementation
│       ├── texts_validate.go  # Text validation logic
│       ├── sessions.go        # Session repository implementation
│       ├── settings.go        # Settings repository implementation
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
│   │   │   ├── library.css
│   │   │   ├── theme-dark.css
│   │   │   └── theme-light.css
│   │   ├── js/
│   │   │   ├── events.js         # Event bus (pub/sub for module communication)
│   │   │   ├── utils.js          # Key normalization + HTML escaping utilities
│   │   │   ├── constants.js      # Application-wide constants
│   │   │   ├── layouts.js        # Keyboard layout registry system
│   │   │   ├── layouts/          # Modular keyboard layout definitions
│   │   │   │   └── en-qwerty.js  # EN QWERTY layout data
│   │   │   ├── keyboard.js       # Keyboard highlighting + finger mapping
│   │   │   ├── typing.js         # Typing engine (WPM, accuracy, mistakes)
│   │   │   ├── modals/           # Modal dialog components
│   │   │   │   ├── core.js           # Base modal (overlay, ESC, close)
│   │   │   │   ├── session-summary.js # Post-session statistics
│   │   │   │   ├── color-settings.js  # Color theme editor
│   │   │   │   ├── text-editor.js     # Text creation/editing
│   │   │   │   ├── settings.js        # Application settings
│   │   │   │   └── error.js           # Error notifications
│   │   │   ├── ui.js             # Text rendering and stats updates
│   │   │   ├── stats.js          # Statistics visualization
│   │   │   ├── session.js        # Session state management
│   │   │   ├── library.js        # Text library management
│   │   │   ├── colors.js         # Color customization manager
│   │   │   ├── settings.js       # Application settings manager
│   │   │   ├── shortcuts.js      # Keyboard shortcuts handler
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
        │  └─ LayoutRegistry (layouts.js)            │  └─ app.go (Wails bindings)
        │                                            │
        ├─ UI Components                             ├─ Domain Models
        │  ├─ KeyboardUI (keyboard.js)               │  ├─ domain/text.go
        │  ├─ TypingEngine (typing.js)               │  ├─ domain/session.go
        │  ├─ Modals (modals/*.js)                   │  └─ domain/settings.go
        │  │  ├─ Core (core.js)                      │
        │  │  ├─ SessionSummary                      │
        │  │  ├─ ColorSettings                       ├─ Storage Layer
        │  │  ├─ TextEditor                          │  ├─ storage/storage.go
        │  │  ├─ Settings                            │  ├─ storage/texts.go
        │  │  └─ Error                               │  ├─ storage/texts_validate.go
        │  ├─ UIManager (ui.js)                      │  ├─ storage/sessions.go
        │  ├─ StatsManager (stats.js)                │  ├─ storage/settings.go
        │  ├─ SessionManager (session.js)            │  └─ storage/paths.go
        │  ├─ LibraryManager (library.js)            │
        │  ├─ ColorManager (colors.js)               │
        │  ├─ SettingsManager (settings.js)          │
        │  └─ ShortcutsManager (shortcuts.js)        │
        │                                            │
        ├─ Layout Data                               │
        │  └─ layouts/en-qwerty.js                   │
        │                                            │
        └─ Orchestration                             │
           └─ app.js (main controller)               │
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

### Frontend vs. Backend Responsibilities
FingerGo's architecture leverages the Wails framework, which provides a bridge between a Go backend and a web frontend (HTML/CSS/JS). This allows for a flexible division of responsibilities.

Due to the critical need for immediate UI responsiveness in a typing application, the core typing engine logic, keyboard interaction (highlighting, input processing), and real-time statistics calculation (WPM, accuracy during a session) are primarily implemented in the **GUI Layer (JavaScript)**. This ensures minimal latency and a fluid user experience.

**GUI**
*   `gui/src/js/keyboard.js`: Handles virtual keyboard rendering, key state, and visual feedback.
*   `gui/src/js/typing.js`: Orchestrates the typing session, manages text progression, and tracks immediate typing performance.
*   `gui/src/js/stats.js`: Performs real-time calculation and display of typing statistics within a session.
*   `gui/src/js/modals/`: Modular modal dialog system with base functionality (`core.js`) and specialized modals (session summary, color settings, text editor, settings, error notifications).

**Internal Layer**
*   **Domain Models (`internal/domain/`):**
    *   `text.go`: Text, Category, and TextLibrary domain models.
    *   `session.go`: TypingSession and SessionPayload domain models.
    *   `settings.go`: Settings domain model with defaults.
*   **Storage Layer (`internal/storage/`):**
    *   `storage.go`: Storage manager that orchestrates all repositories and provides embedded defaults.
    *   `texts.go`: `TextRepository` — loads text content and metadata from the `texts/` directory with lazy loading and caching.
    *   `texts_validate.go`: Text validation logic (ID uniqueness, category validation, etc.).
    *   `sessions.go`: `SessionRepository` — persists completed typing sessions to `sessions.json` with limited history.
    *   `settings.go`: `SettingsRepository` — persists user preferences (theme, zenMode, showKeyboard) in `settings.json`.
    *   `paths.go`: XDG data directory path management for cross-platform data storage.