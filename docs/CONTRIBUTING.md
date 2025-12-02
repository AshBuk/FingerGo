# Contributing to FingerGo

I considered using Svelte, which would be ideal for this type of application, but:

**GUI**
This project uses a **classic vanilla JavaScript approach** (circa 2010-2015) without modern frameworks like React/Vue or build tools like Webpack/Vite.

Paradigm: Procedural code with functional patterns.

Why?
- Zero frontend dependencies
- Simple and maintainable for a desktop app
- Fast performance without virtual DOM overhead

**INTERNAL**
Go backend with Repository Pattern and Domain-Driven Design.

Paradigm: Interface-based dependency injection with idiomatic Go.

Why?
- Clean separation of concerns (domain, storage, app layers)
- Testable code through interface abstractions
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
