/**
 * Design System Tokens
 * Source: documents/designs/skincare_app_design_system.md
 * Platform: iOS mobile (React Native/Expo)
 */

export const Colors = {
//gomms
  darkBackground: '#050509',

  // Brand Core
  brandPrimary: '#4D7CFF',        // Strong blue used for active states (e.g., Day 1)
  brandSecondary: '#A6B8FF',      // Soft blue-lavender used in header gradient accents

  // Neutrals / Surfaces
  white: '#FFFFFF',
  appBackground: '#FAFAFC',       // Soft cool white
  backgroundLight: '#F5F6FA',     // Light neutral background
  surfaceCard: '#FFFFFF',         // Cards in the daily plan
  surfaceSecondary: 'rgba(255, 255, 255, 0.25)', // overlays on gradients

  // Text
  textPrimary: '#1A1B1F',         // Strong dark charcoal
  textSecondary: '#6E7180',       // Medium gray (subtitles)
  textTertiary: '#A7A9B4',        // Disabled, hints, locked tasks

  // Accents
  accentBlue: '#4D7CFF',          // Primary action color
  accentCyan: '#66D1FF',          // Optional accent for icons / scan button glow

  // Success / System
  successGreen: '#00C853',
  black: '#000000',

  // Borders
  borderSoft: 'rgba(0, 0, 0, 0.05)',
  borderSubtle: '#E2E4EE',

  // Overlays
  overlayDark: 'rgba(0, 0, 0, 0.45)',

  // Gradients
  gradients: {
    header: [
      '#DDE3FF', // very soft blue
      '#EEF1FF', // pale lavender
      '#FFFFFF'  // fades into white
    ],
    bottomBar: [
      'rgba(255,255,255,0.95)',
      'rgba(255,255,255,1)',
    ],
  },

  // Dark Mode (optional future)
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    brandPrimary: '#6D9BFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    successGreen: '#00E676',
  },
} as const;


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
} as const;

export const FontFamily = {
  thin: 'ZTNature-Thin',
  thinItalic: 'ZTNature-ThinItalic',
  medium: 'ZTNature-Medium',
  mediumItalic: 'ZTNature-MediumItalic',
  black: 'ZTNature-Black',
  blackItalic: 'ZTNature-BlackItalic',
} as const;

export const Typography = {
  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: FontFamily.black,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: FontFamily.black,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.2,
  },

  // Body Text
  bodyLarge: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: FontFamily.medium,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.medium,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },

  // Special Text
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },
  progress: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },
} as const;

export const BorderRadius = {
  small: 8,
  medium: 16,
  large: 20,
  pill: 28,
  circle: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

export const ButtonSizes = {
  primary: {
    height: 60,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  icon: {
    size: 44,
    iconSize: 24,
    borderRadius: 22,
  },
  circular: {
    size: 72,
    borderRadius: 36,
  },
} as const;

export const CardSizes = {
  standard: {
    borderRadius: 20,
    padding: 20,
  },
  listItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  option: {
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 2,
    activeBorderWidth: 3,
  },
} as const;

export const ProgressBar = {
  height: 4,
  borderRadius: 2,
} as const;

export const Icons = {
  primary: 24,
  small: 20,
  large: 32,
  tabBar: 28,
} as const;

export const Layout = {
  screenMarginHorizontal: 24,
  cardSpacing: 12,
  maxContentWidth: '100%',
} as const;

/**
 * Animation timing constants
 */
export const Animation = {
  standard: {
    duration: 300,
    easing: 'ease-out',
  },
  emphasized: {
    duration: 400,
    damping: 15,
    stiffness: 100,
  },
  micro: {
    duration: 200,
    easing: 'ease-in-out',
  },
  progress: {
    duration: 1500,
    easing: 'linear',
  },
  faceDetection: {
    pulseDuration: 150,
    colorDuration: 500,
  },
  shimmer: {
    duration: 1200,
    easing: 'linear',
  },
} as const;

/**
 * Haptic feedback patterns
 */
export const Haptics = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;
