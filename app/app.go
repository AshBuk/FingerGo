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
	storage      *storage.Manager
	textsRepo    *storage.TextRepository
	sessionsRepo *storage.SessionRepository
}

func New() *App { return &App{} }

func (a *App) Startup(ctx context.Context) {
	if a.storage == nil {
		root := storage.DefaultRoot()
		manager, err := storage.New(root)
		if err != nil {
			log.Printf("storage: failed to create manager: %v", err)
			return
		}
		a.storage = manager
	}
	if err := a.storage.Init(); err != nil {
		log.Printf("storage: initialization failed: %v", err)
		return
	}
	if err := a.ensureTextRepository(); err != nil {
		log.Printf("storage: text repository init failed: %v", err)
	}
	if err := a.ensureSessionRepository(); err != nil {
		log.Printf("storage: session repository init failed: %v", err)
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
func (a *App) SaveSession(payload domain.SessionPayload) error {
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
