# Changelog

All notable changes to FingerGo will be documented in this file.

## [1.2.1] - 2026-03-09

### Changed
- Update Wails framework v2.10.2 → v2.11.0
- Flatpak offline build (no network access during build)
- Add Go module sources generator for Flatpak builds
- Add explicit OARS 1.1 content rating metadata

## [1.2.0] - 2026-02-08

Multiple keyboard layout support.

### Added
- Dynamic keyboard layout switching with layout selector modal
- English Dvorak keyboard layout
- Russian JCUKEN keyboard layout with Unicode/Cyrillic input support
- German QWERTZ keyboard layout
- Keyboard layout preference persistence across sessions

### Fixed
- Backspace now clears error state in typing display

## [1.1.2] - 2025-01-26

Session UX improvements.

### Fixed
- Remove redundant `renderText` call on typing start, this fix cursor jump when starting to type from middle of text and optimize perf

### Added
- Restore last opened text on app startup via `lastTextId` setting
- Add visible highlight for Enter key in text display

## [1.1.1] - 2025-12-30

Flatpak metadata patch.

## [1.1.0] - 2025-12-27

Stability and performance improvements.

### Fixed
- Session stats modal now shows current session data on Esc
- Strict mode setting now persists between sessions

### Changed
- Strict mode enabled by default (cheat mode is opt-in)
- GPU-accelerated sidebar animation for smoother transitions

## [1.0.0] - 2025-12-02

Stable cross-platform release.

### Added
- Clean interface design
- Keyboard shortcuts, Zen mode, keyboard/stats toggle
- Real-time visual keyboard with finger mapping
- Hierarchical text/code library (plain text and code samples)
- Live stats: WPM, CPM, accuracy, per-key mistakes, session history
- Eye-friendly Dark/Light themes
- Customizable color theme
- Cross-platform support: Linux, macOS, Windows
- Flatpak and tar builds for Linux
- DMG installer for macOS (Universal binary - Intel and Apple Silicon)
- Portable ZIP for Windows