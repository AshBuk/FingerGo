// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package domain

// Settings holds user preferences persisted in settings.json.
type Settings struct {
	Theme        string `json:"theme"`        // "dark" | "light"
	LastTextID   string `json:"lastTextId"`   // last opened text ID for session restore
	ShowKeyboard bool   `json:"showKeyboard"` // keyboard section visibility
	ShowStatsBar bool   `json:"showStatsBar"` // stats bar visibility
	ZenMode      bool   `json:"zenMode"`      // focus mode (hides both keyboard and stats)
	StrictMode   bool   `json:"strictMode"`   // require backspace to fix errors (true) or allow direct correction (false)
}

// DefaultSettings returns factory defaults for new installations.
func DefaultSettings() Settings {
	return Settings{
		Theme:        "dark",
		ShowKeyboard: true,
		ShowStatsBar: true,
		ZenMode:      false,
		StrictMode:   true, // require backspace to fix errors (false = cheat mode)
	}
}
