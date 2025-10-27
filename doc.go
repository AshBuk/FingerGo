// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

// Package main provides FingerGo, a desktop touch-typing trainer.
//
// # Overview
//
// FingerGo is a desktop touch-typing trainer app with real-time keyboard
// visualization and detailed typing analytics (WPM, accuracy, mistakes).
// Built with Wails (Go backend + HTML/CSS/JS frontend).
// Distributed for Linux (Flatpak).
//
// # Tech Stack
//
// - Backend: Go 1.25+
// - Desktop: Wails v2
// - Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3
// - Storage: JSON files
// - Platform: Linux
//
// # Key Features
//
// - Real-time visual keyboard with finger mapping
// - Hierarchical text library (plain text and code samples)
// - Detailed stats: WPM, accuracy, per-key mistakes, session history
// - Minimalist UI with the Go gopher mascot
package main
