// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/AshBuk/FingerGo/app"
)

//go:embed gui/src
var assets embed.FS

func main() {
	appInstance := app.New()

	if err := wails.Run(&options.App{
		Title:                    "FingerGo",
		Width:                    1100,
		Height:                   700,
		MinWidth:                 800,
		MinHeight:                600,
		AssetServer:              &assetserver.Options{Assets: assets},
		OnStartup:                appInstance.Startup,
		OnShutdown:               appInstance.Shutdown,
		Bind:                     []interface{}{appInstance},
		Frameless:                false,
		EnableDefaultContextMenu: true,
	}); err != nil {
		log.Fatal(err)
	}
}
