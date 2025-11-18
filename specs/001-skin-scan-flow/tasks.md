# Tasks: Skin Scan Flow

**Input**: Design documents from `/specs/001-skin-scan-flow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/face-analysis-api.yaml

**Tests**: This feature does not require automated tests. Manual validation on iOS simulator per quickstart.md checklist.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

> **Constitution Guardrails**
>
> - Keep implementations straightforward—no speculative fallback screens or
>   extra try/catch blocks unless recovery UX is defined.
> - Prove features on Expo-managed iOS builds first.
> - Power all motion/gestures with React Native Reanimated primitives.
> - Reference the shared design tokens/assets for every UI element.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single Expo project structure (from plan.md):

- `app/` - Expo Router file-based routes
- `components/` - Reusable UI primitives
- `features/` - Feature-specific logic and stores
- `constants/` - Design tokens and config
- `hooks/` - Custom hooks
- `types/` - TypeScript types
- `assets/` - Images and resources

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependencies

- [X] T001 Verify Expo SDK 54 and dependencies from package.json are installed (npm install)
- [X] T002 [P] Create environment config in constants/Config.ts (EXPO_PUBLIC_FACE_API_BASE_URL access)
- [X] T003 [P] Verify app.json has correct Supabase credentials in extra config
- [X] T004 [P] Verify react-native-face-detector-camera plugin configured in app.json
- [X] T005 Run npx expo run:ios to verify base Expo build succeeds on iOS simulator

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create design system tokens in constants/Tokens.ts (Colors light/dark, Spacing, Typography per research.md Section 1)
- [X] T007 [P] Create base Button component in components/Button.tsx with tokens
- [X] T008 [P] Create base Card component in components/Card.tsx with tokens
- [X] T009 [P] Create LoadingSpinner component in components/LoadingSpinner.tsx with Reanimated rotation
- [X] T010 Configure Supabase client in features/auth/supabase-client.ts (per docs/supabase-auth.md)
- [X] T011 Create auth store in features/auth/stores/auth-store.ts with Zustand + AsyncStorage persistence (per data-model.md)
- [X] T012 [P] Create TypeScript types in types/api.ts for backend response schemas (TaskStatusResponse, UpgradedFaceAnalysisResult, RoutinePlan from contracts/)
- [X] T013 [P] Create TypeScript types in types/navigation.ts for Expo Router typed routes

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Authenticate & Onboard (Priority: P1) 🎯 MVP

**Goal**: Returning or new user launches app, completes FE auth (Google/Apple OAuth), and is taken through 5-question onboarding survey with stored answers before landing on home screen.

**Independent Test**: On iOS simulator, run app from clean install, complete auth + all 5 questionnaire screens, verify app lands on home screen with saved answers visible via React DevTools (check AsyncStorage).

### Implementation for User Story 1

**Auth Implementation**:

- [X] T014 [P] [US1] Create OAuth functions in features/auth/oauth.ts (signInWithGoogle, signInWithApple using expo-web-browser)
- [X] T015 [P] [US1] Create useAuthGate hook in features/auth/useAuthGate.ts (checks session, redirects if needed)
- [X] T016 [US1] Create sign-in screen in app/(auth)/signin.tsx with Google/Apple buttons
- [X] T017 [US1] Create auth layout in app/(auth)/_layout.tsx (stack navigator for auth flow)
- [X] T018 [US1] Handle OAuth redirect in app/_layout.tsx useEffect with handleSupabaseRedirect (from supabase-client.ts)

**Onboarding Implementation**:

- [X] T019 [P] [US1] Create onboarding question data in features/onboarding/questions.ts (8 questions based on RoutineIntake schema)
- [X] T020 [P] [US1] Create onboarding store in features/onboarding/stores/onboarding-store.ts with Zustand + AsyncStorage persistence (per data-model.md)
- [X] T021 [US1] Create onboarding layout in app/(onboarding)/_layout.tsx (stack navigator)
- [X] T022 [US1] Create welcome screen in app/(onboarding)/welcome.tsx with 8-question carousel using Reanimated shared values
- [X] T023 [US1] Implement progress bar in welcome.tsx with Reanimated width animation
- [X] T024 [US1] Wire onboarding completion to navigate to /(tabs) in welcome.tsx
- [X] T025 [US1] Add auth gate logic in app/_layout.tsx root layout (check session → onboarding complete → route to tabs)

**Checkpoint**: User can sign in with Google/Apple, complete 5 questions, and land on home screen. Auth + onboarding state persists across app restarts.

---

## Phase 4: User Story 2 - Home Hub & Tabs (Priority: P2)

**Goal**: Onboarded user arrives on home screen with scan CTA and persistent bottom tab bar (Home, History, Track, Settings).

**Independent Test**: Launch app with completed onboarding data, verify home screen layout shows scan CTA, tap each tab to ensure correct route loads while bottom nav stays visible.

### Implementation for User Story 2

- [X] T027 [P] [US2] Create TabBarIcon component in components/TabBarIcon.tsx (renders icon with active state)
- [X] T028 [US2] Create bottom tabs layout in app/(tabs)/_layout.tsx with 4 tabs (index=Home, history, track, settings) and TabBarIcon
- [X] T029 [US2] Implement active tab indicator sliding animation in _layout.tsx using Reanimated translateX
- [X] T030 [US2] Create home screen in app/(tabs)/index.tsx with hero scan CTA button
- [X] T031 [US2] Display last scan summary on home screen (pull from useScanStore.getRecentRuns(1))
- [X] T032 [US2] Create track screen placeholder in app/(tabs)/track.tsx (empty state for future longitudinal insights)
- [X] T033 [US2] Wire home scan CTA to navigate to /(tabs)/scan

**Checkpoint**: Home screen displays with working tab bar. All 4 tabs navigate correctly. Scan button ready for next phase.

---

## Phase 5: User Story 3 - Scan & Result Flow (Priority: P2)

**Goal**: From home CTA, user enters scan screen, sees camera preview with face detection, captures photo when face centered, and is routed to result screen showing captured photo + analysis results (with loading state while polling backend).

**Independent Test**: On iOS simulator/device, open scan page, grant camera permissions, verify face detection guides appear, take photo with face centered, confirm result screen displays captured image, loading state, then mocked/real backend response.

### Implementation for User Story 3

**Scan Store & API Client**:

- [X] T034 [P] [US3] Create scan store in features/scans/stores/scan-store.ts with Zustand + AsyncStorage (per data-model.md ScanRun schema)
- [X] T035 [P] [US3] Implement face analysis API client in features/scans/face-analysis-api.ts (startAnalysis, pollTaskStatus, pollUntilComplete, generateRoutine per research.md Section 4)
- [X] T036 [P] [US3] Create useFaceDetection hook in hooks/useFaceDetection.ts (centering validation logic per research.md Section 3)

**Scan Screen**:

- [X] T037 [US3] Create scan screen in app/(tabs)/scan.tsx with CameraView from react-native-face-detector-camera
- [X] T038 [US3] Configure face detector settings in scan.tsx (FaceDetectorMode.fast, minDetectionInterval: 200ms)
- [X] T039 [US3] Create FaceDetectionOverlay component in components/FaceDetectionOverlay.tsx with Reanimated border color (red→green when centered)
- [X] T040 [US3] Implement capture button in scan.tsx (disabled until face centered, haptic feedback on press)
- [X] T041 [US3] Add scan button pulse animation using Reanimated withRepeat + withSequence when face detected
- [X] T042 [US3] Display reference image thumbnail (top-right) and back button (top-left) in scan.tsx
- [X] T043 [US3] Handle photo capture: create ScanRun via useScanStore.createRun(photoUri) → navigate to /results/[runId]

**Result Screen**:

- [X] T044 [US3] Create result detail screen in app/(results)/[runId].tsx (dynamic route)
- [X] T045 [US3] Display captured photo at top of result screen using Image component
- [X] T046 [US3] Implement loading skeleton with Reanimated shimmer effect while status !== 'completed'
- [X] T047 [US3] Call uploadRun and pollRunStatus in useEffect when screen mounts (per data-model.md flow diagrams)
- [X] T048 [US3] Display progressive status text ("Analyzing skin type...", "Analyzing texture..." based on TaskStatusResponse.status)
- [ ] T049 [US3] When status = 'completed', render global_profile (skin type, scores, summary) using Card components
- [ ] T050 [US3] Render detected issues grouped by category (oily_shine, acne_active, etc.) as IssueDetailCard components
- [ ] T051 [US3] Create IssueDetailCard component in app/(results)/components/IssueDetailCard.tsx (displays region, severity, description)
- [ ] T052 [US3] Add routine intake form at bottom of result screen in app/(results)/components/RoutineIntakeForm.tsx (sensitivity, allergies, budget per RoutineIntake schema)
- [ ] T053 [US3] Submit routine intake → call submitRoutineIntake → continue polling until routine_json !== null
- [ ] T054 [US3] Display routine sections (AM/PM steps) when routine_json available, with product cards showing brand, name, tier, why
- [ ] T055 [US3] Handle errors: show error screen with retry button if status = 'failed' or network error (per research.md error handling)

**Checkpoint**: Full scan-to-result flow works. User can capture selfie with face detection, see analysis results after polling completes, optionally generate routine.

---

## Phase 6: User Story 4 - Run History & Detail (Priority: P3)

**Goal**: Users visit History tab to browse prior scans (thumbnail, timestamp, status) and reopen any run to view its result page with stored image and interpretation.

**Independent Test**: Seed multiple scan runs (via app usage), open History tab, scroll list, tap item to confirm it deep-links into result page without triggering new capture.

### Implementation for User Story 4

- [ ] T056 [P] [US4] Create history screen in app/(tabs)/history.tsx with FlatList
- [ ] T057 [US4] Pull scan runs from useScanStore.getRecentRuns(10) sorted by createdAt descending
- [ ] T058 [US4] Render each run with thumbnail (from photoUri), timestamp, status chip (color-coded: captured/processing/completed/failed)
- [ ] T059 [US4] Implement FlatList item press → navigate to /results/[runId] (reuses result screen from US3)
- [ ] T060 [US4] Add Layout.springify() animation on list mount using Reanimated layout animations
- [ ] T061 [US4] Display empty state when runs array is empty ("No scans yet" with CTA to scan)
- [ ] T062 [US4] Add swipe-to-delete gesture on list items → call useScanStore.deleteRun(id) with Reanimated gesture handler

**Checkpoint**: History list displays all past scans. Tapping item navigates to existing result. Can delete runs.

---

## Phase 7: Settings & Final Polish

**Purpose**: Settings screen and cross-cutting improvements

**Settings Screen**:

- [ ] T063 [P] [US-Settings] Create settings store in features/settings/stores/settings-store.ts with Zustand + AsyncStorage (per data-model.md)
- [ ] T064 [US-Settings] Create settings screen in app/(tabs)/settings.tsx
- [ ] T065 [US-Settings] Display user profile from useAuthStore (avatar, name, email)
- [ ] T066 [US-Settings] Add "Restart Onboarding" button → useOnboardingStore.reset() + navigate to /(onboarding)/welcome
- [ ] T067 [US-Settings] Add "Delete Account" button with confirmation alert → delete all stores + supabase.auth.signOut()
- [ ] T068 [US-Settings] Add "Sign Out" button → useAuthStore.signOut() → navigate to /(auth)/signin

**Polish & Cross-Cutting**:

- [ ] T069 [P] Add error boundary in app/_layout.tsx to catch unhandled errors (simple error screen with restart button)
- [ ] T070 [P] Verify all screens use design tokens from constants/Tokens.ts (no hardcoded colors/spacing)
- [ ] T071 [P] Add haptic feedback to all button presses (Expo Haptics.impactAsync)
- [ ] T072 [P] Verify all Reanimated animations run at 60fps on iPhone 14 simulator (check via React DevTools profiler)
- [ ] T073 [P] Run quickstart.md testing checklist and fix any failures
- [ ] T074 [P] Clean up console.log statements and unused imports (eslint --fix)
- [ ] T075 Run final iOS build and verify no warnings or errors (npx expo run:ios)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - **US1 (P1)**: Can start after Phase 2 - No dependencies on other stories
  - **US2 (P2)**: Can start after Phase 2 - Integrates with US1 auth gate but independently testable
  - **US3 (P2)**: Can start after Phase 2 - Depends on US2 for tab navigation but core scan flow independent
  - **US4 (P3)**: Can start after Phase 2 - Reuses US3 result screen but history list independent
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS everything below
    ↓
    ├─→ Phase 3 (US1: Auth & Onboarding) ← MVP
    │       ↓
    ├─→ Phase 4 (US2: Home & Tabs) ← Uses US1 auth gate
    │       ↓
    ├─→ Phase 5 (US3: Scan & Result) ← Uses US2 tabs, US1 session
    │       ↓
    └─→ Phase 6 (US4: History) ← Reuses US3 result screen
            ↓
        Phase 7 (Polish) ← All stories complete
```

### Recommended Implementation Order

**Sequential (MVP-first)**:

1. Phase 1 → Phase 2 (foundation)
2. Phase 3 (US1) → STOP & VALIDATE → Deploy MVP
3. Phase 4 (US2) → VALIDATE
4. Phase 5 (US3) → VALIDATE
5. Phase 6 (US4) → VALIDATE
6. Phase 7 (Polish) → Final release

**Parallel (with team)**:

1. Phase 1 → Phase 2 together
2. After Phase 2 completes:
   - Developer A: Phase 3 (US1)
   - Developer B: Phase 4 (US2) in parallel
   - Developer C: Start Phase 5 (US3) scaffolding
3. Integrate and test together
4. Phase 6 (US4) after US3 complete
5. Phase 7 (Polish) together

### Within Each User Story

**US1 (Auth & Onboarding)**:

- T014, T015 can run parallel (both create new files)
- T019, T020 can run parallel
- T016 depends on T014, T015
- T022, T023 can run parallel
- T026 depends on all previous US1 tasks

**US2 (Home & Tabs)**:

- T027, T028, T032 can run parallel (different files)
- T029 depends on T028 (same file)
- T030, T031 can run parallel
- T033 depends on T030

**US3 (Scan & Result)**:

- T034, T035, T036 can run parallel (different files)
- T037-T043 sequential for scan screen (same file)
- T044-T055 sequential for result screen (same file)
- But scan screen (T037-T043) and result screen (T044-T055) can be developed in parallel by different developers

**US4 (History)**:

- All T056-T062 mostly sequential (same file)
- T056, T061 can run parallel (different components)

### Parallel Opportunities

**Phase 1** (all can run in parallel):

- T002, T003, T004 (different files, independent checks)

**Phase 2**:

- Parallel: T007, T008, T009, T012, T013
- Sequential: T006 → T010 → T011 (tokens needed first, then Supabase, then store)

**Phase 3 (US1)** - 2 parallel tracks:

- Track A (Auth): T014, T015 → T016 → T017 → T018
- Track B (Onboarding): T019, T020 → T021, T022 → T023, T024, T025
- Merge: T026 (needs both tracks done)

**Phase 5 (US3)** - 2 parallel tracks:

- Track A (Scan screen): T037-T043
- Track B (Result screen): T044-T055
- Prerequisites for both: T034, T035, T036 (can all run parallel first)

**Phase 7** - Most tasks marked [P] can run in parallel

---

## Parallel Example: User Story 3 (Scan & Result)

```bash
# Step 1: Launch prerequisites in parallel
Task T034: "Create scan store in features/scans/stores/scan-store.ts"
Task T035: "Implement API client in features/scans/face-analysis-api.ts"
Task T036: "Create useFaceDetection hook in hooks/useFaceDetection.ts"

# Step 2: Once prerequisites done, split into 2 parallel tracks
# Developer A builds scan screen (T037-T043)
# Developer B builds result screen (T044-T055)

# Both integrate when complete
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T013) ← CRITICAL
3. Complete Phase 3: User Story 1 (T014-T026)
4. **STOP and VALIDATE**: Test auth flow end-to-end on iOS simulator
5. Deploy/demo if ready → Users can now sign in and complete onboarding

**MVP Scope**: Just auth + onboarding (26 tasks total)

### Incremental Delivery

1. **MVP** (Phases 1-3): Auth & Onboarding → Deploy
2. **v0.2** (+Phase 4): Add Home & Tabs → Deploy
3. **v0.3** (+Phase 5): Add Scan & Result → Deploy (core value delivered!)
4. **v0.4** (+Phase 6): Add History → Deploy
5. **v1.0** (+Phase 7): Polish & Launch

Each phase adds value without breaking previous features.

### Parallel Team Strategy

With 2-3 developers:

1. **Week 1**: Together complete Phase 1 + Phase 2 (foundation)
2. **Week 2**:
   - Dev A: Phase 3 (US1)
   - Dev B: Phase 4 (US2) + start Phase 5 scaffolding
   - Dev C: Phase 5 API client (T034-T036)
3. **Week 3**:
   - Dev A: Phase 5 scan screen (T037-T043)
   - Dev B: Phase 5 result screen (T044-T055)
   - Dev C: Phase 6 (US4)
4. **Week 4**: Together Phase 7 (polish) + final testing

---

## Task Summary

**Total Tasks**: 75

**By Phase**:

- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 8 tasks
- Phase 3 (US1: Auth & Onboarding): 13 tasks
- Phase 4 (US2: Home & Tabs): 7 tasks
- Phase 5 (US3: Scan & Result): 22 tasks
- Phase 6 (US4: History): 7 tasks
- Phase 7 (Polish): 13 tasks

**By User Story**:

- US1 (P1): 13 tasks → **MVP scope**
- US2 (P2): 7 tasks
- US3 (P2): 22 tasks → **Highest complexity (camera, API, polling)**
- US4 (P3): 7 tasks

**Parallel Opportunities**: 35 tasks marked [P] (can run in parallel within phase)

**Independent Test Criteria**:

- US1: Sign in + complete 5 questions → lands on home
- US2: All 4 tabs navigate correctly
- US3: Capture photo → see analysis results
- US4: View history list → open detail

**Format Validation**: ✅ All tasks follow `- [ ] [ID] [P?] [Story] Description with path` format

---

## Notes

- All paths assume single Expo project structure (from plan.md)
- Tests NOT included (spec does not request automated tests, only manual validation)
- Each user story can be independently implemented and tested
- [P] marks tasks that touch different files and have no dependencies
- Stop at any checkpoint to validate story works independently
- Commit after each task or logical group
- Constitution compliance: All motion via Reanimated, all colors via Tokens, straightforward error handling only
