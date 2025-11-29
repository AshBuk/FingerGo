// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package internal

import "testing"

func TestDefaultSettings(t *testing.T) {
	t.Run("returns dark theme by default", func(t *testing.T) {
		settings := DefaultSettings()
		if settings.Theme != "dark" {
			t.Errorf("got Theme %q, want %q", settings.Theme, "dark")
		}
	})

	t.Run("keyboard visible by default", func(t *testing.T) {
		settings := DefaultSettings()
		if !settings.ShowKeyboard {
			t.Error("expected ShowKeyboard to be true")
		}
	})

	t.Run("stats bar visible by default", func(t *testing.T) {
		settings := DefaultSettings()
		if !settings.ShowStatsBar {
			t.Error("expected ShowStatsBar to be true")
		}
	})

	t.Run("zen mode disabled by default", func(t *testing.T) {
		settings := DefaultSettings()
		if settings.ZenMode {
			t.Error("expected ZenMode to be false")
		}
	})
}
