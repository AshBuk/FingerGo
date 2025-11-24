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
	storage   *storage.Manager
	textsRepo *storage.TextRepository
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
}

func (a *App) Shutdown(ctx context.Context) {}

// GetDefaultText returns the default text entry (metadata + content).
func (a *App) GetDefaultText() (domain.Text, error) {
	repo, err := a.getTextRepository()
	if err != nil {
		return domain.Text{}, err
	}
	return repo.GetDefaultText()
}

// GetText returns text content by identifier.
func (a *App) GetText(id string) (domain.Text, error) {
	repo, err := a.getTextRepository()
	if err != nil {
		return domain.Text{}, err
	}
	return repo.GetText(id)
}

// GetTextLibrary returns library metadata for UI navigation.
func (a *App) GetTextLibrary() (domain.TextLibrary, error) {
	repo, err := a.getTextRepository()
	if err != nil {
		return domain.TextLibrary{}, err
	}
	return repo.GetLibrary()
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
