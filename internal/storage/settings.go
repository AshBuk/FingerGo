// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sync"

	domain "github.com/AshBuk/FingerGo/internal"
)

const configFile = "settings.json"

// SettingsRepository persists user settings in settings.json.
type SettingsRepository struct {
	storage  *Manager
	settings domain.Settings
	mu       sync.RWMutex
	loaded   bool
}

// NewSettingsRepository wires the repository to the storage manager.
func NewSettingsRepository(mgr *Manager) (*SettingsRepository, error) {
	if mgr == nil {
		return nil, errNilManager
	}
	return &SettingsRepository{storage: mgr}, nil
}

// Load returns current settings, loading from disk on first access.
func (r *SettingsRepository) Load() (domain.Settings, error) {
	if err := r.ensureLoaded(); err != nil {
		return domain.Settings{}, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.settings, nil
}

// Save persists the entire settings object.
func (r *SettingsRepository) Save(s domain.Settings) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if err := r.persist(s); err != nil {
		return err
	}
	r.settings = s
	r.loaded = true
	return nil
}

// Update modifies a single setting by key and persists the change.
// Supported keys: "theme", "showKeyboard", "showStatsBar", "zenMode".
func (r *SettingsRepository) Update(key string, value any) error {
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	updated := r.settings
	switch key {
	case "theme":
		v, ok := value.(string)
		if !ok {
			return fmt.Errorf("settings: theme expects string, got %T", value)
		}
		if v != "dark" && v != "light" {
			return fmt.Errorf("settings: invalid theme %q", v)
		}
		updated.Theme = v
	case "showKeyboard":
		v, ok := value.(bool)
		if !ok {
			return fmt.Errorf("settings: showKeyboard expects bool, got %T", value)
		}
		updated.ShowKeyboard = v
	case "showStatsBar":
		v, ok := value.(bool)
		if !ok {
			return fmt.Errorf("settings: showStatsBar expects bool, got %T", value)
		}
		updated.ShowStatsBar = v
	case "zenMode":
		v, ok := value.(bool)
		if !ok {
			return fmt.Errorf("settings: zenMode expects bool, got %T", value)
		}
		updated.ZenMode = v
	default:
		return fmt.Errorf("settings: unknown key %q", key)
	}

	if err := r.persist(updated); err != nil {
		return err
	}
	r.settings = updated
	return nil
}

func (r *SettingsRepository) ensureLoaded() error {
	r.mu.RLock()
	if r.loaded {
		r.mu.RUnlock()
		return nil
	}
	r.mu.RUnlock()

	r.mu.Lock()
	defer r.mu.Unlock()
	if r.loaded {
		return nil
	}

	path := r.storage.join(configFile)
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			r.settings = domain.DefaultSettings()
			r.loaded = true
			return nil
		}
		return fmt.Errorf("storage: read config %q: %w", path, err)
	}

	clean := bytes.TrimSpace(data)
	if len(clean) == 0 {
		r.settings = domain.DefaultSettings()
	} else {
		var s domain.Settings
		if err := json.Unmarshal(clean, &s); err != nil {
			return fmt.Errorf("storage: parse config %q: %w", path, err)
		}
		r.settings = s
	}
	r.loaded = true
	return nil
}

func (r *SettingsRepository) persist(s domain.Settings) error {
	path := r.storage.join(configFile)
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return fmt.Errorf("storage: marshal config: %w", err)
	}
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return fmt.Errorf("storage: write config %q: %w", path, err)
	}
	return nil
}
