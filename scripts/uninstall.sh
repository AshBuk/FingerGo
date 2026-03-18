#!/usr/bin/env bash
# Copyright 2025-2026 Asher Buk
# SPDX-License-Identifier: Apache-2.0
# https://github.com/AshBuk/FingerGo
#
# Uninstall FingerGo from user-local directories (~/.local)

set -euo pipefail

rm -f "$HOME/.local/bin/fingergo"
rm -f "$HOME/.local/share/icons/hicolor/512x512/apps/io.github.AshBuk.FingerGo.png"
rm -f "$HOME/.local/share/applications/io.github.AshBuk.FingerGo.desktop"

gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

echo "FingerGo uninstalled successfully."
