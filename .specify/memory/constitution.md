<!--
Sync Impact Report
Version: 0.0.0 → 1.0.0
Modified Principles:
- None (initial draft)
Added Sections:
- Technology Stack Guardrails
- Development Workflow & Quality Gates
Removed Sections:
- None
Templates Updated:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Deferred TODOs:
- None
-->

# Skincare Companion Constitution

## Core Principles

### I. Straightforward Surfaces Only
Every component must express the simplest logic that can satisfy the
requirement. Avoid defensive fallbacks, redundant branches, and speculative
try/catch blocks—handle only the errors we can meaningfully recover from and
let Expo tooling surface everything else. Straightforward code keeps the UI
predictable for iOS users and limits regressions.

### II. Expo iOS Native Focus
All work targets the Expo-managed workflow and must prove clean operation on
iOS simulators/devices before considering any other platform. New libraries or
native modules are added only if Expo SDK 54 cannot satisfy the requirement.
Any configuration change must preserve `expo prebuild` parity and fast EAS
builds.

### III. Reanimated-Driven Motion
Animations, gestures, and transitions are powered by React Native Reanimated
worklets to guarantee 60 fps rendering. When motion is required, prefer shared
values, layout animations, and gesture-handler primitives over imperative
timers. If a design cannot be met with Reanimated, escalate instead of falling
back to React Native defaults.

### IV. Deterministic Data & State
Screen state flows from a single source of truth (React context, Zustand, or
server cache) with explicit typing. Avoid hidden globals, underspecified prop
drilling, and implicit date/unit conversions. All network or storage access is
wrapped in typed hooks that return resolved states without extra fallbacks.

### V. Design-System Fidelity
UI work references the design system assets in `.claude/skills/ui-designer` and
shared images in `assets/`. Color, spacing, typography, and iconography must
match tokens defined there, with reusable primitives (buttons, cards, loaders)
living under `components/`. Differences from the provided vibes require a
recorded rationale.

## Technology Stack Guardrails

- React Native 0.81 with Expo Router drives navigation; no custom CLI or bare
  workflow unless constitution amended.
- Animations rely on `react-native-reanimated` and gesture primitives; do not
  import alternative animation libraries.
- Component styling stays within StyleSheet, Tailwind-in-JS equivalents are not
  allowed; maintain light/dark adaptability via tokens.
- Dependencies outside `package.json` require proof that an existing Expo or
  React Native API cannot deliver the need.
- All assets are managed through the Expo asset pipeline; remote URLs need a
  fallback asset committed locally for offline dev parity.

## Development Workflow & Quality Gates

- Work begins by deriving user stories, success metrics, and task plans that
  reference these principles explicitly.
- Each feature branch must include a lightweight playground screen or Storybook
  entry showing Reanimated interactions before merging to main.
- Code review checklists confirm: (1) no unused fallbacks/try-catch blocks, (2)
  Expo iOS build passes locally, and (3) tokens from the design system are
  referenced where applicable.
- QA builds are produced via EAS for iOS with release-channel notes summarizing
  design parity and animation scope.

## Governance

- This constitution supersedes ad-hoc preferences. Amendments require a pull
  request that cites impacted principles, demonstrates Expo iOS build success,
  and links updated templates.
- Semantic versioning applies: breaking regimen changes bump MAJOR, added
  guidance bumps MINOR, clarifications bump PATCH.
- Compliance is reviewed at each `/speckit.plan`, `/speckit.spec`, and
  `/speckit.tasks` checkpoint. Violations must be captured in the Complexity
  Tracking table with justification.

**Version**: 1.0.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-18
