// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package app

import "context"

type App struct{}

func New() *App { return &App{} }

func (a *App) Startup(ctx context.Context) {}

func (a *App) Shutdown(ctx context.Context) {}
