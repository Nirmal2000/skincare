# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript + React Native 0.81 (Expo SDK 54)  
**Primary Dependencies**: Expo Router, React Navigation, React Native Reanimated, Expo Haptics  
**Storage**: Local JSON/state only unless spec mandates backend  
**Testing**: Expo Test + component story/playground capture  
**Target Platform**: iOS 17+ via Expo managed workflow  
**Project Type**: Mobile (single Expo project)  
**Performance Goals**: 60 fps animations, <100 ms gesture latency  
**Constraints**: Avoid extra fallbacks/try-catch, Reanimated for motion, Expo-compatible deps  
**Scale/Scope**: Boutique skincare companion (single app, <20 screens)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Straightforward Surfaces** – Identify any defensive fallbacks or try/catch
   blocks; justify only when we can recover with a defined UX.
2. **Expo iOS Focus** – Confirm every dependency and native capability works in
   Expo managed workflow with iOS builds (sim/device + `expo prebuild`).
3. **Reanimated Motion** – List the screens/interactions that need animation and
   describe the Reanimated primitives/worklets that will power them.
4. **Deterministic State** – Document the single source of truth (hook, context,
   cache) for each story; note how data enters/leaves components without hidden
   globals.
5. **Design-System Fidelity** – Map the feature to tokens/assets from
   `.claude/skills/ui-designer`; capture any intentional deviations.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
