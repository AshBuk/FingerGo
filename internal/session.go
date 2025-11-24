// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

package internal

import (
	"math"
	"strings"
	"time"
	"unicode/utf8"
)

// TypingSession captures a completed typing attempt for historical analytics.
type TypingSession struct {
	StartedAt   time.Time      `json:"startedAt"`   // session start time (UTC)
	CompletedAt time.Time      `json:"completedAt"` // session end time (UTC)
	Mistakes    map[string]int `json:"mistakes,omitempty"`

	TextPreview string `json:"textPreview"` // excerpt from the source text
	TextTitle   string `json:"textTitle"`   // human readable label
	CategoryID  string `json:"categoryId,omitempty"`
	TextID      string `json:"textId,omitempty"` // optional reference to text catalog
	ID          string `json:"id"`               // stable identifier (UUID)

	WPM      float64 `json:"wpm"`
	CPM      float64 `json:"cpm"`
	Accuracy float64 `json:"accuracy"`

	DurationSeconds int `json:"durationSeconds"` // whole seconds spent typing
	TotalKeystrokes int `json:"totalKeystrokes"`
	TotalErrors     int `json:"totalErrors"`
	CharacterCount  int `json:"characterCount"`
}

// SessionTextMeta aggregates textual metadata provided by the frontend payload.
type SessionTextMeta struct {
	Text       string `json:"text"`
	TextTitle  string `json:"textTitle"`
	CategoryID string `json:"categoryId"`
	TextID     string `json:"textId"`
}

// SessionPayload mirrors the structure sent from the frontend when a session completes.
type SessionPayload struct {
	*SessionTextMeta

	Mistakes map[string]int `json:"mistakes"` // key → mistake count

	WPM      float64 `json:"wpm"`
	CPM      float64 `json:"cpm"`
	Accuracy float64 `json:"accuracy"`
	Duration float64 `json:"duration"` // seconds (approximation)

	StartTime int64 `json:"startTime"` // milliseconds since epoch
	EndTime   int64 `json:"endTime"`   // milliseconds since epoch

	TotalErrors     int `json:"totalErrors"`
	TotalKeystrokes int `json:"totalKeystrokes"`
}

// ToTypingSession converts the payload to a normalized TypingSession.
// Any missing temporal information falls back to the provided fallback time.
func (p *SessionPayload) ToTypingSession(fallback time.Time) TypingSession {
	now := fallback.UTC()
	start := fromMillis(p.StartTime, now)
	end := fromMillis(p.EndTime, start)
	if !start.Before(end) {
		end = start
	}

	duration := end.Sub(start)
	if p.Duration > 0 {
		dur := time.Duration(p.Duration * float64(time.Second))
		if dur > 0 {
			duration = dur
			end = start.Add(duration)
		}
	}

	rawText := ""
	rawTitle := ""
	rawCategory := ""
	rawTextID := ""
	if p.SessionTextMeta != nil {
		rawText = p.Text
		rawTitle = p.TextTitle
		rawCategory = p.CategoryID
		rawTextID = p.TextID
	}

	title := strings.TrimSpace(rawTitle)
	if title == "" {
		title = deriveTitle(rawText)
	}
	preview := derivePreview(rawText)
	mistakes := cloneMistakes(p.Mistakes)

	charCount := utf8.RuneCountInString(rawText)

	return TypingSession{
		TextID:          strings.TrimSpace(rawTextID),
		TextTitle:       title,
		TextPreview:     preview,
		CategoryID:      strings.TrimSpace(rawCategory),
		StartedAt:       start,
		CompletedAt:     end,
		DurationSeconds: int(math.Round(duration.Seconds())),
		WPM:             round2(p.WPM),
		CPM:             round2(p.CPM),
		Accuracy:        round2(p.Accuracy),
		TotalKeystrokes: p.TotalKeystrokes,
		TotalErrors:     p.TotalErrors,
		CharacterCount:  charCount,
		Mistakes:        mistakes,
	}
}

func fromMillis(ms int64, fallback time.Time) time.Time {
	if ms <= 0 {
		return fallback
	}
	return time.UnixMilli(ms).UTC()
}

func deriveTitle(text string) string {
	const limit = 64
	lines := strings.Split(strings.TrimSpace(text), "\n")
	if len(lines) == 0 {
		return "Typing Session"
	}
	line := strings.TrimSpace(lines[0])
	if line == "" {
		return "Typing Session"
	}
	return truncateRunes(line, limit)
}

func derivePreview(text string) string {
	const limit = 120
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return ""
	}
	return truncateRunes(trimmed, limit)
}

func truncateRunes(text string, limit int) string {
	if limit <= 0 {
		return ""
	}
	runes := []rune(text)
	if len(runes) <= limit {
		return text
	}
	return string(runes[:limit])
}

func cloneMistakes(src map[string]int) map[string]int {
	if len(src) == 0 {
		return nil
	}
	dst := make(map[string]int, len(src))
	for k, v := range src {
		if v <= 0 {
			continue
		}
		dst[k] = v
	}
	if len(dst) == 0 {
		return nil
	}
	return dst
}

func round2(value float64) float64 {
	if value == 0 {
		return 0
	}
	return math.Round(value*100) / 100
}
