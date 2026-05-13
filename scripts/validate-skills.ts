const fs = require('node:fs');
const path = require('node:path');

interface SkillFrontmatter {
  name?: unknown;
  description?: unknown;
  [key: string]: unknown;
}

interface ValidationResult {
  errors: string[];
  skillCount: number;
}

const skillNamePattern = /^(?!.*--)[a-z](?:[a-z-]{0,62}[a-z])?$/;
const defaultRepoRoot = process.cwd();

function formatPath(filePath: string, repoRoot: string): string {
  const relativePath = path.relative(repoRoot, filePath);

  return relativePath === '' ? filePath : relativePath.split('\\').join('/');
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === '') {
    return '';
  }

  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  return trimmed;
}

function parseFrontmatter(markdown: string): SkillFrontmatter {
  const normalized = markdown.replace(/^\uFEFF/, '');

  if (!normalized.startsWith('---\n') && normalized.trim() !== '---') {
    throw new Error('missing YAML frontmatter opening delimiter');
  }

  const closingDelimiter = normalized.indexOf('\n---', 4);
  if (closingDelimiter === -1) {
    throw new Error('missing YAML frontmatter closing delimiter');
  }

  const frontmatter = normalized.slice(4, closingDelimiter);
  const result: SkillFrontmatter = {};
  const parents: Array<Record<string, unknown>> = [result];
  const indents = [0];

  for (const rawLine of frontmatter.split('\n')) {
    if (rawLine.trim() === '' || rawLine.trimStart().startsWith('#')) {
      continue;
    }

    const match = rawLine.match(/^(\s*)([^:#][^:]*):(?:\s*(.*))?$/);
    if (!match) {
      continue;
    }

    const indent = match[1].length;
    const key = match[2].trim();
    const value = match[3] ?? '';

    while (indents.length > 1 && indent <= indents[indents.length - 1]) {
      parents.pop();
      indents.pop();
    }

    const parent = parents[parents.length - 1];
    if (value.trim() === '') {
      const child: Record<string, unknown> = {};
      parent[key] = child;
      parents.push(child);
      indents.push(indent);
      continue;
    }

    parent[key] = parseScalar(value);
  }

  return result;
}

function validateName(filePath: string, repoRoot: string, directoryName: string, name: unknown): string[] {
  const location = formatPath(filePath, repoRoot);
  const errors: string[] = [];

  if (typeof name !== 'string' || name.trim() === '') {
    errors.push(`${location}: frontmatter.name is required`);
    return errors;
  }

  if (!skillNamePattern.test(name)) {
    errors.push(`${location}: frontmatter.name must be lowercase hyphenated text, 1-64 chars, with no leading/trailing/consecutive hyphens`);
  }

  if (name !== directoryName) {
    errors.push(`${location}: frontmatter.name must match parent directory name "${directoryName}"`);
  }

  return errors;
}

function validateDescription(filePath: string, repoRoot: string, description: unknown): string[] {
  const location = formatPath(filePath, repoRoot);

  if (typeof description !== 'string' || description.trim() === '') {
    return [`${location}: frontmatter.description is required`];
  }

  if (description.length > 1024) {
    return [`${location}: frontmatter.description must be 1-1024 characters`];
  }

  return [];
}

function validateSkills(repoRoot = defaultRepoRoot): ValidationResult {
  const skillsDir = path.join(repoRoot, 'skills');
  const errors: string[] = [];
  const names = new Map<string, string[]>();

  if (!fs.existsSync(skillsDir)) {
    return {
      errors: [`${formatPath(skillsDir, repoRoot)}: skills directory does not exist`],
      skillCount: 0,
    };
  }

  const skillDirectories = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const directoryName of skillDirectories) {
    const filePath = path.join(skillsDir, directoryName, 'SKILL.md');
    const location = formatPath(filePath, repoRoot);

    if (!fs.existsSync(filePath)) {
      errors.push(`${location}: SKILL.md is required`);
      continue;
    }

    let frontmatter: SkillFrontmatter;
    try {
      frontmatter = parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${location}: ${message}`);
      continue;
    }

    errors.push(...validateName(filePath, repoRoot, directoryName, frontmatter.name));
    errors.push(...validateDescription(filePath, repoRoot, frontmatter.description));

    if (typeof frontmatter.name === 'string' && frontmatter.name.trim() !== '') {
      const paths = names.get(frontmatter.name) ?? [];
      paths.push(location);
      names.set(frontmatter.name, paths);
    }
  }

  for (const [name, paths] of names) {
    if (paths.length > 1) {
      errors.push(`${paths.join(', ')}: duplicate skill name "${name}"`);
    }
  }

  return {
    errors,
    skillCount: skillDirectories.length,
  };
}

function runValidation(repoRoot = defaultRepoRoot): number {
  const result = validateSkills(repoRoot);

  if (result.errors.length > 0) {
    console.error(`Skill validation failed with ${result.errors.length} error(s):`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    return 1;
  }

  console.log(`Validated ${result.skillCount} skill${result.skillCount === 1 ? '' : 's'}.`);
  return 0;
}

if (path.basename(process.argv[1] ?? '') === 'validate-skills.ts') {
  process.exitCode = runValidation();
}

module.exports = {
  parseFrontmatter,
  runValidation,
  validateSkills,
};
