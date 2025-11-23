// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package app

import (
	"context"
	"log"

	"github.com/AshBuk/FingerGo/internal/storage"
)

type App struct {
	storage *storage.Manager
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
	}
}

func (a *App) Shutdown(ctx context.Context) {}
