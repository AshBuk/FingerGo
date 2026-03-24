// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package app

import (
	"context"
	"testing"

	domain "github.com/AshBuk/FingerGo/internal/domain"
	"github.com/AshBuk/FingerGo/internal/storage"
)

// startApp creates an App wired to a real storage directory.
// Reuse the same dir across calls to simulate app restart.
func startApp(t *testing.T, dir string) *App {
	t.Helper()
	mgr, err := storage.New(dir)
	if err != nil {
		t.Fatalf("storage.New: %v", err)
	}
	app := New()
	app.storage = mgr
	if err := app.Startup(context.Background()); err != nil {
		t.Fatalf("Startup: %v", err)
	}
	return app
}

func TestApp_Startup(t *testing.T) {
	t.Run("initializes all repositories", func(t *testing.T) {
		app := startApp(t, t.TempDir())
		if app.textsRepo == nil {
			t.Error("textsRepo not initialized")
		}
		if app.sessionsRepo == nil {
			t.Error("sessionsRepo not initialized")
		}
		if app.settingsRepo == nil {
			t.Error("settingsRepo not initialized")
		}
	})

	t.Run("is idempotent", func(t *testing.T) {
		dir := t.TempDir()
		app := startApp(t, dir)
		if err := app.Startup(context.Background()); err != nil {
			t.Fatalf("second Startup: %v", err)
		}
	})
}

func TestApp_DefaultText(t *testing.T) {
	app := startApp(t, t.TempDir())

	text, err := app.DefaultText()
	if err != nil {
		t.Fatalf("DefaultText: %v", err)
	}
	if text.ID == "" {
		t.Error("expected non-empty ID")
	}
	if text.Content == "" {
		t.Error("expected non-empty content from embedded data")
	}
}

func TestApp_TextLifecycle(t *testing.T) {
	app := startApp(t, t.TempDir())

	text := &domain.Text{
		ID:       "lifecycle-test",
		Title:    "Lifecycle Test",
		Content:  "The quick brown fox jumps over the lazy dog.",
		Language: "text",
	}

	// Create
	if err := app.SaveText(text); err != nil {
		t.Fatalf("SaveText: %v", err)
	}

	// Read
	got, err := app.Text("lifecycle-test")
	if err != nil {
		t.Fatalf("Text: %v", err)
	}
	if got.Title != text.Title {
		t.Errorf("title = %q, want %q", got.Title, text.Title)
	}
	if got.Content != text.Content {
		t.Errorf("content = %q, want %q", got.Content, text.Content)
	}

	// Appears in library
	lib, err := app.TextLibrary()
	if err != nil {
		t.Fatalf("TextLibrary: %v", err)
	}
	found := false
	for _, entry := range lib.Texts {
		if entry.ID == "lifecycle-test" {
			found = true
		}
	}
	if !found {
		t.Error("saved text not found in library")
	}

	// Update
	updated := &domain.Text{
		ID:       "lifecycle-test",
		Title:    "Updated Title",
		Content:  "Updated content for the lifecycle test.",
		Language: "go",
	}
	if err := app.UpdateText(updated); err != nil {
		t.Fatalf("UpdateText: %v", err)
	}
	got, _ = app.Text("lifecycle-test")
	if got.Title != "Updated Title" {
		t.Errorf("title after update = %q, want %q", got.Title, "Updated Title")
	}
	if got.Language != "go" {
		t.Errorf("language after update = %q, want %q", got.Language, "go")
	}

	// Delete
	if err := app.DeleteText("lifecycle-test"); err != nil {
		t.Fatalf("DeleteText: %v", err)
	}
	_, err = app.Text("lifecycle-test")
	if err == nil {
		t.Error("expected error after delete")
	}
}

func TestApp_CategoryLifecycle(t *testing.T) {
	app := startApp(t, t.TempDir())

	cat := &domain.Category{ID: "cat-1", Name: "Test Category", Icon: "folder"}
	if err := app.SaveCategory(cat); err != nil {
		t.Fatalf("SaveCategory: %v", err)
	}

	// Add texts to category
	for _, id := range []string{"text-a", "text-b"} {
		err := app.SaveText(&domain.Text{
			ID: id, Title: id, Content: "content", Language: "text", CategoryID: "cat-1",
		})
		if err != nil {
			t.Fatalf("SaveText(%s): %v", id, err)
		}
	}

	// Delete category — should cascade-delete texts
	if err := app.DeleteCategory("cat-1"); err != nil {
		t.Fatalf("DeleteCategory: %v", err)
	}
	for _, id := range []string{"text-a", "text-b"} {
		if _, err := app.Text(id); err == nil {
			t.Errorf("text %q should be deleted with category", id)
		}
	}
}

func TestApp_SessionLifecycle(t *testing.T) {
	app := startApp(t, t.TempDir())

	// Initially empty
	sessions, err := app.ListSessions(10)
	if err != nil {
		t.Fatalf("ListSessions: %v", err)
	}
	if len(sessions) != 0 {
		t.Errorf("expected 0 sessions, got %d", len(sessions))
	}

	// Record a session
	payload := &domain.SessionPayload{
		SessionTextMeta: &domain.SessionTextMeta{
			Text:      "The quick brown fox",
			TextTitle: "Fox Test",
		},
		WPM:             65.5,
		Accuracy:        98.2,
		Duration:        30,
		TotalKeystrokes: 200,
		TotalErrors:     4,
		Mistakes:        map[string]int{"q": 2, "x": 2},
	}
	if err := app.SaveSession(payload); err != nil {
		t.Fatalf("SaveSession: %v", err)
	}

	// Retrieve
	sessions, err = app.ListSessions(10)
	if err != nil {
		t.Fatalf("ListSessions: %v", err)
	}
	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}
	if sessions[0].WPM != 65.5 {
		t.Errorf("WPM = %v, want 65.5", sessions[0].WPM)
	}
	if sessions[0].Mistakes["q"] != 2 {
		t.Errorf("mistakes[q] = %d, want 2", sessions[0].Mistakes["q"])
	}
}

func TestApp_SettingsLifecycle(t *testing.T) {
	app := startApp(t, t.TempDir())

	// Defaults
	settings, err := app.GetSettings()
	if err != nil {
		t.Fatalf("GetSettings: %v", err)
	}
	defaults := domain.DefaultSettings()
	if settings.Theme != defaults.Theme {
		t.Errorf("default theme = %q, want %q", settings.Theme, defaults.Theme)
	}

	// Update
	if err := app.UpdateSetting("theme", "light"); err != nil {
		t.Fatalf("UpdateSetting: %v", err)
	}
	if err := app.UpdateSetting("zenMode", true); err != nil {
		t.Fatalf("UpdateSetting: %v", err)
	}

	settings, _ = app.GetSettings()
	if settings.Theme != "light" {
		t.Errorf("theme = %q, want light", settings.Theme)
	}
	if !settings.ZenMode {
		t.Error("zenMode should be true")
	}
}

func TestApp_Persistence(t *testing.T) {
	dir := t.TempDir()

	// First run: create data
	app1 := startApp(t, dir)
	_ = app1.SaveText(&domain.Text{
		ID: "persist-test", Title: "Persist", Content: "survives restart", Language: "text",
	})
	_ = app1.SaveSession(&domain.SessionPayload{
		SessionTextMeta: &domain.SessionTextMeta{Text: "test"},
		WPM:             42.0,
	})
	_ = app1.UpdateSetting("theme", "light")

	// Second run: new App, same directory
	app2 := startApp(t, dir)

	text, err := app2.Text("persist-test")
	if err != nil {
		t.Fatalf("text not persisted: %v", err)
	}
	if text.Content != "survives restart" {
		t.Errorf("content = %q, want %q", text.Content, "survives restart")
	}

	sessions, _ := app2.ListSessions(1)
	if len(sessions) != 1 || sessions[0].WPM != 42.0 {
		t.Error("session not persisted across restart")
	}

	settings, _ := app2.GetSettings()
	if settings.Theme != "light" {
		t.Errorf("settings not persisted: theme = %q", settings.Theme)
	}
}
