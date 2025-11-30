// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	domain "github.com/AshBuk/FingerGo/internal/domain"
)

// Text validation errors.
var (
	ErrTextNotFound        = errors.New("storage: text not found")
	ErrContentUnavailable  = errors.New("storage: text content unavailable")
	ErrTextExists          = errors.New("storage: text already exists")
	ErrEmptyTextID         = errors.New("storage: text id is empty")
	ErrInvalidTextID       = errors.New("storage: text id contains invalid characters")
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
	ErrInvalidCategoryID   = errors.New("storage: category id contains invalid characters")
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

// validIDPattern defines allowed characters in IDs: alphanumeric, hyphens, underscores.
// This prevents path traversal attacks (../, ..\, etc.) and ensures filesystem safety.
var validIDPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)

// validateTextID checks if text ID is safe for filesystem operations.
// Prevents path traversal attacks by ensuring ID contains only safe characters.
func validateTextID(id string) error {
	if id == "" {
		return ErrEmptyTextID
	}
	// Check for path traversal patterns
	if strings.Contains(id, "..") || strings.Contains(id, "/") || strings.Contains(id, "\\") {
		return fmt.Errorf("%w: contains path traversal characters", ErrInvalidTextID)
	}
	// Ensure only safe characters (alphanumeric, hyphens, underscores)
	if !validIDPattern.MatchString(id) {
		return fmt.Errorf("%w: must contain only alphanumeric characters, hyphens, or underscores", ErrInvalidTextID)
	}
	return nil
}

// validateCategoryID checks if category ID is safe for filesystem operations.
func validateCategoryID(id string) error {
	if id == "" {
		return ErrEmptyCategoryID
	}
	// Check for path traversal patterns
	if strings.Contains(id, "..") || strings.Contains(id, "/") || strings.Contains(id, "\\") {
		return fmt.Errorf("%w: contains path traversal characters", ErrInvalidCategoryID)
	}
	// Ensure only safe characters (alphanumeric, hyphens, underscores)
	if !validIDPattern.MatchString(id) {
		return fmt.Errorf("%w: must contain only alphanumeric characters, hyphens, or underscores", ErrInvalidCategoryID)
	}
	return nil
}

// validateText checks text field constraints.
func validateText(text *domain.Text) error {
	// Validate ID first (security-critical)
	if err := validateTextID(text.ID); err != nil {
		return err
	}
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
	if cat == nil {
		return ErrEmptyCategoryID
	}
	// Validate ID first (security-critical)
	if err := validateCategoryID(cat.ID); err != nil {
		return err
	}
	if cat.Name == "" {
		return ErrEmptyCategoryName
	}
	if len(cat.Name) > maxCategoryName {
		return ErrCategoryNameTooLong
	}
	return nil
}
