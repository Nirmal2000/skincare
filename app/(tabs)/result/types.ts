export type IssueEntry = {
  region: string;
  intensity?: number;
  area?: number;
  description?: string;
};

export type IssueSummary = {
  key: string;
  label: string;
  averageIntensity: number;
  entries: IssueEntry[];
};
