#!/usr/bin/env bash
# Copyright 2025 Asher Buk
# SPDX-License-Identifier: Apache-2.0
# https://github.com/AshBuk/FingerGo
#
# Script to test local builds for all platforms (where possible)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $*"; }

cd "$PROJECT_ROOT"

# Detect current OS
CURRENT_OS="$(uname -s)"
case "$CURRENT_OS" in
    Linux*)     PLATFORM="linux";;
    Darwin*)    PLATFORM="darwin";;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows";;
    *)          log_error "Unknown OS: $CURRENT_OS"; exit 1;;
esac

log_info "Detected platform: $PLATFORM"
log_info "Project root: $PROJECT_ROOT"
echo ""

# ============================================
# Pre-flight checks
# ============================================
log_step "Running pre-flight checks..."

if ! command -v wails &> /dev/null; then
    log_error "Wails CLI not found!"
    log_info "Install: go install github.com/wailsapp/wails/v2/cmd/wails@latest"
    exit 1
fi

if ! command -v go &> /dev/null; then
    log_error "Go not found!"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm not found!"
    exit 1
fi

log_info "✓ All required tools found"
echo ""

# ============================================
# Run tests
# ============================================
log_step "Running Go tests..."
if go test ./... -v; then
    log_info "✓ Go tests passed"
else
    log_error "✗ Go tests failed"
    exit 1
fi
echo ""

log_step "Running JavaScript tests..."
if npm test; then
    log_info "✓ JavaScript tests passed"
else
    log_error "✗ JavaScript tests failed"
    exit 1
fi
echo ""

# ============================================
# Lint checks
# ============================================
log_step "Running linters..."

if command -v golangci-lint &> /dev/null; then
    if golangci-lint run; then
        log_info "✓ Go lint passed"
    else
        log_error "✗ Go lint failed"
        exit 1
    fi
else
    log_warn "golangci-lint not found, skipping Go lint"
fi

if npm run lint; then
    log_info "✓ JavaScript lint passed"
else
    log_error "✗ JavaScript lint failed"
    exit 1
fi
echo ""

# ============================================
# License headers check
# ============================================
log_step "Checking license headers..."
if bash scripts/check-licenses.sh; then
    log_info "✓ License headers valid"
else
    log_error "✗ License headers check failed"
    exit 1
fi
echo ""

# ============================================
# Build for current platform
# ============================================
log_step "Building for current platform ($PLATFORM)..."

case "$PLATFORM" in
    linux)
        BUILD_TARGET="linux/amd64"
        ;;
    darwin)
        BUILD_TARGET="darwin/universal"
        ;;
    windows)
        BUILD_TARGET="windows/amd64"
        ;;
esac

log_info "Build target: $BUILD_TARGET"

if wails build -platform "$BUILD_TARGET" -clean; then
    log_info "✓ Build successful"
else
    log_error "✗ Build failed"
    exit 1
fi
echo ""

# ============================================
# Verify build artifacts
# ============================================
log_step "Verifying build artifacts..."

BUILD_OUTPUT="build/bin"
case "$PLATFORM" in
    linux)
        BINARY="fingergo"
        ;;
    darwin)
        BINARY="fingergo.app"
        ;;
    windows)
        BINARY="fingergo.exe"
        ;;
esac

if [ -e "$BUILD_OUTPUT/$BINARY" ]; then
    log_info "✓ Binary found: $BUILD_OUTPUT/$BINARY"
    ls -lh "$BUILD_OUTPUT/$BINARY"
else
    log_error "✗ Binary not found: $BUILD_OUTPUT/$BINARY"
    exit 1
fi
echo ""

# ============================================
# Optional: Cross-platform builds
# ============================================
if [ "$1" = "--all" ] 2>/dev/null; then
    log_step "Building for all platforms (cross-compilation)..."
    
    if [ "$PLATFORM" = "linux" ]; then
        log_info "Building Windows binary (cross-compile)..."
        wails build -platform windows/amd64 -clean || log_warn "Windows build failed"
        
        # macOS cross-compile from Linux is not officially supported
        log_warn "macOS build requires macOS host (skipping)"
    fi
    
    if [ "$PLATFORM" = "darwin" ]; then
        log_info "Building Linux binary (cross-compile)..."
        wails build -platform linux/amd64 -clean || log_warn "Linux build failed"
        
        log_info "Building Windows binary (cross-compile)..."
        wails build -platform windows/amd64 -clean || log_warn "Windows build failed"
    fi
fi
echo ""

# ============================================
# Summary
# ============================================
log_info "============================================"
log_info "✓ All checks passed!"
log_info "============================================"
log_info "Ready to push and create release tag"
log_info ""
log_info "Next steps:"
log_info "  1. Commit changes: git add . && git commit -m 'feat: ...'"
log_info "  2. Push to remote: git push origin <branch>"
log_info "  3. Create release: git tag -a v0.x.x -m 'Release v0.x.x'"
log_info "  4. Push tag: git push origin v0.x.x"
log_info ""
log_info "CI/CD will automatically build and publish release artifacts"

