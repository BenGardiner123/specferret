# SPRINT-6-STORIES.MD

Engineering stories for SpecFerret Sprint 6 (GitHub Action adoption distribution).
Acceptance criteria map directly to implementation tests and workflow evidence.
This sprint targets G8 from ROADMAP.MD.

---

## Status: Planned

Goal: make CI adoption one-line and deterministic through a reusable GitHub Action.
Gate target: G8.

---

### S46 — Reusable GitHub Action (`specferret/action@v1`)

**As a** repository maintainer,
**I want** a reusable GitHub Action for `ferret lint --ci`,
**so that** I can adopt SpecFerret in CI without custom shell orchestration.

**Acceptance Criteria:**

- Public action published and versioned (`v1` tag)
- Action runs `ferret lint --ci` with deterministic baseline behavior
- Action supports baseline strategy inputs (`committed` / `rebuild`)
- Action exits non-zero on drift exactly as CLI does
- Action docs include minimal copy-paste workflow

**Status:** Planned

---

### S47 — Action Outputs and Workflow UX

**As a** reviewer,
**I want** Action runs to produce clear summary and machine output,
**so that** I can triage drift quickly in PRs and automation.

**Acceptance Criteria:**

- Action emits stable output fields for `consistent`, `breaking`, `nonBreaking`, and flagged contracts
- Workflow summary includes compact drift diagnostics and artifact links
- JSON artifact is preserved for every run
- Output contract is documented for tooling/agent consumption

**Status:** Planned

---

### S48 — Starter Workflow Templates

**As a** new adopter,
**I want** starter templates for common repo layouts,
**so that** I can enable enforcement quickly with low setup risk.

**Acceptance Criteria:**

- Templates exist for at least: single package repo, monorepo workspace, and PR-only lint mode
- Templates include baseline strategy guidance and troubleshooting notes
- Templates are validated by test repositories or fixture workflows
- Docs include exact copy-paste examples

**Status:** Planned

---

### S49 — Action Versioning and Support Policy

**As a** maintainer,
**I want** explicit Action versioning and compatibility policy,
**so that** adopters can upgrade safely without surprise breakage.

**Acceptance Criteria:**

- `v1` maintenance policy documented (non-breaking updates only)
- Breaking changes require new major tag and migration notes
- Release checklist includes Action smoke validation before publish
- Action docs state supported runtimes and deprecation policy

**Status:** Planned

---

### Sprint Exit Criteria

1. Stories S46-S49 are implemented or explicitly deferred with approved rationale.
2. `uses: specferret/action@v1` works in a fresh repository without custom shell scripts.
3. Action outputs are stable and documented for human and machine consumers.
4. Starter templates are validated and linked from README/docs.
5. Documentation updates land in the same PR set:

- `README.md`
- `spec/ROADMAP.MD`
- `spec/DOCUMENTATION-INDEX.MD`
- `spec/MASTER-STORIES.MD`

---

_© Laser Unicorn — MIT License_
