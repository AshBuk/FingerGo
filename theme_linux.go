// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

//go:build linux

// Package main provides Linux-specific theme detection.
// Sets GTK_THEME environment variable based on system color-scheme preference.
package main

import (
	"os"
	"os/exec"
	"strings"
)

func init() {
	// Skip if GTK_THEME already set by user
	if os.Getenv("GTK_THEME") != "" {
		return
	}
	scheme := getGsetting("color-scheme")
	theme := getGsetting("gtk-theme")
	if scheme == "" || theme == "" {
		return
	}
	// Apply dark variant if system prefers dark and theme doesn't already include :dark
	if strings.Contains(scheme, "dark") && !strings.Contains(theme, ":dark") {
		os.Setenv("GTK_THEME", theme+":dark")
	}
}

// getGsetting retrieves a GNOME desktop interface setting.
// Uses flatpak-spawn --host when running inside Flatpak sandbox.
func getGsetting(key string) string {
	var out []byte
	var err error
	// Check if running inside Flatpak sandbox
	if _, statErr := os.Stat("/.flatpak-info"); statErr == nil {
		out, err = exec.Command("flatpak-spawn", "--host", "gsettings", "get",
			"org.gnome.desktop.interface", key).Output()
	} else {
		out, err = exec.Command("gsettings", "get",
			"org.gnome.desktop.interface", key).Output()
	}
	if err != nil {
		return ""
	}
	return strings.Trim(strings.TrimSpace(string(out)), "'\"")
}
