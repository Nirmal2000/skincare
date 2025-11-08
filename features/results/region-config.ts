import type { FaceAnalysisResult } from "@/features/scans/face-analysis-api";
import type {
  FaceLandmarkId,
  FaceLandmarkMap,
  FaceLandmarkPoint,
} from "@/features/scans/landmark-points";

export type RegionId =
  | "eyes"
  | "forehead"
  | "crowsFeet"
  | "glabella"
  | "nasolabial"
  | "leftCheek"
  | "rightCheek";

type RegionDefinition = {
  id: RegionId;
  label: string;
  dotKey: FaceLandmarkId | null;
  issues: Array<{
    key: Extract<keyof FaceAnalysisResult, string>;
    label: string;
  }>;
};

const REGION_DEFINITIONS: RegionDefinition[] = [
  {
    id: "eyes",
    label: "Eye area",
    dotKey: "eye_pouch",
    issues: [
      { key: "eye_pouch", label: "Eye pouch" },
      { key: "dark_circles", label: "Dark circles" },
    ],
  },
  {
    id: "forehead",
    label: "Forehead",
    dotKey: "forehead_pores",
    issues: [
      { key: "forehead_pores", label: "Forehead pores" },
      { key: "forehead_wrinkle", label: "Forehead wrinkles" },
    ],
  },
  {
    id: "crowsFeet",
    label: "Crow's feet",
    dotKey: "crows_feet",
    issues: [{ key: "crows_feet", label: "Crow's feet" }],
  },
  {
    id: "glabella",
    label: "Between eyebrows",
    dotKey: "glabella_wrinkle",
    issues: [{ key: "glabella_wrinkle", label: "Glabella wrinkle" }],
  },
  {
    id: "nasolabial",
    label: "Nasolabial fold",
    dotKey: "nasolabial_fold",
    issues: [{ key: "nasolabial_fold", label: "Nasolabial fold" }],
  },
  {
    id: "leftCheek",
    label: "Left cheek",
    dotKey: "left_cheek_pores",
    issues: [{ key: "left_cheek_pores", label: "Left cheek pores" }],
  },
  {
    id: "rightCheek",
    label: "Right cheek",
    dotKey: "right_cheek_pores",
    issues: [{ key: "right_cheek_pores", label: "Right cheek pores" }],
  },
];

export type RegionIssue = {
  key: string;
  label: string;
  value: number;
  confidence: number;
};

export type RegionReport = {
  id: RegionId;
  label: string;
  dot: FaceLandmarkPoint | null;
  issues: RegionIssue[];
};

export type ProblemListItem = {
  id: string;
  regionId: RegionId;
  regionLabel: string;
  label: string;
  confidence: number;
};

export type RegionReports = {
  regions: RegionReport[];
  allProblems: ProblemListItem[];
};

export function buildRegionReports(
  analysis: FaceAnalysisResult | null,
  landmarks: FaceLandmarkMap | null | undefined,
): RegionReports {
  if (!analysis) {
    return { regions: [], allProblems: [] };
  }

  const regions: RegionReport[] = REGION_DEFINITIONS.map((definition) => {
    const dot =
      definition.dotKey && landmarks
        ? landmarks[definition.dotKey] ?? null
        : null;
    const issues: RegionIssue[] = definition.issues
      .map((issue) => {
        const raw = analysis[issue.key];
        if (!raw || typeof raw !== "object") {
          return null;
        }
        const value = "value" in raw ? raw.value : 0;
        const confidence = "confidence" in raw ? raw.confidence ?? 0 : 0;
        if (value !== 1) {
          return null;
        }
        return {
          key: issue.key,
          label: issue.label,
          value,
          confidence,
        } satisfies RegionIssue;
      })
      .filter(Boolean) as RegionIssue[];

    return {
      id: definition.id,
      label: definition.label,
      dot,
      issues,
    };
  });

  const allProblems: ProblemListItem[] = regions
    .flatMap((region) =>
      region.issues.map((issue) => ({
        id: `${region.id}:${issue.key}`,
        regionId: region.id,
        regionLabel: region.label,
        label: issue.label,
        confidence: issue.confidence,
      })),
    )
    .sort((a, b) => b.confidence - a.confidence);

  return { regions, allProblems };
}
