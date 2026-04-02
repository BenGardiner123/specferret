````markdown
# SpecFerret keeps your specs honest.

AI coding tools build fast. Specs drift faster.

## Runtime

SpecFerret targets Bun 1.0+ and ships as a CLI tool.
It uses Bun's built-in `bun:sqlite` backend for the local graph store, so there is no separate runtime shim or database setup.

## Install

```bash
bun install -g @specferret/cli
ferret init
ferret lint
```

`ferret init` installs a pre-commit hook by default (when `.git/hooks` exists).
Use `ferret init --no-hook` to opt out.

Requires Bun 1.0 or later. Install Bun at [bun.sh](https://bun.sh).

If you want the shortest end-to-end onboarding path, start with:

- [docs/QUICKSTART.md](docs/QUICKSTART.md)

That guide covers install, first clean lint, first blocked drift, first `ferret review`, and common failure recovery in one path.

## Your First Spec

After `ferret init`, open `contracts/example.contract.md` and replace it with your first real contract:

```markdown
---
ferret:
  id: api.GET/users
  type: api
  shape:
    type: array
    items:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
      required: [id, email]
---

# GET /users

Returns the list of registered users.
```

Run:

```bash
ferret lint
```

You should see:

```
✓ ferret  1 contracts  0 drift  12ms
```

Now change `required: [id, email]` to `required: [id]` and run lint again:

```bash
ferret lint
```

```
ferret  1 contracts need review
```

and guidance to run `ferret review`.

That's spec drift. SpecFerret caught it before your AI assistant, your teammates, or your users did.

Already using BMAD or spec-kit? Skip the example file. Pick a data shape from your PRD or architecture document, create a `.contract.md` file in `contracts/`, and run `ferret lint`. SpecFerret takes it from there.

`ferret scan` is still available for manual graph updates and debugging, but normal day-to-day flow should be lint-first.

## Resolving Drift

When `ferret lint` blocks, run:

```bash
ferret review
```

`ferret review` shows:

- the drifting contract id
- the source contract file
- direct and transitive downstream impact
- the available actions: accept, update, reject

Typical flow:

```bash
ferret lint
ferret review
ferret lint
```

If you want editor or agent tooling to consume the review context directly, use:

```bash
ferret review --json
```

That emits stable JSON to stdout with the current reviewable items, grouped impact, recommended action, and available options. Use `--contract <id>` or `--all` with `--action <accept|update|reject>` for non-interactive review steps.

## How It Works

SpecFerret watches your spec files. Each spec exports a contract — a typed JSON Schema shape defined in lightweight YAML frontmatter.

When a shape changes, SpecFerret classifies it: breaking or non-breaking. Breaking changes block your pre-commit hook. Non-breaking changes pass silently.

No LLM. No network call. No opinion. Just your specs, your contracts, and a fast deterministic check every time you commit.

## Contract Types

SpecFerret understands six kinds of contracts:

| Type     | Use for                                         |
| -------- | ----------------------------------------------- |
| `api`    | REST endpoints, GraphQL operations, RPC methods |
| `table`  | Database tables, collections, schemas           |
| `type`   | Shared TypeScript types, interfaces, enums      |
| `event`  | Domain events, webhooks, message queue payloads |
| `flow`   | User flows, multi-step processes                |
| `config` | Configuration shapes, feature flags             |

## CI Integration

```bash
ferret lint --ci
```

Outputs JSON, exits 1 on drift. Drop it in any pipeline.

CI baseline modes:

- Default: `--ci-baseline committed` (requires committed `.ferret/context.json`)
- Optional: `--ci-baseline rebuild` (rebuilds baseline state in CI)

Examples:

```bash
# Recommended when context.json is committed
ferret lint --ci

# Use in ephemeral CI runners if you do not commit context.json
ferret lint --ci --ci-baseline rebuild
```

S34 end-to-end smoke harness:

```bash
# Clean path: init -> lint -> break -> block -> review -> green
bun run smoke:s34

# Intentional failure seed: init -> lint -> break -> block
bun run smoke:s34:drift
```

```yaml
# GitHub Actions
- run: ferret lint --ci
```

## Badge

```markdown
[![SpecFerret](https://img.shields.io/badge/spec--drift-protected-green)](https://specferret.dev)
```

[![SpecFerret](https://img.shields.io/badge/spec--drift-protected-green)](https://specferret.dev)

## Working Alongside BMAD and spec-kit

SpecFerret is not a planning tool. It lives downstream of your planning workflow.

If you use BMAD, spec-kit, or any structured planning process, the integration is straightforward:

1. Your planning workflow produces a PRD, architecture doc, or stories
2. When that planning defines a concrete data shape — an API response, a table schema, a shared type — create a `.contract.md` file in `contracts/` with `ferret:` frontmatter
3. Run `ferret lint` to register and validate the contract
4. From that point, SpecFerret detects if the shape drifts

```
your-project/
  _bmad-output/          ← BMAD planning artifacts
    PRD.md
    architecture.md
  contracts/             ← SpecFerret guards this
    auth/
      jwt.contract.md
    tables/
      user.contract.md
  ferret.config.json
```

Planning tools define intent. SpecFerret enforces it.

### Code-First Extract (`ferret extract`)

For deterministic, non-LLM contract bootstrap from code, annotate TypeScript declarations:

```ts
// @ferret-contract: api.GET/users api
export interface GetUsersResponse {
  id: string;
  email: string;
}
```

Then run:

```bash
ferret extract
```

This scaffolds `.contract.md` files under `contracts/` using deterministic mapping and exits non-zero if any annotated symbol fails extraction.

### Agent Skills

To automate the bridge — having your AI agent read planning docs and scaffold the `.contract.md` files for you — copy the agent skill template for your tool:

| Tool           | Template                                                                                                 | Install location                           |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Claude Code    | [docs/agent-skills/ferret-extract.claude-command.md](docs/agent-skills/ferret-extract.claude-command.md) | `.claude/commands/ferret-extract.md`       |
| GitHub Copilot | [docs/agent-skills/ferret-extract.prompt.md](docs/agent-skills/ferret-extract.prompt.md)                 | `.github/prompts/ferret-extract.prompt.md` |

Once installed, invoke it (`/ferret-extract` in Claude Code, or via Copilot agent mode) and point it at your planning docs. It will create the contract files and run `ferret lint`.

## GA Validation Proof (spec-kit + BMAD)

SpecFerret GA is blocked unless validation passes in two external workflow repos:

1. A spec-kit validation repository
2. A BMAD validation repository

Validation policy and gates:

- `spec/GA-VALIDATION-REPOS.MD`

Execution runbook (copy-paste commands, CI sequence, evidence checklist):

- `spec/GA-VALIDATION-RUNBOOK.MD`

Template bootstrap:

```bash
bun run bootstrap:validation --type spec-kit --out ../specferret-validation-spec-kit
bun run bootstrap:validation --type bmad --out ../specferret-validation-bmad
```

Current candidate evidence (2026-04-03):

- spec-kit validation run (success): https://github.com/BenGardiner123/spec-ferret-validation-spec-kit/actions/runs/23926425357
- spec-kit commit SHA: `c6413cd1fa29e7a483c7a0ceaeded81f7e0771a2`
- BMAD validation run (success): https://github.com/BenGardiner123/specferret-validation-bmad/actions/runs/23926426128
- BMAD commit SHA: `b1039e0182188a9879d0ae596c88864c87833ae8`

Note on candidate install path:

- These validations ran before npm publication of `@specferret/cli`.
- CI used a pinned repo-local bundle (`vendor/ferret.bundle.js`) to run the exact tested candidate.
- After npm publication, switch validation workflows back to `bun install -g @specferret/cli@<candidate-version>`.

## Migration Notes (Pre-GA -> Current)

Behavior changes teams must adopt:

1. `ferret init` now installs a pre-commit hook by default (opt-out with `--no-hook`).
2. CI baseline behavior is now explicit:
  - default is `ferret lint --ci --ci-baseline committed` (requires committed `.ferret/context.json`)
  - alternative is `ferret lint --ci --ci-baseline rebuild` for ephemeral runners.

If your existing CI intermittently passed/fails around baseline state, migrate to one baseline strategy per repository and document it in your pipeline README.

## Documentation Map

Primary documentation index:

- `spec/DOCUMENTATION-INDEX.MD`
- `docs/QUICKSTART.md` (single onboarding path + troubleshooting)

Critical docs for release quality:

- `spec/ROADMAP.MD` (gates, blockers, execution sequence)
- `spec/GA-VALIDATION-REPOS.MD` (policy)
- `spec/GA-VALIDATION-RUNBOOK.MD` (execution)
- `spec/SPRINT-2-STORIES.MD` and `spec/SPRINT-3-STORIES.MD` (implementation backlog)

Documentation is part of done. Workflow changes are not complete until docs are updated in the same PR.

---

MIT License
````
