// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"os"
	"path/filepath"
)

const appName = "fingergo"

// DefaultRoot returns the XDG-compliant data directory.
// Uses $XDG_DATA_HOME/fingergo or ~/.local/share/fingergo as fallback.
func DefaultRoot() string {
	if xdg := os.Getenv("XDG_DATA_HOME"); xdg != "" {
		return filepath.Join(xdg, appName)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(".", appName) // fallback to current dir
	}
	return filepath.Join(home, ".local", "share", appName)
}
