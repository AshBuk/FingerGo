#!/usr/bin/env bash
# Copyright 2025 Asher Buk
# SPDX-License-Identifier: Apache-2.0
# https://github.com/AshBuk/FingerGo
#
# Script to generate application icons for all platforms from source PNG
# Requires: ImageMagick (convert), iconutil (macOS only for .icns)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_ICON="$PROJECT_ROOT/fingergo.png"
BUILD_DIR="$PROJECT_ROOT/build"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Check if source icon exists
if [[ ! -f "$SOURCE_ICON" ]]; then
    log_error "Source icon not found: $SOURCE_ICON"
    exit 1
fi

log_info "Generating application icons from: $SOURCE_ICON"

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    log_error "ImageMagick (convert) is required but not installed"
    log_info "Install on:"
    log_info "  Ubuntu/Debian: sudo apt-get install imagemagick"
    log_info "  macOS: brew install imagemagick"
    log_info "  Fedora: sudo dnf install ImageMagick"
    exit 1
fi

mkdir -p "$BUILD_DIR"

# ============================================
# Generate Windows .ico file
# ============================================
log_info "Generating Windows icon (.ico)..."

ICO_OUTPUT="$BUILD_DIR/appicon.ico"

# Windows ICO supports multiple resolutions in one file
# Standard sizes: 16, 32, 48, 64, 128, 256
convert "$SOURCE_ICON" \
    -define icon:auto-resize=256,128,64,48,32,16 \
    "$ICO_OUTPUT"

if [[ -f "$ICO_OUTPUT" ]]; then
    log_info "✓ Windows icon created: $ICO_OUTPUT"
else
    log_error "Failed to create Windows icon"
    exit 1
fi

# ============================================
# Generate macOS .icns file
# ============================================
log_info "Generating macOS icon (.icns)..."

ICNS_OUTPUT="$BUILD_DIR/appicon.icns"

# macOS requires specific iconset directory structure
ICONSET_DIR="$BUILD_DIR/appicon.iconset"
mkdir -p "$ICONSET_DIR"

# Generate all required macOS icon sizes
# Sizes: 16, 32, 64, 128, 256, 512, 1024 (with @2x retina versions)
declare -A ICON_SIZES=(
    ["16"]="icon_16x16.png"
    ["32"]="icon_16x16@2x.png"
    ["32_"]="icon_32x32.png"
    ["64"]="icon_32x32@2x.png"
    ["128"]="icon_128x128.png"
    ["256"]="icon_128x128@2x.png"
    ["256_"]="icon_256x256.png"
    ["512"]="icon_256x256@2x.png"
    ["512_"]="icon_512x512.png"
    ["1024"]="icon_512x512@2x.png"
)

for size in "${!ICON_SIZES[@]}"; do
    # Remove trailing underscore (used for duplicate keys)
    actual_size="${size%_}"
    filename="${ICON_SIZES[$size]}"
    
    convert "$SOURCE_ICON" \
        -resize "${actual_size}x${actual_size}" \
        "$ICONSET_DIR/$filename"
done

# Convert iconset to .icns
if command -v iconutil &> /dev/null; then
    # macOS native tool
    iconutil -c icns "$ICONSET_DIR" -o "$ICNS_OUTPUT"
    rm -rf "$ICONSET_DIR"
    log_info "✓ macOS icon created: $ICNS_OUTPUT"
elif command -v png2icns &> /dev/null; then
    # Alternative tool (can be installed on Linux)
    png2icns "$ICNS_OUTPUT" "$ICONSET_DIR"/*.png
    rm -rf "$ICONSET_DIR"
    log_info "✓ macOS icon created: $ICNS_OUTPUT (using png2icns)"
else
    log_warn "iconutil/png2icns not found, skipping .icns generation"
    log_warn "On macOS: iconutil is built-in"
    log_warn "On Linux: install libicns-utils (apt/dnf) or icnsutils"
    rm -rf "$ICONSET_DIR"
fi

# ============================================
# Summary
# ============================================
log_info ""
log_info "============================================"
log_info "Icon generation complete!"
log_info "============================================"
log_info "Generated files:"
[[ -f "$ICO_OUTPUT" ]] && log_info "  ✓ $ICO_OUTPUT (Windows)"
[[ -f "$ICNS_OUTPUT" ]] && log_info "  ✓ $ICNS_OUTPUT (macOS)"
log_info ""
log_info "These icons are now referenced in wails.json"
log_info "and will be used in CI/CD builds."

