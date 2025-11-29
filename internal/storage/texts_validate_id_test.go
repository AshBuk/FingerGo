// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"errors"
	"testing"
)

func TestValidateTextID(t *testing.T) {
	t.Run("accepts valid alphanumeric IDs", func(t *testing.T) {
		validIDs := []string{
			"simple-id",
			"test_123",
			"CamelCaseID",
			"lowercase",
			"UPPERCASE",
			"with-dashes-123",
			"with_underscores_456",
			"abc123xyz",
		}

		for _, id := range validIDs {
			if err := validateTextID(id); err != nil {
				t.Errorf("validateTextID(%q) unexpected error: %v", id, err)
			}
		}
	})

	t.Run("rejects empty ID", func(t *testing.T) {
		err := validateTextID("")
		if !errors.Is(err, ErrEmptyTextID) {
			t.Errorf("expected ErrEmptyTextID, got %v", err)
		}
	})

	t.Run("rejects path traversal patterns", func(t *testing.T) {
		dangerousIDs := []string{
			"../etc/passwd",
			"..\\windows\\system32",
			"../../secret",
			"dir/../file",
			"dir\\..\\file",
		}

		for _, id := range dangerousIDs {
			err := validateTextID(id)
			if err == nil {
				t.Errorf("validateTextID(%q) should reject path traversal, got nil error", id)
			}
			if !errors.Is(err, ErrInvalidTextID) {
				t.Errorf("validateTextID(%q) expected ErrInvalidTextID, got %v", id, err)
			}
		}
	})

	t.Run("rejects IDs with slashes", func(t *testing.T) {
		invalidIDs := []string{
			"dir/file",
			"dir\\file",
			"/absolute/path",
			"\\absolute\\path",
			"middle/slash",
		}

		for _, id := range invalidIDs {
			err := validateTextID(id)
			if err == nil {
				t.Errorf("validateTextID(%q) should reject slashes, got nil error", id)
			}
			if !errors.Is(err, ErrInvalidTextID) {
				t.Errorf("validateTextID(%q) expected ErrInvalidTextID, got %v", id, err)
			}
		}
	})

	t.Run("rejects IDs with special characters", func(t *testing.T) {
		invalidIDs := []string{
			"id with spaces",
			"id@email.com",
			"id#hashtag",
			"id$dollar",
			"id%percent",
			"id&ampersand",
			"id*asterisk",
			"id(parens)",
			"id[brackets]",
			"id{braces}",
			"id;semicolon",
			"id'quote",
			"id\"doublequote",
		}

		for _, id := range invalidIDs {
			err := validateTextID(id)
			if err == nil {
				t.Errorf("validateTextID(%q) should reject special chars, got nil error", id)
			}
			if !errors.Is(err, ErrInvalidTextID) {
				t.Errorf("validateTextID(%q) expected ErrInvalidTextID, got %v", id, err)
			}
		}
	})
}

func TestValidateCategoryID(t *testing.T) {
	t.Run("accepts valid alphanumeric IDs", func(t *testing.T) {
		validIDs := []string{
			"category-1",
			"test_cat",
			"Programming",
			"go-lang",
			"javascript_basics",
		}

		for _, id := range validIDs {
			if err := validateCategoryID(id); err != nil {
				t.Errorf("validateCategoryID(%q) unexpected error: %v", id, err)
			}
		}
	})

	t.Run("rejects empty ID", func(t *testing.T) {
		err := validateCategoryID("")
		if !errors.Is(err, ErrEmptyCategoryID) {
			t.Errorf("expected ErrEmptyCategoryID, got %v", err)
		}
	})

	t.Run("rejects path traversal patterns", func(t *testing.T) {
		dangerousIDs := []string{
			"../parent",
			"..\\parent",
			"../../root",
		}

		for _, id := range dangerousIDs {
			err := validateCategoryID(id)
			if err == nil {
				t.Errorf("validateCategoryID(%q) should reject path traversal, got nil error", id)
			}
			if !errors.Is(err, ErrInvalidCategoryID) {
				t.Errorf("validateCategoryID(%q) expected ErrInvalidCategoryID, got %v", id, err)
			}
		}
	})

	t.Run("rejects IDs with slashes", func(t *testing.T) {
		invalidIDs := []string{
			"parent/child",
			"parent\\child",
			"/root",
		}

		for _, id := range invalidIDs {
			err := validateCategoryID(id)
			if err == nil {
				t.Errorf("validateCategoryID(%q) should reject slashes, got nil error", id)
			}
			if !errors.Is(err, ErrInvalidCategoryID) {
				t.Errorf("validateCategoryID(%q) expected ErrInvalidCategoryID, got %v", id, err)
			}
		}
	})
}

// Benchmark validation functions for performance
func BenchmarkValidateTextID(b *testing.B) {
	id := "test-text-id-123"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = validateTextID(id)
	}
}

func BenchmarkValidateCategoryID(b *testing.B) {
	id := "test-category-id-123"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = validateCategoryID(id)
	}
}
