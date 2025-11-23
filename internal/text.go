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
