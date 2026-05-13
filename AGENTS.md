# AGENTS.md

## Project Overview

Public skills repository for Gravity products. Pure content repo — no build tooling or package manager required. Skills are distributed via GitHub Releases (zips). The `@gravity/skills` CLI lives in the Gravity Monorepo.

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

## Skills Directory Structure

Skills live in `skills/` and must follow the Agent Skills spec:

- **Name**: lowercase, hyphens only, 1-64 chars, no consecutive hyphens
- **Directory name must match** the `name` field in SKILL.md frontmatter
- **Required file**: `SKILL.md` with YAML frontmatter (`name`, `description`)
- **Optional**: `references/` subdirectory for supporting files (included in zips)

## Commit Convention

Use conventional-style prefixes: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

Format: `<type>: <subject>` — present tense, imperative mood, no period.
