// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"testing"

	domain "github.com/AshBuk/FingerGo/internal"
)

// setupSessionRepository creates a test repository with initialized storage.
func setupSessionRepository(t *testing.T) *SessionRepository {
	t.Helper()
	tmpDir := t.TempDir()
	mgr, err := New(tmpDir)
	if err != nil {
		t.Fatalf("failed to create manager: %v", err)
	}
	if err := mgr.Init(); err != nil {
		t.Fatalf("failed to init manager: %v", err)
	}
	repo, err := NewSessionRepository(mgr)
	if err != nil {
		t.Fatalf("failed to create repository: %v", err)
	}
	return repo
}

func TestNewSessionRepository(t *testing.T) {
	t.Run("returns error for nil manager", func(t *testing.T) {
		_, err := NewSessionRepository(nil)
		if err == nil {
			t.Error("expected error for nil manager")
		}
	})

	t.Run("creates repository with valid manager", func(t *testing.T) {
		tmpDir := t.TempDir()
		mgr, _ := New(tmpDir)
		repo, err := NewSessionRepository(mgr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if repo == nil {
			t.Error("expected non-nil repository")
		}
	})
}

func TestSessionRepository_Record(t *testing.T) {
	t.Run("records session with generated id", func(t *testing.T) {
		repo := setupSessionRepository(t)

		payload := &domain.SessionPayload{
			SessionTextMeta: &domain.SessionTextMeta{
				Text:      "test text",
				TextTitle: "Test",
			},
			WPM:             45.5,
			Accuracy:        97.2,
			Duration:        120,
			TotalKeystrokes: 100,
			TotalErrors:     3,
		}

		session, err := repo.Record(payload)
		if err != nil {
			t.Fatalf("Record() error: %v", err)
		}
		if session.ID == "" {
			t.Error("expected non-empty session ID")
		}
		if session.WPM != 45.5 {
			t.Errorf("got WPM %v, want %v", session.WPM, 45.5)
		}
	})

	t.Run("enforces max session limit", func(t *testing.T) {
		repo := setupSessionRepository(t)

		// Record more than max sessions
		for i := 0; i < maxStoredSessions+10; i++ {
			payload := &domain.SessionPayload{
				SessionTextMeta: &domain.SessionTextMeta{Text: "test"},
				WPM:             float64(i),
			}
			_, err := repo.Record(payload)
			if err != nil {
				t.Fatalf("Record() error on iteration %d: %v", i, err)
			}
		}

		sessions, err := repo.List(0)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(sessions) > maxStoredSessions {
			t.Errorf("got %d sessions, want max %d", len(sessions), maxStoredSessions)
		}
	})
}

func TestSessionRepository_List(t *testing.T) {
	t.Run("returns empty list initially", func(t *testing.T) {
		repo := setupSessionRepository(t)

		sessions, err := repo.List(10)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(sessions) != 0 {
			t.Errorf("expected empty list, got %d sessions", len(sessions))
		}
	})

	t.Run("returns sessions newest first", func(t *testing.T) {
		repo := setupSessionRepository(t)

		// Record sessions with different WPM to identify order
		for i := 1; i <= 3; i++ {
			payload := &domain.SessionPayload{
				SessionTextMeta: &domain.SessionTextMeta{Text: "test"},
				WPM:             float64(i * 10),
			}
			_, _ = repo.Record(payload)
		}

		sessions, err := repo.List(3)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(sessions) != 3 {
			t.Fatalf("got %d sessions, want 3", len(sessions))
		}
		// Newest (WPM=30) should be first
		if sessions[0].WPM != 30 {
			t.Errorf("first session WPM %v, want 30", sessions[0].WPM)
		}
		if sessions[2].WPM != 10 {
			t.Errorf("last session WPM %v, want 10", sessions[2].WPM)
		}
	})

	t.Run("respects limit parameter", func(t *testing.T) {
		repo := setupSessionRepository(t)

		for i := 0; i < 5; i++ {
			payload := &domain.SessionPayload{
				SessionTextMeta: &domain.SessionTextMeta{Text: "test"},
			}
			_, _ = repo.Record(payload)
		}

		sessions, err := repo.List(2)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(sessions) != 2 {
			t.Errorf("got %d sessions, want 2", len(sessions))
		}
	})

	t.Run("returns all when limit is 0", func(t *testing.T) {
		repo := setupSessionRepository(t)

		for i := 0; i < 3; i++ {
			payload := &domain.SessionPayload{
				SessionTextMeta: &domain.SessionTextMeta{Text: "test"},
			}
			_, _ = repo.Record(payload)
		}

		sessions, err := repo.List(0)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(sessions) != 3 {
			t.Errorf("got %d sessions, want 3", len(sessions))
		}
	})
}

func TestSessionRepository_Persistence(t *testing.T) {
	t.Run("sessions persist across instances", func(t *testing.T) {
		tmpDir := t.TempDir()

		// Create first instance and record session
		mgr1, _ := New(tmpDir)
		_ = mgr1.Init()
		repo1, _ := NewSessionRepository(mgr1)

		payload := &domain.SessionPayload{
			SessionTextMeta: &domain.SessionTextMeta{Text: "persist test"},
			WPM:             42.0,
		}
		_, _ = repo1.Record(payload)

		// Create second instance
		mgr2, _ := New(tmpDir)
		repo2, _ := NewSessionRepository(mgr2)

		sessions, err := repo2.List(1)
		if err != nil {
			t.Fatalf("List() error: %v", err)
		}
		if len(sessions) != 1 {
			t.Fatalf("got %d sessions, want 1", len(sessions))
		}
		if sessions[0].WPM != 42.0 {
			t.Errorf("got WPM %v, want 42.0", sessions[0].WPM)
		}
	})
}
