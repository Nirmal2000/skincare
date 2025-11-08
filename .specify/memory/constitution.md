<!--
Sync Impact Report
Version change: v1.0.0 -> v1.1.0
Modified principles: IV. Expo-Managed Stack Only -> IV. Expo-Managed Stack Only; V. Owner-Installed Dependencies (new); V. Deterministic UX -> VI. Deterministic UX
Added sections: (none)
Removed sections: none
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-ups: none
-->

# Skincare App Constitution

## Core Principles

### I. Ship the Simplest Screen
Every feature must land as a focused Expo Router screen or component with only the state it
consumes. Avoid abstractions, optional fallbacks, or speculative hooks. Prefer a plain
function component with tight props, typed data, and zero hidden branches.

### II. User Story or No Story
Work only starts from a prioritized user story in `spec.md` with an independent acceptance
path. No story means no feature, no refactor, and no research branch. User journeys are the
sole measure of done-ness.

### III. One Source of State
Each flow declares one state owner (local component state, React Context, or a data module).
Derived values are computed on the fly, not cached in parallel structures. Networking,
caching, and persistence modules must expose a single contract per entity.

### IV. Expo-Managed Stack Only
Stay inside the Expo managed workflow, React 19, and the dependencies already declared in
`package.json`. Introduce new libraries only when they are Expo-safe, well-supported, and
replace clear, repeated pain.

### V. Owner-Installed Dependencies
Do not run package managers or edit `package.json`/`package-lock.json`. When a new dependency
is truly required, document the exact package names and reasons so the repository owner can
install them manually and capture the latest versions.

### VI. Deterministic UX
All interactions must either succeed normally or surface a clear, user-facing message in the
current view. No silent retries, blanket `try/catch`, or hidden error fallbacks. Behaviors
must be predictable across iOS, Android, and web builds.

## Technical Constraints & Stack Mandates

- Language: TypeScript across app code, scripts, and configs.
- Platform: Expo Router with file-based navigation; no ejecting.
- Styling: Use React Native style objects or Expo-compatible styling libs already in the repo.
- Data: Prefer static mock data modules for early flows; remote data integrations require
  contract docs before implementation.
- Tooling: ESLint via `eslint.config.js` must pass; no additional build tooling without owner
  approval. Never modify dependency manifests; instead, list required packages in the plan or
  PR comment for the owner to install.

## Delivery Workflow

1. Specs define user stories, priorities, and acceptance flows. They must be actionable and
   independently testable.
2. Plans capture technical context, guardrails, and structure decisions before any coding.
3. Tasks stay tightly scoped to individual files or modules so parallel work does not clash.
4. Implementations avoid extra fallback logic, unused helpers, or defensive code that has not
   been requested.
5. When a dependency gap is discovered, stop and note the package names plus justification for
   the owner; do not attempt local installation.
6. Manual validation replaces automated test cases unless a spec explicitly demands tests.

## Governance

- This constitution overrides conflicting docs within the repo.
- Amendments require agreement from the project owner plus documentation of rationale in the
  PR description.
- Versioning follows semantic rules: MAJOR for principle changes/removals, MINOR for added
  principles or workflow sections, PATCH for clarifications.
- `plan.md`, `spec.md`, `tasks.md`, and related templates must reflect every amendment before
  the version bump is considered complete.
- Compliance is reviewed at every plan and spec checkpoint; violations block feature kickoff
  until resolved or explicitly waived in writing.

**Version**: 1.1.0 | **Ratified**: 2025-11-08 | **Last Amended**: 2025-11-08
