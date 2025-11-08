# Implementation Plan: FaceFit MVP

**Branch**: `[001-facefit-mvp]` | **Date**: 2025-11-08 | **Spec**: `specs/facefit/spec.md`  
**Input**: Feature specification from `/specs/facefit/spec.md`

**Note**: Derives UI tone and component rules from the FaceFit DDL brief and honors the project constitution (simplicity, deterministic UX, owner-installed deps).

## Summary

FaceFit provides a privacy-forward skincare scan companion with four user stories: onboarding + consent, Supabase-powered Apple/Google sign-in, camera/gallery capture routed through a fake `face_analysis` API, and local-only history/settings management. We will stay inside Expo Router with minimalist screens, wire Supabase OAuth using the provided project URL/anon key and the `facefit://auth` redirect, and persist scans plus settings locally via `expo-file-system` and `@react-native-async-storage/async-storage`. The fake analysis response will be simulated client-side (no real backend) but still use the same API contract so we can swap in the live service later.

## Technical Context

**Language/Version**: TypeScript targeting Expo SDK 54 / React Native 0.81 (per current deps).  
**Primary Dependencies**: Expo Router, React Navigation, Supabase JS client, `expo-camera`, `expo-image-picker`, `expo-file-system`, `expo-web-browser`, `@react-native-async-storage/async-storage`.  
**Storage**: On-device only — AsyncStorage for metadata (onboarding, user profile snapshot, settings) and `expo-file-system` documents directory for captured images + JSON records.  
**Testing**: Manual validation flows per constitution (onboarding path, auth linking, camera + gallery, history purge).  
**Target Platform**: iOS 15+, Android 10+, Expo web (best-effort; camera limited, degrade to gallery upload).  
**Project Type**: Expo single-app workspace using file-based routing under `app/`.  
**Performance Goals**: Camera preview <200ms to mount; fake scan pipeline returns mock analysis in ≤3s; history grid renders ≤16ms per frame on 20 entries.  
**Constraints**: No backend writes, deterministic UX (explicit inline error states), Supabase OAuth must use `facefit://auth` scheme, no package installations performed by this agent (owner installs).  
**Scale/Scope**: ~6 primary screens (Onboarding carousel, Sign-in modal, Scan, Result, History, Settings/User), one shared storage module, and a Supabase auth client.

## Constitution Check

1. **Simplicity** – Each deliverable maps to a single screen component (`app/(onboarding)/welcome`, `app/(tabs)/scan`, `app/(tabs)/history`, etc.) with local hooks for the state it consumes.  
2. **User Story Alignment** – Tasks will align with the four prioritized stories from the spec; no “extra” refactors.  
3. **State Ownership** – Onboarding state lives in `features/onboarding/onboarding-store.ts`, auth/session in `features/auth/supabase-session.ts`, and scans in `features/scans/scan-store.ts`; no duplicate caches.  
4. **Expo Stack** – Camera/ImagePicker/FileSystem/WebBrowser libs are Expo-managed per the latest docs fetched from Expo MCP today. No ejecting.  
5. **Owner Install Only** – Required packages are enumerated below; we will not touch `package.json` or run installers.  
6. **Deterministic UX** – Permission denials and Supabase/auth errors render inline cards or toasts; fake API failures fall back to user-facing messaging rather than silent retries.

## Project Structure

### Documentation (this feature)

```text
specs/facefit/
├── plan.md              # THIS FILE
├── spec.md              # Authored earlier
├── research.md          # To capture Supabase/Expo auth nuances if needed
├── data-model.md        # Will document UserProfile, ScanRecord, Settings schemas
├── quickstart.md        # Runbook for enabling schemes + installing deps
├── contracts/
│   └── face-analysis.md # Placeholder describing fake API contract
└── tasks.md             # Generated after plan approval
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                     # Tab shell (will add linking + Splash navigation)
├── index.tsx                       # Entry decides between onboarding vs tabs
├── (onboarding)/
│   └── welcome.tsx                 # 3-slide carousel + age chips + consent
├── (auth)/
│   └── signin-modal.tsx            # Apple/Google buttons via Supabase OAuth
├── (tabs)/
│   ├── scan.tsx                    # Camera/gallery capture + scan flow
│   ├── result.tsx                  # Renders mock analysis + save CTA
│   ├── history.tsx                 # Grid of saved scans, empty state
│   └── settings.tsx                # Age edit, auto-delete, privacy copy, delete all
features/
├── auth/
│   ├── supabase-client.ts          # `createClient` w/ AsyncStorage + constants
│   └── useSupabaseSession.ts       # Hook to bridge Supabase events to UI store
├── onboarding/onboarding-store.ts  # AsyncStorage-backed store for age/consent
├── scans/
│   ├── scan-store.ts               # CRUD for ScanRecord JSON + FileSystem refs
│   └── fake-analysis-service.ts    # Returns mock `face_analysis`
└── settings/settings-store.ts      # Auto-delete window + purge helpers
lib/
├── navigation/safe-area.ts         # Shared layout helpers (optional)
└── ui/facefit-components.tsx       # PrimaryButton, Card, Chips per design system
assets/
└── illustrations/facefit/          # Onboarding iconography (optional placeholder)
```

**Structure Decision**: Single Expo project with feature-specific folders under `features/` to keep state logic isolated, while all routed screens live under `app/` per Expo Router conventions. This keeps “one state owner per module” and ensures we can expand each area without duplicating logic.

## Implementation Outline

### Phase 0 – Environment & Dependencies (Owner-installed)

Please install (or confirm availability of) the following packages before development; they are required for the plan but WILL NOT be installed by this agent:

1. `expo-camera` — camera preview + capture (per [Expo Camera docs](https://docs.expo.dev/versions/latest/sdk/camera/)).
2. `expo-image-picker` — gallery selection fallback ([Expo ImagePicker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/)).
3. `expo-file-system` — local storage for images + metadata ([Expo FileSystem docs](https://docs.expo.dev/versions/latest/sdk/filesystem/)).
4. `@react-native-async-storage/async-storage` — persistence for onboarding, auth snapshot, settings.
5. `@supabase/supabase-js` — Supabase client for OAuth + session management.

Configuration tasks for the owner (no code yet):

- Add `facefit` to `expo.scheme` in `app.json` (required for `facefit://auth` redirects).  
- Set `IOS` camera usage strings + Android permissions via `app.json` plugin props (Camera/ImagePicker).  
- Store Supabase URL `https://szpwelqikxpjmshckqjp.supabase.co` and anon key `gommale` in env-safe location (e.g., `app.config` extra) — never inline secrets in code.

### Phase 1 – Onboarding & Settings Foundations (US1)

- Build `features/onboarding/onboarding-store.ts` using AsyncStorage setters/getters to track `{ completed, ageBand, consent }`. Provide synchronous fallback state via React context/hook.  
- Implement `app/(onboarding)/welcome.tsx` as the 3-slide carousel referencing the FaceFit design tokens (primary button, progress dots). Age chips + consent checkbox must block Continue until valid.  
- Wire entry flow in `app/index.tsx` to check onboarding completion and direct to onboarding vs tabs.  
- Define Settings store skeleton with default auto-delete window (30 days) referencing the same AsyncStorage key as onboarding for age updates.

### Phase 2 – Supabase Auth Integration (US2)

- Create `features/auth/supabase-client.ts` that calls `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { storage: AsyncStorage, detectSessionInUrl: false, flowType: 'pkce' }})`.  
- Implement `useSupabaseSession` hook that listens to `supabase.auth.onAuthStateChange` and maps session → `UserProfile`.  
- Build `app/(auth)/signin-modal.tsx` with Apple/Google buttons. Use `supabase.auth.signInWithOAuth({ provider: 'apple' | 'google', options: { redirectTo: 'facefit://auth', skipBrowserRedirect: false } })`.  
- Use `expo-web-browser`’s `openAuthSessionAsync` (per [Expo doc](https://docs.expo.dev/versions/latest/sdk/webbrowser/)) to handle the URL returned by Supabase and ensure control returns to the app.  
- Update the tab shell (likely `app/_layout.tsx` + `app/(tabs)/_layout.tsx` if needed) so signed-out users can browse onboarding and view static content, but the Scan screen enforces authentication: when a user taps “Scan” without a session, open the sign-in modal before allowing photo capture or gallery access.

### Phase 3 – Capture & Fake Analysis (US3)

- Build `features/scans/permissions.ts` to manage camera/gallery permission prompts (leveraging `useCameraPermissions` + `ImagePicker.requestMediaLibraryPermissionsAsync`).  
- Implement `app/(tabs)/scan.tsx`:
  - Top instructions per DDL.
  - Live preview via `CameraView` with `front` as default (from Expo Camera doc).  
  - Secondary button to launch Image Picker.  
  - Preview card with `Scan` + `Retake`.  
  - On Scan, call `fake-analysis-service.ts` which wraps a `setTimeout` to emulate API latency and returns `{ face_analysis: string }`. Surface spinner + inline error states.  
- Ensure we unmount `CameraView` whenever the tab loses focus to respect the Expo Camera “single preview” rule.

### Phase 4 – Local Persistence & History (US4)

- Extend `scan-store.ts` to copy taken image files from cache into `FileSystem.documentDirectory + /scans/{id}.jpg` and persist metadata JSON alongside (using `ScanRecord`).  
- Auto-prune expired scans (based on `Settings.autoDeleteDays`) when history loads, using `FileSystem` directory listing APIs.  
- Build `app/(tabs)/history.tsx` to render a 2-column grid (FlatList numColumns=2) with badges showing `Expires in N days`. Provide empty state linking back to Scan.  
- Implement `app/(tabs)/settings.tsx` consolidating: age band editor (reuses chips), auto-delete slider/selector, privacy policy link (via `WebBrowser.openBrowserAsync`), and destructive “Delete all local images” action that wipes both AsyncStorage metadata and FileSystem directory.

### Phase 5 – Result Surface & Cross-Screen Glue

- `app/(tabs)/result.tsx` displays the latest scan result (pulled from a navigation param or global store) with the tip card, disclaimer, Save & Scan Again CTAs.  
- Ensure navigation flows: Scan → Result (with serialized payload), Result “Save” writes to store + routes to History, “Scan Again” pops back.  
- Add toast utility for success/error states, respecting FaceFit DDL (bottom-center, 2.5s auto-dismiss).

### Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase redirect misconfiguration | Hardcode `redirectTo: 'facefit://auth'` and document owner setup; log helpful error if linking listener doesn’t fire. |
| Camera denied / low-light issues | Provide inline error cards guiding the user + hide `CameraView` when permission absent per Expo docs. |
| Storage growth | Auto-delete job runs on history load + when save completes, removing files older than the retention window. |
| Web platform limitations | Detect `Platform.OS === 'web'` to disable CameraView and only show gallery upload. |

## Complexity Tracking

No constitution violations anticipated; each screen manages its own state and all new dependencies go through owner install requests listed above. If Supabase auth introduces shared global context beyond the planned hook, revisit this table.
