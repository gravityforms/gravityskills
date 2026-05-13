#!/usr/bin/env bash
# Packs each skill directory into dist/skills/{name}.zip
# Excludes: node_modules, .git, .DS_Store, .env, __pycache__, *.tgz

set -euo pipefail

SKILLS_DIR="${1:-skills}"
OUTPUT_DIR="dist/skills"

if [[ ! -d "$SKILLS_DIR" ]]; then
	echo "Error: skills directory does not exist: $SKILLS_DIR" >&2
	exit 1
fi

mkdir -p "$OUTPUT_DIR"

for skill_dir in "$SKILLS_DIR"/*/; do
	[[ -d "$skill_dir" ]] || continue

	skill_name=$(basename "$skill_dir")
	zip_path="$OUTPUT_DIR/$skill_name.zip"

	rm -f "$zip_path"

	(cd "$SKILLS_DIR" && zip -q -r "../$zip_path" "$skill_name" \
		-x "**/node_modules/*" \
		-x "**/.git/*" \
		-x "**/.DS_Store" \
		-x "**/.env" \
		-x "**/__pycache__/*" \
		-x "*.tgz" \
		-x "**/*.tgz")

	size=$(wc -c < "$zip_path" | tr -d ' ')
	if [[ $size -lt 1024 ]]; then
		echo "Created $zip_path ($size B)"
	else
		kb=$((size / 1024))
		remainder=$(( (size % 1024) * 10 / 1024 ))
		echo "Created $zip_path ($kb.$remainder KB)"
	fi
done
