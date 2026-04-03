# SPRINT-5-STORIES.MD

Engineering stories for SpecFerret Sprint 5 (branch-matrix dogfooding coverage expansion).
Acceptance criteria map directly to reproducible validation evidence.
This sprint extends G7 from single-flow proof to scenario-matrix proof.

---

## Status: Planned

Goal: use existing external validation repos (spec-kit + BMAD) to prove SpecFerret behavior across all key drift situations and one opinionated SpecFerret workflow model.
Gate target: G7 hardening.

---

### S38 — Canonical Scenario Branch Taxonomy

**As a** release maintainer,
**I want** both validation repositories to use the same scenario branch taxonomy,
**so that** matrix execution and evidence review are deterministic.

**Acceptance Criteria:**

- Both validation repos include identical required branch names
- Required branch set is documented in GA validation docs
- Each branch includes a short scenario manifest describing intent and expected outcomes
- Scenario branch naming policy is stable and reused for future candidates

**Required Branch Families:**

- `main`
- `scenario/breaking-required-field`
- `scenario/breaking-type-change`
- `scenario/nonbreaking-optional-add`
- `scenario/transitive-impact-depth`
- `scenario/review-resolution-flow`
- `scenario/code-first-extract`
- `scenario/specferret-opinionated-layout`

**Status:** Planned

---

### S39 — Deterministic Branch Assertion Matrix

**As a** CI owner,
**I want** each scenario branch to declare deterministic expected outcomes,
**so that** branch regressions fail fast and cannot be waived by interpretation.

**Acceptance Criteria:**

- Each required branch has expected `ferret lint --ci` behavior documented
- Expected outcomes include: exit code, drift class, and whether review is required
- CI fails when observed output diverges from expected branch contract
- Assertion matrix is identical between spec-kit and BMAD repos

**Status:** Planned

---

### S40 — Transitive Impact Depth Validation

**As a** developer relying on downstream impact reporting,
**I want** dedicated scenarios for transitive dependency depth,
**so that** impact trees remain accurate under multi-hop imports.

**Acceptance Criteria:**

- Scenario branch seeds drift in an upstream contract consumed transitively
- Output includes direct and transitive downstream references
- Depth in diagnostics is asserted (for example depth 2+ appears when expected)
- Matrix evidence includes logs proving depth-aware reporting

**Status:** Planned

---

### S41 — Guided Resolution Branch Flow

**As a** reviewer blocked by drift,
**I want** scenario coverage for `accept`, `update`, and `reject` decisions,
**so that** review workflows stay stable for both humans and editor agents.

**Acceptance Criteria:**

- Scenario branch verifies drift block is produced before review actions
- `accept` clears reviewed drift event as expected
- `update` preserves block and emits downstream update context
- `reject` preserves block and records intent without false green state
- Evidence includes before/after command output and JSON where applicable

**Status:** Planned

---

### S42 — Code-First Extraction Determinism Scenario

**As a** team bootstrapping from TypeScript,
**I want** extraction determinism covered in external validation repos,
**so that** generated contract files stay stable across repeated runs.

**Acceptance Criteria:**

- Scenario branch includes annotated TypeScript fixtures
- Running `ferret extract` twice on the same commit yields byte-identical output
- Extracted contract IDs, paths, and normalized schema order remain stable
- Non-deterministic output is treated as release-blocking regression

**Status:** Planned

---

### S43 — Opinionated SpecFerret Workflow Scenario Set

**As a** product owner,
**I want** one opinionated scenario branch family,
**so that** recommended default usage is validated continuously, not just documented.

**Acceptance Criteria:**

- Opinionated branch verifies lint-first daily flow (`ferret lint` primary)
- Branch verifies baseline strategy expectations for CI
- Branch verifies enforcement defaults and opt-out behavior
- Scenario docs explicitly state this is a recommended posture, not a hard requirement for all teams

**Status:** Planned

---

### S44 — Branch-Matrix Policy and Runbook Hardening

**As a** maintainer,
**I want** validation policy and runbook docs aligned to branch-matrix execution,
**so that** candidate validation is reproducible by any maintainer without tribal knowledge.

**Acceptance Criteria:**

- `GA-VALIDATION-REPOS.MD` defines required branches and expected outcomes
- `GA-VALIDATION-RUNBOOK.MD` defines matrix execution order and triage flow
- Evidence template includes branch, commit SHA, candidate version, and artifact links
- Historical baseline evidence remains preserved and clearly labeled

**Status:** Planned

---

### S45 — Candidate Release Gate Upgrade

**As a** release approver,
**I want** Sprint 5 matrix-green evidence required for candidate sign-off,
**so that** release confidence is based on broad scenario proof, not one happy-path flow.

**Acceptance Criteria:**

- Release checklist requires all mandatory scenario branches green in both validation repos
- Candidate tag is blocked if any required branch fails in either repo
- Release notes include matrix evidence links and candidate version provenance
- Gate wording is reflected in `spec/ROADMAP.MD`

**Status:** Planned

---

### Sprint Exit Criteria

1. Stories S38-S45 are implemented or explicitly deferred with approved rationale.
2. Both validation repos expose the same mandatory scenario branch set.
3. Branch assertion matrix is consistent across both repos.
4. Candidate gate reflects matrix-green requirement for both repos.
5. Documentation updates land in the same PR set:

- `spec/ROADMAP.MD`
- `spec/GA-VALIDATION-REPOS.MD`
- `spec/GA-VALIDATION-RUNBOOK.MD`
- `spec/DOCUMENTATION-INDEX.MD`
- `spec/MASTER-STORIES.MD`

---

_© Laser Unicorn — MIT License_
