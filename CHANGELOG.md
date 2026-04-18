# Changelog

All notable changes to FingerGo will be documented in this file.

## [1.2.6] - 2026-04-18

### Security
- Bump Go dependencies
- Add `SECURITY.md` with a private vulnerability reporting channel

## [1.2.5] - 2026-04-13

### Added
- Text zoom controls (± buttons in right panel, Ctrl++/−/0 shortcuts) with persistence
- Reduced tab indentation width from 8 to 4 spaces in text display

## [1.2.4] - 2026-03-24

### Added
- French AZERTY keyboard layout (ISO 105-key)
- ISO keyboard geometry with shorter left Shift and extra key between Shift and first letter
- Auto-registration of keyboard layouts from window globals

### Fixed
- German QWERTZ layout: add missing ISO key (</>)

## [1.2.3] - 2026-03-19

### Enhanced
- Published on [Flathub](https://flathub.org/apps/io.github.AshBuk.FingerGo)
- Refined Linux tar release: include install/uninstall scripts, icon, and .desktop entry for desktop integration (app menu, launcher)

## [1.2.2] - 2026-03-10

### Changed
- Move desktop and metainfo files to project root
- Upgrade GNOME runtime 48 → 49
- Simplify OARS content rating metadata

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