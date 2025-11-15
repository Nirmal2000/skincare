import { Text, View } from "react-native";

import { resultStyles } from "../styles";
import type { IssueSummary } from "../types";
import { clamp, formatRegionLabel } from "../utils";

const styles = resultStyles;

type Props = {
  issue: IssueSummary;
  isActive: boolean;
};

export function IssueDetailCard({ issue, isActive }: Props) {
  const averagePercent = Math.round(clamp(issue.averageIntensity, 0, 1) * 100);
  return (
    <View style={[styles.card, { borderColor: isActive ? "#F18A1B" : "transparent", borderWidth: 1 }]}>
      <Text style={styles.issueTitle}>{issue.label}</Text>
      <Text style={styles.issueIntensity}>{`Average intensity ${averagePercent} / 100`}</Text>
      {issue.entries.map((entry, index) => (
        <View key={`${issue.key}-${index}`} style={styles.issueEntry}>
          <Text style={styles.entryRegion}>{formatRegionLabel(entry.region)}</Text>
          {typeof entry.intensity === "number" ? (
            <Text style={styles.entryMeta}>{`Intensity ${Math.round(clamp(entry.intensity, 0, 1) * 100)}%`}</Text>
          ) : null}
          {entry.description ? <Text style={styles.entryDescription}>{entry.description}</Text> : null}
        </View>
      ))}
    </View>
  );
}
