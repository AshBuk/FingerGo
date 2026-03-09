// Copyright 2025-2026 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

// Generate Flatpak sources JSON for offline Go module builds.
//
// Usage:
//
//	go mod download -json | go run flatpak/gen-go-sources.go > flatpak/go-mod-sources.json
package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"unicode"
)

const proxy = "https://proxy.golang.org"

type module struct {
	Path    string // module path
	Version string // module version
	Zip     string // local path to zip
	GoMod   string // local path to go.mod
}

type source struct {
	Type         string `json:"type"`
	URL          string `json:"url"`
	SHA256       string `json:"sha256"`
	Dest         string `json:"dest"`
	DestFilename string `json:"dest-filename"`
}

// encodePath encodes uppercase letters for proxy.golang.org (A -> !a).
func encodePath(path string) string {
	var b strings.Builder
	for _, r := range path {
		if unicode.IsUpper(r) {
			b.WriteByte('!')
			b.WriteRune(unicode.ToLower(r))
		} else {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func sha256file(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", h.Sum(nil)), nil
}

func main() {
	dec := json.NewDecoder(os.Stdin)
	var sources []source

	for dec.More() {
		var m module
		if err := dec.Decode(&m); err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
		encoded := encodePath(m.Path)
		dest := fmt.Sprintf("go/pkg/mod/cache/download/%s/@v/", encoded)

		for _, f := range []struct {
			ext  string
			path string
		}{
			{"zip", m.Zip},
			{"mod", m.GoMod},
		} {
			hash, err := sha256file(f.path)
			if err != nil {
				fmt.Fprintf(os.Stderr, "error hashing %s: %v\n", f.path, err)
				os.Exit(1)
			}
			sources = append(sources, source{
				Type:         "file",
				URL:          fmt.Sprintf("%s/%s/@v/%s.%s", proxy, encoded, m.Version, f.ext),
				SHA256:       hash,
				Dest:         dest,
				DestFilename: fmt.Sprintf("%s.%s", m.Version, f.ext),
			})
		}
	}

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(sources); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
