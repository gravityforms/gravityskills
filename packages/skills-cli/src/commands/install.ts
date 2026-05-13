import { execSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

export interface InstallOptions {
  fetchImpl?: (input: string) => Promise<Response>;
  unzip?: (zipPath: string, targetDir: string) => void;
  log?: (message: string) => void;
}

interface ParsedInstallArgs {
  skillName: string;
  targetDir: string;
}

function parseInstallArgs(args: string[]): ParsedInstallArgs | null {
  const [skillName, ...rest] = args;

  if (!skillName || skillName === "--help" || skillName === "-h") {
    return null;
  }

  let targetDir = process.cwd();

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--target") {
      const value = rest[index + 1];
      if (!value) {
        throw new Error("Missing value for --target");
      }
      targetDir = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown install option: ${arg}`);
  }

  return { skillName, targetDir: resolve(targetDir) };
}

function installUsage(): string {
  return "Usage: gravity-skills install <skill> [--target <dir>]";
}

function assertSkillName(skillName: string): void {
  if (!/^[a-zA-Z0-9._-]+$/.test(skillName) || basename(skillName) !== skillName) {
    throw new Error("Skill name may only contain letters, numbers, dots, underscores, and hyphens");
  }
}

function defaultUnzip(zipPath: string, targetDir: string): void {
  execSync(`unzip -oq ${JSON.stringify(zipPath)} -d ${JSON.stringify(targetDir)}`, {
    stdio: "inherit",
  });
}

export async function installSkill(args: string[], options: InstallOptions = {}): Promise<number> {
  const parsed = parseInstallArgs(args);
  const log = options.log ?? console.log;

  if (!parsed) {
    console.log(installUsage());
    return 0;
  }

  const { skillName, targetDir } = parsed;
  assertSkillName(skillName);

  const fetchImpl = options.fetchImpl ?? fetch;
  const unzip = options.unzip ?? defaultUnzip;
  const downloadUrl = `https://github.com/gravityforms/gravityskills/releases/latest/download/${skillName}.zip`;
  const zipPath = join(tmpdir(), `gravity-skills-${skillName}-${Date.now()}.zip`);

  log(`Downloading ${skillName} from ${downloadUrl}`);

  const response = await fetchImpl(downloadUrl);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}: ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(zipPath, bytes);

  try {
    await mkdir(targetDir, { recursive: true });
    log(`Extracting ${skillName} to ${targetDir}`);
    unzip(zipPath, targetDir);
    log(`Installed ${skillName}`);
  } finally {
    await rm(zipPath, { force: true });
  }

  return 0;
}
