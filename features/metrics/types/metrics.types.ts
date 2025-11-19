export type TimeRange = '7d' | '2w' | '1m' | 'all';

export interface ScoreDataPoint {
  runId: string;
  date: string; // ISO timestamp
  score: number; // 0-100
  createdAt: string;
}

export interface IssueFrequency {
  category: string;
  displayName: string;
  count: number; // total issue instances across all scans
  scansWithIssue: number; // number of scans containing this issue
  totalScans: number;
  percentage: number; // (scansWithIssue / totalScans) * 100
  avgIntensity: number; // average intensity across all instances
}

export interface RegionFrequency {
  region: string;
  displayName: string;
  count: number; // total issues in this region
  issueTypes: string[]; // unique issue categories in this region
  avgIntensity: number;
}

export interface CategoryTrend {
  category: string;
  displayName: string;
  scoreKey: string; // key in scores object (e.g., 'acne', 'wrinkles')
  dataPoints: ScoreDataPoint[]; // sorted by date
  currentScore: number;
  trend: 'up' | 'down' | 'stable'; // based on last 2 data points
  change: number; // percentage change
}

// Map of issue category keys to display names
export const ISSUE_DISPLAY_NAMES: Record<string, string> = {
  oily_shine: 'Oily Shine',
  dryness_dehydration: 'Dryness',
  enlarged_pores_texture: 'Enlarged Pores',
  blackheads: 'Blackheads',
  acne_active: 'Active Acne',
  acne_scars_post_inflammatory: 'Acne Scars',
  pigmentation_brown_spots: 'Pigmentation',
  freckles: 'Freckles',
  melasma_like_patches: 'Melasma',
  redness_sensitivity: 'Redness',
  wrinkles_and_fine_lines: 'Wrinkles',
  eye_bags: 'Eye Bags',
  dark_circles: 'Dark Circles',
  moles_or_nevi: 'Moles',
};

// Map of score keys to display names
export const SCORE_DISPLAY_NAMES: Record<string, string> = {
  overall: 'Overall Health',
  wrinkles: 'Wrinkles',
  dark_circles: 'Dark Circles',
  oily_shine: 'Oil Control',
  pores: 'Pore Size',
  blackheads: 'Blackheads',
  acne: 'Acne',
  sensitivity_redness: 'Redness',
  pigmentation: 'Pigmentation',
  hydration: 'Hydration',
  roughness: 'Texture',
};

// Map of region keys to display names
export const REGION_DISPLAY_NAMES: Record<string, string> = {
  NoseBase: 'Nose',
  LeftEye: 'Left Eye',
  RightEye: 'Right Eye',
  MouthLeft: 'Left Mouth',
  MouthCenter: 'Mouth',
  MouthRight: 'Right Mouth',
  LeftCheekCenter: 'Left Cheek',
  RightCheekCenter: 'Right Cheek',
  LeftCheekbone: 'Left Cheekbone',
  RightCheekbone: 'Right Cheekbone',
  Forehead: 'Forehead',
  ForeheadLeft: 'Left Forehead',
  ForeheadRight: 'Right Forehead',
  LeftTemple: 'Left Temple',
  RightTemple: 'Right Temple',
  Chin: 'Chin',
};
