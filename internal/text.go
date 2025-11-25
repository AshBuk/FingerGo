// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package internal

import "time"

// Text represents a single training entry available to the typing engine.
type Text struct {
	CreatedAt  time.Time `json:"createdAt"`  // when the text was added
	ID         string    `json:"id"`         // unique identifier (UUID)
	Title      string    `json:"title"`      // display name in library
	Content    string    `json:"content"`    // the actual text to type
	CategoryID string    `json:"categoryId"` // parent category (empty if root)
	Language   string    `json:"language"`   // tokenization rules: go, js, py, plain
	IsFavorite bool      `json:"isFavorite"` // user-pinned for quick access
}

// Category groups texts into hierarchical collections for browsing.
type Category struct {
	ID       string `json:"id"`                 // unique identifier (UUID)
	Name     string `json:"name"`               // display name in library
	ParentID string `json:"parentId,omitempty"` // parent for nesting (empty if root)
	Icon     string `json:"icon,omitempty"`     // icon: go, js, py, folder
}

// TextLibrary aggregates available texts and their categories.
type TextLibrary struct {
	DefaultTextID string     `json:"defaultTextId"` // text loaded on startup
	Categories    []Category `json:"categories"`    // flat list with ParentID refs
	Texts         []Text     `json:"texts"`         // metadata; content lazy-loaded
}

// LanguageInfo describes a supported programming language.
type LanguageInfo struct {
	Key   string `json:"key"`   // identifier used in Text.Language
	Icon  string `json:"icon"`  // emoji for UI display
	Label string `json:"label"` // human-readable name
}

// supportedLanguages is the single source of truth for language definitions.
var supportedLanguages = []LanguageInfo{
	// General text
	{Key: "text", Icon: "📄", Label: "Plain Text"},
	{Key: "english", Icon: "🇬🇧", Label: "English"},
	{Key: "russian", Icon: "🇷🇺", Label: "Russian"},
	// Systems programming
	{Key: "c", Icon: "🔧", Label: "C"},
	{Key: "cpp", Icon: "⚙️", Label: "C++"},
	{Key: "rust", Icon: "🦀", Label: "Rust"},
	{Key: "go", Icon: "🐹", Label: "Go"},
	{Key: "zig", Icon: "⚡", Label: "Zig"},
	// Web & scripting
	{Key: "js", Icon: "🟡", Label: "JavaScript"},
	{Key: "ts", Icon: "🔷", Label: "TypeScript"},
	{Key: "py", Icon: "🐍", Label: "Python"},
	{Key: "rb", Icon: "💎", Label: "Ruby"},
	{Key: "php", Icon: "🐘", Label: "PHP"},
	{Key: "lua", Icon: "🌙", Label: "Lua"},
	// JVM & .NET
	{Key: "java", Icon: "☕", Label: "Java"},
	{Key: "kotlin", Icon: "🟣", Label: "Kotlin"},
	{Key: "scala", Icon: "🔴", Label: "Scala"},
	{Key: "csharp", Icon: "🟢", Label: "C#"},
	// Functional
	{Key: "haskell", Icon: "λ", Label: "Haskell"},
	{Key: "elixir", Icon: "💧", Label: "Elixir"},
	// Mobile
	{Key: "swift", Icon: "🍎", Label: "Swift"},
	{Key: "dart", Icon: "🎯", Label: "Dart"},
	// Data & config
	{Key: "sql", Icon: "🗃️", Label: "SQL"},
	{Key: "json", Icon: "📋", Label: "JSON"},
	{Key: "yaml", Icon: "📝", Label: "YAML"},
	// Shell
	{Key: "bash", Icon: "🖥️", Label: "Bash"},
}

// validLanguageKeys is a lookup map for O(1) validation.
// Built from supportedLanguages at initialization.
var validLanguageKeys map[string]bool

func init() {
	validLanguageKeys = make(map[string]bool, len(supportedLanguages))
	for _, lang := range supportedLanguages {
		validLanguageKeys[lang.Key] = true
	}
}

// SupportedLanguages returns the list of supported programming languages.
func SupportedLanguages() []LanguageInfo {
	return supportedLanguages
}

// IsValidLanguage checks if a language key is supported.
// Uses O(1) map lookup for performance.
func IsValidLanguage(key string) bool {
	return validLanguageKeys[key]
}
