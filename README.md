# Gravity Skills

A collection of skills for AI coding agents working with Gravity products. Skills are packaged instructions, references, and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Installation

### Skills CLI

Install all skills with the [Vercel Skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add gravityforms/gravityskills
```

Install a specific skill:

```bash
npx skills add gravityforms/gravityskills --skill gravity-forms-abilities
```

### GitHub Releases

Download skill zips directly from [Releases](https://github.com/gravityforms/gravityskills/releases) and extract into your project's `.agents/skills/` directory (or other applicable directory, eg `.claude/skills`).

In the case of the Claude desktop app, follow their [instructions](https://support.claude.com/en/articles/12512180-use-skills-in-claude). 

## Available Skills

### [`gravity-forms-abilities`](skills/gravity-forms-abilities/)

Workflow guidance for AI agents using Gravity Forms abilities via the WordPress Abilities API (MCP). Covers form CRUD, entry management, submissions, feeds, notifications, conditional logic, and system queries. Provides critical sequencing rules, field configuration knowledge, and pitfall avoidance that tool schemas alone cannot express.

**Requires:** WordPress site with Gravity Forms 3.1+ and MCP endpoint enabled (GF Settings → MCP).

```bash
npx skills add gravityforms/gravityskills --skill gravity-forms-abilities
```

## Usage

Once installed, skills are automatically available to your AI coding agent. The agent reads the skill's `SKILL.md` when working on relevant tasks.

## License

GPL-2.0+
