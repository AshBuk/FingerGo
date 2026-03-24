// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package app

import (
	"context"
	"fmt"
	"log"

	domain "github.com/AshBuk/FingerGo/internal/domain"
	"github.com/AshBuk/FingerGo/internal/storage"
)

type App struct {
	storage      *storage.Manager            // Manages the application's data storage on disk
	textsRepo    *storage.TextRepository     // Handles operations related to typing texts
	sessionsRepo *storage.SessionRepository  // Manages the persistence of typing session data
	settingsRepo *storage.SettingsRepository // Handles user preferences persistence
}

func New() *App { return &App{} }

func (a *App) Startup(ctx context.Context) error {
	if a.storage == nil {
		root := storage.DefaultRoot()
		manager, err := storage.New(root)
		if err != nil {
			return fmt.Errorf("storage: failed to create manager: %w", err)
		}
		a.storage = manager
	}
	if err := a.storage.Init(); err != nil {
		return fmt.Errorf("storage: initialization failed: %w", err)
	}
	// Text repository is critical — app is useless without it
	if err := a.ensureTextRepository(); err != nil {
		return fmt.Errorf("storage: text repository init failed: %w", err)
	}
	// Session repository is not critical — app can run, but won't save sessions
	if err := a.ensureSessionRepository(); err != nil {
		log.Printf("WARNING: session repository init failed, sessions will not be saved: %v", err)
	}
	// Settings repository is not critical — app can run with defaults
	if err := a.ensureSettingsRepository(); err != nil {
		log.Printf("WARNING: settings repository init failed, using defaults: %v", err)
	}
	return nil
}

func (a *App) Shutdown(ctx context.Context) {}

// DefaultText returns the default text entry (metadata + content).
func (a *App) DefaultText() (domain.Text, error) {
	if a.textsRepo == nil {
		return domain.Text{}, fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.DefaultText()
}

// Text returns text content by identifier.
func (a *App) Text(id string) (domain.Text, error) {
	if a.textsRepo == nil {
		return domain.Text{}, fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.Text(id)
}

// TextLibrary returns library metadata for UI navigation.
func (a *App) TextLibrary() (domain.TextLibrary, error) {
	if a.textsRepo == nil {
		return domain.TextLibrary{}, fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.Library()
}

// SaveSession persists a completed typing session.
func (a *App) SaveSession(payload *domain.SessionPayload) error {
	if a.sessionsRepo == nil {
		return fmt.Errorf("session repository not initialized")
	}
	_, err := a.sessionsRepo.Record(payload)
	return err
}

// ListSessions returns recent typing sessions (newest first).
func (a *App) ListSessions(limit int) ([]domain.TypingSession, error) {
	if a.sessionsRepo == nil {
		return nil, fmt.Errorf("session repository not initialized")
	}
	return a.sessionsRepo.List(limit)
}

// GetSettings returns current user settings.
func (a *App) GetSettings() (domain.Settings, error) {
	if a.settingsRepo == nil {
		return domain.DefaultSettings(), fmt.Errorf("settings repository not initialized")
	}
	return a.settingsRepo.Load()
}

// UpdateSetting modifies a single setting by key and persists the change.
func (a *App) UpdateSetting(key string, value any) error {
	if a.settingsRepo == nil {
		return fmt.Errorf("settings repository not initialized")
	}
	return a.settingsRepo.Update(key, value)
}

// SaveText creates a new text entry.
func (a *App) SaveText(text *domain.Text) error {
	if a.textsRepo == nil {
		return fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.SaveText(text)
}

// UpdateText modifies an existing text entry.
func (a *App) UpdateText(text *domain.Text) error {
	if a.textsRepo == nil {
		return fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.UpdateText(text)
}

// DeleteText removes a text entry by ID.
func (a *App) DeleteText(id string) error {
	if a.textsRepo == nil {
		return fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.DeleteText(id)
}

// SaveCategory creates a new category entry.
func (a *App) SaveCategory(cat *domain.Category) error {
	if a.textsRepo == nil {
		return fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.SaveCategory(cat)
}

// DeleteCategory removes a category entry by ID.
func (a *App) DeleteCategory(id string) error {
	if a.textsRepo == nil {
		return fmt.Errorf("text repository not initialized")
	}
	return a.textsRepo.DeleteCategory(id)
}

// SupportedLanguages returns the list of supported programming languages.
func (a *App) SupportedLanguages() []domain.LanguageInfo {
	return domain.SupportedLanguages()
}

// ensureTextRepository initializes text repository if not already initialized.
func (a *App) ensureTextRepository() error {
	if a.textsRepo != nil {
		return nil
	}
	if a.storage == nil {
		return fmt.Errorf("text repository: storage manager not initialized")
	}
	repo, err := storage.NewTextRepository(a.storage)
	if err != nil {
		return fmt.Errorf("text repository: initialization failed: %w", err)
	}
	a.textsRepo = repo
	return nil
}

// ensureSessionRepository initializes session repository if not already initialized.
func (a *App) ensureSessionRepository() error {
	if a.sessionsRepo != nil {
		return nil
	}
	if a.storage == nil {
		return fmt.Errorf("session repository: storage manager not initialized")
	}
	repo, err := storage.NewSessionRepository(a.storage)
	if err != nil {
		return fmt.Errorf("session repository: initialization failed: %w", err)
	}
	a.sessionsRepo = repo
	return nil
}

// ensureSettingsRepository initializes settings repository if not already initialized.
func (a *App) ensureSettingsRepository() error {
	if a.settingsRepo != nil {
		return nil
	}
	if a.storage == nil {
		return fmt.Errorf("settings repository: storage manager not initialized")
	}
	repo, err := storage.NewSettingsRepository(a.storage)
	if err != nil {
		return fmt.Errorf("settings repository: initialization failed: %w", err)
	}
	a.settingsRepo = repo
	return nil
}
