<h1 align="center">FingerGo</h1>

<p align="center">
  <a href="https://github.com/AshBuk/FingerGo/actions/workflows/ci.yml"><img src="https://github.com/AshBuk/FingerGo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/AshBuk/FingerGo/releases"><img src="https://img.shields.io/badge/Windows-available-blue?logo=windows" alt="Windows"></a>
  <a href="https://github.com/AshBuk/FingerGo/releases"><img src="https://img.shields.io/badge/macOS-available-blue?logo=apple" alt="macOS"></a>
  <a href="https://github.com/AshBuk/FingerGo/releases"><img src="https://img.shields.io/badge/Linux-available-blue?logo=linux&logoColor=white" alt="Linux"></a>
  <a href="https://flathub.org/apps/io.github.AshBuk.FingerGo"><img src="https://img.shields.io/flathub/v/io.github.AshBuk.FingerGo" alt="Flathub"></a>
  <a href="https://github.com/AshBuk/FingerGo/releases"><img src="https://img.shields.io/github/v/release/AshBuk/FingerGo?sort=semver" alt="Release"></a>
</p>

<img src="fingergo.png" alt="FingerGo cross-platform touch-typing trainer modern app" width="400" align="right">

FingerGo is a **cross-platform touch-typing trainer**, designed to improve typing speed and accuracy, with a user-friendly and intuitive interface.  
It includes real-time keyboard visualization, a hierarchical text and code library, and live statistics tracking.  
Built with Go ↔ Wails ↔ Vanilla JavaScript (ES6+). Available for **Linux, macOS, and Windows**.

### Features
▸ **Clean Interface Design**

▸ **Shortcuts, Zen Mode, keyboard/Stat Toggle** 

▸ **Real-time visual keyboard with finger mapping**  

▸ **Hierarchical text/code library (plain text and code samples)**  

▸ **Live stats: WPM, CPM, accuracy, per‑key mistakes**  

▸ **Eye-friendly Dark/Light themes**

▸ **Customizable color theme**

## Screenshots

<p align="center">
  <img src="screen/fingergo-screen.png" alt="FingerGo main interface" width="800">
</p>

## Installation

### 🪟 Windows [Release](https://github.com/AshBuk/FingerGo/releases/latest)

**Portable:**
1. Download `FingerGo-{VERSION}-x64-portable.zip`
2. Extract and run `FingerGo.exe`

**Requirements:** Windows 10/11 with WebView2 (auto-downloads if missing)

### 🍎 macOS [Release](https://github.com/AshBuk/FingerGo/releases/latest)

**DMG:**
1. Download `FingerGo-{VERSION}-universal.dmg`
2. Open DMG and drag FingerGo to Applications
3. **First launch:** Right-click → Open (bypasses Gatekeeper if unsigned)

**Supports:** Intel and Apple Silicon (Universal binary)

### 🐧 Linux

**Flatpak (recommended):**

<a href="https://flathub.org/apps/io.github.AshBuk.FingerGo">
  <img src="https://flathub.org/api/badge?locale=en" width="190" alt="Get it on Flathub">
</a>

```bash
flatpak install flathub io.github.AshBuk.FingerGo
flatpak run io.github.AshBuk.FingerGo
```

**Portable (tar.gz):** [Release](https://github.com/AshBuk/FingerGo/releases/latest)
```bash
# Requires WebKit2GTK 4.1 installed on your system.
tar -xzf FingerGo-{VERSION}-linux-x86_64.tar.gz
./FingerGo    # or run install.sh for desktop integration
```

---

## Tech Stack

  <a href="https://pkg.go.dev/github.com/AshBuk/FingerGo"><img src="https://pkg.go.dev/badge/github.com/AshBuk/FingerGo.svg" alt="Go Reference"></a>
  <a href="https://goreportcard.com/report/github.com/AshBuk/FingerGo"><img src="https://goreportcard.com/badge/github.com/AshBuk/FingerGo" alt="Go Report Card"></a>
  <img src="https://img.shields.io/badge/Vanilla_JS-No_Framework-yellow?logo=javascript&logoColor=000" alt="Vanilla JavaScript">

```
┌──────────────────────┐                    ┌────────────────────────┐
│   GUI LAYER          │◄──── Wails ───────►│  INTERNAL LAYER        │
│   HTML/CSS/JS        │      Bridge        │  Go 1.25+              │
└──────────────────────┘                    └────────────────────────┘
         │                                              │
    Event-Driven                                   Layered
         │                                              │
    ┌────┴─────┐                                   ┌────┴─────┐
    │ EventBus │                                   │ Concrete │
    │ (pub/sub)│                                   │ Repos    │
    └────┬─────┘                                   └────┬─────┘
         │                                              │
    Modular JS                                    Domain Models
                                                         │
                                                         ▼
                                           ┌─────────────────────┐
                                           │ JSON Storage        │
                                           │ ~/.local/share/...  │
                                           └─────────────────────┘
```

- **Backend:** [Go](https://github.com/golang/go) 1.25+ with concrete repositories
- **Bridge:** [Wails v2](https://github.com/wailsapp/wails) provides Go↔JS communication
- **Frontend:** Vanilla [JavaScript](https://github.com/tc39/ecma262) (ES6+) with Event-Driven Architecture (pub/sub EventBus)
- **Storage:** JSON files in XDG directories
- **Platforms:** [Linux](https://kernel.org/), [macOS](https://www.apple.com/macos/), [Windows](https://www.microsoft.com/windows/)

## For Developers

- [Technical design](docs/tech-design/)
- [Architecture overview](docs/tech-design/architecture.md)
- [Makefile](Makefile)
- [Contributing](docs/CONTRIBUTING.md)
- [ashbuk.hashnode.dev](https://ashbuk.hashnode.dev/fingergo) Architecture Dive

## Acknowledgments
- [ATTRIBUTION.md](docs/ATTRIBUTION.md)
- [Wails](https://wails.io/)

## Apache 2.0 [LICENSE](LICENSE)

If you use this project, please link back to this repo and ⭐ it if it helped you.

## Sponsor

[![Sponsor](https://img.shields.io/badge/Sponsor-💖-pink?style=for-the-badge&logo=github)](https://github.com/sponsors/AshBuk) [![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=R3HZH8DX7SCJG)

Please consider supporting development
