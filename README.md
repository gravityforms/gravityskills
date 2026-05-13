# Gravity Skills

A collection of skills for AI coding agents working with Gravity products. Skills are packaged instructions, references, and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Installation

### CLI

```bash
npx @gravity/skills install <skill-name>
```

### GitHub Releases

Download skill zips directly from [Releases](https://github.com/gravityforms/gravityskills/releases) and extract into your project's `.agents/skills/` directory.

### Claude Code Plugin

Skills are also available through the Claude Code plugin marketplace. See `.claude-plugin/marketplace.json` for the plugin manifest.

## Available Skills

_Coming soon._ This repository is being set up to host public skills for Gravity products.

## Usage

Once installed, skills are automatically available to your AI coding agent. The agent reads the skill's `SKILL.md` when working on relevant tasks.

**Examples:**

```
Help me build a Gravity Forms integration
```

```
Review my form field implementation
```

## Skill Structure

Each skill contains:

- `SKILL.md` — Instructions for the agent (required)
- `references/` — Supporting documentation (optional)
- `scripts/` — Helper scripts for automation (optional)

## Contributing

Skills must follow the [Agent Skills spec](https://agentskills.io/):

- **Name**: lowercase, hyphens only, 1–64 characters
- **Directory name** must match the `name` field in `SKILL.md` frontmatter
- **Frontmatter**: `name` and `description` fields required

Run validation before submitting:

```bash
pnpm skills:validate
```

## License

GPL-2.0+
