import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach, afterEach } from "bun:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ferretBin = path.resolve(__dirname, "../ferret.ts");

function runFerret(cwd: string, args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [ferretBin, ...args], {
    cwd,
    encoding: "utf-8",
    timeout: 10_000,
  });
}

describe("ferret lint --ci baseline strategy — S27 acceptance criteria", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ferret-lint-ci-test-"));
    runFerret(tmpDir, ["init", "--no-hook"]);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("fails with clear diagnostic when committed baseline is missing", () => {
    const result = runFerret(tmpDir, ["lint", "--ci"]);

    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /CI baseline missing/);
    assert.match(result.stderr, /--ci-baseline rebuild/);
  });

  it("passes with --ci-baseline rebuild on a clean project", () => {
    const result = runFerret(tmpDir, ["lint", "--ci", "--ci-baseline", "rebuild"]);

    assert.equal(result.status, 0);
    const json = JSON.parse(result.stdout) as Record<string, unknown>;
    assert.equal(json.consistent, true);
  });

  it("passes with committed baseline when context.json exists", () => {
    runFerret(tmpDir, ["scan"]);

    const result = runFerret(tmpDir, ["lint", "--ci"]);

    assert.equal(result.status, 0);
    const json = JSON.parse(result.stdout) as Record<string, unknown>;
    assert.equal(json.consistent, true);
  });

  it("is deterministic across repeated CI runs in the same state", () => {
    runFerret(tmpDir, ["scan"]);

    const first = runFerret(tmpDir, ["lint", "--ci"]);
    const second = runFerret(tmpDir, ["lint", "--ci"]);

    assert.equal(first.status, second.status);

    const firstJson = JSON.parse(first.stdout) as Record<string, unknown>;
    const secondJson = JSON.parse(second.stdout) as Record<string, unknown>;

    assert.equal(firstJson.consistent, secondJson.consistent);
    assert.equal(firstJson.breaking, secondJson.breaking);
    assert.equal(firstJson.nonBreaking, secondJson.nonBreaking);
    assert.equal(JSON.stringify(firstJson.flagged), JSON.stringify(secondJson.flagged));
  });

  it("fails fast on invalid --ci-baseline value", () => {
    const result = runFerret(tmpDir, [
      "lint",
      "--ci",
      "--ci-baseline",
      "unsupported",
    ]);

    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /invalid --ci-baseline/);
  });
});
