// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"errors"
	"strings"
	"testing"

	domain "github.com/AshBuk/FingerGo/internal/domain"
)

func TestValidateText(t *testing.T) {
	t.Run("accepts valid text", func(t *testing.T) {
		text := &domain.Text{
			ID:       "test-id",
			Title:    "Valid Title",
			Content:  "Some content to type",
			Language: "go",
		}

		if err := validateText(text); err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	t.Run("rejects empty title", func(t *testing.T) {
		text := &domain.Text{
			ID:      "test-id",
			Title:   "",
			Content: "content",
		}

		err := validateText(text)
		if !errors.Is(err, ErrEmptyTextTitle) {
			t.Errorf("got %v, want ErrEmptyTextTitle", err)
		}
	})

	t.Run("rejects too long title", func(t *testing.T) {
		text := &domain.Text{
			ID:      "test-id",
			Title:   strings.Repeat("a", maxTitleLength+1),
			Content: "content",
		}

		err := validateText(text)
		if !errors.Is(err, ErrTextTitleTooLong) {
			t.Errorf("got %v, want ErrTextTitleTooLong", err)
		}
	})

	t.Run("rejects empty content", func(t *testing.T) {
		text := &domain.Text{
			ID:      "test-id",
			Title:   "Title",
			Content: "",
		}

		err := validateText(text)
		if !errors.Is(err, ErrEmptyTextContent) {
			t.Errorf("got %v, want ErrEmptyTextContent", err)
		}
	})

	t.Run("rejects too large content", func(t *testing.T) {
		text := &domain.Text{
			ID:      "test-id",
			Title:   "Title",
			Content: strings.Repeat("x", maxContentLength+1),
		}

		err := validateText(text)
		if !errors.Is(err, ErrTextContentTooLarge) {
			t.Errorf("got %v, want ErrTextContentTooLarge", err)
		}
	})

	t.Run("sets default language when empty", func(t *testing.T) {
		text := &domain.Text{
			ID:       "test-id",
			Title:    "Title",
			Content:  "content",
			Language: "",
		}

		if err := validateText(text); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if text.Language != defaultLanguage {
			t.Errorf("got language %q, want %q", text.Language, defaultLanguage)
		}
	})

	t.Run("rejects invalid language", func(t *testing.T) {
		text := &domain.Text{
			ID:       "test-id",
			Title:    "Title",
			Content:  "content",
			Language: "invalid-lang",
		}

		err := validateText(text)
		if !errors.Is(err, ErrInvalidLanguage) {
			t.Errorf("got %v, want ErrInvalidLanguage", err)
		}
	})
}

func TestValidateCategory(t *testing.T) {
	t.Run("accepts valid category", func(t *testing.T) {
		cat := &domain.Category{
			ID:   "cat-id",
			Name: "Category Name",
		}

		if err := validateCategory(cat); err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	t.Run("rejects nil category", func(t *testing.T) {
		err := validateCategory(nil)
		if !errors.Is(err, ErrEmptyCategoryID) {
			t.Errorf("got %v, want ErrEmptyCategoryID", err)
		}
	})

	t.Run("rejects empty ID", func(t *testing.T) {
		cat := &domain.Category{
			ID:   "",
			Name: "Name",
		}

		err := validateCategory(cat)
		if !errors.Is(err, ErrEmptyCategoryID) {
			t.Errorf("got %v, want ErrEmptyCategoryID", err)
		}
	})

	t.Run("rejects empty name", func(t *testing.T) {
		cat := &domain.Category{
			ID:   "id",
			Name: "",
		}

		err := validateCategory(cat)
		if !errors.Is(err, ErrEmptyCategoryName) {
			t.Errorf("got %v, want ErrEmptyCategoryName", err)
		}
	})

	t.Run("rejects too long name", func(t *testing.T) {
		cat := &domain.Category{
			ID:   "id",
			Name: strings.Repeat("n", maxCategoryName+1),
		}

		err := validateCategory(cat)
		if !errors.Is(err, ErrCategoryNameTooLong) {
			t.Errorf("got %v, want ErrCategoryNameTooLong", err)
		}
	})
}
