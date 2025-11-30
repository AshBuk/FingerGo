// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package domain

import "testing"

func TestSupportedLanguages(t *testing.T) {
	t.Run("returns non-empty list", func(t *testing.T) {
		languages := SupportedLanguages()
		if len(languages) == 0 {
			t.Error("expected non-empty language list")
		}
	})

	t.Run("includes common languages", func(t *testing.T) {
		languages := SupportedLanguages()
		expected := []string{"go", "js", "py", "rust", "text"}
		langMap := make(map[string]bool)
		for _, l := range languages {
			langMap[l.Key] = true
		}
		for _, key := range expected {
			if !langMap[key] {
				t.Errorf("expected language %q not found", key)
			}
		}
	})

	t.Run("all entries have required fields", func(t *testing.T) {
		for _, lang := range SupportedLanguages() {
			if lang.Key == "" {
				t.Error("language Key cannot be empty")
			}
			if lang.Label == "" {
				t.Errorf("language %q has empty Label", lang.Key)
			}
			if lang.Icon == "" {
				t.Errorf("language %q has empty Icon", lang.Key)
			}
		}
	})
}

func TestIsValidLanguage(t *testing.T) {
	t.Run("returns true for valid languages", func(t *testing.T) {
		validKeys := []string{"go", "js", "py", "text", "rust", "bash"}
		for _, key := range validKeys {
			if !IsValidLanguage(key) {
				t.Errorf("IsValidLanguage(%q) = false, want true", key)
			}
		}
	})

	t.Run("returns false for invalid languages", func(t *testing.T) {
		invalidKeys := []string{"", "invalid", "golang", "javascript", "python"}
		for _, key := range invalidKeys {
			if IsValidLanguage(key) {
				t.Errorf("IsValidLanguage(%q) = true, want false", key)
			}
		}
	})

	t.Run("is case sensitive", func(t *testing.T) {
		if IsValidLanguage("Go") {
			t.Error("expected case-sensitive check (Go != go)")
		}
		if IsValidLanguage("GO") {
			t.Error("expected case-sensitive check (GO != go)")
		}
	})
}
