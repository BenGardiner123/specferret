# SPRINT-7-STORIES.MD

Engineering stories for SpecFerret Sprint 7 (upward code-to-spec drift detection).
Acceptance criteria map directly to deterministic tests and validation evidence.
This sprint targets G9 from ROADMAP.MD.

---

## Status: Planned

Goal: enforce bidirectional drift detection by catching implementation-code changes that invalidate declared contracts.
Gate target: G9.

---

### S50 — Code-Shape Baseline Snapshot

**As a** developer using annotated TypeScript,
**I want** deterministic code-shape snapshots,
**so that** code-origin drift can be measured reliably.

**Acceptance Criteria:**

- Snapshot model generated from annotated TypeScript symbols
- Snapshot hashing is deterministic for identical code input
- Canonical ordering rules documented and tested
- Unsupported symbols fail with actionable diagnostics

**Status:** Planned

---

### S51 — Upward Drift Classifier (Code -> Spec)

**As a** maintainer,
**I want** a classifier for code-to-spec mismatches,
**so that** contract drift is caught even when specs were not edited.

**Acceptance Criteria:**

- Diff engine compares code-derived shape with stored/declared contract shape
- Breaking and non-breaking classes are deterministic and documented
- Classifier reports contract ID, source symbol/file, and mismatch reason
- Known no-op formatting changes do not produce false positives

**Status:** Planned

---

### S52 — Lint and CI Integration for Upward Drift

**As a** CI owner,
**I want** upward drift included in `ferret lint` and `ferret lint --ci`,
**so that** code-origin contract breakage blocks merges deterministically.

**Acceptance Criteria:**

- `ferret lint` surfaces upward drift alongside existing drift diagnostics
- `ferret lint --ci` JSON includes explicit code-origin drift metadata
- Exit behavior remains deterministic and documented
- CI output includes impacted contracts and source locations

**Status:** Planned

---

### S53 — Review Flow Support for Upward Drift

**As a** reviewer,
**I want** guided resolution context for code-origin drift,
**so that** remediation is clear for humans and editor agents.

**Acceptance Criteria:**

- `ferret review` presents code-origin drift context in terminal output
- `ferret review --json` includes source symbol/file and recommended resolution actions
- Resolution options distinguish spec update vs code rollback intent
- Reconciliation log captures code-origin drift decision metadata

**Status:** Planned

---

### S54 — Validation Scenarios and Release Gate Evidence

**As a** release approver,
**I want** external validation evidence for upward drift coverage,
**so that** bidirectional enforcement is proven before candidate release.

**Acceptance Criteria:**

- Validation templates include at least one code-only drift scenario branch
- Matrix assertions verify upward drift detection and diagnostics
- Candidate release checklist requires green upward drift scenarios
- Evidence links are recorded in roadmap/runbook docs

**Status:** Planned

---

### Sprint Exit Criteria

1. Stories S50-S54 are implemented or explicitly deferred with approved rationale.
2. Upward drift can be reproduced deterministically from code-only changes.
3. Lint/CI/review flows expose code-origin drift in both human and machine outputs.
4. Validation repositories include upward drift scenario coverage.
5. Documentation updates land in the same PR set:

- `README.md`
- `spec/ROADMAP.MD`
- `spec/MASTER-STORIES.MD`
- `spec/GA-VALIDATION-REPOS.MD`
- `spec/GA-VALIDATION-RUNBOOK.MD`

---

_© Laser Unicorn — MIT License_
