#!/usr/bin/env bash
set -euo pipefail

header_go='// Copyright 2025 Asher Buk'
header_js='// Copyright 2025 Asher Buk'
header_css='/*'

root="$(cd "$(dirname "$0")"/.. && pwd)"

missing=0

check_go() {
	while IFS= read -r -d '' f; do
		if ! head -n 3 "$f" | grep -q "Copyright 2025 Asher Buk"; then
			echo "Missing license header: $f"
			missing=$((missing+1))
		fi
	done < <(find "$root" -type f -name '*.go' -not -path '*/vendor/*' -print0)
}

check_js() {
	while IFS= read -r -d '' f; do
		if ! head -n 3 "$f" | grep -q "Copyright 2025 Asher Buk"; then
			echo "Missing license header: $f"
			missing=$((missing+1))
		fi
	done < <(find "$root/frontend/src/js" -type f -name '*.js' -print0 2>/dev/null || true)
}

check_css() {
	while IFS= read -r -d '' f; do
		if ! head -n 5 "$f" | grep -q "Copyright 2025 Asher Buk"; then
			echo "Missing license header: $f"
			missing=$((missing+1))
		fi
	done < <(find "$root/frontend/src/styles" -type f -name '*.css' -print0 2>/dev/null || true)
}

check_go
check_js
check_css

if [[ $missing -gt 0 ]]; then
	echo "Found $missing files without license headers"
	exit 1
fi

echo "All license headers present"


