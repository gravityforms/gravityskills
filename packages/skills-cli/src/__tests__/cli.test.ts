import { describe, expect, test } from "bun:test";
import { run, usage } from "../index";
import { installSkill } from "../commands/install";

function captureConsole(method: "log" | "error", callback: () => Promise<number> | number): Promise<{ code: number; output: string[] }> {
  const original = console[method];
  const output: string[] = [];
  console[method] = (...args: unknown[]) => {
    output.push(args.map(String).join(" "));
  };

  return Promise.resolve(callback()).then((code) => {
    console[method] = original;
    return { code, output };
  }, (error) => {
    console[method] = original;
    throw error;
  });
}

describe("gravity-skills CLI", () => {
  test("--help output contains install and list", async () => {
    const { code, output } = await captureConsole("log", () => run(["--help"]));

    expect(code).toBe(0);
    expect(output.join("\n")).toContain("install");
    expect(output.join("\n")).toContain("list");
    expect(usage()).toContain("Usage");
  });

  test("--version outputs 0.0.1", async () => {
    const { code, output } = await captureConsole("log", () => run(["--version"]));

    expect(code).toBe(0);
    expect(output.join("\n").trim()).toBe("0.0.1");
  });

  test("install downloads and extracts a skill", async () => {
    const calls: string[] = [];
    const fakeFetch = async (url: string) => {
      calls.push(String(url));
      return new Response(new Uint8Array([80, 75, 3, 4]), { status: 200 });
    };

    const code = await installSkill(["example-skill", "--target", "/tmp/gravity-skills-test"], {
      fetchImpl: fakeFetch,
      unzip: (zipPath, targetDir) => {
        expect(zipPath).toContain("example-skill");
        expect(targetDir).toBe("/tmp/gravity-skills-test");
      },
      log: () => undefined,
    });

    expect(code).toBe(0);
    expect(calls).toEqual([
      "https://github.com/gravityforms/gravityskills/releases/latest/download/example-skill.zip",
    ]);
  });
});
