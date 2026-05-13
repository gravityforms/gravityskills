#!/usr/bin/env node

import { installSkill } from "./commands/install.js";
import { listSkills } from "./commands/list.js";

const VERSION = "0.0.1";

export function usage(): string {
  return `Usage: gravity-skills <command> [options]

Commands:
  install <skill> [--target <dir>]  Download and install a skill from GitHub Releases
  list                            Show where to find available skills

Options:
  -h, --help     Show this help message
  -v, --version  Print the CLI version
`;
}

export async function run(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command, ...args] = argv;

  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log(VERSION);
    return 0;
  }

  if (command === "install") {
    return installSkill(args);
  }

  if (command === "list") {
    return listSkills();
  }

  console.error(`Unknown command: ${command}`);
  console.error(usage());
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
