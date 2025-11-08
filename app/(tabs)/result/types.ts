import type { RegionId } from "@/features/results/region-config";

export type RegionSelectHandler = (
  regionId: RegionId,
  options?: {
    scroll?: boolean;
  },
) => void;
