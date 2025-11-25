// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package app

import (
	"context"
	"errors"
	"fmt"
	"log"

	domain "github.com/AshBuk/FingerGo/internal"
	"github.com/AshBuk/FingerGo/internal/storage"
)

type App struct {
	storage      *storage.Manager            // Manages the application's data storage on disk
	textsRepo    *storage.TextRepository     // Handles operations related to typing texts
	sessionsRepo *storage.SessionRepository  // Manages the persistence of typing session data
	settingsRepo *storage.SettingsRepository // Handles user preferences persistence
}

func New() *App { return &App{} }

func (a *App) Startup(ctx context.Context) {
	if a.storage == nil {
		root := storage.DefaultRoot()
		manager, err := storage.New(root)
		if err != nil {
			log.Fatalf("storage: failed to create manager: %v", err)
		}
		a.storage = manager
	}
	if err := a.storage.Init(); err != nil {
		log.Fatalf("storage: initialization failed: %v", err)
	}
	// Text repository is critical — app is useless without it
	if err := a.ensureTextRepository(); err != nil {
		log.Fatalf("storage: text repository init failed: %v", err)
	}
	// Session repository is not critical — app can run, but won't save sessions
	if err := a.ensureSessionRepository(); err != nil {
		log.Printf("WARNING: session repository init failed, sessions will not be saved: %v", err)
	}
	// Settings repository is not critical — app can run with defaults
	if err := a.ensureSettingsRepository(); err != nil {
		log.Printf("WARNING: settings repository init failed, using defaults: %v", err)
	}
}

func (a *App) Shutdown(ctx context.Context) {}

// DefaultText returns the default text entry (metadata + content).
func (a *App) DefaultText() (domain.Text, error) {
	repo, err := a.getTextRepository()
	if err != nil {
		return domain.Text{}, err
	}
	return repo.DefaultText()
}

// Text returns text content by identifier.
func (a *App) Text(id string) (domain.Text, error) {
	repo, err := a.getTextRepository()
	if err != nil {
		return domain.Text{}, err
	}
	return repo.Text(id)
}

// TextLibrary returns library metadata for UI navigation.
func (a *App) TextLibrary() (domain.TextLibrary, error) {
	repo, err := a.getTextRepository()
	if err != nil {
		return domain.TextLibrary{}, err
	}
	return repo.Library()
}

// SaveSession persists a completed typing session.
func (a *App) SaveSession(payload *domain.SessionPayload) error {
	repo, err := a.getSessionRepository()
	if err != nil {
		return err
	}
	_, err = repo.Record(payload)
	return err
}

// ListSessions returns recent typing sessions (newest first).
func (a *App) ListSessions(limit int) ([]domain.TypingSession, error) {
	repo, err := a.getSessionRepository()
	if err != nil {
		return nil, err
	}
	return repo.List(limit)
}

// GetSettings returns current user settings.
func (a *App) GetSettings() (domain.Settings, error) {
	repo, err := a.getSettingsRepository()
	if err != nil {
		return domain.DefaultSettings(), err
	}
	return repo.Load()
}

// UpdateSetting modifies a single setting by key and persists the change.
func (a *App) UpdateSetting(key string, value any) error {
	repo, err := a.getSettingsRepository()
	if err != nil {
		return err
	}
	return repo.Update(key, value)
}

// SaveText creates a new text entry.
func (a *App) SaveText(text *domain.Text) error {
	repo, err := a.getTextRepository()
	if err != nil {
		return err
	}
	return repo.SaveText(text)
}

// UpdateText modifies an existing text entry.
func (a *App) UpdateText(text *domain.Text) error {
	repo, err := a.getTextRepository()
	if err != nil {
		return err
	}
	return repo.UpdateText(text)
}

// DeleteText removes a text entry by ID.
func (a *App) DeleteText(id string) error {
	repo, err := a.getTextRepository()
	if err != nil {
		return err
	}
	return repo.DeleteText(id)
}

// SaveCategory creates a new category entry.
func (a *App) SaveCategory(cat *domain.Category) error {
	repo, err := a.getTextRepository()
	if err != nil {
		return err
	}
	return repo.SaveCategory(cat)
}

// SupportedLanguages returns the list of supported programming languages.
func (a *App) SupportedLanguages() []domain.LanguageInfo {
	return domain.SupportedLanguages()
}

func (a *App) ensureTextRepository() error {
	if a.storage == nil {
		return errors.New("storage manager not initialized")
	}
	if a.textsRepo != nil {
		return nil
	}
	repo, err := storage.NewTextRepository(a.storage)
	if err != nil {
		return err
	}
	a.textsRepo = repo
	return nil
}

func (a *App) getTextRepository() (*storage.TextRepository, error) {
	if err := a.ensureTextRepository(); err != nil {
		return nil, err
	}
	if a.textsRepo == nil {
		return nil, fmt.Errorf("text repository unavailable")
	}
	return a.textsRepo, nil
}

func (a *App) ensureSessionRepository() error {
	if a.storage == nil {
		return errors.New("storage manager not initialized")
	}
	if a.sessionsRepo != nil {
		return nil
	}
	repo, err := storage.NewSessionRepository(a.storage)
	if err != nil {
		return err
	}
	a.sessionsRepo = repo
	return nil
}

func (a *App) getSessionRepository() (*storage.SessionRepository, error) {
	if err := a.ensureSessionRepository(); err != nil {
		return nil, err
	}
	if a.sessionsRepo == nil {
		return nil, fmt.Errorf("session repository unavailable")
	}
	return a.sessionsRepo, nil
}

func (a *App) ensureSettingsRepository() error {
	if a.storage == nil {
		return errors.New("storage manager not initialized")
	}
	if a.settingsRepo != nil {
		return nil
	}
	repo, err := storage.NewSettingsRepository(a.storage)
	if err != nil {
		return err
	}
	a.settingsRepo = repo
	return nil
}

func (a *App) getSettingsRepository() (*storage.SettingsRepository, error) {
	if err := a.ensureSettingsRepository(); err != nil {
		return nil, err
	}
	if a.settingsRepo == nil {
		return nil, fmt.Errorf("settings repository unavailable")
	}
	return a.settingsRepo, nil
}
