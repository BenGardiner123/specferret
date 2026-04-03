# SPRINT-2-STORIES.MD

Engineering stories for SpecFerret Sprint 2.5 (GA blockers tranche 1).
Acceptance criteria map directly to implementation tests.
This sprint targets G1-G3 from ROADMAP.MD.

---

## Status: ✓ Complete

Goal: remove manual setup friction and make enforcement deterministic.
Gate target: G1, G2, G3.

---

### S25 — Default Commit Enforcement

**As a** developer initializing SpecFerret,
**I want** commit enforcement installed by default,
**so that** drift protection works immediately without extra setup.

**Acceptance Criteria:**

- `ferret init` installs commit hook by default in git repositories
- `ferret init --no-hook` explicitly disables hook installation
- Existing hook files are not silently overwritten
- If `.git/hooks` is unavailable, init prints a clear warning and continues
- Hook installation behavior is deterministic in non-interactive shells (CI/devcontainers)
- Init remains idempotent across repeated runs

**Implementation Notes:**

- Keep current hook payload (`ferret lint --changed` or equivalent) as the default enforcement command
- Preserve opt-out capability for teams with custom hook stacks
- Print a concise post-init line showing hook status: installed, skipped, or unavailable

**Test Plan:**

- Unit: init command hook decision logic
- Integration: fresh repo init installs hook and blocks breaking commit
- Regression: `--no-hook` path leaves hook untouched

**Candidate Test Files:**

- `packages/cli/bin/commands/init.test.ts`
- `packages/cli/bin/commands/init.hook.test.ts` (new)

**Status:** ✓ Complete
**Implemented Tests:** `packages/cli/bin/commands/init.hook.test.ts`

---

### S26 — Lint-First UX (Scan as Advanced)

**As a** developer using SpecFerret daily,
**I want** one primary command (`ferret lint`),
**so that** I do not need to remember manual scan loops.

**Acceptance Criteria:**

- README and CLI examples use `ferret lint` as the default daily workflow
- `ferret scan` remains supported but documented as advanced/manual
- `ferret --help` and command descriptions are consistent with lint-first messaging
- BMAD/spec-kit integration docs reference lint-first enforcement
- No public docs instruct "run scan after each change" as the normal path

**Implementation Notes:**

- Keep `scan` for debugging, graph introspection, and advanced troubleshooting
- Ensure lint output remains concise and fast for day-to-day use

**Test Plan:**

- Doc consistency check (manual review checklist)
- CLI help snapshot tests (if available)

**Candidate Files:**

- `README.md`
- `packages/cli/bin/ferret.ts`
- `packages/cli/bin/commands/lint.ts`

**Status:** ✓ Complete
**Implemented Files:**

- `README.md`
- `packages/cli/bin/commands/lint.ts`
- `packages/cli/bin/commands/scan.ts`
- `packages/cli/bin/commands/init.ts`
- `spec/SPEC-CONVENTIONS.MD`

---

### S27 — Deterministic CI Baseline Strategy

**As a** CI pipeline owner,
**I want** `ferret lint --ci` to be deterministic on clean runners,
**so that** drift detection never false-passes due to missing local state.

**Acceptance Criteria:**

- CI baseline strategy is explicit and implemented:
  - Option A: committed `.ferret/context.json`, or
  - Option B: deterministic baseline rebuild mode in CI
- `ferret lint --ci` behavior is consistent across two clean runners on same commit
- Missing baseline state produces a clear diagnostic (not a silent pass)
- CI documentation provides copy-paste setup for GitHub Actions

**Implementation Notes:**

- Prefer fail-loud behavior when baseline requirements are unmet
- Keep JSON output contract stable (`version`, `consistent`, `breaking`, `nonBreaking`, `flagged`, `timestamp`)

**Test Plan:**

- Integration: CI-mode lint with baseline present
- Integration: CI-mode lint with baseline missing -> explicit failure/warning behavior
- Snapshot: JSON output stability

**Candidate Test Files:**

- `packages/cli/bin/commands/lint.test.ts`
- `packages/cli/bin/commands/lint.ci.test.ts` (new)

**Status:** ✓ Complete
**Implemented Files:**

- `packages/cli/bin/commands/lint.ts`
- `packages/cli/bin/commands/lint.test.ts`
- `packages/cli/bin/commands/lint.ci.test.ts`
- `README.md`

---

### Sprint Exit Criteria

1. S25-S27 acceptance criteria all pass.
2. Manual dry run from clean repo confirms:
   - `ferret init` installs enforcement by default
   - breaking change is blocked on first commit
   - CI catches same drift deterministically
3. `bun test` green.
4. Documentation updated in same PR set:

- `README.md`
- `spec/ROADMAP.MD`
- `spec/DOCUMENTATION-INDEX.MD`

---

_© Laser Unicorn — MIT License_
