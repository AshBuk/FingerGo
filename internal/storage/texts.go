// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"

	domain "github.com/AshBuk/FingerGo/internal/domain"
)

// Internal errors (not exported).
var (
	errNilManager       = errors.New("storage: manager is nil")
	errDefaultTextUnset = errors.New("storage: default text id is not configured")
)

const (
	// maxCachedTexts limits in-memory content cache to prevent unbounded growth.
	// At ~100KB average per text, 50 texts ≈ 5MB RAM maximum.
	maxCachedTexts = 50
)

// TextRepository manages the text library with lazy loading and caching.
//
// Design:
//   - Metadata (index.json) loaded once on first access
//   - Content files loaded on demand and cached in memory
//   - All public methods are thread-safe (guarded by RWMutex)
//   - Writes persist both in-memory state and disk atomically
//   - O(1) lookups via textIndex and sliceIndex maps
type TextRepository struct {
	contentCache map[string]string      // id → full text content
	textIndex    map[string]domain.Text // id → metadata (O(1) lookup)
	sliceIndex   map[string]int         // id → position in library.Texts slice
	storage      *Manager               // underlying file manager
	library      domain.TextLibrary     // categories + text metadata
	mu           sync.RWMutex           // guards all fields
	loaded       bool                   // true after first load
}

// NewTextRepository wires repository to the storage manager.
func NewTextRepository(mgr *Manager) (*TextRepository, error) {
	if mgr == nil {
		return nil, errNilManager
	}
	return &TextRepository{
		storage:      mgr,
		contentCache: make(map[string]string),
		textIndex:    make(map[string]domain.Text),
		sliceIndex:   make(map[string]int),
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
	// Validate ID for security (prevent path traversal)
	if err := validateTextID(id); err != nil {
		return domain.Text{}, fmt.Errorf("%w: %s", ErrTextNotFound, id)
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
	if len(r.contentCache) >= maxCachedTexts {
		clear(r.contentCache) // evict all to prevent unbounded growth
	}
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
	if err := validateText(text); err != nil {
		return err
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
	entry.Content = ""
	if err := r.persistContent(entry.ID, content); err != nil {
		return err
	}
	idx := len(r.library.Texts)
	r.library.Texts = append(r.library.Texts, entry)
	r.textIndex[entry.ID] = entry
	r.sliceIndex[entry.ID] = idx
	r.contentCache[entry.ID] = content
	if err := r.persistIndex(); err != nil {
		r.library.Texts = r.library.Texts[:idx]
		delete(r.textIndex, entry.ID)
		delete(r.sliceIndex, entry.ID)
		delete(r.contentCache, entry.ID)
		// Best-effort rollback: attempt to delete orphaned content file
		if delErr := r.deleteContent(entry.ID); delErr != nil {
			log.Printf("WARNING: rollback failed to delete content for %q: %v", entry.ID, delErr)
		}
		return err
	}
	return nil
}

// UpdateText modifies an existing text entry.
func (r *TextRepository) UpdateText(text *domain.Text) error {
	if text == nil || text.ID == "" {
		return ErrEmptyTextID
	}
	if err := validateText(text); err != nil {
		return err
	}
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	idx, exists := r.sliceIndex[text.ID]
	if !exists {
		return fmt.Errorf("%w: %s", ErrTextNotFound, text.ID)
	}
	content := text.Content
	entry := *text
	entry.Content = ""
	prevContent, hadFile, err := r.getPrevContent(entry.ID)
	if err != nil {
		return err
	}
	if err := r.persistContent(entry.ID, content); err != nil {
		return err
	}
	oldEntry := r.textIndex[entry.ID]
	oldCache, hadCache := r.contentCache[entry.ID]
	r.library.Texts[idx] = entry // O(1) update via sliceIndex
	r.textIndex[entry.ID] = entry
	r.contentCache[entry.ID] = content
	if err := r.persistIndex(); err != nil {
		r.library.Texts[idx] = oldEntry
		r.textIndex[entry.ID] = oldEntry
		if hadCache {
			r.contentCache[entry.ID] = oldCache
		} else {
			delete(r.contentCache, entry.ID)
		}
		// Best-effort rollback: attempt to restore previous content file state
		if hadFile {
			if restoreErr := r.persistContent(entry.ID, prevContent); restoreErr != nil {
				log.Printf("WARNING: rollback failed to restore content for %q: %v", entry.ID, restoreErr)
			}
		} else {
			if delErr := r.deleteContent(entry.ID); delErr != nil {
				log.Printf("WARNING: rollback failed to delete content for %q: %v", entry.ID, delErr)
			}
		}
		return err
	}
	return nil
}

// SaveCategory creates a new category entry.
// Returns ErrCategoryExists if a category with the same ID or name already exists.
func (r *TextRepository) SaveCategory(cat *domain.Category) error {
	if err := validateCategory(cat); err != nil {
		return err
	}
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, c := range r.library.Categories {
		if c.ID == cat.ID {
			return fmt.Errorf("%w: %s", ErrCategoryExists, cat.ID)
		}
		if c.Name == cat.Name {
			return fmt.Errorf("%w: %s", ErrCategoryExists, cat.Name)
		}
	}
	r.library.Categories = append(r.library.Categories, *cat)
	if err := r.persistIndex(); err != nil {
		r.library.Categories = r.library.Categories[:len(r.library.Categories)-1]
		return err
	}
	return nil
}

// DeleteCategory removes a category entry by ID.
// Returns ErrCategoryNotFound if category doesn't exist.
func (r *TextRepository) DeleteCategory(id string) error {
	// Validate ID for security (prevent path traversal)
	if err := validateCategoryID(id); err != nil {
		return err
	}
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	idx := -1
	for i, c := range r.library.Categories {
		if c.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("%w: %s", ErrCategoryNotFound, id)
	}
	oldCat := r.library.Categories[idx]
	r.library.Categories = append(r.library.Categories[:idx], r.library.Categories[idx+1:]...)
	if err := r.persistIndex(); err != nil {
		r.library.Categories = append(r.library.Categories[:idx], append([]domain.Category{oldCat}, r.library.Categories[idx:]...)...)
		return err
	}
	return nil
}

// DeleteText removes a text entry by ID.
func (r *TextRepository) DeleteText(id string) error {
	// Validate ID for security (prevent path traversal)
	if err := validateTextID(id); err != nil {
		return err
	}
	if err := r.ensureLoaded(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	idx, exists := r.sliceIndex[id]
	if !exists {
		return fmt.Errorf("%w: %s", ErrTextNotFound, id)
	}
	prevContent, hadFile, err := r.readContent(id)
	if err != nil {
		return err
	}
	if err := r.deleteContent(id); err != nil {
		return err
	}
	oldEntry := r.textIndex[id]
	oldCache, hadCache := r.contentCache[id]
	// Remove from slice using O(1) index lookup
	r.library.Texts = append(r.library.Texts[:idx], r.library.Texts[idx+1:]...)
	delete(r.textIndex, id)
	delete(r.sliceIndex, id)
	delete(r.contentCache, id)
	// Rebuild sliceIndex for shifted elements
	r.rebuildSliceIndex()
	if err := r.persistIndex(); err != nil {
		// Rollback: restore slice, maps, and content file
		r.library.Texts = append(r.library.Texts[:idx], append([]domain.Text{oldEntry}, r.library.Texts[idx:]...)...)
		r.textIndex[id] = oldEntry
		r.rebuildSliceIndex()
		if hadCache {
			r.contentCache[id] = oldCache
		}
		// Best-effort rollback: attempt to restore content file
		if hadFile {
			if restoreErr := r.persistContent(id, prevContent); restoreErr != nil {
				log.Printf("WARNING: rollback failed to restore content for %q: %v", id, restoreErr)
			}
		}
		return err
	}
	return nil
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

func (r *TextRepository) getPrevContent(id string) (content string, hadFile bool, err error) {
	if cached, ok := r.contentCache[id]; ok {
		return cached, true, nil
	}
	return r.readContent(id)
}

// rebuildSliceIndex reconstructs the id→position map from library.Texts.
// Called after slice modifications (delete) to maintain O(1) lookups.
func (r *TextRepository) rebuildSliceIndex() {
	clear(r.sliceIndex)
	for i, t := range r.library.Texts {
		r.sliceIndex[t.ID] = i
	}
}

// deleteContent removes the content file for a text.
func (r *TextRepository) deleteContent(id string) error {
	contentPath := r.storage.join(textsContentDir, fmt.Sprintf("%s.txt", id))
	if err := os.Remove(contentPath); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("storage: delete content %q: %w", contentPath, err)
	}
	return nil
}

func (r *TextRepository) readContent(id string) (content string, exists bool, err error) {
	contentPath := r.storage.join(textsContentDir, fmt.Sprintf("%s.txt", id))
	data, readErr := os.ReadFile(contentPath)
	if readErr != nil {
		if errors.Is(readErr, os.ErrNotExist) {
			return "", false, nil
		}
		err = fmt.Errorf("storage: read content %q: %w", contentPath, readErr)
		return "", false, err
	}
	content = string(data)
	exists = true
	return
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
	// Initialize lookup maps
	if r.contentCache == nil {
		r.contentCache = make(map[string]string)
	}
	if r.textIndex == nil {
		r.textIndex = make(map[string]domain.Text, len(library.Texts))
	}
	if r.sliceIndex == nil {
		r.sliceIndex = make(map[string]int, len(library.Texts))
	}
	for i, text := range library.Texts {
		r.textIndex[text.ID] = text
		r.sliceIndex[text.ID] = i
	}
	return nil
}

func (r *TextRepository) lookupTextLocked(id string) (domain.Text, bool) {
	text, ok := r.textIndex[id]
	return text, ok
}

func (r *TextRepository) loadContent(id string) (string, error) {
	if content, ok, err := r.readContent(id); err != nil {
		return "", err
	} else if ok {
		return content, nil
	}
	fallbackPath := r.storage.join(fallbackContentFile)
	data, err := os.ReadFile(fallbackPath)
	if err != nil {
		return "", fmt.Errorf("%w: %s", ErrContentUnavailable, id)
	}
	return string(data), nil
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
