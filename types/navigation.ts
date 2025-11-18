/**
 * Expo Router Navigation Types
 * Source: app/ directory structure
 */

export type RootStackParamList = {
  // Auth routes
  '(auth)/signin': undefined;

  // Onboarding routes
  '(onboarding)/welcome': undefined;

  // Tab routes
  '(tabs)': undefined;
  '(tabs)/index': undefined; // Home
  '(tabs)/scan': undefined;
  '(tabs)/history': undefined;
  '(tabs)/track': undefined;
  '(tabs)/settings': undefined;

  // Result routes
  '(results)/[runId]': { runId: string };

  // Modal routes
  'modal': undefined;
  'edit-age': undefined;
};

export type TabParamList = {
  index: undefined; // Home tab
  scan: undefined;
  history: undefined;
  track: undefined;
  settings: undefined;
};

// ============================================================================
// Navigation Prop Types
// ============================================================================

import { NavigationProp } from '@react-navigation/native';

export type AppNavigationProp = NavigationProp<RootStackParamList>;

// ============================================================================
// Route Params
// ============================================================================

export interface ResultScreenParams {
  runId: string;
}
