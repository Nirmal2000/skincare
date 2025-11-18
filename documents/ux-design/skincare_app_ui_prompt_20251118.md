# Skincare App UI Implementation Prompt

**Generated**: 2025-11-18
**Target Platform**: iOS (React Native + Expo SDK 54)
**Design System**: `/documents/designs/skincare_app_design_system.md`
**Spec Reference**: `/specs/001-skin-scan-flow/spec.md`

---

## Goal

You are a Senior Mobile UI Engineer at a FANG-level company. Your task is to implement a complete skincare analysis mobile app UI that combines clinical precision with emotional warmth, following the extracted design system and technical requirements below.

---

## Aesthetic Principles

### Core Design Philosophy

**Modern Wellness Aesthetic**: Balance clinical precision (face detection, skin analysis) with emotional warmth (soft pastels, generous white space) to create a trustworthy yet inviting environment for users receiving sensitive feedback about their appearance.

**Visual Hierarchy through Warmth**:
- Soft pastels (blush pinks #FFF5F8, lavenders #E8E8F0) create breathing room
- Vibrant gradient CTAs (#FF2D92 → #E91E8C) encourage action without aggression
- Circular forms and rounded corners (16-28dp) maintain gentleness throughout

**Strategic Negative Space**:
- 24dp horizontal screen margins for cognitive breathing room
- 12-20dp card spacing prevents visual overwhelm
- White space prioritized around sensitive content (scan results, issue markers)

**Systematic Color Theory**:
- Brand Pink (#FF2D92) for primary actions and progress
- Success Green (#00C853) for face detection approval signals
- White dot overlays (40% opacity) for clinical skin issue visualization
- Gradient overlays on camera (rgba(0,0,0,0.4)) ensure text contrast

**Typographic Hierarchy**:
- SF Pro Display/Text (iOS native) for zero bundle impact
- Bold 32px headings establish authority, 15-17px body maintains readability
- Weight variations (400/500/600/700) build information architecture without size jumps

**Motion Choreography**:
- Reanimated v4 for 60fps transitions (required by constitution)
- 300ms ease-out for screen transitions, 400ms spring for emphasized actions
- Face detection "OK" indicator: 150ms pulse + 500ms color transition (gray→green)
- Progress bar animations: 1500ms linear width updates

**Accessibility-First Contrast**:
- 44dp minimum touch targets (all buttons meet or exceed)
- WCAG AA contrast ratios (Brand Pink darkened to #C7005C on white for body text)
- Haptic feedback via iOS Haptics API (scan capture, errors, confirmations)

---

## Project-Specific Design Guidelines

### Color Palette

```typescript
// Primary Colors
const brandPink = '#FF2D92';       // CTA buttons, active states, progress
const brandMagenta = '#E91E8C';    // Gradient end stops
const backgroundBlush = '#FFF5F8'; // Main screen backgrounds
const lavender = '#E8E8F0';        // Inactive surfaces, option cards

// Functional Colors
const successGreen = '#00C853';    // Face detection OK, confirmations
const accentCyan = '#4DD0E1';      // Skin issue markers (pores)
const textPrimary = '#1A1A1A';     // Headings, body text
const textSecondary = '#6B6B6B';   // Captions, metadata
const white = '#FFFFFF';           // Cards, pure surfaces
const overlayDark = 'rgba(0,0,0,0.6)'; // Camera dimming
```

### Typography System

```typescript
const Typography = {
  h1: { fontSize: 32, lineHeight: 38, fontWeight: '700' }, // Screen titles
  h2: { fontSize: 24, lineHeight: 30, fontWeight: '700' }, // Section headers
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' }, // Card titles
  bodyLarge: { fontSize: 17, lineHeight: 24, fontWeight: '400' }, // Main content
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' }, // Standard text
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' }, // Supporting
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' }, // Metadata
  button: { fontSize: 16, lineHeight: 24, fontWeight: '600' }, // CTAs
};
```

### Component Styles

**Primary Button (CTA)**:
```typescript
{
  background: 'linear-gradient(180deg, #FF2D92 0%, #E91E8C 100%)',
  height: 56,
  borderRadius: 28, // Pill shape
  paddingHorizontal: 32,
  // Text: white, 16px, weight 600
}
```

**Option Card Button (Selection)**:
```typescript
{
  background: '#E8E8F0', // Default
  activeBackground: '#FFFFFF', // When selected
  height: 64,
  borderRadius: 16,
  padding: 24,
  activeBorder: '3px solid #FF2D92',
  shadow: { offsetY: 2, blur: 8, opacity: 0.04 }, // Active only
}
```

**Standard Card**:
```typescript
{
  background: '#FFFFFF',
  borderRadius: 20,
  padding: 20,
  shadow: { offsetY: 2, blur: 12, opacity: 0.06 },
}
```

**Face Detection Overlay**:
```typescript
{
  shape: 'oval',
  border: '3px solid #00C853', // When face detected + centered
  dimensions: { width: 280, height: 360 }, // Dynamic to face bounds
  shadow: { blur: 20, color: 'rgba(0,200,83,0.4)' }, // Active glow
}
```

**Progress Bar**:
```typescript
{
  height: 4,
  background: '#E8E8F0',
  foreground: '#FF2D92',
  borderRadius: 2,
  animation: { duration: 1500, easing: 'linear' },
}
```

### Spacing Scale

```typescript
const Spacing = {
  micro: 2,   // Inline element gaps
  tiny: 4,    // List item tight spacing
  small: 8,   // Icon-text gaps
  base: 12,   // List item margins
  default: 16, // Card padding
  medium: 20, // Card corner radius
  large: 24,  // Screen margins
  xl: 32,     // Section separation
  xxl: 48,    // Bottom nav clearance
  xxxl: 64,   // Hero spacing
};
```

---

## App Overview (MVP PRD)

### Elevator Pitch

A mobile skincare companion that captures your selfie with real-time face detection, analyzes your skin concerns via ML-powered backend, and delivers personalized daily routines—all wrapped in a warm, trustworthy interface.

### Problem Statement

Users want professional skin analysis without intimidation or complexity. Existing apps are either too clinical (medical portals) or too superficial (beauty filters). This app bridges clinical precision with emotional accessibility.

### Target Audience

- Age: 18-45, primarily female-identifying
- Behavior: Skincare-conscious, tech-comfortable, values self-care rituals
- Pain Points: Inconsistent routines, unclear product choices, lack of personalized guidance

### Unique Selling Proposition

1. **Face-First Capture**: Real-time face detection ensures quality selfies without retakes
2. **Warm Clinical Aesthetic**: Precise analysis presented in soft, approachable UI
3. **Progressive Personalization**: Onboarding questions + scan results = tailored routines

### Platform Target

iOS 17+ via Expo managed workflow (React Native 0.81, Expo SDK 54)

---

## Feature List & User Stories

### Feature 1: Authentication & Onboarding (Priority P1)

**User Story**: As a new user, I launch the app, complete FE auth, and answer 5 onboarding questions (one per screen) so my profile is ready for personalized analysis.

**Screens**:
1. **Sign-In Screen** (`app/(auth)/signin.tsx`)
   - Google/Apple OAuth buttons (Supabase SDK)
   - Redirect scheme: `facefit://auth`
   - Minimal design: Logo, headline, two CTA buttons

2. **Onboarding Carousel** (`app/(onboarding)/welcome.tsx`)
   - 5 question screens with Reanimated horizontal swipe gestures
   - Progress bar at top (4dp height, Brand Pink fill)
   - Question text (32px bold), option cards (64dp height, lavender background)
   - "Next" button (primary CTA, 56dp pill) at bottom
   - Back navigation (icon button, 44dp circular, top-left)

**UX Considerations**:
- Persist answers via Zustand + AsyncStorage (resume on relaunch)
- Swipe gestures feel springy (400ms, damping 15)
- Progress bar animates 1500ms linear on question advance
- Option cards scale 0.97→1.0 on press (200ms ease-out)

---

### Feature 2: Home Hub & Bottom Tabs (Priority P2)

**User Story**: As an onboarded user, I arrive at Home where I see my last scan summary and a hero "Scan" CTA, with persistent bottom navigation to Home, History, Settings, Track.

**Screens**:
1. **Home Screen** (`app/(tabs)/index.tsx`)
   - Hero section: "Ready to scan?" headline + primary CTA button
   - Last scan summary card (if exists): thumbnail, timestamp, top concern
   - Background: Blush White (#FFF5F8)
   - Screen margins: 24dp horizontal, 32dp top

2. **Bottom Tab Bar** (`app/(tabs)/_layout.tsx`)
   - 4 tabs: Home, History, Track, Settings
   - Icon size: 28dp, active color: Brand Pink, inactive: Text Tertiary
   - Height: 80dp (includes safe area), background: White
   - Active indicator: Sliding dot below icon (Reanimated withTiming 300ms)

**UX Considerations**:
- Tab transitions <100ms latency (constitution requirement)
- Active tab icon scales 1.0→1.1 on press (150ms ease-in-out)
- Bottom nav stays visible across all tab screens

---

### Feature 3: Scan & Result Flow (Priority P2)

**User Story**: As a user, I tap "Scan", see my camera with face detection guides, capture a selfie, and view my scan results with skin issue overlays.

**Screens**:
1. **Scan Screen** (`app/(tabs)/scan.tsx`)
   - Full-screen camera preview (Expo Camera)
   - Dark background (#2C2C2E) with top/bottom gradient overlays
   - Top-left: Back button (X icon, 44dp, white)
   - Top-right: Reference image thumbnail (60dp circular, white border)
   - Center: Oval face detection overlay (280×360dp, 3dp green border when OK)
   - Top-center: Status badge ("OK" with sun icon, 48dp circular, green)
   - Bottom-center: "Start" button (72dp circular, white, 4dp shadow)

2. **Result Screen** (`app/(results)/[runId].tsx`)
   - Top: Close button (X icon, top-right, 44dp)
   - Timestamp badge (rounded, top-center, dark overlay)
   - Full-width captured photo (aspect ratio 3:4)
   - Skin issue overlays: White dots (4-8dp, 40% opacity), cyan dots for pores
   - Filter chips below photo: "All", "Wrinkles", "Visible Pores" (scrollable)
   - Backend response card: White card, 20dp radius, 20dp padding
   - Loading state: Shimmer skeleton (1200ms linear gradient sweep)

**UX Considerations**:
- Face detection updates every 200ms (constitution performance goal)
- "Start" button disabled (50% opacity) until face centered
- Haptic feedback on capture (iOS Haptics.impactAsync 'medium')
- Scan-to-result under 5 seconds (mocked backend, constitution goal)
- Result overlay dots fade in sequentially (50ms stagger)

---

### Feature 4: History & Track (Priority P3)

**User Story**: As a returning user, I view my scan history and longitudinal skin metrics.

**Screens**:
1. **History Screen** (`app/(tabs)/history.tsx`)
   - List of scan runs: thumbnail (80dp square, 16dp radius), timestamp, status chip
   - List item: White card, 16dp radius, 16dp padding, 12dp margin-bottom
   - Layout animation: Reanimated Layout.springify() on mount
   - Empty state: Illustration + "Start your first scan" CTA

2. **Track Screen** (`app/(tabs)/track.tsx`)
   - Placeholder for charts/metrics
   - Header: "Your Progress" (24px bold)
   - Cards for streaks, skin score trends (future iteration)

**UX Considerations**:
- History list scrolls smoothly (60fps via FlashList or FlatList with Reanimated)
- Tap list item → navigate to result detail (same as Feature 3 screen 2)
- Pull-to-refresh: Reanimated gesture + spinner (Brand Pink)

---

### Feature 5: Settings (Priority P3)

**User Story**: As a user, I manage my profile, edit onboarding answers, and sign out.

**Screens**:
1. **Settings Screen** (`app/(tabs)/settings.tsx`)
   - Profile card: Avatar, name, email (from Supabase auth)
   - Action list: "Edit onboarding", "Notifications", "Sign out"
   - List items: White card, 64dp height, chevron right icon
   - Sign out: Destructive red text, confirmation modal

**UX Considerations**:
- "Edit onboarding" → reopens carousel with pre-filled answers
- Sign out → clears Zustand stores + AsyncStorage + Supabase session
- Confirmation modal: Blurred background, centered card, 300ms ease-out

---

## Implementation Tasks

### Phase 1: Foundation (Design System Setup)

1. **Create `constants/Tokens.ts`**
   - Export Colors, Typography, Spacing, BorderRadius, Shadows
   - TypeScript strict types for all tokens

2. **Create Base Components** (`components/`)
   - `<Button>` - Primary, Secondary, Icon, Circular variants
   - `<Card>` - Standard, List Item variants
   - `<ScreenContainer>` - SafeAreaView + 24dp margins
   - `<ProgressBar>` - Linear with Reanimated width animation

3. **Setup Expo Router Navigation**
   - Configure `app/_layout.tsx` with auth gate
   - Define route groups: `(auth)`, `(onboarding)`, `(tabs)`, `(results)`

---

### Phase 2: Authentication & Onboarding

4. **Implement Sign-In Screen** (`app/(auth)/signin.tsx`)
   - Supabase OAuth buttons (Google/Apple via expo-web-browser)
   - Minimal layout: Logo, headline, two CTAs
   - Session persistence via AsyncStorage

5. **Build Onboarding Carousel** (`app/(onboarding)/welcome.tsx`)
   - 5 question screens with horizontal PanGestureHandler (Reanimated)
   - `<OptionCard>` component with active state (border, shadow)
   - Progress bar component with animated width (useSharedValue)
   - Zustand store: `useOnboardingStore` with AsyncStorage persistence

---

### Phase 3: Home & Bottom Tabs

6. **Create Home Screen** (`app/(tabs)/index.tsx`)
   - Hero section with primary CTA
   - Last scan summary card (conditional rendering)
   - Blush White background

7. **Build Bottom Tab Bar** (`app/(tabs)/_layout.tsx`)
   - Custom tab bar component with Reanimated sliding indicator
   - 4 tabs: Home, History, Track, Settings
   - Icon scaling on press (Reanimated useAnimatedStyle)

---

### Phase 4: Scan Flow

8. **Implement Scan Screen** (`app/(tabs)/scan.tsx`)
   - Expo Camera with `react-native-face-detector-camera`
   - `<FaceDetectionOverlay>` component (oval SVG, animated border color)
   - Status badge ("OK" indicator with sun icon, Reanimated pulse)
   - Circular "Start" button with haptic feedback
   - Gradient overlays (top/bottom) via LinearGradient

9. **Create useScanWorkflow Hook** (`features/scans/useScanWorkflow.ts`)
   - Capture photo → create ScanRun → navigate to result
   - Zustand store: `useScanStore` with CRUD actions
   - Polling logic for backend status (mocked 5s delay)

10. **Build Result Screen** (`app/(results)/[runId].tsx`)
    - Display captured photo (Image with aspectRatio 3:4)
    - `<SkinIssueMarker>` component (white/cyan dots, sequential fade-in)
    - Filter chips (ScrollView horizontal, option cards)
    - Backend response card with shimmer loading skeleton
    - Close button → navigate back to Home

---

### Phase 5: History & Track

11. **Create History Screen** (`app/(tabs)/history.tsx`)
    - FlashList/FlatList with Reanimated Layout.springify()
    - List item component: thumbnail, timestamp, status chip
    - Pull-to-refresh (Reanimated gesture + spinner)
    - Empty state illustration

12. **Placeholder Track Screen** (`app/(tabs)/track.tsx`)
    - Header + cards for future metrics
    - Static layout for now (charts in future iteration)

---

### Phase 6: Settings

13. **Implement Settings Screen** (`app/(tabs)/settings.tsx`)
    - Profile card (Supabase user data)
    - Action list: Edit onboarding, Notifications, Sign out
    - Sign out confirmation modal (Reanimated useSharedValue for visibility)

---

### Phase 7: Polish & Animations

14. **Add Haptic Feedback**
    - Button presses, scan capture, errors (Expo.Haptics)

15. **Implement Screen Transitions**
    - Reanimated slide transitions (300ms ease-out)
    - Modal presentations (400ms spring)

16. **Test Constitution Compliance**
    - 60fps check (Expo Performance Monitor)
    - No `Animated` API usage (only Reanimated)
    - No try/catch except around network calls (constitution requirement)

---

## Technical Requirements

### Must-Have Dependencies

```json
{
  "expo": "~54.0.0",
  "react-native": "0.81.0",
  "expo-router": "^4.0.0",
  "react-native-reanimated": "^4.0.0",
  "react-native-gesture-handler": "^2.22.0",
  "@supabase/supabase-js": "^2.50.0",
  "zustand": "^5.0.2",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "expo-camera": "~16.0.0",
  "react-native-face-detector-camera": "^1.0.0",
  "expo-haptics": "~14.0.0",
  "expo-linear-gradient": "~14.0.0"
}
```

### Constitution Compliance Checklist

- [ ] All animations use Reanimated v4 (no `Animated` API)
- [ ] All features testable on iOS simulator via `npx expo run:ios`
- [ ] No custom native modules outside Expo SDK
- [ ] Try/catch only around network/API calls (no defensive fallbacks)
- [ ] Face detection updates ≥200ms intervals
- [ ] Scan-to-result <5 seconds (mocked flow)
- [ ] Tab navigation <100ms latency
- [ ] 60fps target for all Reanimated transitions
- [ ] Single source of truth: Zustand stores + AsyncStorage persistence
- [ ] No prop drilling beyond 2 levels
- [ ] All API responses typed via TypeScript

---

## Output Specifications

### Component Organization

```
components/
├── buttons/
│   ├── PrimaryButton.tsx
│   ├── OptionCard.tsx
│   └── IconButton.tsx
├── cards/
│   ├── StandardCard.tsx
│   └── ListItemCard.tsx
├── overlays/
│   ├── FaceDetectionOverlay.tsx
│   └── SkinIssueMarker.tsx
├── navigation/
│   ├── TabBar.tsx
│   └── TabBarIcon.tsx
├── ui/
│   ├── ProgressBar.tsx
│   ├── LoadingShimmer.tsx
│   └── ScreenContainer.tsx
└── index.ts
```

### File Naming Conventions

- Components: PascalCase (`PrimaryButton.tsx`)
- Hooks: camelCase with `use` prefix (`useScanWorkflow.ts`)
- Stores: kebab-case with `-store` suffix (`onboarding-store.ts`)
- Screens: kebab-case matching route (`signin.tsx`, `[runId].tsx`)

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Functional components with hooks (no class components)
- Reanimated worklets for all animations
- Zustand for state management (no Context API for global state)

---

## Design Variations (Optional Enhancement)

Create 3 design variations for the **Onboarding Question Screen** to explore layout alternatives:

**Variation 1: Vertical Stack (Current)**
- Question text at top (32px bold)
- Option cards stacked vertically (64dp each)
- Next button fixed at bottom

**Variation 2: Horizontal Carousel**
- Swipeable option cards (280dp width)
- Horizontal scroll indicator dots below
- Larger card size for visual focus

**Variation 3: Grid Layout**
- 2-column grid for options (if ≤4 choices)
- Reduced card height (56dp)
- Faster scanning for power users

Implement Variation 1 by default, create Variations 2 & 3 as separate components in `app/(onboarding)/variations/` for future A/B testing.

---

## Success Criteria

### Measurable Outcomes

1. **Performance**: 60fps on all Reanimated transitions (Expo Performance Monitor)
2. **Speed**: Onboarding completion <90 seconds, scan-to-result <5 seconds
3. **Accessibility**: All buttons ≥44dp, WCAG AA contrast ratios, screen reader labels
4. **Constitution**: Zero violations (no `Animated` API, no speculative try/catch)
5. **Code Quality**: TypeScript strict mode, ESLint passing, <5% unused exports

### User Experience Goals

- Users feel **confident** (face detection approval signals, clear guidance)
- Users feel **supported** (warm color palette, generous white space)
- Users feel **efficient** (quick scan flow, persistent navigation)
- Users feel **informed** (detailed results, longitudinal tracking)

---

## Next Steps

1. Review this prompt and the referenced design system document
2. Set up Expo project with required dependencies
3. Implement Phase 1 (foundation) first to establish token system
4. Build incrementally following Phases 2-7
5. Test each feature independently on iOS simulator (constitution requirement)
6. Run `/speckit.tasks` command to generate granular task breakdown

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Maintained By**: Claude Code (ui-designer skill)
**Ready for**: Implementation
