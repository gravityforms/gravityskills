{
const { execFileSync } = require('node:child_process');
const { mkdirSync, readdirSync, rmSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const repoRoot = process.cwd();
const skillsDir = join(repoRoot, 'skills');
const outputDir = join(repoRoot, 'dist', 'skills');

const excludedNames = new Set(['node_modules', '.git', '.DS_Store', '.env', '__pycache__']);

function getSkillDirectories(): string[] {
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function shouldExclude(path: string): boolean {
  const parts = path.split('/');
  const name = parts[parts.length - 1] ?? '';

  return parts.some((part) => excludedNames.has(part)) || name.endsWith('.tgz');
}

function getIncludedFiles(skillName: string): string[] {
  const skillDir = join(skillsDir, skillName);
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      const archivePath = relative(skillsDir, absolutePath).split('/').join('/');

      if (shouldExclude(archivePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile()) {
        files.push(archivePath);
      }
    }
  }

  walk(skillDir);

  return files.sort();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function packSkills(): void {
  mkdirSync(outputDir, { recursive: true });

  const skills = getSkillDirectories();

  for (const skillName of skills) {
    const zipPath = join(outputDir, `${skillName}.zip`);
    const includedFiles = getIncludedFiles(skillName);

    rmSync(zipPath, { force: true });

    if (includedFiles.length === 0) {
      throw new Error(`No files found to package for ${skillName}`);
    }

    execFileSync('zip', ['-q', '-r', zipPath, ...includedFiles], {
      cwd: skillsDir,
      stdio: 'pipe',
    });

    const size = statSync(zipPath).size;
    console.log(`Created ${relative(repoRoot, zipPath)} (${formatBytes(size)})`);
  }
}

try {
  packSkills();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to pack skills: ${message}`);
  process.exitCode = 1;
}
}
