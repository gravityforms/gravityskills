# Gravity Skills Repo Framework

## TL;DR

> **Quick Summary**: Set up the public skills repository framework for Gravity products with three distribution channels — GitHub Releases (zip artifacts), npm CLI installer (`@gravity/skills`), and Claude Code plugin marketplace — using pnpm 11 with full supply chain hardening.
> 
> **Deliverables**:
> - pnpm 11 monorepo with supply chain hardening (minimumReleaseAge, blockExoticSubdeps, trustPolicy)
> - `skills/` directory with placeholder skill following Agent Skills spec
> - `packages/skills-cli/` with `@gravity/skills` CLI scaffold (`--help`, `install <skill-name>`)
> - `.claude-plugin/marketplace.json` for native Claude Code plugin install
> - GitHub Actions: CI validation workflow + tag-triggered release workflow + disabled npm publish scaffold
> - Skill validation script (frontmatter, naming, structure)
> - Zip packaging script (deterministic, excludes junk files)
> - GPL-2.0+ LICENSE
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 3 → Task 5 → Task 7 → Task 9

---

## Context

### Original Request
Set up a public skills repo framework for Gravity products (Gravity Forms, add-ons, Gravity SMTP, etc.). The repo (`gravityforms/gravityskills`) is currently private and empty. It needs to serve skills via zip downloads from GitHub Releases, an npm CLI installer under `@gravity/skills` using trusted publishing only, and Claude Code plugin marketplace integration. No actual publishing happens in this branch due to npm supply chain concerns.

### Interview Summary
**Key Discussions**:
- **Zip distribution**: CI generates zips on tag, attaches to GitHub Releases (not committed to repo like Vercel)
- **Claude plugin marketplace**: Yes — `.claude-plugin/marketplace.json`, no approval process needed
- **npm package**: CLI installer (`npx @gravity/skills install <skill-name>`), scaffold only, no publish yet
- **Repo structure**: `skills/` + `packages/` (Vercel/Anthropic pattern)
- **pnpm version**: v11 (supply chain hardening on by default)
- **Node**: 24.11.1, npm: 11.6.2
- **License**: GPL-2.0+
- **First skills**: Placeholder/test skill only
- **Testing**: Basic CI validation (frontmatter, zip integrity, build)
- **Branch protection**: Not in this branch

**Research Findings**:
- Vercel ships skill dirs + zip siblings in repo, uses per-skill CI workflows
- Anthropic uses `.claude-plugin/marketplace.json` with plugins grouping skills into installable bundles
- Agent Skills spec: `SKILL.md` with YAML frontmatter (name, description required), optional scripts/references/assets dirs
- npm trusted publishing: OIDC-based, requires npm 11.5.1+, first publish must be manual, then configure OIDC on npmjs.com
- pnpm 11 defaults: `minimumReleaseAge: 1440`, `blockExoticSubdeps: true`, `verifyDepsBeforeRun: "install"`, postinstall disabled

### Metis Review
**Identified Gaps** (addressed):
- `.agents/` vs `skills/` canonical location: `.agents/` is internal/gitignored, `skills/` is the public directory — no conflict
- Zip structure: each skill zipped as `<skill-name>/SKILL.md` (not flat)
- CLI minimum behavior for this branch: `--help` + `install <skill-name>` stub that downloads from GitHub Releases
- Release tagging: manual tags only for this branch, no changesets
- Exclude `.DS_Store`, `node_modules`, `.git`, `.env` from zips
- Placeholder skill clearly marked as test-only
- npm trusted publishing workflow disabled by default, with documentation on manual first-publish requirement

---

## Work Objectives

### Core Objective
Establish the complete framework for a public skills repository with three distribution channels, validated by CI, with no actual publishing.

### Concrete Deliverables
- Root `package.json` with `packageManager` field, `.nvmrc`, `pnpm-workspace.yaml`
- `LICENSE` (GPL-2.0+)
- `skills/placeholder-skill/SKILL.md` following Agent Skills spec
- `packages/skills-cli/` — minimal TypeScript CLI package (`@gravity/skills`)
- `.claude-plugin/marketplace.json`
- `.github/workflows/ci.yml` — validation on PR/push
- `.github/workflows/release.yml` — zip generation + GitHub Release on tags
- `.github/workflows/npm-publish.yml` — disabled scaffold for future trusted publishing
- `scripts/validate-skills.ts` — frontmatter + structure validation
- `scripts/pack-skills.ts` — deterministic zip generation
- Updated `README.md` with installation instructions for all three channels
- Updated `.gitignore` for build artifacts

### Definition of Done
- [ ] `pnpm install --frozen-lockfile` exits 0
- [ ] `pnpm build` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm skills:validate` exits 0
- [ ] `pnpm skills:pack` exits 0 and produces valid zips
- [ ] CLI `--help` works
- [ ] All GitHub Actions workflow files pass `actionlint`

### Must Have
- pnpm 11 with explicit supply chain config
- Node 24.11.1 pinned in `.nvmrc`
- `packageManager` field in root `package.json`
- GPL-2.0+ LICENSE at root
- At least one skill following Agent Skills spec
- Skill validation (frontmatter required fields, naming convention, structure)
- Zip packaging that excludes junk files
- CI workflow that runs on PR
- Release workflow that generates zips on tag
- Claude plugin marketplace manifest

### Must NOT Have (Guardrails)
- NO actual npm publishing — workflow exists but is disabled/manual-only
- NO real product skills — placeholder only
- NO migration of `.agents/` content (those are internal, gitignored)
- NO branch protection setup (done manually later)
- NO docs site or catalog website
- NO Changesets, Turborepo, Nx, or complex monorepo tooling
- NO postinstall scripts in any package
- NO long-lived npm tokens or secrets for CI validation
- NO duplicate skill sources between `.agents/` and `skills/`
- NO over-abstracted CLI — minimal install command, not a full SDK

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (new repo)
- **Automated tests**: YES (tests-after) — validation scripts + unit tests for CLI
- **Framework**: `bun test` (ships with bun, zero config, fast)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **CLI**: Use Bash — run command, validate output, check exit code
- **Scripts**: Use Bash — run validation/pack scripts, check outputs
- **CI Workflows**: Use `actionlint` for syntax validation
- **Zips**: Use `unzip -t` and `zipinfo` for integrity/contents

---

## Execution Strategy

### Pre-Implementation: Issue + Spec Creation

> This plan requires a GitHub issue and spec BEFORE implementation begins.
> The orchestrator must follow this sequence with user checkpoints.

**Step A: Create GitHub Issue**
- Use `.agents/github-issue-creator` skill to create issue in `gravityforms/backlog`
- Team: Orion, Label: `gravity`, Assignee: `faction23`
- Type: Feature request
- Title: `Gravity: Public skills repository framework`
- Body: Dense summary of this plan's objectives, deliverables, and three distribution channels
- **PAUSE after creation** — user reviews issue on GitHub before proceeding

**Step B: Create Spec (after user confirms issue)**
- Use `.agents/skill-creator` or spec skill to create `.specs/skills-repo-framework.md`
- Link spec's `source:` field to the created issue URL
- Spec captures: objectives, architecture decisions, distribution channels, supply chain strategy
- **PAUSE after creation** — user reviews spec before implementation begins

**Step C: Begin Implementation**
- Create feature branch from `main`
- Execute Wave 1-3 tasks below
- All commits reference the issue number

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation):
├── Task 1: Runtime + pnpm workspace foundation [quick]
├── Task 2: License + README scaffold [quick]
├── Task 3: Placeholder skill [quick]

Wave 2 (After Wave 1 - tooling + packages):
├── Task 4: Skill validation script [unspecified-high]
├── Task 5: Zip packaging script [unspecified-high]
├── Task 6: CLI package scaffold [unspecified-high]
├── Task 7: Claude plugin marketplace manifest [quick]

Wave 3 (After Wave 2 - CI + release):
├── Task 8: CI validation workflow [unspecified-high]
├── Task 9: Release artifact workflow [unspecified-high]
├── Task 10: npm trusted publishing scaffold [quick]

Wave FINAL (After ALL tasks):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
├── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 4, 5, 6, 7, 8, 9, 10 |
| 2 | - | 8 |
| 3 | - | 4, 5, 7, 8 |
| 4 | 1, 3 | 8 |
| 5 | 1, 3 | 8, 9 |
| 6 | 1 | 8, 10 |
| 7 | 1, 3 | 8 |
| 8 | 4, 5, 6, 7 | F1-F4 |
| 9 | 5 | F1-F4 |
| 10 | 6 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 `quick`, T2 `quick`, T3 `quick`
- **Wave 2**: 4 tasks — T4 `unspecified-high`, T5 `unspecified-high`, T6 `unspecified-high`, T7 `quick`
- **Wave 3**: 3 tasks — T8 `unspecified-high`, T9 `unspecified-high`, T10 `quick`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [ ] 1. Runtime + pnpm Workspace Foundation

  **What to do**:
  - Create `.nvmrc` with `24.11.1`
  - Create root `package.json` with:
    - `"name": "gravityskills"` (private, not published)
    - `"private": true`
    - `"packageManager": "pnpm@11.0.8"` (latest stable pnpm 11)
    - `"engines": { "node": "24.11.1", "npm": "11.6.2" }`
    - Scripts: `build`, `test`, `skills:validate`, `skills:pack`
  - Create `pnpm-workspace.yaml` with:
    - `packages: ["packages/*"]`
    - `minimumReleaseAge: 1440` (1 day — pnpm 11 default, but be explicit)
    - `blockExoticSubdeps: true` (pnpm 11 default, be explicit)
    - `trustPolicy: no-downgrade`
    - `verifyDepsBeforeRun: install`
  - Run `pnpm install` to generate lockfile
  - Update `.gitignore` to include: `node_modules/`, `dist/`, `.DS_Store`, `*.tgz`, `.sisyphus/`

  **Must NOT do**:
  - Do not add Turborepo, Nx, Changesets, or any complex monorepo tooling
  - Do not add postinstall scripts
  - Do not add unnecessary dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7, 8, 9, 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - pnpm 11 supply chain docs: https://pnpm.io/supply-chain-security — minimumReleaseAge, blockExoticSubdeps, trustPolicy settings
  - pnpm workspace config: https://pnpm.io/pnpm-workspace_yaml — workspace package glob and settings format

  **API/Type References**:
  - `packageManager` field docs: https://nodejs.org/api/packages.html#packagemanager — enables Corepack auto-install

  **External References**:
  - pnpm 11.0.8 release: https://github.com/pnpm/pnpm/releases/tag/v11.0.8 — latest stable, fixes self-update and tarball URL issues

  **Acceptance Criteria**:
  - [ ] `.nvmrc` contains `24.11.1`
  - [ ] `package.json` has `packageManager` field starting with `pnpm@11`
  - [ ] `pnpm-workspace.yaml` has explicit `minimumReleaseAge: 1440`
  - [ ] `pnpm install --frozen-lockfile` exits 0
  - [ ] `pnpm-lock.yaml` exists and is committed

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: pnpm install succeeds with frozen lockfile
    Tool: Bash
    Preconditions: Clean checkout, Node 24.11.1 available
    Steps:
      1. Run `cat .nvmrc` → expect output `24.11.1`
      2. Run `node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).packageManager)"` → expect starts with `pnpm@11`
      3. Run `pnpm install --frozen-lockfile` → expect exit 0
      4. Run `grep minimumReleaseAge pnpm-workspace.yaml` → expect `1440`
      5. Run `grep blockExoticSubdeps pnpm-workspace.yaml` → expect `true`
    Expected Result: All commands exit 0 with correct values
    Failure Indicators: pnpm install fails, missing config fields
    Evidence: .sisyphus/evidence/task-1-pnpm-foundation.txt

  Scenario: .gitignore excludes build artifacts and internal dirs
    Tool: Bash
    Preconditions: .gitignore exists
    Steps:
      1. Run `grep -c 'node_modules' .gitignore` → expect ≥ 1
      2. Run `grep -c 'dist/' .gitignore` → expect ≥ 1
      3. Run `grep -c '.DS_Store' .gitignore` → expect ≥ 1
      4. Run `grep -c '.sisyphus/' .gitignore` → expect ≥ 1
    Expected Result: All patterns present including .sisyphus/
    Failure Indicators: Missing patterns in .gitignore
    Evidence: .sisyphus/evidence/task-1-gitignore.txt
  ```

  **Commit**: YES
  - Message: `chore: add runtime and pnpm workspace foundation`
  - Files: `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore`

- [ ] 2. License + README Scaffold

  **What to do**:
  - Add `LICENSE` file with GPL-2.0+ full text
  - Update `README.md` with:
    - Project description (skills for Gravity products)
    - Three installation methods: Claude Code plugin (`/plugin marketplace add`), CLI (`npx @gravity/skills install`), direct download (GitHub Releases)
    - Contributing section (brief, point to Agent Skills spec)
    - License badge
    - Note that npm publishing is not yet active

  **Must NOT do**:
  - Do not create a docs site
  - Do not add CONTRIBUTING.md or CODE_OF_CONDUCT.md yet
  - Do not mention internal tooling or `.agents/`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **External References**:
  - GPL-2.0 license text: https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt
  - Agent Skills spec: https://agentskills.io/specification — link for contributors
  - Anthropic README example: https://github.com/anthropics/skills/blob/main/README.md — installation section pattern

  **Acceptance Criteria**:
  - [ ] `LICENSE` file exists with GPL-2.0 text
  - [ ] `README.md` mentions all three installation methods
  - [ ] `README.md` does not reference `.agents/` or internal tooling

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: License file is valid GPL-2.0
    Tool: Bash
    Preconditions: LICENSE exists
    Steps:
      1. Run `head -1 LICENSE` → expect contains "GNU GENERAL PUBLIC LICENSE"
      2. Run `grep -c 'Version 2' LICENSE` → expect ≥ 1
    Expected Result: GPL-2.0 identified
    Failure Indicators: Wrong license text or missing file
    Evidence: .sisyphus/evidence/task-2-license.txt

  Scenario: README has all three install methods
    Tool: Bash
    Preconditions: README.md exists
    Steps:
      1. Run `grep -c 'plugin marketplace add' README.md` → expect ≥ 1
      2. Run `grep -c '@gravity/skills' README.md` → expect ≥ 1
      3. Run `grep -c 'Releases' README.md` → expect ≥ 1
      4. Run `grep -c '.agents' README.md` → expect 0
    Expected Result: All install methods documented, no internal references
    Failure Indicators: Missing install method or internal leakage
    Evidence: .sisyphus/evidence/task-2-readme.txt
  ```

  **Commit**: YES
  - Message: `chore: add GPL-2.0+ license and README scaffold`
  - Files: `LICENSE`, `README.md`

- [ ] 3. Placeholder Skill

  **What to do**:
  - Create `skills/placeholder-skill/SKILL.md` following Agent Skills spec:
    ```yaml
    ---
    name: placeholder-skill
    description: A placeholder skill for testing the Gravity Skills repository framework. Not intended for production use.
    license: GPL-2.0+
    metadata:
      author: gravityforms
      version: "0.0.1"
    ---
    ```
  - Add markdown body with brief instructions explaining this is a test/placeholder
  - Optionally add a `references/` dir with a sample reference file to validate zip packaging

  **Must NOT do**:
  - Do not create any real Gravity product skills
  - Do not include any proprietary Gravity code or documentation

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 5, 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - Agent Skills spec: https://agentskills.io/specification — SKILL.md frontmatter format, required fields, naming rules
  - Anthropic template: https://github.com/anthropics/skills/blob/main/template/SKILL.md — minimal skill template
  - Vercel skill example: `skills/deploy-to-vercel/SKILL.md` in `vercel-labs/agent-skills` — structure with references dir

  **Acceptance Criteria**:
  - [ ] `skills/placeholder-skill/SKILL.md` exists
  - [ ] Frontmatter has required `name` and `description` fields
  - [ ] `name` matches parent directory name (`placeholder-skill`)
  - [ ] `name` is lowercase, hyphens only, no consecutive hyphens

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Placeholder skill follows Agent Skills spec
    Tool: Bash
    Preconditions: skills/placeholder-skill/SKILL.md exists
    Steps:
      1. Run `test -f skills/placeholder-skill/SKILL.md` → expect exit 0
      2. Run `head -2 skills/placeholder-skill/SKILL.md` → expect first line is `---`
      3. Run `grep 'name: placeholder-skill' skills/placeholder-skill/SKILL.md` → expect match
      4. Run `grep 'description:' skills/placeholder-skill/SKILL.md` → expect match
    Expected Result: Valid SKILL.md with required frontmatter
    Failure Indicators: Missing file, missing frontmatter, name mismatch
    Evidence: .sisyphus/evidence/task-3-placeholder-skill.txt

  Scenario: Skill name matches directory name
    Tool: Bash
    Preconditions: Skill directory exists
    Steps:
      1. Extract name from SKILL.md frontmatter
      2. Compare with parent directory name `placeholder-skill`
    Expected Result: Names match exactly
    Evidence: .sisyphus/evidence/task-3-name-match.txt
  ```

  **Commit**: YES
  - Message: `feat: add placeholder skill following Agent Skills spec`
  - Files: `skills/placeholder-skill/SKILL.md`, optionally `skills/placeholder-skill/references/`

- [ ] 4. Skill Validation Script

  **What to do**:
  - Create `scripts/validate-skills.ts` that:
    - Scans `skills/*/SKILL.md` for all skills
    - Parses YAML frontmatter (use `yaml` package or manual parsing)
    - Validates required fields: `name`, `description`
    - Validates `name` format: lowercase, hyphens only, 1-64 chars, no consecutive hyphens, no leading/trailing hyphens
    - Validates `name` matches parent directory name
    - Checks for duplicate skill names
    - Checks `description` is 1-1024 characters
    - Reports errors with file paths and exits non-zero on failure
  - Add a test file `scripts/__tests__/validate-skills.test.ts` with:
    - Test for valid skill passing
    - Test for missing `name` field
    - Test for invalid `name` format (uppercase, spaces, consecutive hyphens)
    - Test for name/directory mismatch
    - Test for duplicate names
  - Wire up as `pnpm skills:validate` in root package.json

  **Must NOT do**:
  - Do not add heavy validation frameworks (no ajv, zod, etc.)
  - Do not validate optional fields beyond basic type checks
  - Do not fetch or validate external references

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - Agent Skills spec naming rules: https://agentskills.io/specification — `name` field constraints (lowercase, hyphens, 1-64 chars, must match parent dir)
  - `skills/placeholder-skill/SKILL.md` — the skill to validate against (created in Task 3)

  **External References**:
  - YAML frontmatter parsing: standard `---` delimited block at top of file, parse with simple regex or `yaml` npm package

  **WHY Each Reference Matters**:
  - The spec defines exact validation rules — don't invent constraints, follow the spec precisely
  - The placeholder skill is the test fixture — validation must pass on it

  **Acceptance Criteria**:
  - [ ] `scripts/validate-skills.ts` exists
  - [ ] `pnpm skills:validate` exits 0 with placeholder skill present
  - [ ] Validation catches: missing name, invalid name format, name/dir mismatch, missing description
  - [ ] `bun test scripts/__tests__/validate-skills.test.ts` passes

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Validation passes for valid placeholder skill
    Tool: Bash
    Preconditions: placeholder-skill exists with valid SKILL.md
    Steps:
      1. Run `pnpm skills:validate`
      2. Check exit code → expect 0
      3. Check output contains "placeholder-skill" as validated
    Expected Result: Clean validation pass
    Failure Indicators: Non-zero exit, error messages
    Evidence: .sisyphus/evidence/task-4-validate-pass.txt

  Scenario: Validation fails for invalid skill
    Tool: Bash
    Preconditions: Create temp invalid skill with uppercase name
    Steps:
      1. Create `skills/Invalid-Skill/SKILL.md` with `name: Invalid-Skill`
      2. Run `pnpm skills:validate`
      3. Check exit code → expect non-zero
      4. Check output mentions invalid name format
      5. Remove temp skill
    Expected Result: Validation catches the invalid name
    Failure Indicators: Validation passes when it shouldn't
    Evidence: .sisyphus/evidence/task-4-validate-fail.txt
  ```

  **Commit**: YES
  - Message: `feat: add skill validation script`
  - Files: `scripts/validate-skills.ts`, `scripts/__tests__/validate-skills.test.ts`, `package.json` (script entry)

- [ ] 5. Zip Packaging Script

  **What to do**:
  - Create `scripts/pack-skills.ts` that:
    - Scans `skills/*/` for all skill directories
    - Creates a `dist/skills/` output directory
    - For each skill, creates `<skill-name>.zip` containing the skill directory (not flat — zip root is the skill dir name)
    - Excludes: `node_modules/`, `.git/`, `.DS_Store`, `.env`, `*.tgz`, `__pycache__/`
    - Uses Node's built-in `child_process` to call `zip` or uses `archiver` npm package
    - Logs each zip created with size
    - Exits non-zero if any zip fails
  - Add test file `scripts/__tests__/pack-skills.test.ts`:
    - Test zip is created for placeholder skill
    - Test zip contains SKILL.md
    - Test zip excludes .DS_Store
    - Test zip root is skill directory name (not flat)
  - Wire up as `pnpm skills:pack` in root package.json

  **Must NOT do**:
  - Do not commit zips to the repo (CI generates them)
  - Do not create one monolithic zip of all skills
  - Do not include any files from outside the skill directory

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - Vercel zip pattern: `vercel-labs/agent-skills` has `Archive.zip` inside each skill dir + `<skill>.zip` at skills/ root — we do NOT follow this (we generate to `dist/`)

  **External References**:
  - `archiver` npm package: https://www.npmjs.com/package/archiver — if avoiding shell `zip` dependency
  - Alternative: Node `child_process.execSync('zip ...')` — simpler if `zip` is available in CI (ubuntu-latest has it)

  **Acceptance Criteria**:
  - [ ] `scripts/pack-skills.ts` exists
  - [ ] `pnpm skills:pack` exits 0
  - [ ] `dist/skills/placeholder-skill.zip` is created
  - [ ] `unzip -t dist/skills/placeholder-skill.zip` exits 0
  - [ ] `zipinfo -1 dist/skills/placeholder-skill.zip` includes `placeholder-skill/SKILL.md`
  - [ ] `zipinfo -1 dist/skills/placeholder-skill.zip` does NOT include `.DS_Store` or `node_modules`
  - [ ] `bun test scripts/__tests__/pack-skills.test.ts` passes

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Zip packaging creates valid archive
    Tool: Bash
    Preconditions: placeholder-skill exists, dist/ is clean
    Steps:
      1. Run `rm -rf dist/`
      2. Run `pnpm skills:pack` → expect exit 0
      3. Run `test -f dist/skills/placeholder-skill.zip` → expect exit 0
      4. Run `unzip -t dist/skills/placeholder-skill.zip` → expect exit 0
      5. Run `zipinfo -1 dist/skills/placeholder-skill.zip` → expect contains `placeholder-skill/SKILL.md`
    Expected Result: Valid zip with correct structure
    Failure Indicators: Missing zip, corrupt archive, wrong structure
    Evidence: .sisyphus/evidence/task-5-pack-valid.txt

  Scenario: Zip excludes junk files
    Tool: Bash
    Preconditions: Create .DS_Store in skill dir
    Steps:
      1. Run `touch skills/placeholder-skill/.DS_Store`
      2. Run `pnpm skills:pack`
      3. Run `zipinfo -1 dist/skills/placeholder-skill.zip | grep -c '.DS_Store'` → expect 0
      4. Run `rm skills/placeholder-skill/.DS_Store`
    Expected Result: Junk files excluded from zip
    Failure Indicators: .DS_Store appears in zip contents
    Evidence: .sisyphus/evidence/task-5-pack-excludes.txt
  ```

  **Commit**: YES
  - Message: `feat: add skill zip packaging script`
  - Files: `scripts/pack-skills.ts`, `scripts/__tests__/pack-skills.test.ts`, `package.json` (script entry)

- [ ] 6. @gravity/skills CLI Package Scaffold

  **What to do**:
  - Create `packages/skills-cli/` with:
    - `package.json`:
      - `"name": "@gravity/skills"`
      - `"version": "0.0.1"` (not published yet)
      - `"bin": { "gravity-skills": "./dist/index.js" }`
      - `"type": "module"`
      - `"publishConfig": { "access": "public", "registry": "https://registry.npmjs.org" }`
      - `"license": "GPL-2.0+"`
      - `"repository": { "type": "git", "url": "https://github.com/gravityforms/gravityskills" }`
      - `"engines": { "node": ">=20" }` (broader than repo requirement for CLI users)
      - Scripts: `build`, `test`
    - `tsconfig.json` for TypeScript compilation
    - `src/index.ts` — entry point with CLI argument parsing:
      - `--help` / `-h`: Show usage (list skills, install skill)
      - `--version` / `-v`: Show package version
      - `install <skill-name>`: Download skill zip from GitHub Releases and extract to target dir
      - `list`: List available skills (reads from a bundled or fetched manifest)
    - `src/commands/install.ts` — download zip from `https://github.com/gravityforms/gravityskills/releases/latest/download/<skill-name>.zip`, extract to current dir or `--target` path
    - `src/commands/list.ts` — fetch/display available skills
    - Minimal deps: **ZERO npm dependencies**. Use only Node built-ins:
      - `https` / `fetch` (Node 24 has global fetch) for downloading zips from GitHub Releases
      - `fs` / `fs/promises` for file operations
      - `path` for path manipulation
      - `child_process` for `unzip` or use `zlib` + manual zip parsing
      - `crypto` for integrity checks if needed
      - `readline` for minimal interactive prompts if needed
      - Parse YAML frontmatter with simple regex (3 lines: split on `---`, no yaml lib needed for reading metadata)
    - The published package must have `"dependencies": {}` in package.json — absolutely no npm deps
    - Build with bundler (rolldown, esbuild, or tsc) so the dist is a single self-contained file
    - This makes the CLI resilient to npm supply chain attacks — nothing to compromise except our own code
    - Test file `src/__tests__/cli.test.ts`:
      - Test `--help` output
      - Test `--version` output
      - Test `install` with mock/stub (don't actually download)
  - Run `pnpm install` from root to wire up workspace

  **Must NOT do**:
  - Do not add heavy CLI frameworks (commander, yargs, oclif)
  - Do not add ANY npm dependencies — the published package must have zero deps
  - Do not implement authentication or private skill access
  - Do not add SDK/programmatic API
  - Do not publish to npm

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Tasks 8, 10
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - npm `bin` field: `package.json` `bin` maps CLI command name to entry file
  - GitHub Releases download URL pattern: `https://github.com/{owner}/{repo}/releases/latest/download/{filename}`

  **External References**:
  - npm trusted publishing: https://docs.npmjs.com/trusted-publishers/ — `publishConfig` setup for future OIDC publishing
  - Node built-in `https` for downloads, `child_process` for `unzip`

  **WHY Each Reference Matters**:
  - `publishConfig` must be correct now so the trusted publishing workflow works when enabled
  - Download URL pattern is how the CLI fetches skills from GitHub Releases

  **Acceptance Criteria**:
  - [ ] `packages/skills-cli/package.json` has `"name": "@gravity/skills"`
  - [ ] `pnpm --filter @gravity/skills build` exits 0
  - [ ] `node packages/skills-cli/dist/index.js --help` exits 0 and shows usage
  - [ ] `node packages/skills-cli/dist/index.js --version` shows `0.0.1`
  - [ ] `node -e "const p=JSON.parse(require('fs').readFileSync('packages/skills-cli/package.json','utf8')); console.log(Object.keys(p.dependencies||{}).length)"` outputs `0` (zero dependencies)
  - [ ] `bun test packages/skills-cli/src/__tests__/cli.test.ts` passes

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: CLI --help shows install command
    Tool: Bash
    Preconditions: CLI is built
    Steps:
      1. Run `pnpm --filter @gravity/skills build` → expect exit 0
      2. Run `node packages/skills-cli/dist/index.js --help` → expect exit 0
      3. Check output contains "install" → expect match
      4. Check output contains "list" → expect match
    Expected Result: Help shows available commands
    Failure Indicators: Build fails, help missing commands
    Evidence: .sisyphus/evidence/task-6-cli-help.txt

  Scenario: CLI --version shows correct version
    Tool: Bash
    Preconditions: CLI is built
    Steps:
      1. Run `node packages/skills-cli/dist/index.js --version`
      2. Check output → expect `0.0.1`
    Expected Result: Version matches package.json
    Evidence: .sisyphus/evidence/task-6-cli-version.txt
  ```

  **Commit**: YES
  - Message: `feat: scaffold @gravity/skills CLI package`
  - Files: `packages/skills-cli/*`, `pnpm-lock.yaml`

- [ ] 7. Claude Plugin Marketplace Manifest

  **What to do**:
  - Create `.claude-plugin/marketplace.json` with:
    ```json
    {
      "name": "gravity-skills",
      "owner": {
        "name": "Gravity Forms",
        "email": "support@gravityforms.com"
      },
      "metadata": {
        "description": "Official skills for Gravity Forms, Gravity SMTP, and other Gravity products",
        "version": "1.0.0"
      },
      "plugins": [
        {
          "name": "gravity-skills",
          "description": "Skills for working with Gravity products",
          "source": "./",
          "strict": false,
          "skills": [
            "./skills/placeholder-skill"
          ]
        }
      ]
    }
    ```
  - Validate JSON is well-formed

  **Must NOT do**:
  - Do not add real product skills to the plugins array yet
  - Do not reference `.agents/` skills
  - Do not invent skill paths that don't exist

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - Anthropic marketplace.json: `anthropics/skills/.claude-plugin/marketplace.json` — exact schema to follow with `name`, `owner`, `metadata`, `plugins` array

  **Acceptance Criteria**:
  - [ ] `.claude-plugin/marketplace.json` exists
  - [ ] JSON is valid (`node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'))"` exits 0)
  - [ ] `plugins[0].skills` references only existing skill directories
  - [ ] `name` field is `"gravity-skills"`

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Marketplace manifest is valid JSON with correct structure
    Tool: Bash
    Preconditions: .claude-plugin/marketplace.json exists
    Steps:
      1. Run `node -e "const m=JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8')); console.log(m.name)"` → expect `gravity-skills`
      2. Run `node -e "const m=JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8')); console.log(m.plugins[0].skills[0])"` → expect `./skills/placeholder-skill`
      3. Run `test -d skills/placeholder-skill` → expect exit 0
    Expected Result: Valid manifest pointing to existing skills
    Failure Indicators: Invalid JSON, missing skills, broken references
    Evidence: .sisyphus/evidence/task-7-marketplace.txt

  Scenario: Referenced skill paths exist
    Tool: Bash
    Preconditions: Manifest exists
    Steps:
      1. Parse all skill paths from plugins[].skills[]
      2. For each path, verify directory exists
    Expected Result: All referenced paths exist
    Evidence: .sisyphus/evidence/task-7-skill-refs.txt
  ```

  **Commit**: YES
  - Message: `feat: add Claude plugin marketplace manifest`
  - Files: `.claude-plugin/marketplace.json`

- [ ] 8. CI Validation Workflow

  **What to do**:
  - Create `.github/workflows/ci.yml`:
    - Trigger: push to `main`, pull_request to `main`
    - Jobs:
      - `validate`:
        - `runs-on: ubuntu-latest`
        - Setup pnpm 11 via `pnpm/action-setup@v4`
        - Setup Node 24.11.1 via `actions/setup-node@v4` with pnpm cache
        - `pnpm install --frozen-lockfile`
        - `pnpm build`
        - `pnpm test`
        - `pnpm skills:validate`
        - `pnpm skills:pack` (verify zips can be created)
        - Verify zips with `unzip -t dist/skills/*.zip`

  **Must NOT do**:
  - Do not require any secrets for CI validation
  - Do not publish anything
  - Do not add complex matrix builds
  - Do not add caching beyond pnpm's built-in

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 4, 5, 6, 7

  **References**:

  **Pattern References**:
  - Vercel CI workflow: `.github/workflows/react-best-practices-ci.yml` in `vercel-labs/agent-skills` — pnpm/action-setup + setup-node + validate + build pattern
  - pnpm/action-setup@v4: https://github.com/pnpm/action-setup — official pnpm GitHub Action

  **External References**:
  - actions/setup-node@v4 with pnpm cache: set `cache: 'pnpm'` and `cache-dependency-path: 'pnpm-lock.yaml'`

  **Acceptance Criteria**:
  - [ ] `.github/workflows/ci.yml` exists
  - [ ] Workflow triggers on push to main and PR to main
  - [ ] Workflow runs: install, build, test, skills:validate, skills:pack
  - [ ] No secrets required for validation jobs
  - [ ] `actionlint .github/workflows/ci.yml` exits 0 (if actionlint available)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: CI workflow YAML is valid
    Tool: Bash
    Preconditions: .github/workflows/ci.yml exists
    Steps:
      1. Run `node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/ci.yml','utf8'))"` or `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` → expect exit 0
      2. Verify `on.push.branches` includes `main`
      3. Verify `on.pull_request.branches` includes `main`
      4. Verify steps include `pnpm install`, `pnpm build`, `pnpm test`, `pnpm skills:validate`, `pnpm skills:pack`
    Expected Result: Valid workflow with all required steps
    Failure Indicators: Invalid YAML, missing triggers, missing steps
    Evidence: .sisyphus/evidence/task-8-ci-workflow.txt

  Scenario: No secrets referenced in CI workflow
    Tool: Bash
    Preconditions: ci.yml exists
    Steps:
      1. Run `grep -c 'secrets\.' .github/workflows/ci.yml` → expect 0
    Expected Result: No secrets used
    Evidence: .sisyphus/evidence/task-8-no-secrets.txt
  ```

  **Commit**: YES
  - Message: `ci: add validation workflow`
  - Files: `.github/workflows/ci.yml`

- [ ] 9. Release Artifact Workflow

  **What to do**:
  - Create `.github/workflows/release.yml`:
    - Trigger: push tags matching `v*` (e.g. `v0.1.0`)
    - Permissions: `contents: write` (to create releases)
    - Jobs:
      - `release`:
        - `runs-on: ubuntu-latest`
        - Setup pnpm + Node (same as CI)
        - `pnpm install --frozen-lockfile`
        - `pnpm build`
        - `pnpm test`
        - `pnpm skills:validate`
        - `pnpm skills:pack`
        - Create GitHub Release using `softprops/action-gh-release@v2` or `gh release create`:
          - Upload all `dist/skills/*.zip` as release assets
          - Generate release notes from tag
          - Mark as latest

  **Must NOT do**:
  - Do not publish to npm (separate workflow)
  - Do not auto-create tags
  - Do not create draft releases (make them actual releases)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 5

  **References**:

  **External References**:
  - `softprops/action-gh-release@v2`: https://github.com/softprops/action-gh-release — upload release assets with glob pattern
  - Alternative: `gh release create $TAG dist/skills/*.zip --generate-notes` — simpler, uses GitHub CLI

  **Acceptance Criteria**:
  - [ ] `.github/workflows/release.yml` exists
  - [ ] Triggers only on `v*` tags
  - [ ] Has `contents: write` permission
  - [ ] Uploads `dist/skills/*.zip` as release assets
  - [ ] Runs validation before creating release (install, build, test, validate, pack)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Release workflow triggers on version tags only
    Tool: Bash
    Preconditions: release.yml exists
    Steps:
      1. Parse YAML and check `on.push.tags` → expect includes `v*`
      2. Verify no `on.push.branches` trigger
      3. Verify `permissions.contents` is `write`
    Expected Result: Tag-only trigger with write permissions
    Failure Indicators: Branch triggers, missing permissions
    Evidence: .sisyphus/evidence/task-9-release-trigger.txt

  Scenario: Release workflow validates before creating release
    Tool: Bash
    Preconditions: release.yml exists
    Steps:
      1. Check step order: install before build before test before validate before pack before release
      2. Verify release step references `dist/skills/*.zip`
    Expected Result: Validation gates release creation
    Evidence: .sisyphus/evidence/task-9-release-order.txt
  ```

  **Commit**: YES
  - Message: `ci: add release artifact workflow`
  - Files: `.github/workflows/release.yml`

- [ ] 10. npm Trusted Publishing Scaffold

  **What to do**:
  - Create `.github/workflows/npm-publish.yml`:
    - Trigger: `workflow_dispatch` only (manual, disabled by default)
    - Comment block at top explaining:
      1. First publish must be manual (`npm login && cd packages/skills-cli && npm publish --access public`)
      2. Then configure trusted publisher on npmjs.com (org: gravityforms, repo: gravityskills, workflow: npm-publish.yml)
      3. Then this workflow can be enabled
    - Permissions: `id-token: write`, `contents: read`
    - Jobs:
      - `publish`:
        - `runs-on: ubuntu-latest`
        - Setup pnpm + Node 24.x (must be 24.x for npm 11.5.1+)
        - `pnpm install --frozen-lockfile`
        - `pnpm --filter @gravity/skills build`
        - `pnpm --filter @gravity/skills test`
        - `cd packages/skills-cli && npm publish --access public`
        - `registry-url: 'https://registry.npmjs.org'` in setup-node (REQUIRED for trusted publishing)

  **Must NOT do**:
  - Do not enable auto-trigger (no push/tag triggers)
  - Do not store npm tokens
  - Do not actually publish
  - Do not add `--provenance` flag (automatic with trusted publishing)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 6

  **References**:

  **External References**:
  - npm trusted publishing docs: https://docs.npmjs.com/trusted-publishers/ — OIDC setup, first-publish requirement
  - Key gotcha: first publish must be manual, trusted publishing only works from second release onward
  - Key gotcha: Node 24.x required for npm 11.5.1+ (trusted publishing requirement)
  - Key gotcha: `registry-url` must be explicitly set in `actions/setup-node` even though it's the default
  - Key gotcha: provenance attestations are automatic with trusted publishing from public repos — no `--provenance` flag needed

  **Acceptance Criteria**:
  - [ ] `.github/workflows/npm-publish.yml` exists
  - [ ] Only triggers on `workflow_dispatch` (no push/tag/PR triggers)
  - [ ] Has `id-token: write` and `contents: read` permissions
  - [ ] Has `registry-url: 'https://registry.npmjs.org'` in setup-node
  - [ ] Has comment block explaining manual first-publish requirement
  - [ ] Does NOT reference any npm tokens or secrets

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: npm publish workflow is manual-only
    Tool: Bash
    Preconditions: npm-publish.yml exists
    Steps:
      1. Run `grep -c 'workflow_dispatch' .github/workflows/npm-publish.yml` → expect ≥ 1
      2. Run `grep -c 'push:' .github/workflows/npm-publish.yml` → expect 0
      3. Run `grep -c 'pull_request:' .github/workflows/npm-publish.yml` → expect 0
      4. Run `grep 'id-token' .github/workflows/npm-publish.yml` → expect match containing `write`
      5. Run `grep 'registry-url' .github/workflows/npm-publish.yml` → expect match
      6. Run `grep -c 'NPM_TOKEN\|NODE_AUTH_TOKEN.*secrets' .github/workflows/npm-publish.yml` → expect 0
    Expected Result: Manual-only workflow with OIDC, no tokens
    Failure Indicators: Auto-triggers present, missing OIDC, token references
    Evidence: .sisyphus/evidence/task-10-npm-scaffold.txt

  Scenario: First-publish documentation exists in workflow
    Tool: Bash
    Preconditions: npm-publish.yml exists
    Steps:
      1. Run `grep -c 'first publish' .github/workflows/npm-publish.yml` → expect ≥ 1 (case insensitive)
      2. Run `grep -c 'npm login' .github/workflows/npm-publish.yml` → expect ≥ 1
    Expected Result: Manual first-publish instructions present
    Evidence: .sisyphus/evidence/task-10-npm-docs.txt
  ```

  **Commit**: YES
  - Message: `ci: add disabled npm trusted publishing scaffold`
  - Files: `.github/workflows/npm-publish.yml`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Run `pnpm install`, `pnpm build`, `pnpm test`, `pnpm skills:validate`, `pnpm skills:pack`. Test CLI `--help` and `install placeholder-skill`. Verify zip contents. Test each distribution channel locally.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Commit | Message | Files |
|--------|---------|-------|
| 1 | `chore: add runtime and pnpm workspace foundation` | `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore` |
| 2 | `chore: add GPL-2.0+ license and README scaffold` | `LICENSE`, `README.md` |
| 3 | `feat: add placeholder skill following Agent Skills spec` | `skills/placeholder-skill/SKILL.md` |
| 4 | `feat: add skill validation script` | `scripts/validate-skills.ts`, tests |
| 5 | `feat: add skill zip packaging script` | `scripts/pack-skills.ts`, tests |
| 6 | `feat: scaffold @gravity/skills CLI package` | `packages/skills-cli/*` |
| 7 | `feat: add Claude plugin marketplace manifest` | `.claude-plugin/marketplace.json` |
| 8 | `ci: add validation workflow` | `.github/workflows/ci.yml` |
| 9 | `ci: add release artifact workflow` | `.github/workflows/release.yml` |
| 10 | `ci: add disabled npm trusted publishing scaffold` | `.github/workflows/npm-publish.yml` |

---

## Success Criteria

### Verification Commands
```bash
pnpm install --frozen-lockfile  # Expected: exits 0
pnpm build                      # Expected: exits 0
pnpm test                       # Expected: exits 0, all tests pass
pnpm skills:validate             # Expected: exits 0, placeholder skill valid
pnpm skills:pack                 # Expected: exits 0, creates dist/skills/placeholder-skill.zip
unzip -t dist/skills/placeholder-skill.zip  # Expected: exits 0
node packages/skills-cli/dist/index.js --help  # Expected: shows help with install command
actionlint                       # Expected: exits 0 on all workflow files
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] All three distribution channels scaffolded (GitHub Releases, npm CLI, Claude plugin)
- [ ] Supply chain hardening configured and documented
