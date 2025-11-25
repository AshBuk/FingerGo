// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"errors"
	"fmt"

	domain "github.com/AshBuk/FingerGo/internal"
)

// Text validation errors.
var (
	ErrTextNotFound        = errors.New("storage: text not found")
	ErrContentUnavailable  = errors.New("storage: text content unavailable")
	ErrTextExists          = errors.New("storage: text already exists")
	ErrEmptyTextID         = errors.New("storage: text id is empty")
	ErrEmptyTextTitle      = errors.New("storage: text title is empty")
	ErrTextTitleTooLong    = errors.New("storage: text title too long")
	ErrEmptyTextContent    = errors.New("storage: text content is empty")
	ErrTextContentTooLarge = errors.New("storage: text content too large")
	ErrInvalidLanguage     = errors.New("storage: invalid language")
)

// Category validation errors.
var (
	ErrCategoryExists      = errors.New("storage: category already exists")
	ErrCategoryNotFound    = errors.New("storage: category not found")
	ErrEmptyCategoryID     = errors.New("storage: category id is empty")
	ErrEmptyCategoryName   = errors.New("storage: category name is empty")
	ErrCategoryNameTooLong = errors.New("storage: category name too long")
)

// Validation limits.
const (
	maxTitleLength   = 200       // Maximum title length in characters
	maxContentLength = 1_000_000 // Maximum content length (1MB of text)
	maxCategoryName  = 100       // Maximum category name length
	defaultLanguage  = "text"    // Default language for plain text
)

// validateText checks text field constraints.
func validateText(text *domain.Text) error {
	if text.Title == "" {
		return ErrEmptyTextTitle
	}
	if len(text.Title) > maxTitleLength {
		return ErrTextTitleTooLong
	}
	if text.Content == "" {
		return ErrEmptyTextContent
	}
	if len(text.Content) > maxContentLength {
		return ErrTextContentTooLarge
	}
	if text.Language == "" {
		text.Language = defaultLanguage
	}
	if !domain.IsValidLanguage(text.Language) {
		return fmt.Errorf("%w: %s", ErrInvalidLanguage, text.Language)
	}
	return nil
}

// validateCategory checks category field constraints.
func validateCategory(cat *domain.Category) error {
	if cat == nil || cat.ID == "" {
		return ErrEmptyCategoryID
	}
	if cat.Name == "" {
		return ErrEmptyCategoryName
	}
	if len(cat.Name) > maxCategoryName {
		return ErrCategoryNameTooLong
	}
	return nil
}
