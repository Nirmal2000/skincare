import { Text, View } from "react-native";

import { resultStyles } from "../styles";
import type { IssueSummary } from "../types";
import { formatRegionLabel } from "../utils";

const styles = resultStyles;

type Props = {
  issue: IssueSummary;
  isActive: boolean;
};

export function IssueDetailCard({ issue, isActive }: Props) {
  return (
    <View style={[styles.card, { borderColor: isActive ? "#F18A1B" : "transparent", borderWidth: 1 }]}>
      <Text style={styles.issueTitle}>{issue.label}</Text>
      {issue.entries.map((entry, index) => (
        <View key={`${issue.key}-${index}`} style={styles.issueEntry}>
          <Text style={styles.entryRegion}>{formatRegionLabel(entry.region)}</Text>
          {entry.description ? <Text style={styles.entryDescription}>{entry.description}</Text> : null}
        </View>
      ))}
    </View>
  );
}
