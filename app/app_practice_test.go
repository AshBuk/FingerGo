// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package app

import (
	"testing"
	"time"

	domain "github.com/AshBuk/FingerGo/internal/domain"
)

func TestApp_PracticeGroups(t *testing.T) {
	app := startApp(t, t.TempDir())

	saved, err := app.SavePracticeGroup(&domain.PracticeGroup{
		Name:     "Test group",
		LayoutID: "en-qwerty",
		Keys:     []string{"q", "w"},
	})
	if err != nil {
		t.Fatalf("SavePracticeGroup: %v", err)
	}

	groups, err := app.GetPracticeGroups()
	if err != nil {
		t.Fatalf("GetPracticeGroups: %v", err)
	}
	if len(groups) != 1 {
		t.Fatalf("got %d groups, want 1", len(groups))
	}

	if err := app.DeletePracticeGroup(saved.ID); err != nil {
		t.Fatalf("DeletePracticeGroup: %v", err)
	}
}

func TestApp_AggregateKeyMistakes(t *testing.T) {
	app := startApp(t, t.TempDir())

	payload := &domain.SessionPayload{
		SessionTextMeta: &domain.SessionTextMeta{Text: "test"},
		Mistakes:        map[string]int{"a": 2},
	}
	if err := app.SaveSession(payload); err != nil {
		t.Fatalf("SaveSession: %v", err)
	}

	agg, err := app.AggregateKeyMistakes(10)
	if err != nil {
		t.Fatalf("AggregateKeyMistakes: %v", err)
	}
	if agg["a"] != 2 {
		t.Errorf("a = %d, want 2", agg["a"])
	}
}

func TestSessionPayload_PracticeMeta(t *testing.T) {
	payload := &domain.SessionPayload{
		SessionTextMeta: &domain.SessionTextMeta{Text: "qqq"},
		PracticeSessionMeta: domain.PracticeSessionMeta{
			PracticeMode:      domain.PracticeModeTargeted,
			PracticeGroupID:   "builtin-home-row",
			PracticeGroupName: "Home row",
			TargetKeys:        []string{"a", "s"},
		},
	}
	session := payload.ToTypingSession(time.Now())
	if session.PracticeMode != domain.PracticeModeTargeted {
		t.Errorf("mode = %q", session.PracticeMode)
	}
	if len(session.TargetKeys) != 2 {
		t.Errorf("targetKeys = %v", session.TargetKeys)
	}
}
