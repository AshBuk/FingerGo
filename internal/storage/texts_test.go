// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	domain "github.com/AshBuk/FingerGo/internal"
)

// setupTextRepository creates a test repository with initialized storage.
func setupTextRepository(t *testing.T) *TextRepository {
	t.Helper()
	tmpDir := t.TempDir()
	mgr, err := New(tmpDir)
	if err != nil {
		t.Fatalf("failed to create manager: %v", err)
	}
	if err := mgr.Init(); err != nil {
		t.Fatalf("failed to init manager: %v", err)
	}
	repo, err := NewTextRepository(mgr)
	if err != nil {
		t.Fatalf("failed to create repository: %v", err)
	}
	return repo
}

func TestNewTextRepository(t *testing.T) {
	t.Run("returns error for nil manager", func(t *testing.T) {
		_, err := NewTextRepository(nil)
		if err == nil {
			t.Error("expected error for nil manager")
		}
	})

	t.Run("creates repository with valid manager", func(t *testing.T) {
		tmpDir := t.TempDir()
		mgr, _ := New(tmpDir)
		repo, err := NewTextRepository(mgr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if repo == nil {
			t.Error("expected non-nil repository")
		}
	})
}

func TestTextRepository_Library(t *testing.T) {
	repo := setupTextRepository(t)

	lib, err := repo.Library()
	if err != nil {
		t.Fatalf("Library() error: %v", err)
	}
	// Default embedded library has one category and one text
	if len(lib.Categories) == 0 {
		t.Error("expected at least one category from embedded data")
	}
	if len(lib.Texts) == 0 {
		t.Error("expected at least one text from embedded data")
	}
	// Content should be stripped
	for _, text := range lib.Texts {
		if text.Content != "" {
			t.Errorf("Library() should strip content, got %q", text.Content)
		}
	}
}

func TestTextRepository_DefaultText(t *testing.T) {
	repo := setupTextRepository(t)

	text, err := repo.DefaultText()
	if err != nil {
		t.Fatalf("DefaultText() error: %v", err)
	}
	if text.ID == "" {
		t.Error("expected non-empty text ID")
	}
	if text.Content == "" {
		t.Error("expected non-empty content")
	}
}

func TestTextRepository_Text(t *testing.T) {
	repo := setupTextRepository(t)

	t.Run("returns error for empty id", func(t *testing.T) {
		_, err := repo.Text("")
		if !errors.Is(err, ErrTextNotFound) {
			t.Errorf("expected ErrTextNotFound, got %v", err)
		}
	})

	t.Run("returns error for non-existent id", func(t *testing.T) {
		_, err := repo.Text("non-existent-id")
		if !errors.Is(err, ErrTextNotFound) {
			t.Errorf("expected ErrTextNotFound, got %v", err)
		}
	})

	t.Run("returns text with content", func(t *testing.T) {
		// Get default text ID from library
		lib, _ := repo.Library()
		if len(lib.Texts) == 0 {
			t.Skip("no texts in library")
		}
		id := lib.Texts[0].ID

		text, err := repo.Text(id)
		if err != nil {
			t.Fatalf("Text() error: %v", err)
		}
		if text.ID != id {
			t.Errorf("got ID %q, want %q", text.ID, id)
		}
		if text.Content == "" {
			t.Error("expected non-empty content")
		}
	})
}

func TestTextRepository_SaveText(t *testing.T) {
	t.Run("saves valid text", func(t *testing.T) {
		repo := setupTextRepository(t)

		text := &domain.Text{
			ID:        "test-save-1",
			Title:     "Test Title",
			Content:   "Test content for typing practice.",
			Language:  "text",
			CreatedAt: time.Now(),
		}

		err := repo.SaveText(text)
		if err != nil {
			t.Fatalf("SaveText() error: %v", err)
		}

		// Verify text is retrievable
		got, err := repo.Text("test-save-1")
		if err != nil {
			t.Fatalf("Text() after save error: %v", err)
		}
		if got.Title != text.Title {
			t.Errorf("got title %q, want %q", got.Title, text.Title)
		}
		if got.Content != text.Content {
			t.Errorf("got content %q, want %q", got.Content, text.Content)
		}
	})

	t.Run("returns error for empty id", func(t *testing.T) {
		repo := setupTextRepository(t)
		text := &domain.Text{Title: "Test", Content: "Content"}
		err := repo.SaveText(text)
		if !errors.Is(err, ErrEmptyTextID) {
			t.Errorf("expected ErrEmptyTextID, got %v", err)
		}
	})

	t.Run("returns error for empty title", func(t *testing.T) {
		repo := setupTextRepository(t)
		text := &domain.Text{ID: "test", Content: "Content"}
		err := repo.SaveText(text)
		if !errors.Is(err, ErrEmptyTextTitle) {
			t.Errorf("expected ErrEmptyTextTitle, got %v", err)
		}
	})

	t.Run("returns error for empty content", func(t *testing.T) {
		repo := setupTextRepository(t)
		text := &domain.Text{ID: "test", Title: "Title"}
		err := repo.SaveText(text)
		if !errors.Is(err, ErrEmptyTextContent) {
			t.Errorf("expected ErrEmptyTextContent, got %v", err)
		}
	})

	t.Run("returns error for duplicate id", func(t *testing.T) {
		repo := setupTextRepository(t)
		text := &domain.Text{
			ID:       "duplicate-test",
			Title:    "Test",
			Content:  "Content",
			Language: "text",
		}
		_ = repo.SaveText(text)

		err := repo.SaveText(text)
		if !errors.Is(err, ErrTextExists) {
			t.Errorf("expected ErrTextExists, got %v", err)
		}
	})

	t.Run("defaults language to text", func(t *testing.T) {
		repo := setupTextRepository(t)
		text := &domain.Text{
			ID:      "lang-test",
			Title:   "Test",
			Content: "Content",
		}
		_ = repo.SaveText(text)

		got, _ := repo.Text("lang-test")
		if got.Language != "text" {
			t.Errorf("got language %q, want %q", got.Language, "text")
		}
	})
}

func TestTextRepository_UpdateText(t *testing.T) {
	t.Run("updates existing text", func(t *testing.T) {
		repo := setupTextRepository(t)

		// Create initial text
		original := &domain.Text{
			ID:       "update-test",
			Title:    "Original Title",
			Content:  "Original content",
			Language: "text",
		}
		_ = repo.SaveText(original)

		// Update it
		updated := &domain.Text{
			ID:       "update-test",
			Title:    "Updated Title",
			Content:  "Updated content",
			Language: "go",
		}
		err := repo.UpdateText(updated)
		if err != nil {
			t.Fatalf("UpdateText() error: %v", err)
		}

		// Verify changes
		got, _ := repo.Text("update-test")
		if got.Title != "Updated Title" {
			t.Errorf("got title %q, want %q", got.Title, "Updated Title")
		}
		if got.Content != "Updated content" {
			t.Errorf("got content %q, want %q", got.Content, "Updated content")
		}
		if got.Language != "go" {
			t.Errorf("got language %q, want %q", got.Language, "go")
		}
	})

	t.Run("returns error for non-existent text", func(t *testing.T) {
		repo := setupTextRepository(t)
		text := &domain.Text{
			ID:      "non-existent",
			Title:   "Test",
			Content: "Content",
		}
		err := repo.UpdateText(text)
		if !errors.Is(err, ErrTextNotFound) {
			t.Errorf("expected ErrTextNotFound, got %v", err)
		}
	})
}

func TestTextRepository_DeleteText(t *testing.T) {
	t.Run("deletes existing text", func(t *testing.T) {
		repo := setupTextRepository(t)

		// Create text
		text := &domain.Text{
			ID:       "delete-test",
			Title:    "To Delete",
			Content:  "Content to delete",
			Language: "text",
		}
		_ = repo.SaveText(text)

		// Delete it
		err := repo.DeleteText("delete-test")
		if err != nil {
			t.Fatalf("DeleteText() error: %v", err)
		}

		// Verify deletion
		_, err = repo.Text("delete-test")
		if !errors.Is(err, ErrTextNotFound) {
			t.Errorf("expected ErrTextNotFound after delete, got %v", err)
		}
	})

	t.Run("returns error for empty id", func(t *testing.T) {
		repo := setupTextRepository(t)
		err := repo.DeleteText("")
		if !errors.Is(err, ErrEmptyTextID) {
			t.Errorf("expected ErrEmptyTextID, got %v", err)
		}
	})

	t.Run("returns error for non-existent text", func(t *testing.T) {
		repo := setupTextRepository(t)
		err := repo.DeleteText("non-existent")
		if !errors.Is(err, ErrTextNotFound) {
			t.Errorf("expected ErrTextNotFound, got %v", err)
		}
	})
}

func TestTextRepository_SaveCategory(t *testing.T) {
	t.Run("saves valid category", func(t *testing.T) {
		repo := setupTextRepository(t)

		cat := &domain.Category{
			ID:   "cat-test",
			Name: "Test Category",
			Icon: "folder",
		}
		err := repo.SaveCategory(cat)
		if err != nil {
			t.Fatalf("SaveCategory() error: %v", err)
		}

		// Verify in library
		lib, _ := repo.Library()
		found := false
		for _, c := range lib.Categories {
			if c.ID == "cat-test" {
				found = true
				if c.Name != "Test Category" {
					t.Errorf("got name %q, want %q", c.Name, "Test Category")
				}
			}
		}
		if !found {
			t.Error("saved category not found in library")
		}
	})

	t.Run("returns error for empty id", func(t *testing.T) {
		repo := setupTextRepository(t)
		cat := &domain.Category{Name: "Test"}
		err := repo.SaveCategory(cat)
		if !errors.Is(err, ErrEmptyCategoryID) {
			t.Errorf("expected ErrEmptyCategoryID, got %v", err)
		}
	})

	t.Run("returns error for empty name", func(t *testing.T) {
		repo := setupTextRepository(t)
		cat := &domain.Category{ID: "test"}
		err := repo.SaveCategory(cat)
		if !errors.Is(err, ErrEmptyCategoryName) {
			t.Errorf("expected ErrEmptyCategoryName, got %v", err)
		}
	})

	t.Run("returns error for duplicate id", func(t *testing.T) {
		repo := setupTextRepository(t)
		cat := &domain.Category{ID: "dup-cat", Name: "First"}
		_ = repo.SaveCategory(cat)

		cat2 := &domain.Category{ID: "dup-cat", Name: "Second"}
		err := repo.SaveCategory(cat2)
		if !errors.Is(err, ErrCategoryExists) {
			t.Errorf("expected ErrCategoryExists, got %v", err)
		}
	})
}

func TestTextRepository_DeleteCategory(t *testing.T) {
	t.Run("deletes existing category", func(t *testing.T) {
		repo := setupTextRepository(t)

		cat := &domain.Category{ID: "del-cat", Name: "To Delete"}
		_ = repo.SaveCategory(cat)

		err := repo.DeleteCategory("del-cat")
		if err != nil {
			t.Fatalf("DeleteCategory() error: %v", err)
		}

		// Verify deletion
		lib, _ := repo.Library()
		for _, c := range lib.Categories {
			if c.ID == "del-cat" {
				t.Error("category should be deleted")
			}
		}
	})

	t.Run("returns error for non-existent category", func(t *testing.T) {
		repo := setupTextRepository(t)
		err := repo.DeleteCategory("non-existent")
		if !errors.Is(err, ErrCategoryNotFound) {
			t.Errorf("expected ErrCategoryNotFound, got %v", err)
		}
	})
}

func TestTextRepository_Persistence(t *testing.T) {
	t.Run("data persists across repository instances", func(t *testing.T) {
		tmpDir := t.TempDir()

		// Create and populate first instance
		mgr1, _ := New(tmpDir)
		_ = mgr1.Init()
		repo1, _ := NewTextRepository(mgr1)

		text := &domain.Text{
			ID:       "persist-test",
			Title:    "Persistent",
			Content:  "This should persist",
			Language: "text",
		}
		_ = repo1.SaveText(text)

		// Create second instance (simulates app restart)
		mgr2, _ := New(tmpDir)
		repo2, _ := NewTextRepository(mgr2)

		got, err := repo2.Text("persist-test")
		if err != nil {
			t.Fatalf("Text() on new instance error: %v", err)
		}
		if got.Title != "Persistent" {
			t.Errorf("got title %q, want %q", got.Title, "Persistent")
		}
	})
}

func TestTextRepository_ContentFile(t *testing.T) {
	t.Run("creates content file on save", func(t *testing.T) {
		tmpDir := t.TempDir()
		mgr, _ := New(tmpDir)
		_ = mgr.Init()
		repo, _ := NewTextRepository(mgr)

		text := &domain.Text{
			ID:       "file-test",
			Title:    "File Test",
			Content:  "Content in file",
			Language: "text",
		}
		_ = repo.SaveText(text)

		// Check file exists
		contentPath := filepath.Join(tmpDir, "texts", "content", "file-test.txt")
		data, err := os.ReadFile(contentPath)
		if err != nil {
			t.Fatalf("content file not created: %v", err)
		}
		if string(data) != "Content in file" {
			t.Errorf("got content %q, want %q", string(data), "Content in file")
		}
	})

	t.Run("removes content file on delete", func(t *testing.T) {
		tmpDir := t.TempDir()
		mgr, _ := New(tmpDir)
		_ = mgr.Init()
		repo, _ := NewTextRepository(mgr)

		text := &domain.Text{
			ID:       "del-file-test",
			Title:    "File Delete Test",
			Content:  "To be deleted",
			Language: "text",
		}
		_ = repo.SaveText(text)
		_ = repo.DeleteText("del-file-test")

		contentPath := filepath.Join(tmpDir, "texts", "content", "del-file-test.txt")
		if _, err := os.Stat(contentPath); !os.IsNotExist(err) {
			t.Error("content file should be deleted")
		}
	})
}
