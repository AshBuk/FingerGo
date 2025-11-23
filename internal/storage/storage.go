// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

// Package storage manages the on-disk data layout for FingerGo.
//
// Directory structure created by Init():
//
//	{root}/
//	├── texts/
//	│   ├── index.json           # metadata: categories, text entries
//	│   └── content/
//	│       └── {id}.txt         # actual text content by ID
//	├── stats.json               # (future) session history
//	└── config.json              # (future) user settings
//
// On first run, embedded defaults are copied to {root}/.
// Existing files are never overwritten (idempotent).
package storage

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

// Relative paths within the data directory.
const (
	textsDir            = "texts"
	textsContentDir     = "texts/content"
	textsIndexFile      = "texts/index.json"
	fallbackContentFile = "texts/content/dfs-file-finder.txt"
)

// Paths inside the embedded filesystem.
const (
	embeddedIndexPath   = "embedded/index.json"
	embeddedDefaultPath = "embedded/default.txt"
)

//go:embed embedded/index.json embedded/default.txt
var embeddedFiles embed.FS

// Sentinel errors for the storage package.
var errEmptyRoot = errors.New("storage: root path is empty")

// Manager owns the on-disk data layout for FingerGo.
type Manager struct {
	root string // absolute path to data directory (e.g., ~/.local/share/fingergo)
}

// New creates a storage manager rooted at the provided path.
func New(root string) (*Manager, error) {
	if root == "" {
		return nil, errEmptyRoot
	}
	return &Manager{root: root}, nil
}

// Root returns the absolute root path used by the manager.
func (m *Manager) Root() string {
	return m.root
}

// Init ensures the expected directory structure exists and seeds fallback data.
// Safe to call multiple times — existing files are not overwritten.
//
// Creates:
//   - {root}/texts/
//   - {root}/texts/content/
//   - {root}/texts/index.json       (from embedded)
//   - {root}/texts/content/{id}.txt (from embedded)
func (m *Manager) Init() error {
	if err := m.ensureDir(m.root); err != nil {
		return err
	}
	if err := m.ensureDir(m.join(textsDir)); err != nil {
		return err
	}
	if err := m.ensureDir(m.join(textsContentDir)); err != nil {
		return err
	}
	if err := m.ensureFile(textsIndexFile, embeddedIndexPath); err != nil {
		return err
	}
	if err := m.ensureFile(fallbackContentFile, embeddedDefaultPath); err != nil {
		return err
	}
	return nil
}

// join constructs an absolute path by prepending the root directory.
func (m *Manager) join(elements ...string) string {
	all := append([]string{m.root}, elements...)
	return filepath.Join(all...)
}

// ensureDir creates directory (and parents) if it doesn't exist.
// Permissions: 0o755 (rwxr-xr-x) — standard for directories.
func (m *Manager) ensureDir(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("storage: create directory %q: %w", path, err)
	}
	return nil
}

// ensureFile copies embedded content to target path if target doesn't exist.
// Idempotent: skips if file already exists, never overwrites.
// Permissions: 0o600 (rw-------) — owner-only access.
func (m *Manager) ensureFile(relPath, embeddedPath string) error {
	target := m.join(relPath)

	if _, err := os.Stat(target); err == nil {
		return nil // file exists, skip
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("storage: stat %q: %w", target, err)
	}
	// Read from embedded filesystem (compiled into binary)
	data, err := fs.ReadFile(embeddedFiles, embeddedPath)
	if err != nil {
		return fmt.Errorf("storage: read embedded %q: %w", embeddedPath, err)
	}
	// Write to disk
	if err := os.WriteFile(target, data, 0o600); err != nil {
		return fmt.Errorf("storage: write %q: %w", target, err)
	}
	return nil
}
