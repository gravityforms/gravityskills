# Learnings

## [Wave 1] Foundation

- `packageManager: pnpm@11.0.8` in root package.json — Corepack auto-install
- `pnpm-workspace.yaml` has supply chain hardening: minimumReleaseAge: 1440, blockExoticSubdeps: true, trustPolicy: no-downgrade, verifyDepsBeforeRun: install
- `skills:validate` script: `node --import tsx/esm scripts/validate-skills.ts`
- `skills:pack` script: `node --import tsx/esm scripts/pack-skills.ts`
- `build` and `test` scripts use `pnpm -r` (recursive workspace)
- `skills/placeholder-skill/SKILL.md` exists with valid frontmatter (name: placeholder-skill, description, license, metadata)
- `skills/placeholder-skill/references/README.md` exists for zip packaging validation
- Node 24.11.1 pinned in `.nvmrc`
- GPL-2.0+ LICENSE at root
- README.md is minimal (52 bytes) — was NOT updated with 3 install methods yet (T2 commit may be missing from log)
- Git log shows 5 commits; T2 (license+README) commit message not visible — LICENSE file IS present though
- `packages/` directory does NOT exist yet (CLI scaffold coming in T6)
- `.claude-plugin/` directory does NOT exist yet (T7)
- `scripts/` directory does NOT exist yet (T4, T5)
- `.github/workflows/` does NOT exist yet (T8, T9, T10)
- `tsx` is needed as devDep for running TypeScript scripts via `node --import tsx/esm`

## Key Constraints
- ZERO npm dependencies in `packages/skills-cli/` published package
- No Turborepo, Nx, Changesets
- No postinstall scripts
- No actual npm publishing
- No real product skills — placeholder only
- bun test for testing
- All commits reference (#7488)

## Task 5 pack skills - 2026-05-13
- Root skills:pack script runs through tsx/esm and Node 24 when implemented as CommonJS-style TypeScript, matching existing validate-skills.ts.
- Packaging from skills/ as cwd preserves the skill directory as zip root while preventing files outside the skill directory from being included.

## Task 6 - @gravity/skills CLI scaffold
- Added packages/skills-cli as @gravity/skills with explicit empty dependencies and dev-only TypeScript/Bun types.
- CLI uses manual argv parsing and Node global fetch; no commander/yargs/oclif.
- pnpm-workspace allowBuilds must set esbuild: false so verifyDepsBeforeRun does not fail on ignored transitive tsx build scripts.
