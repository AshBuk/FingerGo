//go:build ignore

// Generate Flatpak sources JSON for Go modules with SHA256 checksums.
//
// This script creates a JSON file containing all Go module dependencies
// for offline Flatpak builds. Downloads each module to compute checksum.
//
// Usage:
//
//	go run scripts/generate-go-sources.go > flatpak/go-sources.json
//
// Before release:
//
//	go mod tidy
//	go run scripts/generate-go-sources.go > flatpak/go-sources.json
//	git add flatpak/go-sources.json
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

// ModuleInfo represents output from 'go mod download -json'
type ModuleInfo struct {
	Path    string `json:"Path"`
	Version string `json:"Version"`
}

// FlatpakSource represents a Flatpak source entry
type FlatpakSource struct {
	Type   string `json:"type"`
	URL    string `json:"url"`
	Sha256 string `json:"sha256"`
	Dest   string `json:"dest"`
}

func main() {
	if _, err := os.Stat("go.mod"); os.IsNotExist(err) {
		fmt.Fprintln(os.Stderr, "Error: go.mod not found. Run from project root.")
		os.Exit(1)
	}

	fmt.Fprintln(os.Stderr, "Running 'go mod download -json'...")
	cmd := exec.Command("go", "mod", "download", "-json")
	output, err := cmd.Output()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error running 'go mod download -json': %v\n", err)
		os.Exit(1)
	}

	// Parse JSON stream
	var modules []ModuleInfo
	decoder := json.NewDecoder(bytes.NewReader(output))
	for decoder.More() {
		var mod ModuleInfo
		if err := decoder.Decode(&mod); err != nil {
			continue
		}
		if mod.Path != "" && mod.Version != "" {
			modules = append(modules, mod)
		}
	}

	fmt.Fprintf(os.Stderr, "Found %d modules. Downloading to compute checksums...\n", len(modules))

	var sources []FlatpakSource
	client := &http.Client{}

	for i, mod := range modules {
		url := fmt.Sprintf("https://proxy.golang.org/%s/@v/%s.zip", mod.Path, mod.Version)

		// Escape module path for URL (e.g., upper case letters)
		escapedPath := escapeModulePath(mod.Path)
		url = fmt.Sprintf("https://proxy.golang.org/%s/@v/%s.zip", escapedPath, mod.Version)

		fmt.Fprintf(os.Stderr, "[%d/%d] %s@%s\n", i+1, len(modules), mod.Path, mod.Version)

		checksum, err := downloadAndHash(client, url)
		if err != nil {
			fmt.Fprintf(os.Stderr, "  Warning: failed to get checksum: %v\n", err)
			continue
		}

		// Destination: go-mod-cache
		// The zip already contains full path: github.com/google/uuid@v1.6.0/...
		sources = append(sources, FlatpakSource{
			Type:   "archive",
			URL:    url,
			Sha256: checksum,
			Dest:   "go-mod-cache",
		})
	}

	fmt.Fprintf(os.Stderr, "Generated %d sources\n", len(sources))

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(sources); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
}

// escapeModulePath escapes uppercase letters in module path for proxy.golang.org
// e.g., "github.com/BurntSushi/toml" -> "github.com/!burnt!sushi/toml"
func escapeModulePath(path string) string {
	var result strings.Builder
	for _, r := range path {
		if r >= 'A' && r <= 'Z' {
			result.WriteRune('!')
			result.WriteRune(r + ('a' - 'A'))
		} else {
			result.WriteRune(r)
		}
	}
	return result.String()
}

// downloadAndHash downloads URL and returns SHA256 hex digest
func downloadAndHash(client *http.Client, url string) (string, error) {
	resp, err := client.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	h := sha256.New()
	if _, err := io.Copy(h, resp.Body); err != nil {
		return "", err
	}

	return hex.EncodeToString(h.Sum(nil)), nil
}
