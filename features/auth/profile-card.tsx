import { View, Text, StyleSheet } from "react-native";

import type { UserProfile } from "@/features/auth/useSupabaseSession";

import { Card, Chip, SecondaryButton } from "@/lib/ui/facefit-components";

export type ProfileCardProps = {
  profile: UserProfile;
  ageBand: string | null;
  onEditAge?: () => void;
};

export function ProfileCard({ profile, ageBand, onEditAge }: ProfileCardProps) {
  return (
    <Card style={styles.card}>
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
          <Text style={styles.meta}>Provider: {profile.provider ?? "—"}</Text>
          <Text style={styles.meta}>ID: {profile.id.slice(0, 8)}...</Text>
        </View>
      </View>
      <View style={styles.ageRow}>
        <Text style={styles.sectionLabel}>Age Band</Text>
        <Chip label={ageBand ?? "Not set"} selected style={{ marginRight: 12 }} />
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
    flexWrap: "wrap",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#6B6B6B",
  },
});
