// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package storage

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"

	domain "github.com/AshBuk/FingerGo/internal/domain"
)

const (
	// maxStoredSessions limits session history to prevent unbounded disk growth.
	// At ~1KB per session JSON, 500 sessions ≈ 500KB disk space.
	maxStoredSessions = 500
)

// SessionRepository persists typing sessions in sessions.json.
type SessionRepository struct {
	storage  *Manager
	sessions []domain.TypingSession
	mu       sync.RWMutex
	loaded   bool
}

// NewSessionRepository wires the repository to the storage manager.
func NewSessionRepository(mgr *Manager) (*SessionRepository, error) {
	if mgr == nil {
		return nil, errNilManager
	}
	return &SessionRepository{
		storage: mgr,
	}, nil
}

// Record persists a session payload and returns the stored session.
func (r *SessionRepository) Record(payload *domain.SessionPayload) (domain.TypingSession, error) {
	if err := r.ensureLoaded(); err != nil {
		return domain.TypingSession{}, err
	}

	session := payload.ToTypingSession(time.Now())
	if session.ID == "" {
		session.ID = uuid.NewString()
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	candidate := append(append([]domain.TypingSession(nil), r.sessions...), session)
	if len(candidate) > maxStoredSessions {
		candidate = candidate[len(candidate)-maxStoredSessions:]
	}
	if err := r.persist(candidate); err != nil {
		return domain.TypingSession{}, err
	}
	r.sessions = candidate
	return session, nil
}

// List returns recent sessions (newest first). limit <= 0 returns all.
func (r *SessionRepository) List(limit int) ([]domain.TypingSession, error) {
	if err := r.ensureLoaded(); err != nil {
		return nil, err
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	total := len(r.sessions)
	if total == 0 {
		return nil, nil
	}

	if limit <= 0 || limit > total {
		limit = total
	}

	result := make([]domain.TypingSession, 0, limit)
	for i := total - 1; i >= total-limit; i-- {
		result = append(result, cloneSession(&r.sessions[i]))
	}
	return result, nil
}

func (r *SessionRepository) ensureLoaded() error {
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

	path := r.storage.join(sessionsFile)
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			r.sessions = nil
			r.loaded = true
			return nil
		}
		return fmt.Errorf("storage: read sessions %q: %w", path, err)
	}

	clean := bytes.TrimSpace(data)
	if len(clean) == 0 {
		r.sessions = nil
	} else {
		if err := json.Unmarshal(clean, &r.sessions); err != nil {
			return fmt.Errorf("storage: parse sessions %q: %w", path, err)
		}
	}

	if len(r.sessions) > maxStoredSessions {
		r.sessions = append([]domain.TypingSession(nil), r.sessions[len(r.sessions)-maxStoredSessions:]...)
	}
	r.loaded = true
	return nil
}

func (r *SessionRepository) persist(items []domain.TypingSession) error {
	path := r.storage.join(sessionsFile)
	data, err := json.MarshalIndent(items, "", "  ")
	if err != nil {
		return fmt.Errorf("storage: marshal sessions: %w", err)
	}
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return fmt.Errorf("storage: write sessions %q: %w", path, err)
	}
	return nil
}

func cloneSession(src *domain.TypingSession) domain.TypingSession {
	out := *src
	if len(src.Mistakes) > 0 {
		out.Mistakes = make(map[string]int, len(src.Mistakes))
		for k, v := range src.Mistakes {
			out.Mistakes[k] = v
		}
	}
	return out
}
