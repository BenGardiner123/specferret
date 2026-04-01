import { spawn } from "node:child_process";

const experimentalWarningFlag = "--disable-warning=ExperimentalWarning";
const existingNodeOptions = process.env.NODE_OPTIONS?.trim();
const nodeOptions = existingNodeOptions
  ? `${existingNodeOptions} ${experimentalWarningFlag}`
  : experimentalWarningFlag;

const child = spawn(
  process.execPath,
  ["./node_modules/vitest/vitest.mjs", "run", ...process.argv.slice(2)],
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
