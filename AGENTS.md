# AGENTS.md

## Project Overview

Public skills repository for Gravity products. pnpm 11 monorepo with supply-chain hardening that distributes agent skills via GitHub Releases (zips) and Claude Code plugin marketplace. The `@gravity/skills` CLI lives in `gravitysuite`.

## Critical Warnings

- **`dist/` is GENERATED** — never edit or commit. Built by `pnpm build` and `pnpm skills:pack`.
- **`.agents/`, `.specs/`, `.sisyphus/` are PRIVATE** — gitignored, never commit. These contain local-only skills, specs, and plans.
- **Zero npm dependencies in `@gravity/skills` CLI** — this is a hard constraint. The CLI lives in `gravitysuite`, not this repo. Never add runtime deps.
- **All commits on feature branches must reference `(#7488)`** in the message.

## Commands

```bash
# Install
pnpm install                 # Supply-chain-hardened (7-day minimumReleaseAge)

# Test
pnpm test                    # Runs bun test

# Skills
pnpm skills:validate         # Validates skill frontmatter and directory structure
pnpm skills:pack             # Packs skills into dist/skills/*.zip
```

## Build System

- **Package manager**: pnpm 11.0.8 — pinned in `package.json` `packageManager` field
- **Node version**: 24.11.1 — pinned in `.nvmrc`
- **Supply chain config**: `pnpm-workspace.yaml` (authoritative source for `minimumReleaseAge`, `blockExoticSubdeps`, `trustPolicy`, `verifyDepsBeforeRun`)
- **Test runner**: `bun test`
- **Scripts use `tsx`**: `node --import tsx/esm` for TypeScript execution without compilation

## Code Style Highlights

- **Tabs** for indentation
- **`console.log`/`console.error` in scripts and CLI** are intentional — these are user-facing output mechanisms, not library code
- **`@ts-ignore` in test files** — acceptable only for Bun runtime module workarounds (e.g., `bun:test`)

## Testing

- **Framework**: Bun test (`bun test`)
- **Test location**: `scripts/__tests__/` for script tests, colocated in packages
- **Gotcha**: Tests import from `bun:test` which requires `@ts-ignore` — this is expected

## Publishing

Three distribution channels, all scaffolded but not yet active:

| Channel | Workflow | Trigger |
|---------|----------|---------|
| GitHub Releases (zips) | `.github/workflows/release.yml` | `v*` tag push |
| Claude Code plugin | `.claude-plugin/marketplace.json` | Automatic from repo structure |

- **Zip packaging**: `scripts/pack-skills.ts` → `dist/skills/` using shell `zip` via `child_process.execSync`

## Skills Directory Structure

Skills live in `skills/` and must follow the Agent Skills spec:

- **Name**: lowercase, hyphens only, 1-64 chars, no consecutive hyphens
- **Directory name must match** the `name` field in SKILL.md frontmatter
- **Required file**: `SKILL.md` with YAML frontmatter (`name`, `description`)
- **Optional**: `references/` subdirectory for supporting files (included in zips)

## Commit Convention

Use conventional-style prefixes: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

Format: `<type>: <subject> (#7488)` — present tense, imperative mood, no period.
