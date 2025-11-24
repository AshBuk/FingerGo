# FingerGo Makefile

.PHONY: deps fmt lint test build run dev clean generate license
.PHONY: go-deps go-fmt go-lint go-test js-deps js-fmt js-lint

# === Combined Targets ===
deps: go-deps js-deps     # Install all dependencies (Go + JS)
fmt: go-fmt js-fmt        # Format all code (Go + JS)
lint: go-lint js-lint     # Lint all code (Go + JS)
test: go-test             # Run Go tests

# === Go Targets ===
go-deps:                  # Install Go dependencies
	go mod tidy
go-fmt:                   # Format Go code
	@gofmt -s -w .
	@goimports -w . || true
go-lint:                  # Lint Go code
	@golangci-lint run
go-test:                  # Run Go tests
	@go test ./...

# === JS Targets ===
js-deps:                  # Install JS dependencies
	npm install
js-fmt:                   # Format JS code
	npm run format
js-lint:                  # Lint JS code
	npm run lint

# === Wails Targets ===
dev:                      # Start development mode
	wails dev
build:                    # Build production binary
	wails build
run:                      # Run application
	wails run
generate:                 # Generate Wails bindings
	wails generate module

# === Utility Targets ===
clean:                    # Remove build artifacts
	rm -rf build/bin dist gui/src/wailsjs node_modules || true
license:                  # Check license headers
	bash scripts/check-licenses.sh


