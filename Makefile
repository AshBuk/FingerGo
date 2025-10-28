# FingerGo Makefile

.PHONY: help deps fmt lint test build run dev clean generate licenses

help:
	@echo "Targets: deps fmt lint test build run dev clean generate licenses"

deps:
	go mod tidy

fmt:
	@gofmt -s -w .
	@goimports -w . || true

lint:
	@golangci-lint run

test:
	@go test ./...

build:
	wails build

run:
	wails run

dev:
	wails dev

clean:
	rm -rf build/bin dist frontend/src/wailsjs || true

generate:
	wails generate module

license:
	bash scripts/check-licenses.sh


