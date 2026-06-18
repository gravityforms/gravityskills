#!/usr/bin/env bash
# Prints the change_log.txt section for a given version, for use as GitHub Release notes.
# Usage: ./scripts/release-notes.sh 1.0.2   (leading "v" is stripped)
#
# Self-check: ./scripts/release-notes.sh --self-check

set -euo pipefail

CHANGELOG="${CHANGELOG:-change_log.txt}"

extract() {
	local version="${1#v}" file="$2"
	# Print the bullet lines under "### <version>" up to the next "### " header.
	awk -v ver="$version" '
		/^### / {
			if (found) exit
			# Header is "### <version>" optionally followed by " | <date>".
			hdr = $2
			if (hdr == ver) { found = 1; next }
		}
		found && NF { print }
	' "$file"
}

if [[ "${1:-}" == "--self-check" ]]; then
	tmp="$(mktemp)"
	cat >"$tmp" <<-'EOF'
		### 1.0.2 | 2026-06-18
		- Add b.
		- Add a.

		### 1.0.1 | 2026-05-13
		- Add the skill.
	EOF
	got="$(extract v1.0.2 "$tmp")"
	want=$'- Add b.\n- Add a.'
	[[ "$got" == "$want" ]] || { echo "FAIL latest: got [$got]" >&2; exit 1; }
	got="$(extract 1.0.1 "$tmp")"
	[[ "$got" == "- Add the skill." ]] || { echo "FAIL middle: got [$got]" >&2; exit 1; }
	[[ -z "$(extract 9.9.9 "$tmp")" ]] || { echo "FAIL missing version not empty" >&2; exit 1; }
	rm -f "$tmp"
	echo "self-check passed"
	exit 0
fi

if [[ $# -lt 1 ]]; then
	echo "Usage: $0 <version>" >&2
	exit 1
fi

notes="$(extract "$1" "$CHANGELOG")"
if [[ -z "$notes" ]]; then
	echo "Error: no change_log.txt section found for version ${1#v}" >&2
	exit 1
fi
printf '%s\n' "$notes"
