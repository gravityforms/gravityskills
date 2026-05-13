/// <reference types="bun" />

import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

const repoRoot = join(import.meta.dirname, '..', '..');
const distDir = join(repoRoot, 'dist');
const zipPath = join(distDir, 'skills', 'placeholder-skill.zip');

function zipEntries(): string[] {
  return execFileSync('zipinfo', ['-1', zipPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean);
}

describe('pack skills', () => {
  beforeAll(() => {
    rmSync(distDir, { recursive: true, force: true });
    execFileSync('pnpm', ['skills:pack'], { cwd: repoRoot, stdio: 'pipe' });
  });

  afterAll(() => {
    rmSync(distDir, { recursive: true, force: true });
  });

  test('creates the placeholder skill zip', () => {
    expect(existsSync(zipPath)).toBe(true);
  });

  test('contains SKILL.md under the skill directory root', () => {
    expect(zipEntries()).toContain('placeholder-skill/SKILL.md');
  });

  test('keeps the skill directory as the zip root', () => {
    const entries = zipEntries();

    expect(entries).not.toContain('SKILL.md');
    expect(entries.every((entry) => entry.startsWith('placeholder-skill/'))).toBe(true);
  });

  test('excludes ignored files and directories', () => {
    const entries = zipEntries();

    expect(entries.some((entry) => entry.includes('.DS_Store'))).toBe(false);
    expect(entries.some((entry) => entry.includes('node_modules/'))).toBe(false);
  });
});
