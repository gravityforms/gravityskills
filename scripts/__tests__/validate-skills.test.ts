import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-ignore Bun provides this module at test runtime.
import { afterEach, describe, expect, test } from 'bun:test';

const { validateSkills } = require('../validate-skills');

const tempRoots: string[] = [];

function createRepo(): string {
  const repoRoot = mkdtempSync(join(tmpdir(), 'gravityskills-validate-'));
  tempRoots.push(repoRoot);
  mkdirSync(join(repoRoot, 'skills'), { recursive: true });

  return repoRoot;
}

function writeSkill(repoRoot: string, directoryName: string, frontmatter: string): void {
  const skillDir = join(repoRoot, 'skills', directoryName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), `---\n${frontmatter}---\n\n# ${directoryName}\n`);
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('validateSkills', () => {
  test('passes for valid skills', () => {
    const repoRoot = createRepo();
    writeSkill(repoRoot, 'placeholder-skill', 'name: placeholder-skill\ndescription: A placeholder skill\n');

    expect(validateSkills(repoRoot)).toEqual({
      errors: [],
      skillCount: 1,
    });
  });

  test('catches missing name', () => {
    const repoRoot = createRepo();
    writeSkill(repoRoot, 'missing-name', 'description: A valid description\n');

    expect(validateSkills(repoRoot).errors).toContain('skills/missing-name/SKILL.md: frontmatter.name is required');
  });

  test('catches invalid name format', () => {
    const repoRoot = createRepo();
    writeSkill(repoRoot, 'invalid-format', 'name: Invalid--Name\ndescription: A valid description\n');

    expect(validateSkills(repoRoot).errors).toContain(
      'skills/invalid-format/SKILL.md: frontmatter.name must be lowercase hyphenated text, 1-64 chars, with no leading/trailing/consecutive hyphens',
    );
  });

  test('catches name and directory mismatch', () => {
    const repoRoot = createRepo();
    writeSkill(repoRoot, 'directory-name', 'name: frontmatter-name\ndescription: A valid description\n');

    expect(validateSkills(repoRoot).errors).toContain(
      'skills/directory-name/SKILL.md: frontmatter.name must match parent directory name "directory-name"',
    );
  });

  test('catches missing description', () => {
    const repoRoot = createRepo();
    writeSkill(repoRoot, 'missing-description', 'name: missing-description\n');

    expect(validateSkills(repoRoot).errors).toContain(
      'skills/missing-description/SKILL.md: frontmatter.description is required',
    );
  });

  test('catches overlong description', () => {
    const repoRoot = createRepo();
    writeSkill(repoRoot, 'long-description', `name: long-description\ndescription: ${'a'.repeat(1025)}\n`);

    expect(validateSkills(repoRoot).errors).toContain(
      'skills/long-description/SKILL.md: frontmatter.description must be 1-1024 characters',
    );
  });

  test('catches duplicate names', () => {
    const repoRoot = createRepo();
    writeSkill(repoRoot, 'duplicate-one', 'name: duplicate-skill\ndescription: A valid description\n');
    writeSkill(repoRoot, 'duplicate-two', 'name: duplicate-skill\ndescription: Another valid description\n');

    expect(validateSkills(repoRoot).errors).toContain(
      'skills/duplicate-one/SKILL.md, skills/duplicate-two/SKILL.md: duplicate skill name "duplicate-skill"',
    );
  });
});
