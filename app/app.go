// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package app

import (
	"context"
	"fmt"
	"log"
	"reflect"

	domain "github.com/AshBuk/FingerGo/internal"
	"github.com/AshBuk/FingerGo/internal/storage"
)

type App struct {
	storage      *storage.Manager          // Manages the application's data storage on disk
	textsRepo    domain.TextRepository     // Handles operations related to typing texts
	sessionsRepo domain.SessionRepository  // Manages the persistence of typing session data
	settingsRepo domain.SettingsRepository // Handles user preferences persistence
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

// DeleteCategory removes a category entry by ID.
func (a *App) DeleteCategory(id string) error {
	repo, err := a.getTextRepository()
	if err != nil {
		return err
	}
	return repo.DeleteCategory(id)
}

// SupportedLanguages returns the list of supported programming languages.
func (a *App) SupportedLanguages() []domain.LanguageInfo {
	return domain.SupportedLanguages()
}

// ensureRepository is a generic helper to initialize repositories with common logic.
// Reduces code duplication across ensureTextRepository, ensureSessionRepository, etc.
func ensureRepository[T any](
	mgr *storage.Manager,
	repoPtr *T,
	name string,
	factory func(*storage.Manager) (T, error),
) error {
	if mgr == nil {
		return fmt.Errorf("%s: storage manager not initialized", name)
	}
	// Check if already initialized (use reflection to check for nil interface)
	val := reflect.ValueOf(*repoPtr)
	// If Value is valid and not zero, repository is already initialized
	if val.IsValid() && !val.IsZero() {
		return nil
	}
	repo, err := factory(mgr)
	if err != nil {
		return fmt.Errorf("%s: initialization failed: %w", name, err)
	}
	*repoPtr = repo
	return nil
}

// ensureTextRepository initializes text repository if not already initialized.
func (a *App) ensureTextRepository() error {
	return ensureRepository(
		a.storage,
		&a.textsRepo,
		"text repository",
		func(mgr *storage.Manager) (domain.TextRepository, error) {
			return storage.NewTextRepository(mgr)
		},
	)
}

// getTextRepository returns text repository, initializing if needed.
func (a *App) getTextRepository() (domain.TextRepository, error) {
	if err := a.ensureTextRepository(); err != nil {
		return nil, err
	}
	return a.textsRepo, nil
}

// ensureSessionRepository initializes session repository if not already initialized.
func (a *App) ensureSessionRepository() error {
	return ensureRepository(
		a.storage,
		&a.sessionsRepo,
		"session repository",
		func(mgr *storage.Manager) (domain.SessionRepository, error) {
			return storage.NewSessionRepository(mgr)
		},
	)
}

// getSessionRepository returns session repository, initializing if needed.
func (a *App) getSessionRepository() (domain.SessionRepository, error) {
	if err := a.ensureSessionRepository(); err != nil {
		return nil, err
	}
	return a.sessionsRepo, nil
}

// ensureSettingsRepository initializes settings repository if not already initialized.
func (a *App) ensureSettingsRepository() error {
	return ensureRepository(
		a.storage,
		&a.settingsRepo,
		"settings repository",
		func(mgr *storage.Manager) (domain.SettingsRepository, error) {
			return storage.NewSettingsRepository(mgr)
		},
	)
}

// getSettingsRepository returns settings repository, initializing if needed.
func (a *App) getSettingsRepository() (domain.SettingsRepository, error) {
	if err := a.ensureSettingsRepository(); err != nil {
		return nil, err
	}
	return a.settingsRepo, nil
}
