#!/usr/bin/env bash
# Copyright 2025-2026 Asher Buk
# SPDX-License-Identifier: Apache-2.0
# https://github.com/AshBuk/FingerGo
#
# Install FingerGo to user-local directories (~/.local)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BIN_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
APP_DIR="$HOME/.local/share/applications"

mkdir -p "$BIN_DIR" "$ICON_DIR" "$APP_DIR"

install -m755 "$SCRIPT_DIR/FingerGo" "$BIN_DIR/fingergo"
install -m644 "$SCRIPT_DIR/fingergo.png" "$ICON_DIR/io.github.AshBuk.FingerGo.png"
install -m644 "$SCRIPT_DIR/io.github.AshBuk.FingerGo.desktop" "$APP_DIR/io.github.AshBuk.FingerGo.desktop"

gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
update-desktop-database "$APP_DIR" 2>/dev/null || true

echo "FingerGo installed successfully."
echo "Make sure $BIN_DIR is in your PATH."
