# Feature Specification: Skin Scan Flow

**Feature Branch**: `001-skin-scan-flow`  
**Created**: 2025-11-18  
**Status**: Draft  
**Input**: User description: "i want to build a skin care mobile app with the following 1. right when app opens i want onboaridng screens there are 5 question one in each page 2. after onboarding we go to home screen where there is a scan button 3. scan page where camera is enable with face detection, has take photo button with a reference image top right, back button top left 4. history page show list of runs 5. result page where we can see the results of a given run 6. after taking photo and starting scan from scna page we go to result page of that run but just loading to get result 7. at the bottom the app in the nav tab bar with home, history, settings, track 8. in the result we must have photo followed by response from backend api (we are not going build backend api) 9. FE auth"

> **Constitution Alignment**: Keep stories independently testable on iOS via
> Expo managed workflow, power all motion with Reanimated, and avoid defensive
> fallbacks or speculative try/catch blocks.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticate & Onboard (Priority: P1)

A returning or new user launches the app, completes the FE auth step, and is
taken through a five-question onboarding survey (one screen per question) before
being deposited on the home screen with stored answers.

**Why this priority**: No other experience is reachable or personalized until a
user can access the app and provide baseline profile data.

**Independent Test**: On an iOS simulator, run the app from a clean install,
complete auth + all questionnaire screens, and verify that the app lands on the
home screen with saved answers visible via dev tools.

**Acceptance Scenarios**:

1. **Given** the user has not finished onboarding, **When** the app launches,
   **Then** the FE auth gate appears followed by the 5-step questionnaire with
   forward/back/progress indicators and stored responses.
2. **Given** the user completes the final question, **When** they submit,
   **Then** the app navigates to the home screen and suppresses onboarding on
   the next launch unless answers are reset.

---

### User Story 2 - Home Hub & Tabs (Priority: P2)

An onboarded user arrives on the home screen that showcases their next step,
including a hero CTA to "Scan" and a persistent bottom tab bar with Home,
History, Settings, and Track destinations.

**Why this priority**: The home hub and navigation are needed before any scan,
history, or settings feature can be accessed.

**Independent Test**: Launch the app with completed onboarding data, verify the
home screen layout, and tap each tab to ensure the correct route loads while the
bottom nav stays visible.

**Acceptance Scenarios**:

1. **Given** onboarding is complete, **When** the user lands on Home, **Then**
   the screen shows the scan CTA plus at-a-glance info while the bottom tab bar
   renders the four destinations with active-state styling.
2. **Given** the user taps Track from any screen, **When** the tab switches,
   **Then** the Track surface appears without losing navigation context and can
   later host progress charts.

---

### User Story 3 - Scan & Result Flow (Priority: P2)

From the home CTA (or tabs) the user enters the Scan screen, sees the camera
preview with face detection guides and a reference photo thumbnail, captures an
image, and is routed to a result screen showing the captured photo plus a
placeholder response while the backend call would run.

**Why this priority**: The scan-to-result journey is the core product promise
and must feel polished even before backend integration.

**Independent Test**: On device or simulator, open the Scan page, grant camera
permissions, verify guides, take a photo, and confirm the result screen displays
the captured image, run metadata, and a mocked response card.

**Acceptance Scenarios**:

1. **Given** camera permissions are granted, **When** the user opens Scan,
   **Then** the preview shows face-detection outlines, a top-right reference
   image, and top-left back navigation.
2. **Given** a photo is captured, **When** the scan "processing" state begins,
   **Then** the user is navigated to the result screen where the photo remains
   visible above a loading indicator until the mocked analysis is ready.

---

### User Story 4 - Run History & Detail (Priority: P3)

Users can visit the History tab to browse prior scans (thumbnail, timestamp,
status) and reopen any run to view its result page, including the stored image
and interpretation text.

**Why this priority**: History builds trust and enables retests, but it depends
on the scan pipeline existing first.

**Independent Test**: Seed multiple scan runs, open History, scroll the list,
and open an item to confirm it deep-links into the result page without
triggering a new capture.

**Acceptance Scenarios**:

1. **Given** previous runs exist, **When** the user opens History, **Then** the
   list renders chronologically with thumbnails and status chips.
2. **Given** the user selects a run, **When** the detail view loads, **Then** it
   shows the archived photo, responses, and offers a CTA to start a new scan.

### Edge Cases

- What happens when the user force-quits mid-onboarding and relaunches (we must
  persist answers and resume at the right question)?
- How does the system handle denied or revoked camera permissions without
  inventing new fallback UI (surface a settings CTA instead)?
- Does the Reanimated face-outline + button microinteraction stay at 60 fps
  when detection boxes update rapidly or when history list is large?
- What is the UX if the reference image fails to load from assets or the device
  lacks TrueDepth (fallback to static overlay but keep layout consistent)?
- What happens if a scan result takes longer than N seconds—do we keep the user
  on the loading state with progress copy or allow them to leave and return via
  History?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Experience MUST run inside Expo Router on iOS with no custom
  native modules, leveraging the existing TypeScript + Reanimated stack.
- **FR-002**: The onboarding carousel MUST display exactly 5 question screens
  with Reanimated-driven transitions, progress indicator, and answer persistence
  across relaunches.
- **FR-003**: FE auth MUST gate the onboarding/home experience via
  `[NEEDS CLARIFICATION: specify the authentication method (email OTP, biometrics, device passcode, etc.) and data the frontend stores]`.
- **FR-004**: Home screen MUST present a hero scan CTA plus summary of the last
  run, and the bottom tab bar MUST expose Home, History, Settings, and Track
  routes with proper iconography.
- **FR-005**: Scan screen MUST use Expo Camera with face detection overlays,
  show a top-left back button, top-right reference image, and a large capture
  button tied to haptics.
- **FR-006**: Captured scans MUST generate a `ScanRun` entry stored locally with
  the photo URI, timestamp, onboarding context, and placeholder backend status;
  the result screen MUST immediately show the photo followed by mocked backend
  copy once "processing" completes.
- **FR-007**: History tab MUST list prior runs and deep-link into the same
  result screen without re-triggering camera capture.
- **FR-008**: Track tab MUST surface longitudinal insights or KPIs drawn from
  stored runs `[NEEDS CLARIFICATION: define which metrics (streaks, skin scores, regimen reminders) should appear here]`.
- **FR-009**: Result UI MUST display the backend response payload after the
  photo, respecting tokens/assets, even though the backend call is mocked
  `[NEEDS CLARIFICATION: specify expected fields from the backend response so the UI and storage schema can be designed]`.

### Key Entities *(include if feature involves data)*

- **OnboardingAnswerSet**: Stores the five-question responses, completion flag,
  timestamp, and version to resume or reset the flow.
- **AuthSession**: Tracks FE auth state (token/biometric flag), expiry, and
  association with cached onboarding + runs.
- **ScanRun**: Represents a single scan attempt with photo URI, status
  (`captured`, `processing`, `complete`), mocked backend response blob, and
  references to onboarding metadata for personalization.
- **HistoryFeed**: Derived collection that powers History + Track tabs with
  computed metrics (streaks, trends) over `ScanRun` data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of new users can finish FE auth + 5-question onboarding on an
  iOS simulator in under 90 seconds without crashes.
- **SC-002**: Scan-to-result navigation (capture → loading → mocked response)
  completes in under 5 seconds for the mocked flow and never drops below 55 fps
  on iPhone 14 simulator.
- **SC-003**: History tab lists at least the last 10 runs with accurate
  timestamps and opens result detail within 1 second of selection.
- **SC-004**: Bottom tab navigation latency remains under 100 ms and preserves
  navigation state between tabs (verified via automated test or manual log).
- **SC-005**: QA checklist confirms there are zero unnecessary try/catch blocks
  or fallback screens in the implemented feature modules.
