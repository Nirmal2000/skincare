/**
 * API Response Types
 * Source: specs/001-skin-scan-flow/data-model.md
 * Source: docs/frontend_integration.md
 */

/**
 * Face Regions that Backend Recognizes
 * Mapped from ML Kit Face Landmarks → Backend Issue Regions
 */
export type IssueRegion =
  | 'NoseBase'           // ← noseBasePosition ✅
  | 'LeftEar'            // ← leftEarPosition ✅
  | 'RightEar'           // ← rightEarPosition ✅
  | 'LeftEarTip'         // ❌ NOT AVAILABLE (ML Kit doesn't provide)
  | 'RightEarTip'        // ❌ NOT AVAILABLE (ML Kit doesn't provide)
  | 'LeftEye'            // ← leftEyePosition ✅
  | 'RightEye'           // ← rightEyePosition ✅
  | 'LeftCheek'          // ← leftCheekPosition ✅
  | 'RightCheek'         // ← rightCheekPosition ✅
  | 'MouthBottom'        // ← bottomMouthPosition ✅
  | 'MouthLeft'          // ← leftMouthPosition ✅
  | 'MouthRight'         // ← rightMouthPosition ✅
  | 'FaceOval'           // ❌ NOT AVAILABLE (ML Kit doesn't provide face contour)
  | 'LeftEyebrowTop'     // ❌ NOT AVAILABLE (ML Kit doesn't provide eyebrows)
  | 'LeftEyebrowBottom'  // ❌ NOT AVAILABLE (ML Kit doesn't provide eyebrows)
  | 'RightEyebrowTop'    // ❌ NOT AVAILABLE (ML Kit doesn't provide eyebrows)
  | 'RightEyebrowBottom' // ❌ NOT AVAILABLE (ML Kit doesn't provide eyebrows)
;

/**
 * ML Kit Landmarks → Backend Issue Region Mapping
 */
export const FACE_LANDMARK_TO_REGION: Record<string, IssueRegion> = {
  // Available landmarks (12/16 total, 75% coverage)
  noseBasePosition: 'NoseBase',
  leftEarPosition: 'LeftEar',
  rightEarPosition: 'RightEar',
  leftEyePosition: 'LeftEye',
  rightEyePosition: 'RightEye',
  leftCheekPosition: 'LeftCheek',
  rightCheekPosition: 'RightCheek',
  bottomMouthPosition: 'MouthBottom',
  leftMouthPosition: 'MouthLeft',
  rightMouthPosition: 'MouthRight',

  // Missing landmarks (4/16 total, 25% unavailable)
  // leftEarTip: 'LeftEarTip',          // ❌ ML Kit doesn't distinguish tip
  // rightEarTip: 'RightEarTip',        // ❌ ML Kit doesn't distinguish tip
  // faceOval: 'FaceOval',              // ❌ ML Kit doesn't provide face oval contour
  // leftEyebrowTop: 'LeftEyebrowTop',  // ❌ ML Kit doesn't provide eyebrows
  // leftEyebrowBottom: 'LeftEyebrowBottom', // ❌ ML Kit doesn't provide eyebrows
  // rightEyebrowTop: 'RightEyebrowTop', // ❌ ML Kit doesn't provide eyebrows
  // rightEyebrowBottom: 'RightEyebrowBottom', // ❌ ML Kit doesn't provide eyebrows
} as const;

/**
 * Backend Issue Region → Frontend ML Kit Landmark Mapping
 * Reverse mapping for resolving landmarks from regions
 */
export const ISSUE_REGION_TO_LANDMARK: Record<IssueRegion, string> = {
  // Direct 1:1 mappings
  NoseBase: 'noseBasePosition',
  LeftEar: 'leftEarPosition',
  RightEar: 'rightEarPosition',
  LeftEarTip: 'leftEarPosition',        // Map to same landmark as LeftEar
  RightEarTip: 'rightEarPosition',      // Map to same landmark as RightEar
  LeftEye: 'leftEyePosition',
  RightEye: 'rightEyePosition',
  LeftCheek: 'leftCheekPosition',
  RightCheek: 'rightCheekPosition',
  MouthBottom: 'bottomMouthPosition',
  MouthLeft: 'leftMouthPosition',
  MouthRight: 'rightMouthPosition',

  // Eyebrow mappings (using available landmarks as proxy, not actual contours)
  LeftEyebrowTop: 'leftEyePosition',     // Approximate with eye position
  LeftEyebrowBottom: 'leftEyePosition',  // Approximate with eye position
  RightEyebrowTop: 'rightEyePosition',   // Approximate with eye position
  RightEyebrowBottom: 'rightEyePosition', // Approximate with eye position

  // Face oval not available
  FaceOval: 'noseBasePosition',           // Fallback to nose as center reference
} as const;

/**
 * ML Kit landmark properties that are NOT mapped to backend regions
 */
export const UNMAPPED_LANDMARKS = [
  'bounds',        // Face bounding box
  'rollAngle',     // Face rotation angle
  'yawAngle',      // Face tilt angle
] as const;

// ============================================================================
// Task Status Response (from backend polling)
// ============================================================================

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  result: UpgradedFaceAnalysisResult | null;
  error: string | null;
  routine_json: RoutinePlan | null;
}

export type TaskStatus =
  | 'queued'
  | 'processing'
  | 'global_profile_complete'
  | 'texture_complete'
  | 'pigmentation_complete'
  | 'acne_complete'
  | 'aging_complete'
  | 'completed'
  | 'failed';

// ============================================================================
// Face Analysis Result
// ============================================================================

export interface UpgradedFaceAnalysisResult {
  global_profile: GlobalProfile;
  issues: IssuesCollection;
}

export interface GlobalProfile {
  skin_type: {
    label: 'dry' | 'oily' | 'combination' | 'normal' | 'unknown';
    confidence: number; // 0-1
  };
  skin_tone: {
    lightness: 'very_light' | 'light' | 'medium' | 'tan' | 'brown' | 'dark';
    undertone: 'yellow' | 'neutral' | 'red' | 'olive' | 'unknown';
  };
  skin_age: {
    estimated_age: number;
    relative_to_real_age: 'younger' | 'similar' | 'older' | 'unknown';
  };
  scores: {
    overall: number; // 0-100
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
  region: string; // Face region identifier
  intensity: number; // 0-1
  area: number; // 1-10 scale
  description: string;
}

// ============================================================================
// Routine Recommendation
// ============================================================================

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
    prioritized_concerns: {
      key: string;
      severity: string;
      why: string;
    }[];
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
  products: ProductRecommendation[];
}

export interface ProductRecommendation {
  id?: string;
  brand: string;
  name: string;
  tier: 'budget' | 'mid' | 'premium';
  url: string;
  why: string;
}

// ============================================================================
// API Request Payloads
// ============================================================================

export interface StartAnalysisRequest {
  image: File | Blob;
  real_age?: number;
}

export interface StartAnalysisResponse {
  task_id: string;
}

export interface GenerateRoutineRequest {
  task_id: string;
  intake: RoutineIntake;
}

export interface GenerateRoutineResponse {
  task_id: string;
  poll_path: string;
}

// ============================================================================
// API Error Response
// ============================================================================

export interface APIErrorResponse {
  detail: string;
  status?: number;
}

// ============================================================================
// Helper Types
// ============================================================================

export type IssueCategory = keyof IssuesCollection;

export type SkinType = GlobalProfile['skin_type']['label'];

export type SkinToneLightness = GlobalProfile['skin_tone']['lightness'];

export type SkinToneUndertone = GlobalProfile['skin_tone']['undertone'];

export type AgeComparison = GlobalProfile['skin_age']['relative_to_real_age'];
