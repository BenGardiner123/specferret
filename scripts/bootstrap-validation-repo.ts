import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

type TemplateType = "spec-kit" | "bmad";

interface Args {
  type?: TemplateType;
  out?: string;
  force: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--force") {
      args.force = true;
      continue;
    }

    if (token === "--type") {
      const value = argv[i + 1] as TemplateType | undefined;
      if (value === "spec-kit" || value === "bmad") {
        args.type = value;
        i++;
        continue;
      }
      process.stderr.write(
        "Invalid value for --type. Use 'spec-kit' or 'bmad'.\n",
      );
      process.exit(1);
    }

    if (token === "--out") {
      const value = argv[i + 1];
      if (!value) {
        process.stderr.write("Missing value for --out.\n");
        process.exit(1);
      }
      args.out = value;
      i++;
      continue;
    }

    process.stderr.write(`Unknown argument: ${token}\n`);
    process.exit(1);
  }

  return args;
}

function printHelp(): void {
  process.stdout.write(
    [
      "Bootstrap a SpecFerret validation repository from built-in templates.",
      "",
      "Usage:",
      "  bun scripts/bootstrap-validation-repo.ts --type <spec-kit|bmad> --out <path> [--force]",
      "",
      "Examples:",
      "  bun scripts/bootstrap-validation-repo.ts --type spec-kit --out ../specferret-validation-spec-kit",
      "  bun scripts/bootstrap-validation-repo.ts --type bmad --out ../specferret-validation-bmad --force",
      "",
    ].join("\n"),
  );
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.type || !args.out) {
    printHelp();
    process.exit(1);
  }

  const templateDir = resolve(
    process.cwd(),
    "spec",
    "validation-repo-templates",
    args.type,
  );

  if (!existsSync(templateDir)) {
    process.stderr.write(`Template not found: ${templateDir}\n`);
    process.exit(1);
  }

  const outDir = resolve(process.cwd(), args.out);

  if (existsSync(outDir)) {
    if (!args.force) {
      process.stderr.write(
        `Output path already exists: ${outDir}\nUse --force to replace it.\n`,
      );
      process.exit(1);
    }
    rmSync(outDir, { recursive: true, force: true });
  }

  mkdirSync(outDir, { recursive: true });
  cpSync(templateDir, outDir, { recursive: true });

  process.stdout.write(
    `Bootstrapped ${args.type} validation repo at ${outDir}\n`,
  );
}

main();
