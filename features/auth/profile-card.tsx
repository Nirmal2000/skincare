import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";

import type { UserProfile } from "@/features/auth/useSupabaseSession";

import { Card, SecondaryButton } from "@/lib/ui/facefit-components";

export type ProfileCardProps = {
  profile: UserProfile;
  ageBand: string | null;
  onEditAge?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ProfileCard({
  profile,
  ageBand,
  onEditAge,
  style,
}: ProfileCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.title}>Your Account</Text>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {profile.name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.name ?? "FaceFit user"}</Text>
          <Text style={styles.meta}>{profile.email ?? "No email"}</Text>
        </View>
      </View>
      <View style={styles.ageRow}>
        <View style={styles.ageLabelBlock}>
          <Text style={styles.sectionLabel}>Age</Text>
          <View style={styles.ageBadge}>
            <Text style={styles.ageValue}>{ageBand ?? "--"}</Text>
          </View>
        </View>
        {onEditAge ? (
          <SecondaryButton label="Edit" onPress={onEditAge} style={{ flex: 0 }} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  row: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E6E6EA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  meta: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  ageLabelBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ageBadge: {
    minWidth: 64,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  ageValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
