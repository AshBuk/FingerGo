// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package internal

// Settings holds user preferences persisted in settings.json.
type Settings struct {
	Theme        string `json:"theme"`        // "dark" | "light"
	ShowKeyboard bool   `json:"showKeyboard"` // keyboard section visibility
	ShowStatsBar bool   `json:"showStatsBar"` // stats bar visibility
	ZenMode      bool   `json:"zenMode"`      // focus mode (hides both keyboard and stats)
}

// DefaultSettings returns factory defaults for new installations.
func DefaultSettings() Settings {
	return Settings{
		Theme:        "dark",
		ShowKeyboard: true,
		ShowStatsBar: true,
		ZenMode:      false,
	}
}
