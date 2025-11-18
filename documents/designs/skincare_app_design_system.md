# Skincare App Design System

**Generated**: 2025-11-18
**Source**: 5 reference UI screenshots from skincare mobile app
**Platform**: iOS mobile (React Native/Expo)

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

## Dark Mode Variants

*(Not visible in provided screens; designing for future implementation)*

### Adjusted Colors

**Background Dark** - `#121212` (OLED black)
**Surface Dark** - `#1E1E1E` (card background)
**Brand Pink Adjusted** - `#FF5FA8` (increased luminance for contrast)
**Text Primary Dark** - `#FFFFFF` (pure white)
**Text Secondary Dark** - `#B0B0B0` (medium gray)
**Success Green Dark** - `#00E676` (brighter green for visibility)

### Dark Mode Shadows
Replace box-shadows with 1dp borders using `rgba(255,255,255,0.1)` to maintain depth perception on dark backgrounds.

---

## Accessibility Notes

- **Minimum Touch Target**: 44dp × 44dp (all buttons meet or exceed)
- **Color Contrast**: Brand Pink (#FF2D92) on white exceeds WCAG AA (4.5:1 for body text when darkened to #C7005C)
- **Text Sizing**: All body text ≥15px, scalable via iOS Dynamic Type
- **Focus Indicators**: 3dp Brand Pink outline on focused interactive elements
- **Screen Reader Labels**: All icon-only buttons require aria-label equivalents
- **Haptic Feedback**: Success/error patterns via iOS Haptics API (scan capture, errors)

---

## Component Library Checklist

For implementation in React Native/Expo:

- [ ] `<Button>` - Primary, Secondary, Icon, Circular variants
- [ ] `<Card>` - Standard, List Item variants
- [ ] `<ProgressBar>` - Linear (onboarding), Circular (status) variants
- [ ] `<OptionCard>` - Selection card with active state
- [ ] `<FaceDetectionOverlay>` - Animated oval with OK indicator
- [ ] `<SkinIssueMarker>` - Overlay dots for result visualization
- [ ] `<TabBar>` - Bottom navigation with icon animations
- [ ] `<ScreenContainer>` - Base layout with safe area + margins
- [ ] `<LoadingShimmer>` - Skeleton for async content

---

## Design Tokens (Constants)

```typescript
// constants/Tokens.ts
export const Colors = {
  brandPink: '#FF2D92',
  brandMagenta: '#E91E8C',
  backgroundBlush: '#FFF5F8',
  backgroundLight: '#F5F5F7',
  lavender: '#E8E8F0',
  successGreen: '#00C853',
  accentCyan: '#4DD0E1',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9E9E9E',
  white: '#FFFFFF',
  overlayDark: 'rgba(0, 0, 0, 0.6)',
};

export const Spacing = {
  micro: 2,
  tiny: 4,
  small: 8,
  base: 12,
  default: 16,
  medium: 20,
  large: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Typography = {
  h1: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  bodyLarge: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  button: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
};

export const BorderRadius = {
  small: 8,
  medium: 16,
  large: 20,
  pill: 28,
  circle: 9999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
};
```

---

## Implementation Priority

1. **Phase 1 - Core Components**: Button, Card, ScreenContainer, Typography styles
2. **Phase 2 - Onboarding**: OptionCard, ProgressBar, screen layouts
3. **Phase 3 - Scan Flow**: FaceDetectionOverlay, Camera UI, result overlays
4. **Phase 4 - Navigation**: TabBar, History list, Settings screens
5. **Phase 5 - Polish**: Animations, loading states, haptics

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Maintained By**: Claude Code (ui-designer skill)
