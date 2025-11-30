<h1 align="center">FingerGo</h1>

<img src="fingergo.png" alt="FingerGo cross-platform touch-typing trainer modern app" width="400" align="right">

#### FingerGo is a minimalist **cross-platform touch-typing trainer**, designed to improve typing speed and accuracy, with a user-friendly and intuitive interface.  
#### It includes real-time keyboard visualization, a hierarchical text and code library, and live statistics tracking for WPM, CPM, and accuracy.  
#### Built with Go ↔ Wails ↔ Vanilla JavaScript (ES6+). Available for **Linux, macOS, and Windows**.

### Features
▸  Real-time visual keyboard with finger mapping  
▸  Hierarchical **text/code library** (plain text and code samples)  
▸  Live stats: **WPM, CPM, accuracy, per‑key mistakes, session history**  
▸ **Dark/Light theme, Shortcuts, Zen Mode, keyboard Toggle**  
▸ **Clean Interface Design**

## Installation

### 🐧 Linux

**Download from [Releases](https://github.com/AshBuk/FingerGo/releases/latest):**

```bash
# Option 1: Tarball (all distros)
tar -xzf FingerGo-Linux-amd64.tar.gz
chmod +x fingergo
./fingergo

# Option 2: DEB package (Debian/Ubuntu) - Coming soon
# sudo dpkg -i FingerGo-Linux-amd64.deb

# Option 3: RPM package (Fedora/RHEL) - Coming soon
# sudo rpm -i FingerGo-Linux-amd64.rpm
```

### 🍎 macOS

**Download from [Releases](https://github.com/AshBuk/FingerGo/releases/latest):**

1. Download `FingerGo-macOS-universal.dmg`
2. Open DMG and drag FingerGo to Applications folder
3. **First launch:** Right-click → Open (bypasses Gatekeeper if not notarized)

**Supports:** Intel and Apple Silicon (Universal binary)

### 🪟 Windows

**Download from [Releases](https://github.com/AshBuk/FingerGo/releases/latest):**

```powershell
# Option 1: MSI Installer (recommended)
# Double-click FingerGo-Windows-amd64.msi and follow wizard

# Option 2: Portable ZIP
# Extract FingerGo-Windows-amd64.zip and run fingergo.exe
```

**Requirements:** Windows 10/11 with WebView2 (auto-downloads if missing)

---

## Tech Stack

- **Backend:** Go 1.25+
- **Desktop Framework:** Wails v2
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage:** JSON files
- **Platforms:** Linux, macOS, Windows

## For Developers

- [Technical design](docs/tech-design/)
- [Architecture overview](docs/tech-design/architecture.md)
- [Makefile](Makefile) — build, test, lint commands
- [Contributing](docs/CONTRIBUTING.md)

## Acknowledgments

- Built with [Wails](https://wails.io/)

## Apache 2.0 [LICENSE](LICENSE)

If you use this project, please link back to this repo and ⭐ it if it helped you.

Sharing with the Linux community

## Sponsor

[![Sponsor](https://img.shields.io/badge/Sponsor-💖-pink?style=for-the-badge&logo=github)](https://github.com/sponsors/AshBuk) [![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=R3HZH8DX7SCJG)

Please consider supporting development
