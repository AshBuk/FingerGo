# Contributing to FingerGo

Thank you for your interest to FingerGo!

## Before You Start

- **For features** (not bug fixes or small PRs): please open an issue first to discuss the idea before sending a pull request.
- **Stay in scope:** any new contribution must fit the scope and goals of the project.
- AI-assisted contributions accepted **if author understands and can defend the code**.

 • **GUI** • 

I considered using Svelte, which would be ideal for this type of application, but:
This project uses a **classic vanilla JavaScript approach** without modern frameworks like React/Vue or build tools like Webpack/Vite.

Paradigm: Procedural code with functional patterns.

Why?
- Zero frontend dependencies
- Simple and maintainable for a desktop app
- Fast performance without virtual DOM overhead

 • **INTERNAL** • 

Go backend with concrete repository types and domain models.

Paradigm: Straightforward layered architecture with idiomatic Go.

Why?
- Clean separation of concerns (domain models, storage, app layers)
- Minimal indirection — app layer uses concrete `*storage.XxxRepository` types directly
- Simple JSON file storage (no database needed)
- Type safety and performance of Go

## Development Setup

**Prerequisites:**
- Go 1.25+
- Node.js 20+
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Platform-specific:
  - **Linux:** `libgtk-3-dev libwebkit2gtk-4.1-dev`
  - **macOS:** Xcode Command Line Tools
  - **Windows:** WebView2 runtime (auto-installed)

**Quick Start:**
```bash
make deps           # Install all dependencies (Go + JS)
make dev            # Start development mode with hot reload
```

**Development Commands:**
```bash
make dev            # Start development mode with hot reload
wails dev           # Alternative: direct Wails command
make fmt            # Format all code (Go + JS)
make lint           # Lint all code (Go + JS)
make test           # Run all tests (Go + JS)
make build          # Build production binary
```

## CI Requirements

PRs must pass :
- **Go tests** (`go test -race ./...`)
- **Go linting** (`golangci-lint`, `go vet`)
- **JavaScript tests** (`npm test`)
- **JavaScript linting** (`npm run lint`)
- **Code formatting** (`make fmt`)
- **License headers** (`bash scripts/check-licenses.sh`)
- **Build verification** (`wails build`)
