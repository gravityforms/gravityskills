# Gravity Skills

A collection of skills for AI coding agents working with Gravity products. Skills are packaged instructions, references, and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Installation

### CLI (coming soon)

> The `@gravity/skills` CLI is not yet published. Once available:

```bash
npx @gravity/skills install <skill-name>
```

### GitHub Releases

Download skill zips directly from [Releases](https://github.com/gravityforms/gravityskills/releases) and extract into your project's `.agents/skills/` directory.

## Available Skills

### [`gravity-forms-abilities`](skills/gravity-forms-abilities/)

Workflow guidance for AI agents using Gravity Forms abilities via the WordPress Abilities API (MCP). Covers form CRUD, entry management, submissions, feeds, notifications, conditional logic, and system queries. Provides critical sequencing rules, field configuration knowledge, and pitfall avoidance that tool schemas alone cannot express.

**Requires:** WordPress site with Gravity Forms 2.9+ and MCP endpoint enabled (GF Settings → MCP).

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
./scripts/validate-skills.sh
```

## License

GPL-2.0+
