// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

// Package internal defines domain types and repository interfaces for FingerGo.
//
// Repository interfaces enable dependency injection and testability:
//   - App layer depends on interfaces, not concrete implementations
//   - Storage implementations satisfy these interfaces
//   - Tests can provide mock implementations

package domain

// TextRepository defines operations for managing typing texts.
type TextRepository interface {
	Library() (TextLibrary, error)
	DefaultText() (Text, error)
	Text(id string) (Text, error)
	SaveText(text *Text) error
	UpdateText(text *Text) error
	DeleteText(id string) error
	SaveCategory(cat *Category) error
	DeleteCategory(id string) error
}

// SessionRepository defines operations for typing session history.
type SessionRepository interface {
	Record(payload *SessionPayload) (TypingSession, error)
	List(limit int) ([]TypingSession, error)
}

// SettingsRepository defines operations for user preferences.
type SettingsRepository interface {
	Load() (Settings, error)
	Save(s Settings) error
	Update(key string, value any) error
}
