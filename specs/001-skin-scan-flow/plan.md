# Implementation Plan: Skin Scan Flow

**Branch**: `001-skin-scan-flow` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-skin-scan-flow/spec.md`

## Summary

Build a complete skincare mobile app with 5-question onboarding, face-scanning camera with real-time ML detection, scan history, results visualization, and settings - all powered by Expo Router, Supabase auth (Google/Apple OAuth), and Reanimated animations. The scan flow captures selfies with face-detection validation, submits to a backend API (EXPO_PUBLIC_FACE_API_BASE_URL), and displays personalized skin analysis results.

## Technical Context

**Language/Version**: TypeScript + React Native 0.81 (Expo SDK 54)
**Primary Dependencies**:
- Expo Router (file-based navigation)
- React Native Reanimated v4 (animations & gestures)
- Supabase JS Client (auth with Google/Apple OAuth)
- react-native-face-detector-camera (MLKit face detection)
- Expo Camera, Haptics, AsyncStorage
- @react-native-async-storage/async-storage

**Storage**:
- AsyncStorage for onboarding answers, scan runs, settings
- Supabase auth session persistence via AsyncStorage
- Local photo URIs from camera capture

**Backend Integration**:
- Face analysis API at EXPO_PUBLIC_FACE_API_BASE_URL
  - POST /start-task: Upload image, returns task_id
  - GET /tasks/{task_id}: Poll for analysis status/results
  - POST /recommend: Generate routine from completed analysis
  - GET /tasks: List user's recent analyses
- Supabase project (URL/anonKey in app.json extra config)
  - Bearer token authentication for all API calls
- OAuth redirect scheme: `facefit://auth`

**Testing**: Expo Test + manual iOS simulator validation
**Target Platform**: iOS 17+ via Expo managed workflow (Android secondary)
**Project Type**: Mobile (single Expo project with Expo Router)
**Performance Goals**:
- 60 fps Reanimated transitions
- Face detection at 200ms intervals minimum
- Scan-to-result under 5 seconds (mocked)
- Tab navigation <100ms latency

**Constraints**:
- No custom native modules outside Expo SDK
- All animations via Reanimated (no Animated API)
- Face must be centered for capture button activation
- Straightforward error handling (no defensive try/catch)

**Scale/Scope**: Single-user skincare companion (<20 screens, ~10 routes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 1. Straightforward Surfaces Only

**Compliance**: ✅ PASS

- Camera permissions: Request once, surface OS prompt; if denied → show settings deep-link screen (no retry loops)
- Face detection: Enable capture button only when face detected + centered; no fallback manual capture
- Auth: OAuth redirects handled by Supabase SDK; session errors → sign-in screen (no silent refresh retries)
- Backend API: Single POST to face analysis endpoint; network errors surface error screen with retry CTA (no background queues)
- No speculative try/catch blocks; errors bubble to error boundaries

**Justification for error handling**:
- Network requests to face API require try/catch to distinguish network vs. server errors (401/403/404/500 codes)
- Camera/face-detector errors handled by library callbacks (`onMountError`, `onFacesDetected`)
- Polling timeout after 5 minutes requires interval cleanup (prevent memory leaks)

### 2. Expo iOS Native Focus

**Compliance**: ✅ PASS

All dependencies are Expo-compatible:
- `react-native-face-detector-camera`: Expo module with config plugin (already in app.json)
- Supabase auth: Pure JS (no native modules)
- Expo Camera, AsyncStorage, WebBrowser: First-party Expo modules
- All features testable on iOS simulator via `npx expo run:ios`

### 3. Reanimated-Driven Motion

**Compliance**: ✅ PASS

Reanimated v4 worklets for:
- **Onboarding carousel**: `useSharedValue` + `useAnimatedStyle` for slide transitions, progress bar width
- **Tab bar**: Active tab indicator sliding animation via `withTiming`
- **Scan button**: Scale/opacity pulse when face detected via `withRepeat` + `withSequence`
- **Face detection overlay**: Animated border color (red→green) when centered via `interpolateColor`
- **Result loading**: Skeleton shimmer effect via `useAnimatedStyle` + linear gradient transform
- **History list**: Layout animation on mount via `Layout.springify()`

No `Animated` API or `setTimeout` for UI transitions.

### 4. Deterministic Data & State

**Compliance**: ✅ PASS

**State Architecture**:
- **Auth**: Zustand store (`useAuthStore`) synced with Supabase session (single source)
- **Onboarding**: Zustand store (`useOnboardingStore`) persisted to AsyncStorage
- **Scan runs**: Zustand store (`useScanStore`) with async actions for CRUD
- **Settings**: Zustand store (`useSettingsStore`)

**Data Flow**:
1. Auth session → `useAuthStore` → guards via `useAuthGate` hook
2. Onboarding answers → `useOnboardingStore` → loaded at app root
3. Camera capture → local URI → `useScanStore.createRun()` → backend POST → update run status
4. History list → `useScanStore.runs` sorted by timestamp (no derived globals)

**Typed contracts**:
- All API responses typed via `types/api.ts`
- Store schemas via Zod validation
- No prop drilling beyond 2 levels (use context or store)

### 5. Design-System Fidelity

**Compliance**: ⚠️ NEEDS CLARIFICATION

- No design system assets found in `.claude/skills/ui-designer` (directory does not exist yet)
- Will define color tokens, spacing scale, typography in `constants/Tokens.ts`
- Reusable components in `components/` (Button, Card, LoadingSpinner, etc.)

**Deviation**: Creating tokens from scratch since no reference design provided. Will use iOS HIG-inspired spacing (4px base grid) and SF Pro-style typography.

## Project Structure

### Documentation (this feature)

```text
specs/001-skin-scan-flow/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (resolves NEEDS CLARIFICATION)
├── data-model.md        # Phase 1 output (entities + stores)
├── quickstart.md        # Phase 1 output (dev setup instructions)
├── contracts/           # Phase 1 output (API schemas)
│   └── face-analysis-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/                     # Expo Router file-based routes
├── _layout.tsx          # Root layout with auth gate + session provider
├── (auth)/              # Auth flow group
│   ├── signin.tsx       # Sign-in screen with Google/Apple buttons
│   └── oauth-redirect.tsx
├── (onboarding)/        # Onboarding flow group
│   ├── _layout.tsx
│   ├── welcome.tsx      # 5-step questionnaire
│   └── components/
├── (tabs)/              # Main app tabs group
│   ├── _layout.tsx      # Bottom tab navigator
│   ├── index.tsx        # Home screen (scan CTA)
│   ├── scan.tsx         # Camera + face detection
│   ├── history.tsx      # Scan history list
│   ├── track.tsx        # Longitudinal metrics
│   └── settings.tsx     # User profile + actions
└── (results)/
    └── [runId].tsx      # Result detail screen

components/              # Reusable UI primitives
├── Button.tsx
├── Card.tsx
├── LoadingSpinner.tsx
├── FaceDetectionOverlay.tsx
└── TabBarIcon.tsx

features/                # Feature-specific logic
├── auth/
│   ├── supabase-client.ts
│   ├── useAuthGate.ts
│   └── stores/auth-store.ts
├── onboarding/
│   ├── stores/onboarding-store.ts
│   └── questions.ts
├── scans/
│   ├── stores/scan-store.ts
│   ├── face-analysis-api.ts
│   └── types.ts
└── settings/
    └── stores/settings-store.ts

constants/
├── Tokens.ts            # Colors, spacing, typography
└── Config.ts            # Env var access

hooks/                   # Shared custom hooks
├── useCamera.ts
└── useFaceDetection.ts

assets/
└── images/
    └── face-reference.png

types/
├── api.ts               # Backend response types
└── navigation.ts        # Expo Router typed routes
```

**Structure Decision**: Single Expo project with feature-based organization. Routes live in `app/` via Expo Router file-based convention. Shared logic extracted to `features/` modules and `components/` primitives. Zustand stores colocated with feature domains for testability.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Try/catch around fetch | Distinguish network errors from API errors (401/403/404/500) to show correct user message | Letting errors bubble would show generic crash screen instead of actionable "Check connection" vs "Unauthorized" |
| AsyncStorage persistence layer | Onboarding answers + scan history must survive app restarts | Zustand alone loses state on unmount; spec requires resume capability |
| Polling interval/timeout logic | Backend uses async multi-pass LLM workflow requiring status polling | Single blocking request would timeout; need progressive status updates |

---

## Post-Design Constitution Re-Evaluation

**Date**: 2025-11-18 (After Phase 1 completion)

### 1. Straightforward Surfaces Only
**Status**: ✅ PASS

Data model and API contracts maintain simplicity:
- 4 entities (AuthSession, OnboardingAnswerSet, ScanRun, UserSettings) with clear relationships
- No hidden state or derived computations
- Polling logic isolated in store async actions
- Error states explicit in ScanRun.status enum (no silent failures)

**Confirmed**: No additional defensive fallbacks introduced during design phase.

### 2. Expo iOS Native Focus
**Status**: ✅ PASS

All dependencies remain Expo-compatible:
- Zustand: Pure JS state management
- AsyncStorage: First-party Expo module
- No new native dependencies added during Phase 1
- API contract uses standard REST HTTP (no platform-specific protocols)

**Confirmed**: Design maintains Expo managed workflow compatibility.

### 3. Reanimated-Driven Motion
**Status**: ✅ PASS (deferred to implementation)

Phase 1 focused on data/API design. Reanimated usage confirmed in:
- Research.md Section 6: Onboarding carousel gestures
- Research.md Section 1: Face detection overlay animations
- No alternative animation libraries introduced

**Confirmed**: Motion implementation planned with Reanimated as specified.

### 4. Deterministic Data & State
**Status**: ✅ PASS

Single source of truth achieved:
- Each domain has dedicated Zustand store (auth, onboarding, scans, settings)
- All stores use AsyncStorage persistence (no hidden state)
- ScanRun status transitions documented in data-model.md (lines 176-184)
- Backend responses typed via OpenAPI contract (face-analysis-api.yaml)

**Confirmed**: No prop drilling or global state mutations introduced.

### 5. Design-System Fidelity
**Status**: ⚠️ DEFERRED

Design system creation deferred to implementation (research.md Section 1):
- Will create `constants/Tokens.ts` with iOS HIG-inspired tokens
- No design assets exist yet in `.claude/skills/ui-designer`
- Deviation documented in Constitution Check (line 109)

**Action**: Create design tokens during implementation phase, document color/spacing decisions.

---

## Phase 1 Summary

**Documents Generated**:
- ✅ plan.md (this file)
- ✅ research.md (8 decisions resolved)
- ✅ data-model.md (4 entities, 4 Zustand stores, flow diagrams)
- ✅ contracts/face-analysis-api.yaml (OpenAPI 3.0 spec, 5 endpoints)
- ✅ quickstart.md (developer setup guide)

**Key Decisions**:
1. **Backend API**: Async task-based workflow with 1.5s polling
2. **State Management**: Zustand with AsyncStorage persistence per domain
3. **Data Model**: 4 entities, no foreign keys (local-only storage)
4. **Navigation**: Expo Router file-based with grouped routes
5. **Auth**: Supabase OAuth (Google/Apple) via expo-web-browser
6. **Face Detection**: react-native-face-detector-camera with centering validation

**Constitution Compliance**: ✅ All 5 principles pass or deferred appropriately

**Ready for Phase 2**: Generate tasks.md via `/speckit.tasks` command
