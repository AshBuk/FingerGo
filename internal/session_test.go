// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package internal

import (
	"testing"
	"time"
)

func TestSessionPayload_ToTypingSession(t *testing.T) {
	fallback := time.Date(2025, 1, 15, 10, 0, 0, 0, time.UTC)

	t.Run("converts valid payload", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{
				Text:      "hello world",
				TextTitle: "Test Title",
			},
			WPM:             45.567,
			Accuracy:        97.123,
			Duration:        120.5,
			TotalKeystrokes: 100,
			TotalErrors:     3,
		}

		session := payload.ToTypingSession(fallback)

		if session.TextTitle != "Test Title" {
			t.Errorf("got title %q, want %q", session.TextTitle, "Test Title")
		}
		if session.WPM != 45.57 {
			t.Errorf("got WPM %v, want 45.57 (rounded)", session.WPM)
		}
		if session.Accuracy != 97.12 {
			t.Errorf("got Accuracy %v, want 97.12 (rounded)", session.Accuracy)
		}
		if session.CharacterCount != 11 {
			t.Errorf("got CharacterCount %d, want 11", session.CharacterCount)
		}
	})

	t.Run("derives title from text when empty", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{
				Text:      "First line of text\nSecond line",
				TextTitle: "",
			},
		}

		session := payload.ToTypingSession(fallback)

		if session.TextTitle != "First line of text" {
			t.Errorf("got title %q, want %q", session.TextTitle, "First line of text")
		}
	})

	t.Run("generates preview from text", func(t *testing.T) {
		longText := "This is a test text that should be truncated for preview purposes when it exceeds the maximum allowed length for text previews in the session summary display"

		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{
				Text: longText,
			},
		}

		session := payload.ToTypingSession(fallback)

		if len(session.TextPreview) > 120 {
			t.Errorf("preview too long: %d chars", len(session.TextPreview))
		}
	})

	t.Run("clamps negative WPM to zero", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{Text: "test"},
			WPM:             -10.0,
		}

		session := payload.ToTypingSession(fallback)

		if session.WPM != 0 {
			t.Errorf("got WPM %v, want 0", session.WPM)
		}
	})

	t.Run("clamps accuracy to 0-100 range", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{Text: "test"},
			Accuracy:        150.0,
		}

		session := payload.ToTypingSession(fallback)

		if session.Accuracy != 100 {
			t.Errorf("got Accuracy %v, want 100", session.Accuracy)
		}
	})

	t.Run("clamps errors to keystrokes", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{Text: "test"},
			TotalKeystrokes: 50,
			TotalErrors:     100,
		}

		session := payload.ToTypingSession(fallback)

		if session.TotalErrors > session.TotalKeystrokes {
			t.Errorf("errors %d exceeds keystrokes %d", session.TotalErrors, session.TotalKeystrokes)
		}
	})

	t.Run("uses fallback time when timestamps missing", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{Text: "test"},
			StartTime:       0,
			EndTime:         0,
		}

		session := payload.ToTypingSession(fallback)

		if !session.StartedAt.Equal(fallback) {
			t.Errorf("got start %v, want %v", session.StartedAt, fallback)
		}
	})

	t.Run("handles nil SessionTextMeta", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: nil,
			WPM:             30.0,
		}

		session := payload.ToTypingSession(fallback)

		if session.TextTitle != "Typing Session" {
			t.Errorf("got title %q, want %q", session.TextTitle, "Typing Session")
		}
	})

	t.Run("clones mistakes map", func(t *testing.T) {
		original := map[string]int{"a": 3, "s": 5}
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{Text: "test"},
			Mistakes:        original,
		}

		session := payload.ToTypingSession(fallback)

		// Modify original
		original["a"] = 999

		if session.Mistakes["a"] != 3 {
			t.Error("mistakes map was not cloned")
		}
	})

	t.Run("filters zero-value mistakes", func(t *testing.T) {
		payload := &SessionPayload{
			SessionTextMeta: &SessionTextMeta{Text: "test"},
			Mistakes:        map[string]int{"a": 3, "b": 0, "c": -1},
		}

		session := payload.ToTypingSession(fallback)

		if _, exists := session.Mistakes["b"]; exists {
			t.Error("zero-value mistake should be filtered")
		}
		if _, exists := session.Mistakes["c"]; exists {
			t.Error("negative mistake should be filtered")
		}
		if session.Mistakes["a"] != 3 {
			t.Error("valid mistake should be preserved")
		}
	})
}

func TestTruncateRunes(t *testing.T) {
	t.Run("returns full string when under limit", func(t *testing.T) {
		result := truncateRunes("hello", 10)
		if result != "hello" {
			t.Errorf("got %q, want %q", result, "hello")
		}
	})

	t.Run("truncates at rune boundary", func(t *testing.T) {
		result := truncateRunes("hello world", 5)
		if result != "hello" {
			t.Errorf("got %q, want %q", result, "hello")
		}
	})

	t.Run("handles unicode correctly", func(t *testing.T) {
		result := truncateRunes("привет мир", 6)
		if result != "привет" {
			t.Errorf("got %q, want %q", result, "привет")
		}
	})

	t.Run("returns empty for zero limit", func(t *testing.T) {
		result := truncateRunes("hello", 0)
		if result != "" {
			t.Errorf("got %q, want empty", result)
		}
	})
}

func TestRound2(t *testing.T) {
	tests := []struct {
		input    float64
		expected float64
	}{
		{0, 0},
		{1.234, 1.23},
		{1.235, 1.24},
		{99.999, 100},
		{0.001, 0},
		{0.005, 0.01},
	}

	for _, tc := range tests {
		result := round2(tc.input)
		if result != tc.expected {
			t.Errorf("round2(%v) = %v, want %v", tc.input, result, tc.expected)
		}
	}
}

func TestClamp(t *testing.T) {
	t.Run("clamps int values", func(t *testing.T) {
		if clamp(5, 0, 10) != 5 {
			t.Error("value in range should be unchanged")
		}
		if clamp(-5, 0, 10) != 0 {
			t.Error("below min should return min")
		}
		if clamp(15, 0, 10) != 10 {
			t.Error("above max should return max")
		}
	})

	t.Run("clamps float values", func(t *testing.T) {
		if clamp(50.5, 0.0, 100.0) != 50.5 {
			t.Error("value in range should be unchanged")
		}
		if clamp(-10.0, 0.0, 100.0) != 0.0 {
			t.Error("below min should return min")
		}
		if clamp(150.0, 0.0, 100.0) != 100.0 {
			t.Error("above max should return max")
		}
	})
}

func TestDeriveTitle(t *testing.T) {
	t.Run("extracts first line", func(t *testing.T) {
		result := deriveTitle("First line\nSecond line")
		if result != "First line" {
			t.Errorf("got %q, want %q", result, "First line")
		}
	})

	t.Run("returns default for empty text", func(t *testing.T) {
		result := deriveTitle("")
		if result != "Typing Session" {
			t.Errorf("got %q, want %q", result, "Typing Session")
		}
	})

	t.Run("trims whitespace", func(t *testing.T) {
		result := deriveTitle("  \n  content  ")
		if result != "content" {
			t.Errorf("got %q, want %q", result, "content")
		}
	})

	t.Run("truncates long titles", func(t *testing.T) {
		longLine := "This is a very long line that exceeds the maximum allowed title length and should be truncated"
		result := deriveTitle(longLine)
		if len(result) > 64 {
			t.Errorf("title length %d exceeds 64", len(result))
		}
	})
}
