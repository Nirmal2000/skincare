# Feature Specification: FaceFit MVP

**Feature Branch**: `[001-facefit-mvp]`  
**Created**: 2025-11-08  
**Status**: Draft  
**Input**: User description: "we are going to build a simple app core functionality is allow user to take photo or get image from gallery. upon clicking Scan calls backend api. we wont implement backend. its a fake api for now that just returns {"face_analysis":""} i need onboarding screens, asking for age, asking consent, etc we store the results and images locally, i want a history section, settings, user section. i want apple and google sign in" + FaceFit detailed design language brief  
**Testing Policy**: Default to manual validation at the screen level. Add automated tests only when the user explicitly requests them in the feature brief.  
**Dependency Policy**: Document any required npm packages by name and justification; do not modify `package.json` or install them yourself.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided Onboarding & Consent (Priority: P1)

First-time users complete a three-step onboarding carousel that explains lighting rules, privacy stance, and age personalization. They must choose an age band and check a consent box before continuing to the app shell.

**Why this priority**: Without age data and consent, scans cannot be personalized or legally compliant, so this is the first blocker.

**Independent Test**: Launch fresh install → progress through slides → select age band → toggle consent → verify Continue unlocks home and choices persist locally.

**Acceptance Scenarios**:

1. **Given** a first-time launch, **When** the user swipes through onboarding and selects an age band plus consent, **Then** the Continue CTA becomes active and navigating away stores their selection locally.
2. **Given** the user returns after completing onboarding, **When** the app loads, **Then** onboarding is skipped and stored age/consent pre-fill the user profile.

---

### User Story 2 - Account Sign-In & Profile (Priority: P1)

Users can sign in using Apple or Google. After signing in, the profile screen shows their name, email, provider, a truncated user ID, and the selected age band with an edit option.

**Why this priority**: History and settings are tied to a user identity, so sign-in must exist before storing scans against an account.

**Independent Test**: Trigger sign-in modal → use Apple sandbox or Google test account → upon success, verify profile card shows the provider info and sign-out works.

**Acceptance Scenarios**:

1. **Given** the user taps “Sign in to scan”, **When** they choose Apple and complete authentication, **Then** the modal dismisses and the profile card shows Apple plus metadata.
2. **Given** the user is signed in, **When** they tap Sign Out, **Then** all auth tokens clear locally and protected areas prompt for sign-in again.

---

### User Story 3 - Scan Capture & Fake Analysis (Priority: P2)

Users can take a photo via camera or select from gallery, preview it, and tap Scan. The app sends the image payload to a placeholder backend endpoint and displays the `face_analysis` string returned. Users can save the result locally or retake.

**Why this priority**: This is the core offering that turns captures into insights, even if the backend is stubbed.

**Independent Test**: Grant camera permissions → take photo → hit Scan → ensure loading state appears → show mock analysis → save locally → confirm entry appears in history.

**Acceptance Scenarios**:

1. **Given** permissions are granted, **When** the user taps Take Photo and then Scan, **Then** the app calls the fake API, shows a spinner until the mock response arrives, and renders analysis text.
2. **Given** the user uploads from gallery, **When** they tap Retake, **Then** the previous preview clears and the capture step resets.

---

### User Story 4 - Local History & Settings (Priority: P3)

The app stores each scan result (image path, timestamp, face_analysis, expiration date). Users can browse history, see badges for days remaining, delete items, adjust settings like auto-delete interval, and clear all local data.

**Why this priority**: Persistent results create repeat value and support privacy controls requested by the user.

**Independent Test**: Complete two scans → open History to confirm grid view and expiry badges → open Settings to adjust auto-delete → clear history and verify files plus metadata remove.

**Acceptance Scenarios**:

1. **Given** saved scans exist, **When** the user opens History, **Then** they see a two-column grid with each card showing the capture thumbnail and remaining days.
2. **Given** the user toggles “Delete all local images” in Settings, **When** they confirm, **Then** all stored files and metadata purge and history shows the empty state.

---

### Edge Cases

- What message appears when camera or gallery permissions are denied and the user cannot capture?
- How does the flow handle a failed fake API response (e.g., network offline) while still showing deterministic UX?
- What happens if storage is full or saving to disk fails mid-save?
- How do we handle users under the minimum age band (e.g., <13) attempting to continue onboarding?
- What occurs when sign-in succeeds but profile data lacks email/name (privacy-restricted Apple accounts)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a three-slide onboarding carousel with age band chips, consent checkbox, and progress dots; Continue activates only when age + consent are provided.
- **FR-002**: System MUST persist onboarding completion, age band, and consent locally so the flow is skipped on subsequent launches.
- **FR-003**: System MUST offer Apple Sign-In and Google Sign-In options, using native dialogs when available, and store the resulting user profile securely.
- **FR-004**: System MUST provide a camera capture option (front camera default) and a gallery picker option; both feed into a preview card before scanning.
- **FR-005**: System MUST call a fake API endpoint (stubbed service that returns `{"face_analysis": ""}`) when Scan is tapped, showing a loading indicator until completion.
- **FR-006**: System MUST allow users to save each scan result locally (image file + metadata) and list them in a history grid sorted by newest first.
- **FR-007**: System MUST provide a Settings screen with actions for adjusting auto-delete window, reviewing privacy policy text, and deleting all locally stored scans.
- **FR-008**: System MUST ensure deterministic UX: every permission denial, API failure, or storage error surfaces a direct inline message—no hidden retries.
- **FR-009**: System MUST support manual sign-out that clears auth tokens and local user metadata without deleting scan history unless requested.
- **FR-010**: System MUST keep all data on-device (no real backend calls) until a future backend exists; mock responses should be generated locally.

### Dependency Requests (owner installs only)

1. `expo-camera` — capture live photos within Expo-managed workflow.
2. `expo-image-picker` — select images from the user’s gallery without ejecting.
3. `expo-file-system` — store captured images and metadata locally with predictable paths.
4. `@react-native-async-storage/async-storage` — persist onboarding state, history metadata, and settings.
5. `expo-auth-session` — handle Google authentication flows within Expo.
6. `expo-apple-authentication` — enable native Apple sign-in button and flow.

### Key Entities *(include if feature involves data)*

- **UserProfile**: `{ id, provider, name, email, ageBand, consentGranted, signedInAt }`.
- **ScanRecord**: `{ id, imageUri, capturedAt, faceAnalysis, expiresAt, source: "camera" | "gallery" }`.
- **Settings**: `{ autoDeleteDays, onboardingComplete, lastConsentVersion }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of first-time users can complete onboarding and reach the scan screen in under 90 seconds.
- **SC-002**: 95% of scan attempts present a result (mock response) within 3 seconds on modern devices.
- **SC-003**: At least 90% of users can successfully sign in with either Apple or Google and view their profile without crashes.
- **SC-004**: Saved scans remain available locally for the configured retention window, with delete-all actions removing files within 2 seconds per 10 scans.
