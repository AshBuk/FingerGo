// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sync"

	domain "github.com/AshBuk/FingerGo/internal"
)

var (
	errNilManager         = errors.New("storage: manager is nil")
	errDefaultTextUnset   = errors.New("storage: default text id is not configured")
	ErrTextNotFound       = errors.New("storage: text not found")
	ErrContentUnavailable = errors.New("storage: text content unavailable")
	ErrTextExists         = errors.New("storage: text already exists")
	ErrEmptyTextID        = errors.New("storage: text id is empty")
)

// TextRepository manages the text library with lazy loading and caching.
//
// Design:
//   - Metadata (index.json) loaded once on first access
//   - Content files loaded on demand and cached in memory
//   - All public methods are thread-safe (guarded by RWMutex)
//   - Writes persist both in-memory state and disk atomically
type TextRepository struct {
	contentCache map[string]string      // id → full text content
	textIndex    map[string]domain.Text // id → metadata (O(1) lookup)
	storage      *Manager               // underlying file manager
	library      domain.TextLibrary     // categories + text metadata
	mu           sync.RWMutex           // guards all fields below
	loaded       bool                   // true after first load
}

// NewTextRepository wires repository to the storage manager.
func NewTextRepository(mgr *Manager) (*TextRepository, error) {
	if mgr == nil {
		return nil, errNilManager
	}
	return &TextRepository{
		storage:      mgr,                          // file system access
		contentCache: make(map[string]string),      // empty content cache
		textIndex:    make(map[string]domain.Text), // empty lookup index
	}, nil
}

// Library returns metadata for texts and categories (content stripped).
func (r *TextRepository) Library() (domain.TextLibrary, error) {
	if err := r.ensureLoaded(); err != nil {
		return domain.TextLibrary{}, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	return cloneLibrary(r.library), nil
}

// DefaultText resolves and returns the configured default text with content.
func (r *TextRepository) DefaultText() (domain.Text, error) {
	lib, err := r.Library()
	if err != nil {
		return domain.Text{}, err
	}
	if lib.DefaultTextID == "" {
		return domain.Text{}, errDefaultTextUnset
	}
	return r.Text(lib.DefaultTextID)
}

// Text returns a text (metadata + content) by identifier.
func (r *TextRepository) Text(id string) (domain.Text, error) {
	if id == "" {
		return domain.Text{}, ErrTextNotFound
	}
	if err := r.ensureLoaded(); err != nil {
		return domain.Text{}, err
	}
	r.mu.RLock()
	text, found := r.lookupTextLocked(id)
	if !found {
		r.mu.RUnlock()
		return domain.Text{}, fmt.Errorf("%w: %s", ErrTextNotFound, id)
	}
	if content, ok := r.contentCache[id]; ok {
		r.mu.RUnlock()
		text.Content = content
		return text, nil
	}
	r.mu.RUnlock()
	content, err := r.loadContent(id)
	if err != nil {
		return domain.Text{}, err
	}
	r.mu.Lock()
	r.contentCache[id] = content
	r.mu.Unlock()
	text.Content = content
	return text, nil
}

// SaveText creates a new text entry with content.
// Returns ErrTextExists if a text with the same ID already exists.
func (r *TextRepository) SaveText(text *domain.Text) error {
	if text == nil || text.ID == "" {
		return ErrEmptyTextID
	}
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.textIndex[text.ID]; exists {
		return fmt.Errorf("%w: %s", ErrTextExists, text.ID)
	}
	content := text.Content
	entry := *text
	entry.Content = "" // strip content from metadata

	// Update in-memory state
	r.library.Texts = append(r.library.Texts, entry)
	r.textIndex[entry.ID] = entry
	r.contentCache[entry.ID] = content

	// Persist to disk
	if err := r.persistIndex(); err != nil {
		return err
	}
	return r.persistContent(entry.ID, content)
}

// UpdateText modifies an existing text entry.
func (r *TextRepository) UpdateText(text *domain.Text) error {
	if text == nil || text.ID == "" {
		return ErrEmptyTextID
	}
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.textIndex[text.ID]; !exists {
		return fmt.Errorf("%w: %s", ErrTextNotFound, text.ID)
	}
	content := text.Content
	entry := *text
	entry.Content = "" // strip content from metadata

	// Update in-memory state
	for i, t := range r.library.Texts {
		if t.ID == entry.ID {
			r.library.Texts[i] = entry
			break
		}
	}
	r.textIndex[entry.ID] = entry
	r.contentCache[entry.ID] = content

	// Persist to disk
	if err := r.persistIndex(); err != nil {
		return err
	}
	return r.persistContent(entry.ID, content)
}

// DeleteText removes a text entry by ID.
func (r *TextRepository) DeleteText(id string) error {
	if id == "" {
		return ErrEmptyTextID
	}
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.textIndex[id]; !exists {
		return fmt.Errorf("%w: %s", ErrTextNotFound, id)
	}
	// Update in-memory state
	delete(r.textIndex, id)
	delete(r.contentCache, id)
	for i, t := range r.library.Texts {
		if t.ID == id {
			r.library.Texts = append(r.library.Texts[:i], r.library.Texts[i+1:]...)
			break
		}
	}
	// Persist index and remove content file
	if err := r.persistIndex(); err != nil {
		return err
	}
	return r.deleteContent(id)
}

// persistIndex writes the current library metadata to disk.
func (r *TextRepository) persistIndex() error {
	indexPath := r.storage.join(textsIndexFile)
	data, err := json.MarshalIndent(r.library, "", "  ")
	if err != nil {
		return fmt.Errorf("storage: marshal index: %w", err)
	}
	if err := os.WriteFile(indexPath, data, 0o600); err != nil {
		return fmt.Errorf("storage: write index %q: %w", indexPath, err)
	}
	return nil
}

// persistContent writes text content to a separate file.
func (r *TextRepository) persistContent(id, content string) error {
	contentPath := r.storage.join(textsContentDir, fmt.Sprintf("%s.txt", id))
	if err := os.WriteFile(contentPath, []byte(content), 0o600); err != nil {
		return fmt.Errorf("storage: write content %q: %w", contentPath, err)
	}
	return nil
}

// deleteContent removes the content file for a text.
func (r *TextRepository) deleteContent(id string) error {
	contentPath := r.storage.join(textsContentDir, fmt.Sprintf("%s.txt", id))
	if err := os.Remove(contentPath); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("storage: delete content %q: %w", contentPath, err)
	}
	return nil
}

func (r *TextRepository) ensureLoaded() error {
	r.mu.RLock()
	if r.loaded {
		r.mu.RUnlock()
		return nil
	}
	r.mu.RUnlock()
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.loaded {
		return nil
	}
	indexPath := r.storage.join(textsIndexFile)
	data, err := os.ReadFile(indexPath)
	if err != nil {
		return fmt.Errorf("storage: read index %q: %w", indexPath, err)
	}
	var library domain.TextLibrary
	if err := json.Unmarshal(data, &library); err != nil {
		return fmt.Errorf("storage: parse index %q: %w", indexPath, err)
	}
	for i := range library.Texts {
		library.Texts[i].Content = ""
	}
	r.library = library
	r.loaded = true
	if r.contentCache == nil {
		r.contentCache = make(map[string]string)
	}
	if r.textIndex == nil {
		r.textIndex = make(map[string]domain.Text, len(library.Texts))
	}
	for _, text := range library.Texts {
		r.textIndex[text.ID] = text
	}
	return nil
}

func (r *TextRepository) lookupTextLocked(id string) (domain.Text, bool) {
	text, ok := r.textIndex[id]
	return text, ok
}

func (r *TextRepository) loadContent(id string) (string, error) {
	candidate := r.storage.join(textsContentDir, fmt.Sprintf("%s.txt", id))
	data, err := os.ReadFile(candidate)
	if err == nil {
		return string(data), nil
	}
	if errors.Is(err, os.ErrNotExist) {
		fallback := r.storage.join(fallbackContentFile)
		data, ferr := os.ReadFile(fallback)
		if ferr != nil {
			return "", fmt.Errorf("%w: %s", ErrContentUnavailable, id)
		}
		return string(data), nil
	}
	return "", fmt.Errorf("storage: read content %q: %w", candidate, err)
}

func cloneLibrary(src domain.TextLibrary) domain.TextLibrary {
	out := src
	if len(src.Categories) > 0 {
		out.Categories = append([]domain.Category(nil), src.Categories...)
	}
	if len(src.Texts) > 0 {
		out.Texts = append([]domain.Text(nil), src.Texts...)
		for i := range out.Texts {
			out.Texts[i].Content = ""
		}
	}
	return out
}
