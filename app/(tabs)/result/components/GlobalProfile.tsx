import { Text, View } from "react-native";

import type { FaceAnalysisResult } from "@/features/scans/face-analysis-api";

import { resultStyles } from "../styles";
import { capitalize, formatIssueLabel } from "../utils";

const styles = resultStyles;

type Props = {
  profile: NonNullable<FaceAnalysisResult["global_profile"]>;
};

export function GlobalProfile({ profile }: Props) {
  const entries: { label: string; value: string }[] = [];
  if (profile.skin_type?.label) {
    entries.push({ label: "Skin type", value: capitalize(profile.skin_type.label) });
  }
  if (profile.skin_tone?.lightness || profile.skin_tone?.undertone) {
    const toneParts = [profile.skin_tone.lightness, profile.skin_tone.undertone].filter(Boolean);
    entries.push({ label: "Skin tone", value: toneParts[0] });
  }
  if (profile.skin_age?.estimated_age) {
    const relative = profile.skin_age.relative_to_real_age ? ` (${profile.skin_age.relative_to_real_age})` : "";
    entries.push({ label: "Skin age", value: `${profile.skin_age.estimated_age}${relative}` });
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>Global Overview</Text>
      {profile.summary_description ? (
        <Text style={[styles.bodyText, { marginBottom: 16 }]}>{profile.summary_description}</Text>
      ) : null}
      <View style={styles.profileGrid}>
        {entries.map((entry) => (
          <View key={entry.label} style={styles.profileItem}>
            <Text style={styles.profileLabel}>{entry.label}</Text>
            <Text style={styles.profileValue}>{entry.value}</Text>
          </View>
        ))}
      </View>
      {profile.scores ? (
        <View style={styles.scoreRow}>
          {Object.entries(profile.scores).map(([key, value]) => (
            <View key={key} style={styles.scoreChip}>
              <Text style={styles.scoreLabel}>{formatIssueLabel(key)}</Text>
              <Text style={styles.scoreValue}>{Math.round(value)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
