import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const experimentalWarningFlag = "--disable-warning=ExperimentalWarning";
const existingNodeOptions = process.env.NODE_OPTIONS?.trim();
const nodeOptions = existingNodeOptions
  ? `${existingNodeOptions} ${experimentalWarningFlag}`
  : experimentalWarningFlag;

// Vitest is hoisted to workspace root by npm workspaces — resolve from there
const __dirname = dirname(fileURLToPath(import.meta.url));
const vitestMjs = resolve(__dirname, "../../../node_modules/vitest/vitest.mjs");

const child = spawn(
  process.execPath,
  [vitestMjs, "run", ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
    },
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
