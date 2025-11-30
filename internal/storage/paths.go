// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"os"
	"path/filepath"
	"runtime"
)

const appName = "FingerGo"

// DefaultRoot returns platform-specific application data directory.
// - Linux:   $XDG_DATA_HOME/FingerGo or ~/.local/share/FingerGo
// - macOS:   ~/Library/Application Support/FingerGo
// - Windows: %APPDATA%\FingerGo (e.g., C:\Users\Name\AppData\Roaming\FingerGo)
func DefaultRoot() string {
	switch runtime.GOOS {
	case "darwin":
		return macOSDataDir()
	case "windows":
		return windowsDataDir()
	default:
		return linuxDataDir()
	}
}

// linuxDataDir returns XDG-compliant data directory for Linux.
func linuxDataDir() string {
	if xdg := os.Getenv("XDG_DATA_HOME"); xdg != "" {
		return filepath.Join(xdg, appName)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(".", appName) // fallback to current dir
	}
	return filepath.Join(home, ".local", "share", appName)
}

// macOSDataDir returns standard Application Support directory for macOS.
func macOSDataDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(".", appName) // fallback to current dir
	}
	return filepath.Join(home, "Library", "Application Support", appName)
}

// windowsDataDir returns AppData\Roaming directory for Windows.
func windowsDataDir() string {
	if appData := os.Getenv("APPDATA"); appData != "" {
		return filepath.Join(appData, appName)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(".", appName) // fallback to current dir
	}
	return filepath.Join(home, "AppData", "Roaming", appName)
}
