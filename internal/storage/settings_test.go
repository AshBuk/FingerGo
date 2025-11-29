// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"testing"

	domain "github.com/AshBuk/FingerGo/internal"
)

// setupSettingsRepository creates a test repository with initialized storage.
func setupSettingsRepository(t *testing.T) *SettingsRepository {
	t.Helper()
	tmpDir := t.TempDir()
	mgr, err := New(tmpDir)
	if err != nil {
		t.Fatalf("failed to create manager: %v", err)
	}
	if err := mgr.Init(); err != nil {
		t.Fatalf("failed to init manager: %v", err)
	}
	repo, err := NewSettingsRepository(mgr)
	if err != nil {
		t.Fatalf("failed to create repository: %v", err)
	}
	return repo
}

func TestNewSettingsRepository(t *testing.T) {
	t.Run("returns error for nil manager", func(t *testing.T) {
		_, err := NewSettingsRepository(nil)
		if err == nil {
			t.Error("expected error for nil manager")
		}
	})

	t.Run("creates repository with valid manager", func(t *testing.T) {
		tmpDir := t.TempDir()
		mgr, _ := New(tmpDir)
		repo, err := NewSettingsRepository(mgr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if repo == nil {
			t.Error("expected non-nil repository")
		}
	})
}

func TestSettingsRepository_Load(t *testing.T) {
	t.Run("returns defaults when file missing", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		settings, err := repo.Load()
		if err != nil {
			t.Fatalf("Load() error: %v", err)
		}
		defaults := domain.DefaultSettings()
		if settings.Theme != defaults.Theme {
			t.Errorf("got theme %q, want %q", settings.Theme, defaults.Theme)
		}
		if settings.ShowKeyboard != defaults.ShowKeyboard {
			t.Errorf("got ShowKeyboard %v, want %v", settings.ShowKeyboard, defaults.ShowKeyboard)
		}
	})

	t.Run("loads previously saved settings", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		custom := domain.Settings{
			Theme:        "light",
			ShowKeyboard: false,
			ShowStatsBar: false,
			ZenMode:      true,
		}
		_ = repo.Save(custom)

		settings, err := repo.Load()
		if err != nil {
			t.Fatalf("Load() error: %v", err)
		}
		if settings.Theme != "light" {
			t.Errorf("got theme %q, want %q", settings.Theme, "light")
		}
		if settings.ZenMode != true {
			t.Errorf("got ZenMode %v, want true", settings.ZenMode)
		}
	})
}

func TestSettingsRepository_Save(t *testing.T) {
	t.Run("persists settings", func(t *testing.T) {
		tmpDir := t.TempDir()

		// Save with first instance
		mgr1, _ := New(tmpDir)
		_ = mgr1.Init()
		repo1, _ := NewSettingsRepository(mgr1)

		settings := domain.Settings{
			Theme:        "light",
			ShowKeyboard: true,
			ShowStatsBar: false,
			ZenMode:      true,
		}
		err := repo1.Save(settings)
		if err != nil {
			t.Fatalf("Save() error: %v", err)
		}

		// Load with second instance
		mgr2, _ := New(tmpDir)
		repo2, _ := NewSettingsRepository(mgr2)

		loaded, err := repo2.Load()
		if err != nil {
			t.Fatalf("Load() error: %v", err)
		}
		if loaded.Theme != "light" {
			t.Errorf("got theme %q, want %q", loaded.Theme, "light")
		}
		if loaded.ZenMode != true {
			t.Errorf("got ZenMode %v, want true", loaded.ZenMode)
		}
	})
}

func TestSettingsRepository_Update(t *testing.T) {
	t.Run("updates theme", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		err := repo.Update("theme", "light")
		if err != nil {
			t.Fatalf("Update() error: %v", err)
		}

		settings, _ := repo.Load()
		if settings.Theme != "light" {
			t.Errorf("got theme %q, want %q", settings.Theme, "light")
		}
	})

	t.Run("updates showKeyboard", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		err := repo.Update("showKeyboard", false)
		if err != nil {
			t.Fatalf("Update() error: %v", err)
		}

		settings, _ := repo.Load()
		if settings.ShowKeyboard != false {
			t.Errorf("got ShowKeyboard %v, want false", settings.ShowKeyboard)
		}
	})

	t.Run("updates showStatsBar", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		err := repo.Update("showStatsBar", false)
		if err != nil {
			t.Fatalf("Update() error: %v", err)
		}

		settings, _ := repo.Load()
		if settings.ShowStatsBar != false {
			t.Errorf("got ShowStatsBar %v, want false", settings.ShowStatsBar)
		}
	})

	t.Run("updates zenMode", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		err := repo.Update("zenMode", true)
		if err != nil {
			t.Fatalf("Update() error: %v", err)
		}

		settings, _ := repo.Load()
		if settings.ZenMode != true {
			t.Errorf("got ZenMode %v, want true", settings.ZenMode)
		}
	})

	t.Run("returns error for unknown key", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		err := repo.Update("unknownKey", "value")
		if err == nil {
			t.Error("expected error for unknown key")
		}
	})

	t.Run("returns error for invalid theme value", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		err := repo.Update("theme", "invalid")
		if err == nil {
			t.Error("expected error for invalid theme")
		}
	})

	t.Run("returns error for wrong type", func(t *testing.T) {
		repo := setupSettingsRepository(t)

		err := repo.Update("theme", 123) // int instead of string
		if err == nil {
			t.Error("expected error for wrong type")
		}
	})
}
