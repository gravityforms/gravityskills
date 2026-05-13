#!/usr/bin/env bash
# Validates all skills in the skills/ directory.
#
# Checks:
#   - Each subdirectory has a SKILL.md with YAML frontmatter
#   - name: lowercase, hyphens, 1-64 chars, no consecutive/leading/trailing hyphens
#   - name matches parent directory name
#   - description: required, ≤1024 chars
#   - No duplicate skill names

set -euo pipefail

SKILLS_DIR="${1:-skills}"
errors=()
names=()
name_paths=()
count=0

if [[ ! -d "$SKILLS_DIR" ]]; then
	echo "Error: skills directory does not exist: $SKILLS_DIR" >&2
	exit 1
fi

for skill_dir in "$SKILLS_DIR"/*/; do
	[[ -d "$skill_dir" ]] || continue

	dir_name=$(basename "$skill_dir")
	skill_file="$skill_dir/SKILL.md"
	count=$((count + 1))

	if [[ ! -f "$skill_file" ]]; then
		errors+=("$skill_file: SKILL.md is required")
		continue
	fi

	content=$(cat "$skill_file")

	# Check frontmatter delimiters
	if [[ "$content" != ---* ]]; then
		errors+=("$skill_file: missing YAML frontmatter opening delimiter")
		continue
	fi

	# Extract frontmatter (between first and second ---)
	frontmatter=$(echo "$content" | sed -n '2,/^---$/{ /^---$/d; p; }')

	if [[ -z "$frontmatter" ]]; then
		errors+=("$skill_file: missing YAML frontmatter closing delimiter")
		continue
	fi

	# Extract name (handles quoted and unquoted values)
	name=$(echo "$frontmatter" | grep -E '^name:' | head -1 | sed 's/^name:[[:space:]]*//' | sed 's/^["'\'']\(.*\)["'\'']/\1/')

	# Extract description
	description=$(echo "$frontmatter" | grep -E '^description:' | head -1 | sed 's/^description:[[:space:]]*//' | sed 's/^["'\'']\(.*\)["'\'']/\1/')

	# Validate name
	if [[ -z "$name" ]]; then
		errors+=("$skill_file: frontmatter.name is required")
	else
		if ! echo "$name" | grep -qE '^[a-z]([a-z-]{0,62}[a-z])?$'; then
			errors+=("$skill_file: frontmatter.name must be lowercase hyphenated text, 1-64 chars, with no leading/trailing/consecutive hyphens")
		elif echo "$name" | grep -q '\-\-'; then
			errors+=("$skill_file: frontmatter.name must be lowercase hyphenated text, 1-64 chars, with no leading/trailing/consecutive hyphens")
		fi

		if [[ "$name" != "$dir_name" ]]; then
			errors+=("$skill_file: frontmatter.name must match parent directory name \"$dir_name\"")
		fi

		# Track for duplicate detection
		names+=("$name")
		name_paths+=("$skill_file")
	fi

	# Validate description
	if [[ -z "$description" ]]; then
		errors+=("$skill_file: frontmatter.description is required")
	elif [[ ${#description} -gt 1024 ]]; then
		errors+=("$skill_file: frontmatter.description must be 1-1024 characters")
	fi
done

# Check for duplicate names
for ((i = 0; i < ${#names[@]}; i++)); do
	for ((j = i + 1; j < ${#names[@]}; j++)); do
		if [[ "${names[$i]}" == "${names[$j]}" ]]; then
			errors+=("${name_paths[$i]}, ${name_paths[$j]}: duplicate skill name \"${names[$i]}\"")
		fi
	done
done

if [[ ${#errors[@]} -gt 0 ]]; then
	echo "Skill validation failed with ${#errors[@]} error(s):" >&2
	for error in "${errors[@]}"; do
		echo "- $error" >&2
	done
	exit 1
fi

echo "Validated $count skill$([ "$count" -eq 1 ] && echo '' || echo 's')."
