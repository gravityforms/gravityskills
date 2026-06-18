# AGENTS.md

## Project Overview

Public skills repository for Gravity products. Pure content repo — no build tooling or package manager required. Skills are distributed via the [Vercel Skills CLI](https://github.com/vercel-labs/skills) (`npx skills add gravityforms/gravityskills`) and via GitHub Releases (zips).

## Critical Warnings

- **`dist/` is GENERATED** — never edit or commit. Built by `scripts/pack-skills.sh`.
- **`.agents/`, `.specs/`, `.sisyphus/` are PRIVATE** — gitignored, never commit. These contain local-only skills, specs, and plans.

## Commands

```bash
# Validate all skills
./scripts/validate-skills.sh

# Pack skills into dist/skills/*.zip
./scripts/pack-skills.sh
```

## Code Style Highlights

- **Tabs** for indentation

## Publishing

| Channel | Workflow | Trigger |
|---------|----------|---------|
| GitHub Releases (zips) | `.github/workflows/release.yml` | `v*` tag push |

**Tag only after merge to `main`.** The release workflow fires on `v*` tag push: it packs the skill zips, extracts the matching `change_log.txt` section via `scripts/release-notes.sh`, and creates the GitHub Release with that section as the notes. Never tag from a feature branch.

## Changelog

Record user-facing changes in `change_log.txt` (Gravity Forms core format). Add entries to the top version section in the same PR as the change — there is no fragment tooling.

- Header: `### <version> | <date>` (e.g. `### 1.0.2 | 2026-06-18`), newest version on top.
- One change per `- ` bullet, prefixed with the skill name it applies to (e.g. `gravity-forms-abilities: ...`); use `Repository:` for repo-wide changes.
- After the prefix, write in **present tense** ending in a period (e.g. `Add ...`, `Fix ...`, `Remove ...`, `Update ...`).
- Alpha-sort the full bullet lines within a version. This groups them by skill (prefix sorts first), then by verb.
- Skip internal-only changes (refactors, tests, CI, docs).

## Skills Directory Structure

Skills live in `skills/` and must follow the Agent Skills spec:

- **Name**: lowercase, hyphens only, 1-64 chars, no consecutive hyphens
- **Directory name must match** the `name` field in SKILL.md frontmatter
- **Required file**: `SKILL.md` with YAML frontmatter (`name`, `description`)
- **Optional**: `references/` subdirectory for supporting files (included in zips)

## Commit Convention

Use conventional-style prefixes: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

Format: `<type>: <subject>` — present tense, imperative mood, no period.
