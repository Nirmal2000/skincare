---

description: "Task list for implementing the FaceFit MVP feature"
---

# Tasks: FaceFit MVP

**Input**: Design documents from `/specs/facefit/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual validation only unless a spec explicitly asks for automation.

**Principles Reminder**: Each task targets a single screen or module, ties to one user story, uses a single state owner, and never installs packages locally. If a new dependency is needed, add an “Owner installs …” note instead of editing `package.json`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline project wiring needed before user stories.

- [x] T001 [P] [INF] Create `features/storage/async-storage.ts` helper wrapping AsyncStorage get/set/remove with JSON parsing.
- [x] T002 [P] [INF] Add `lib/ui/facefit-components.tsx` with PrimaryButton, SecondaryButton, Card, Chip, ProgressDots per DDL so screens share styling.
- [x] T003 [INF] Configure `app/index.tsx` bootstrap logic that checks onboarding completion + session snapshot to route either `(onboarding)` stack or `(tabs)` stack.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modules every story depends on.

- [x] T004 [INF] Create `features/settings/settings-store.ts` to persist `{ autoDeleteDays, onboardingComplete, consentGranted, ageBand }` via AsyncStorage helper.
- [x] T005 [INF] Create `features/auth/supabase-client.ts` that exports a singleton `createClient` using `extra.supabaseUrl` and `extra.supabaseAnonKey` plus AsyncStorage-backed session storage.
- [x] T006 [INF] Implement `features/auth/useSupabaseSession.ts` hook that subscribes to Supabase `onAuthStateChange`, normalizes `UserProfile`, and exposes `signOut`.
- [x] T007 [INF] Add `features/scans/scan-store.ts` with CRUD helpers for `ScanRecord`, integrating `expo-file-system` (documentsDir) plus auto-prune logic based on `autoDeleteDays`.
- [x] T008 [INF] Add `features/scans/fake-analysis-service.ts` returning mocked `{ face_analysis: string }` with configurable latency + deterministic error handling.

---

## Phase 3: User Story 1 - Guided Onboarding & Consent (Priority: P1) 🎯 MVP

**Goal**: Deliver onboarding carousel, age chips, consent gating, and persistence.

- [x] T009 [US1] Build `features/onboarding/onboarding-store.ts` (hook + context) managing `{ completed, ageBand, consent }` with AsyncStorage helper.
- [x] T010 [P] [US1] Implement `app/(onboarding)/welcome.tsx` carousel (3 slides, progress dots, microcopy) using FaceFit components.
- [x] T011 [US1] Add age band chip row + consent checkbox to onboarding slide 3; disable Continue until both values set, then persist via onboarding store.
- [x] T012 [US1] Ensure onboarding-only routes show on first run and redirect elsewhere afterward (handled via `app/index.tsx` gate).

---

## Phase 4: User Story 2 - Account Sign-In & Profile (Priority: P1)

**Goal**: Allow Apple/Google sign-in through Supabase OAuth and expose the profile view.

- [x] T013 [US2] Implement `app/(auth)/signin-modal.tsx` with stacked “Sign in with Apple/Google” buttons calling `supabase.auth.signInWithOAuth` (redirect `facefit://auth`) and wrapping the request in `WebBrowser.maybeCompleteAuthSessionAsync`.
- [x] T014 [US2] Wire a linking handler in `app/_layout.tsx` (or dedicated hook) that listens for `facefit://auth` deep links and forwards them to Supabase client per AuthSession doc.
- [x] T015 [US2] Create `features/auth/profile-card.tsx` component rendering name/email/provider/id plus age band, editing age via settings store.
- [x] T016 [US2] Implement `app/(tabs)/settings.tsx` “Account” section showing ProfileCard + Sign Out button calling the session hook.
- [x] T017 [US2] Update `app/(tabs)/scan.tsx` entry flow so pressing “Scan” while signed out opens the sign-in modal before exposing camera or gallery options; authenticated users continue normally.
- [x] T018 [US2] Add a lightweight auth guard hook used by Scan/History/Settings to surface “Sign in to continue” messaging when session expires mid-flow.

---

## Phase 5: User Story 3 - Scan Capture & Fake Analysis (Priority: P2)

**Goal**: Enable camera/gallery capture, preview, fake scan call, and result surfacing.

- [x] T019 [P] [US3] Implement `features/scans/permissions.ts` hook to request camera + media permissions using `useCameraPermissions` and `ImagePicker.requestMediaLibraryPermissionsAsync`.
- [x] T020 [US3] Build `app/(tabs)/scan.tsx` screen: instructions, `CameraView` preview (front-facing default), Take Photo CTA, Upload from Gallery CTA (only after auth guard grants access).
- [x] T021 [US3] Add capture preview state with `Scan` + `Retake` buttons; on Scan call fake analysis service, show spinner, then navigate to `result` route with payload.
- [x] T022 [US3] Implement `app/(tabs)/result.tsx` to render analysis text, tips card, disclaimer, and buttons `Save Locally` + `Scan Again`.
- [x] T023 [US3] Connect Save button to `scan-store.save(record)` and route to History; handle errors with inline toast (per FaceFit toast pattern).

---

## Phase 6: User Story 4 - Local History & Settings (Priority: P3)

**Goal**: Persist scans, display history grid, manage retention and destructive actions.

- [x] T024 [P] [US4] Extend `scan-store.ts` with `list()`, `delete(id)`, `deleteAll()`, and expiry badge helper; ensure file writes copy images into `FileSystem.documentDirectory/scans`.
- [x] T025 [US4] Implement `app/(tabs)/history.tsx` rendering a 2-column FlatList of saved scans, each card showing thumbnail, timestamp, and “Expires in N days” badge; include empty state CTA linking to Scan.
- [x] T026 [US4] Enhance `app/(tabs)/settings.tsx` with auto-delete selector (e.g., segmented buttons) plus “Delete all local images” action that calls `scan-store.deleteAll()` and resets related state.
- [x] T027 [US4] Add privacy policy + terms links (using `WebBrowser.openBrowserAsync`) and ensure consent info is viewable/updatable in settings.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T028 [P] [POL] Create shared toast utility (`features/ui/useToast.tsx`) matching FaceFit specs and use it in scan/result/history flows.
- [ ] T029 [POL] Validate linking + Supabase flows on iOS, Android, and web (web should gracefully disable CameraView and show gallery-only messaging).
- [ ] T030 [POL] Run lint (`npm run lint`) and fix any issues introduced by new files.

---

## Dependencies & Execution Order

- Setup + Foundational phases must finish before US1–US4 tasks begin.  
- US1 (Onboarding) must complete before US2+ flows because age/consent feed the profile.  
- US2 (Auth) must finish before US3 since the Scan entry point now enforces sign-in before exposing capture UI.  
- US3 depends on permissions + scan store from foundational work but can run in parallel with US4 once storage logic is stable.  
- Polish tasks wrap up after all user stories validate independently.
