# Phase 0: Research & Decisions

**Date**: 2025-11-18
**Feature**: Skin Scan Flow
**Purpose**: Resolve NEEDS CLARIFICATION items from Technical Context and establish implementation patterns

---

## 1. Design System & UI Tokens

## Design Philosophy

<pondering>
This skincare app embodies a modern, approachable wellness aesthetic that balances clinical precision with emotional warmth. The design language speaks to users who want professional skin analysis without intimidation—soft pastels (blush pinks, lavenders) paired with vibrant accent gradients create an environment that feels both trustworthy and inviting.

The circular face detection overlay and precise dot indicators demonstrate technical capability while maintaining visual gentleness. The generous white space and breathing room around content reduce cognitive load, crucial for an app that might deliver sensitive feedback about one's appearance. Typography hierarchy is clear but never harsh, with rounded san-serif forms that feel contemporary yet accessible.

The vibrant pink-to-magenta gradient on CTAs creates urgency without aggression, encouraging users to take action (unlock routines, start scans) while maintaining the overall calm atmosphere. This is deliberate—skincare is a journey of self-care, not a problem to be attacked. The design invites consistent engagement through beauty rather than alarm.
</pondering>

---

## Color Palette

### Primary Colors

**Brand Pink** - `#FF2D92` (Hot Pink)
*Usage*: Primary CTA buttons, active states, progress indicators
*Psychology*: Energy, vitality, modern femininity, confidence

**Soft Background** - `#FFF5F8` (Blush White)
*Usage*: Main screen backgrounds, question cards
*Psychology*: Gentle, clean, non-clinical warmth

### Secondary Colors

**Light Lavender** - `#E8E8F0` (Cool Gray-Lavender)
*Usage*: Inactive button backgrounds, secondary surfaces
*Psychology*: Calm, neutral, modern sophistication

**Soft Gray** - `#F5F5F7` (Warm Gray)
*Usage*: Card backgrounds, disabled states
*Psychology*: Subtle separation without harshness

### Accent Colors

**Vibrant Magenta** - `#E91E8C` (Magenta)
*Usage*: Gradient end stops, emphasis elements
*Gradient with Brand Pink*: Creates signature button gradient

**Accent Blue** - `#5A9FFF` (Sky Blue)
*Usage*: Informational highlights, links
*Note*: Seen in notification mockup

**Success Green** - `#00C853` (Bright Green)
*Usage*: Face detection "OK" indicator, confirmation states
*Psychology*: Clinical approval, readiness signal

**Indicator Cyan** - `#4DD0E1` (Light Cyan)
*Usage*: Skin issue markers (visible pores indicator)
*Psychology*: Clinical precision, attention without alarm

### Functional Colors

**Text Primary** - `#1A1A1A` (Near Black)
*Usage*: Headings, primary body text
*Weight*: 700 (headings), 400-500 (body)

**Text Secondary** - `#6B6B6B` (Medium Gray)
*Usage*: Supporting text, captions, metadata
*Weight*: 400-500

**Text Tertiary** - `#9E9E9E` (Light Gray)
*Usage*: Placeholder text, disabled labels
*Weight*: 400

**Overlay Dark** - `rgba(0, 0, 0, 0.6)` (60% Black)
*Usage*: Camera screen background dimming, modal overlays

### Background Colors

**Pure White** - `#FFFFFF`
*Usage*: Cards, input fields, content containers

**App Background** - `#FAFAFA` (Off White)
*Usage*: Base layer for screens with multiple cards

**Dark Background** - `#2C2C2E` (Dark Gray)
*Usage*: Camera scan screen base (visible in Image 3)

---

## Typography

### Font Family

**Primary Font**: SF Pro Display (iOS native)
**Body Font**: SF Pro Text (iOS native)
**Fallback**: System default (-apple-system, BlinkMacSystemFont)

*Rationale*: Native iOS fonts ensure optimal rendering, accessibility support, and zero bundle size impact in Expo.

### Weights

- **Regular**: 400 (body text, descriptions)
- **Medium**: 500 (buttons, labels)
- **Semibold**: 600 (sub-headings, emphasis)
- **Bold**: 700 (headings, question text)

---

## Text Styles

### Headings

**H1 - Screen Title**

- Size: 32px / 38px line height
- Weight: 700 (Bold)
- Letter spacing: -0.5px
- Color: Text Primary (#1A1A1A)
- *Example*: "How would you describe your skin type?"

**H2 - Section Header**

- Size: 24px / 30px line height
- Weight: 700 (Bold)
- Letter spacing: -0.3px
- Color: Text Primary (#1A1A1A)
- *Example*: "Your Daily Routines"

**H3 - Card Title**

- Size: 18px / 24px line height
- Weight: 600 (Semibold)
- Letter spacing: -0.2px
- Color: Text Primary (#1A1A1A)
- *Example*: "Morning", "Midday"

### Body Text

**Body Large**

- Size: 17px / 24px line height
- Weight: 400 (Regular)
- Letter spacing: 0px
- Color: Text Primary (#1A1A1A)
- *Usage*: Main content paragraphs, instructions

**Body Regular**

- Size: 15px / 22px line height
- Weight: 400 (Regular)
- Letter spacing: 0px
- Color: Text Primary (#1A1A1A)
- *Usage*: Standard UI text, option labels

**Body Small**

- Size: 13px / 18px line height
- Weight: 400 (Regular)
- Letter spacing: 0.1px
- Color: Text Secondary (#6B6B6B)
- *Usage*: Supporting information, secondary details

### Special Text

**Caption - Metadata**

- Size: 12px / 16px line height
- Weight: 500 (Medium)
- Letter spacing: 0.2px
- Color: Text Secondary (#6B6B6B)
- *Example*: "Question 3 of 8", timestamps

**Button Text**

- Size: 16px / 24px line height
- Weight: 600 (Semibold)
- Letter spacing: 0.2px
- Color: White (#FFFFFF) on primary buttons
- *Example*: "Next", "Unlock Your Routine"

**Progress Label**

- Size: 14px / 18px line height
- Weight: 500 (Medium)
- Letter spacing: 0.1px
- Color: Text Secondary (#6B6B6B)
- *Example*: "3 minutes", "XX/100 GOAL"

---

## Component Styles

### Buttons

#### Primary Button (CTA)

```
Background: Linear gradient (180deg, #FF2D92 0%, #E91E8C 100%)
Text: White (#FFFFFF), 16px, Weight 600
Height: 56dp
Corner Radius: 28dp (fully rounded/pill shape)
Padding: Horizontal 32dp, Vertical 16dp
Shadow: None (relies on gradient vibrancy)
```

*Examples*: "Next", "Unlock Your Routine", "Start" button

#### Secondary Button (Quiet)

```
Background: Light Lavender (#E8E8F0)
Text: Text Primary (#1A1A1A), 16px, Weight 500
Height: 56dp
Corner Radius: 28dp
Padding: Horizontal 32dp, Vertical 16dp
Border: None
```

*Examples*: "Not now" (inferred from common patterns)

#### Option Card Button (Selection)

```
Background: Light Lavender (#E8E8F0) default, White (#FFFFFF) when active
Text: Text Primary (#1A1A1A), 17px, Weight 500
Height: 64dp
Corner Radius: 16dp
Padding: Horizontal 24dp, Vertical 20dp
Border: 2dp transparent (3dp Brand Pink when selected)
Shadow: 0dp 2dp 8dp rgba(0,0,0,0.04) on white variant
```

*Examples*: "Oily", "Dry", "Combination" option cards

#### Icon Button (Utility)

```
Background: rgba(255, 255, 255, 0.2) on dark, White on light
Size: 44dp × 44dp
Icon Size: 24dp × 24dp
Corner Radius: 22dp (circular)
Border: None
```

*Examples*: Back button (X), Help button (?), Close button

#### Circular Action Button

```
Background: White (#FFFFFF)
Size: 72dp × 72dp (large capture button)
Icon/Label: "Start" text or camera icon
Corner Radius: 36dp (fully circular)
Shadow: 0dp 4dp 12dp rgba(0,0,0,0.15)
```

*Example*: "Start" button on face scan screen

### Cards

#### Standard Content Card

```
Background: White (#FFFFFF)
Corner Radius: 20dp
Padding: 20dp
Shadow: 0dp 2dp 12dp rgba(0,0,0,0.06)
Border: None
```

*Examples*: Morning/Midday/Before-bed routine cards

#### List Item Card (History)

```
Background: White (#FFFFFF)
Corner Radius: 16dp
Padding: 16dp
Margin Bottom: 12dp
Shadow: 0dp 1dp 4dp rgba(0,0,0,0.04)
```

*Usage*: Scan history items, track entries

### Progress Indicators

#### Linear Progress Bar

```
Height: 4dp
Background: Light Lavender (#E8E8F0)
Foreground: Brand Pink (#FF2D92)
Corner Radius: 2dp
```

*Example*: Onboarding progress indicator at top of screen

#### Circular Status Badge

```
Size: 48dp × 48dp
Background: Light gradient (multi-color if needed)
Border: 3dp Brand Pink or Success Green
Corner Radius: 24dp (circular)
```

*Usage*: Face detection "OK" indicator (green), status badges

### Inputs

*(Not visible in provided screens, inferring from common patterns)*

```
Height: 56dp
Background: White (#FFFFFF)
Border: 1.5dp Light Lavender (#E8E8F0)
Active Border: 2dp Brand Pink (#FF2D92)
Corner Radius: 16dp
Padding: Horizontal 16dp
Text: 16px, Weight 400, Text Primary
Placeholder: 16px, Weight 400, Text Tertiary
```

### Icons

**Primary Icons**

- Size: 24dp × 24dp (navigation, actions)
- Color: Text Primary (#1A1A1A) or White on dark
- Style: Outlined (1.5dp stroke)

**Small Icons**

- Size: 20dp × 20dp (inline, badges)
- Color: Text Secondary (#6B6B6B)
- Style: Outlined

**Large Icons**

- Size: 32dp × 32dp (headers, empty states)
- Color: Brand Pink (#FF2D92) or Text Primary
- Style: Outlined or filled accent

**Tab Bar Icons**

- Size: 28dp × 28dp
- Color: Text Tertiary (#9E9E9E) inactive, Brand Pink active
- Style: Outlined with 2dp stroke

---

## Spacing System

**Micro (2dp)** - Between related inline elements
**Tiny (4dp)** - Tighter list item spacing
**Small (8dp)** - Internal card padding, icon-text gaps
**Base (12dp)** - List item vertical margins
**Default (16dp)** - Standard card padding, button internal spacing
**Medium (20dp)** - Card corner radius, section internal spacing
**Large (24dp)** - Screen horizontal margins, between cards
**XL (32dp)** - Major section separation, screen top padding
**XXL (48dp)** - Bottom navigation clearance, hero spacing
**XXXL (64dp)** - Onboarding screen vertical rhythm

---

## Layout Grid

**Screen Margins**: 24dp horizontal (left/right)
**Card Spacing**: 12dp vertical gap between cards
**Max Content Width**: Full width minus 48dp (24dp × 2 margins)
**Safe Area**: Respects iOS notch/home indicator (automatic via React Native SafeAreaView)

---

## Motion & Animation

### Standard Transitions

```
Duration: 300ms
Easing: ease-out (cubic-bezier(0.4, 0.0, 0.2, 1))
Properties: opacity, transform
```

*Usage*: Screen transitions, card reveals

### Emphasized Transitions

```
Duration: 400ms
Easing: spring (Reanimated withSpring config: damping 15, stiffness 100)
Properties: scale, transform
```

*Usage*: Button press feedback, modal presentations

### Micro-interactions

```
Duration: 200ms
Easing: ease-in-out
Properties: opacity, scale
```

*Usage*: Button hover/press states, checkbox toggles

### Progress Animations

```
Duration: 1500ms
Easing: linear
Properties: width (progress bar), strokeDashoffset (circular)
Loop: false
```

*Usage*: Onboarding progress bar updates

### Face Detection Indicator

```
Duration: 150ms (pulse), 500ms (color transition)
Easing: ease-out (pulse), linear (color)
Properties: scale (0.95→1.05), background-color (gray→green)
Loop: true (pulse when active)
```

*Usage*: "OK" indicator on face scan screen

### Shimmer Loading (Skeleton)

```
Duration: 1200ms
Easing: linear
Properties: background-position (gradient sweep)
Loop: true
```

*Usage*: Content loading states (not visible but inferred)

---

## Special Effects

### Face Detection Overlay

```
Shape: Oval/ellipse
Border: 3dp Success Green (#00C853) when face detected and centered
Background: Transparent
Dimensions: ~280dp width × ~360dp height (dynamic to face bounds)
Position: Center of screen
Shadow: 0dp 0dp 20dp rgba(0, 200, 83, 0.4) when active
```

### Skin Issue Markers

```
Shape: Circular dots
Size: 4-8dp diameter (varies by issue density)
Color: White (#FFFFFF) with 40% opacity, or Cyan (#4DD0E1) for pores
Clustering: Scattered across detected regions
Animation: Fade in sequentially (50ms stagger)
```

### Gradient Overlays (Camera Screen)

```
Top Gradient: rgba(0,0,0,0.4) → transparent (100dp height)
Bottom Gradient: transparent → rgba(0,0,0,0.5) (120dp height)
Usage: Improve button/text contrast over camera preview
```

---

## 2. Supabase OAuth Implementation

### Decision

Use Supabase `signInWithOAuth` with `expo-web-browser` for Google/Apple sign-in, following the pattern in `docs/supabase-auth.md`.

### Rationale

- Supabase provides built-in OAuth flows (no custom native modules needed)
- Existing `supabase-client.ts` pattern already handles redirect URL parsing
- OAuth scheme `facefit://auth` already configured in app.json
- Keeps auth logic pure JS (Expo managed workflow compatible)

### Implementation Pattern

```typescript
// features/auth/oauth.ts
import * as WebBrowser from 'expo-web-browser';
import { supabase, SUPABASE_REDIRECT_PREFIX } from './supabase-client';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: SUPABASE_REDIRECT_PREFIX,
    },
  });

  if (error) throw error;
  if (data.url) {
    await WebBrowser.openAuthSessionAsync(data.url, SUPABASE_REDIRECT_PREFIX);
  }
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: SUPABASE_REDIRECT_PREFIX,
    },
  });

  if (error) throw error;
  if (data.url) {
    await WebBrowser.openAuthSessionAsync(data.url, SUPABASE_REDIRECT_PREFIX);
  }
}
```

### Supabase Dashboard Configuration Required

1. Enable Google OAuth provider in Supabase Dashboard → Authentication → Providers
2. Enable Apple OAuth provider (requires Apple Developer account + Service ID)
3. Add redirect URL: `facefit://auth` to allowed redirect URLs
4. Configure OAuth consent screens per provider docs

### Alternatives Considered

- **Custom OAuth flow**: Requires managing tokens manually (Supabase SDK handles this)
- **Expo AuthSession alone**: Would need to implement Supabase session creation manually
- **Email/password auth**: Spec explicitly requests social sign-in only

---

## 3. Face Detection Integration

### Decision

Use `react-native-face-detector-camera` with MLKit for real-time face detection, enabling capture button only when face is centered.

### Rationale

- Library already in dependencies and configured in app.json (line 75-79)
- Provides `CameraView` with `onFacesDetected` callback (no need for separate Expo Camera + ML pipeline)
- MLKit runs on-device (no backend calls for detection)
- Face bounds data includes `origin` (x, y) and `size` (width, height) for centering validation

### Implementation Pattern

```typescript
// hooks/useFaceDetection.ts
import { FaceDetectionResult } from 'react-native-face-detector-camera';

export function useFaceDetection(
  viewportWidth: number,
  viewportHeight: number
) {
  const [isCentered, setIsCentered] = useState(false);

  const handleFacesDetected = ({ faces }: FaceDetectionResult) => {
    if (faces.length === 0) {
      setIsCentered(false);
      return;
    }

    const face = faces[0];
    const { origin, size } = face.bounds;

    // Center validation: face must be within middle 60% of viewport
    const centerX = origin.x + size.width / 2;
    const centerY = origin.y + size.height / 2;

    const isHorizontallyCentered =
      centerX > viewportWidth * 0.2 && centerX < viewportWidth * 0.8;
    const isVerticallyCentered =
      centerY > viewportHeight * 0.2 && centerY < viewportHeight * 0.8;

    // Face size validation: must fill at least 30% of viewport
    const faceArea = size.width * size.height;
    const viewportArea = viewportWidth * viewportHeight;
    const fillsEnoughSpace = faceArea > viewportArea * 0.3;

    setIsCentered(
      isHorizontallyCentered &&
      isVerticallyCentered &&
      fillsEnoughSpace &&
      faces.length === 1 // Only one face
    );
  };

  return { isCentered, handleFacesDetected };
}
```

### Camera Configuration

```typescript
<CameraView
  ref={cameraRef}
  style={StyleSheet.absoluteFill}
  facing="front"
  faceDetectorSettings={{
    mode: FaceDetectorMode.fast,
    runClassifications: FaceDetectorClassifications.none,
    minDetectionInterval: 200, // 5 fps detection
  }}
  onFacesDetected={handleFacesDetected}
/>
```

### Alternatives Considered

- **Expo Camera + separate ML library**: Would require integrating TensorFlow Lite or Vision Camera (more complex)
- **Manual photo capture without validation**: Rejected per spec requirement (FR-005: capture only when face centered)
- **Backend-based face detection**: Too slow for real-time feedback (would need to capture first, then validate)

---

## 4. Backend API Integration

### Decision

Multi-step async workflow: Upload image → Poll task status → Generate routine → Poll routine completion. Backend uses multi-pass LLM analysis requiring status polling.

### Rationale

- Backend API documentation (`docs/frontend_integration.md`) specifies async task-based workflow
- Analysis runs in background with progressive status updates (queued → processing → completed)
- API base URL from `EXPO_PUBLIC_FACE_API_BASE_URL` env var
- All endpoints require Supabase Bearer token authentication
- Polling every 1.5 seconds balances responsiveness and server load

### API Workflow

**Step 1: Start Analysis**

- Endpoint: `POST /start-task`
- Headers: `Authorization: Bearer <supabase_token>`
- Body: FormData with `image` (File) and optional `real_age` (number)
- Response: `{ task_id: string }`

**Step 2: Poll Task Status**

- Endpoint: `GET /tasks/{task_id}`
- Headers: `Authorization: Bearer <supabase_token>`
- Response: `TaskStatusResponse` (see schema below)
- Status values: `queued | processing | global_profile_complete | texture_complete | pigmentation_complete | acne_complete | aging_complete | completed | failed`
- Poll until `status === "completed"`

**Step 3: Generate Routine (Optional)**

- Endpoint: `POST /recommend`
- Headers: `Authorization: Bearer <supabase_token>`, `Content-Type: application/json`
- Body: `{ task_id: string, intake: RoutineIntake }`
- Response (202): `{ task_id: string, poll_path: string }`

**Step 4: Poll for Routine**

- Endpoint: `GET /tasks/{task_id}` (same as Step 2)
- Poll until `routine_json !== null`

### Implementation Pattern

```typescript
// features/scans/face-analysis-api.ts
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_FACE_API_BASE_URL;

// Start analysis
export async function startAnalysis(
  imageUri: string,
  realAge: number | undefined,
  token: string
): Promise<{ task_id: string }> {
  const formData = new FormData();

  // Convert local URI to blob for upload
  const response = await fetch(imageUri);
  const blob = await response.blob();
  formData.append('image', blob, 'selfie.jpg');

  if (realAge !== undefined) {
    formData.append('real_age', String(realAge));
  }

  const apiResponse = await fetch(`${API_BASE_URL}/start-task`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!apiResponse.ok) {
    const error = await apiResponse.json();
    throw new APIError(apiResponse.status, error.detail);
  }

  return apiResponse.json();
}

// Poll task status
export async function pollTaskStatus(
  taskId: string,
  token: string
): Promise<TaskStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(response.status, error.detail);
  }

  return response.json();
}

// Poll until complete with timeout
export async function pollUntilComplete(
  taskId: string,
  token: string,
  maxWaitMs: number = 300000 // 5 minutes
): Promise<TaskStatusResponse> {
  const startTime = Date.now();
  const pollInterval = 1500; // 1.5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const payload = await pollTaskStatus(taskId, token);

    if (payload.status === 'completed') {
      return payload;
    }

    if (payload.status === 'failed') {
      throw new Error(payload.error || 'Analysis failed');
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Analysis timeout - exceeded 5 minutes');
}

// Generate routine
export async function generateRoutine(
  taskId: string,
  intake: RoutineIntake,
  token: string
): Promise<{ task_id: string; poll_path: string }> {
  const response = await fetch(`${API_BASE_URL}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ task_id: taskId, intake }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(response.status, error.detail);
  }

  return response.json();
}

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}
```

### TypeScript Schemas (from docs/frontend_integration.md)

```typescript
// Task status response
export interface TaskStatusResponse {
  task_id: string;
  status: 'queued' | 'processing' | 'global_profile_complete' |
          'texture_complete' | 'pigmentation_complete' | 'acne_complete' |
          'aging_complete' | 'completed' | 'failed';
  result: UpgradedFaceAnalysisResult | null;
  error: string | null;
  routine_json: RoutinePlan | null;
}

// Face analysis result
export interface UpgradedFaceAnalysisResult {
  global_profile: GlobalProfile;
  issues: IssuesCollection;
}

export interface GlobalProfile {
  skin_type: { label: string; confidence: number };
  skin_tone: { lightness: string; undertone: string };
  skin_age: { estimated_age: number; relative_to_real_age: string };
  scores: {
    overall: number;
    wrinkles: number;
    dark_circles: number;
    oily_shine: number;
    pores: number;
    blackheads: number;
    acne: number;
    sensitivity_redness: number;
    pigmentation: number;
    hydration: number;
    roughness: number;
  };
  summary_description: string;
}

export interface IssuesCollection {
  oily_shine: IssueItem[];
  dryness_dehydration: IssueItem[];
  enlarged_pores_texture: IssueItem[];
  blackheads: IssueItem[];
  acne_active: IssueItem[];
  acne_scars_post_inflammatory: IssueItem[];
  pigmentation_brown_spots: IssueItem[];
  freckles: IssueItem[];
  melasma_like_patches: IssueItem[];
  redness_sensitivity: IssueItem[];
  wrinkles_and_fine_lines: IssueItem[];
  eye_bags: IssueItem[];
  dark_circles: IssueItem[];
  moles_or_nevi: IssueItem[];
}

export interface IssueItem {
  region: string;
  intensity: number;
  area: number;
  description: string;
}

// Routine recommendation
export interface RoutineIntake {
  sensitivity?: 'low' | 'medium' | 'high' | 'unsure';
  pregnancy?: 'yes' | 'no' | 'prefer_not_to_say';
  rx_topical?: 'yes' | 'no' | 'unsure';
  allergies?: string[];
  fitzpatrick?: 'I-II' | 'III-IV' | 'V-VI' | 'unsure';
  current_actives?: string[];
  country?: string | null;
  budget_preference?: 'budget' | 'mid' | 'premium' | 'no_pref';
}

export interface RoutinePlan {
  routine: {
    am: RoutineStep[];
    midday?: RoutineStep[];
    pm: RoutineStep[];
  };
  reasons: {
    prioritized_concerns: Array<{
      key: string;
      severity: string;
      why: string;
    }>;
    notes: string;
  };
  warnings: string[];
  lifestyle: {
    sleep: string;
    stress: string;
    sun: string;
    habits: string;
    routine_hygiene: string;
    diet: {
      increase: string[];
      limit: string[];
      supplements: string[];
    };
  };
}

export interface RoutineStep {
  type: 'cleanser' | 'active' | 'moisturizer' | 'sunscreen' | 'refresh' | 'other';
  instructions: {
    how: string;
    frequency: string;
    timing: string;
  };
  products: Array<{
    id?: string;
    brand: string;
    name: string;
    tier: 'budget' | 'mid' | 'premium';
    url: string;
    why: string;
  }>;
}
```

### Error Handling Strategy

- **401 Unauthorized**: Token expired → redirect to sign-in
- **403 Forbidden**: Accessing another user's task → show error
- **404 Not Found**: Task doesn't exist → show error
- **400 Bad Request**: Invalid image or data → show validation error
- **500 Server Error**: Backend issue → show "Try again later" with retry
- **Network errors**: No connection → show "Check your connection"
- **Timeout (5 min)**: Still processing → allow cancel or continue polling
- No defensive retries (per constitution Principle I)

### UI Flow

1. User captures photo → Show "Uploading..."
2. Call `startAnalysis()` → Get `task_id`
3. Navigate to result screen → Show "Analyzing..." with status text
4. Poll `pollTaskStatus()` every 1.5s → Update status text based on `status` field
   - "Analyzing skin type..." (global_profile_complete)
   - "Analyzing texture..." (texture_complete)
   - "Analyzing pigmentation..." (pigmentation_complete)
   - etc.
5. When `status === "completed"` → Display `result` data
6. User fills routine intake form → Call `generateRoutine()`
7. Continue polling same `task_id` → Wait for `routine_json !== null`
8. Display routine recommendations

### Alternatives Considered

- **Single blocking request**: Backend uses multi-pass LLM workflow (30-60s), would timeout
- **WebSocket**: Adds complexity; polling is simpler for mobile and handles reconnection naturally
- **Storing task_id only**: Store full response to avoid re-fetching after app restart

---

## 5. State Management Architecture

### Decision

Zustand stores for each feature domain with AsyncStorage persistence middleware.

### Rationale

- Lightweight (no Provider boilerplate like Redux/Context)
- Built-in persist middleware for AsyncStorage sync
- Easy to test (import store directly)
- Constitution Principle IV: Single source of truth per domain

### Store Pattern

```typescript
// features/scans/stores/scan-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanRun {
  id: string;
  photoUri: string;
  status: 'captured' | 'processing' | 'complete' | 'error';
  result?: AnalysisResponse;
  createdAt: string;
  updatedAt: string;
}

interface ScanStore {
  runs: ScanRun[];
  currentRunId: string | null;

  createRun: (photoUri: string) => string;
  updateRun: (id: string, updates: Partial<ScanRun>) => void;
  deleteRun: (id: string) => void;
  getRun: (id: string) => ScanRun | undefined;
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set, get) => ({
      runs: [],
      currentRunId: null,

      createRun: (photoUri) => {
        const id = `run-${Date.now()}`;
        const run: ScanRun = {
          id,
          photoUri,
          status: 'captured',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ runs: [run, ...state.runs], currentRunId: id }));
        return id;
      },

      updateRun: (id, updates) => {
        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === id
              ? { ...run, ...updates, updatedAt: new Date().toISOString() }
              : run
          ),
        }));
      },

      deleteRun: (id) => {
        set((state) => ({
          runs: state.runs.filter((run) => run.id !== id),
          currentRunId: state.currentRunId === id ? null : state.currentRunId,
        }));
      },

      getRun: (id) => get().runs.find((run) => run.id === id),
    }),
    {
      name: 'scan-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Store Organization

- `useAuthStore`: Session, user profile
- `useOnboardingStore`: 5 question answers, completion flag
- `useScanStore`: All scan runs and current run
- `useSettingsStore`: User preferences, app config

### Alternatives Considered

- **React Context**: Would need multiple providers, more boilerplate
- **Redux Toolkit**: Too heavy for app scope (4 stores vs. Redux global state)
- **Jotai/Recoil**: Atomic state overkill for bounded domains
- **Zustand without persist**: Wouldn't survive app restarts (spec requirement FR-002)

---

## 6. Onboarding Question Flow

### Decision

5-screen carousel with Reanimated swipe gestures and progress bar, answers stored in Zustand.

### Rationale

- Spec FR-002: Exactly 5 questions, one per screen
- Reanimated shared values for smooth 60fps transitions (Principle III)
- AsyncStorage persistence to resume mid-flow (Principle IV)

### Question Schema

```typescript
// features/onboarding/questions.ts
export interface Question {
  id: string;
  title: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: string[];
  placeholder?: string;
}

export const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: 'age',
    title: 'What is your age?',
    type: 'scale', // Number picker
  },
  {
    id: 'skinType',
    title: 'What is your skin type?',
    type: 'single',
    options: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'],
  },
  {
    id: 'concerns',
    title: 'What are your main skin concerns?',
    type: 'multiple',
    options: ['Acne', 'Dark spots', 'Wrinkles', 'Redness', 'Dryness', 'Oiliness'],
  },
  {
    id: 'routine',
    title: 'Do you have a current skincare routine?',
    type: 'single',
    options: ['Yes, consistent', 'Yes, sometimes', 'No'],
  },
  {
    id: 'goals',
    title: 'What are your skincare goals?',
    type: 'text',
    placeholder: 'E.g., clear skin, anti-aging...',
  },
];
```

### Gesture Implementation

```typescript
// Simplified - full implementation in tasks
const translateX = useSharedValue(0);
const gesture = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  })
  .onEnd(() => {
    if (translateX.value < -100) {
      goToNextQuestion();
    } else if (translateX.value > 100) {
      goToPreviousQuestion();
    }
    translateX.value = withSpring(0);
  });
```

### Alternatives Considered

- **Single-page form**: Less engaging, doesn't meet "one screen per question" requirement
- **React Native ViewPager**: Deprecated, Reanimated is constitution requirement
- **Hardcoded questions**: Typed array allows future CMS integration

---

## 7. Navigation Architecture

### Decision

Expo Router file-based routing with grouped routes for auth/onboarding/tabs.

### Rationale

- Already configured in project (`expo-router` plugin in app.json)
- Type-safe routes via `typedRoutes` experiment
- Simpler than manually configuring React Navigation stacks
- Natural fit for tab bar + modal flows

### Route Structure

```
app/
  _layout.tsx              → Root layout (auth gate)
  (auth)/
    _layout.tsx            → Auth stack
    signin.tsx             → Sign-in screen
  (onboarding)/
    _layout.tsx            → Onboarding stack
    welcome.tsx            → 5-question flow
  (tabs)/
    _layout.tsx            → Bottom tabs
    index.tsx              → Home (tab 1)
    scan.tsx               → Scan (modal from home)
    history.tsx            → History (tab 2)
    track.tsx              → Track (tab 3)
    settings.tsx           → Settings (tab 4)
  (results)/
    [runId].tsx            → Result detail (modal from history)
```

### Navigation Guards

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const session = useAuthStore((s) => s.session);
  const onboardingComplete = useOnboardingStore((s) => s.complete);

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/signin');
    } else if (!onboardingComplete) {
      router.replace('/(onboarding)/welcome');
    }
  }, [session, onboardingComplete]);

  return <Slot />;
}
```

### Alternatives Considered

- **React Navigation manual setup**: More boilerplate than Expo Router
- **Separate navigation package**: Constitution prefers Expo SDK first-party

---

## 8. Testing Strategy

### Decision

Manual iOS simulator testing with documented test scenarios per user story.

### Rationale

- Spec mentions "Expo Test + component story/playground" but no specific test framework
- Constitution QA gate: iOS simulator validation before merge
- Focus on happy path + edge cases from spec (FR-001 through FR-009)

### Test Checklist (per spec Success Criteria)

- [ ] SC-001: Complete auth + 5-question onboarding in <90s without crash
- [ ] SC-002: Scan-to-result flow completes in <5s (mocked) at 55+ fps
- [ ] SC-003: History lists 10 runs, opens detail in <1s
- [ ] SC-004: Tab navigation <100ms latency, preserves state
- [ ] SC-005: Zero unnecessary try/catch blocks (manual code review)

### Automated Tests (Future)

- Unit tests for store actions (Zustand)
- Integration tests for API client (mock fetch)
- Component tests for UI primitives (React Native Testing Library)

### Alternatives Considered

- **Full Jest/RTL test suite**: Would delay feature delivery (can add post-MVP)
- **E2E with Detox**: Requires separate setup, constitution allows manual for now
- **Storybook**: Nice-to-have but not blocking (constitution mentions it optionally)

---

## Summary of Resolved Clarifications

| Item | Resolution |
|------|------------|
| Design system | Creating minimal iOS HIG-inspired tokens in `constants/Tokens.ts` |
| Supabase OAuth | Using `signInWithOAuth` + `expo-web-browser` with `facefit://auth` redirect |
| Face detection | `react-native-face-detector-camera` with centering validation in hook |
| Backend API | Async workflow: POST /start-task → poll GET /tasks/{id} → POST /recommend → poll for routine |
| State management | Zustand stores per domain with AsyncStorage persistence |
| Onboarding questions | 5-screen carousel with typed question array and Reanimated gestures |
| Navigation | Expo Router file-based with grouped auth/onboarding/tabs routes |
| Testing | Manual iOS simulator validation per success criteria checklist |

**Phase 0 Complete** ✅
Ready to proceed to Phase 1: Data model and API contracts.
