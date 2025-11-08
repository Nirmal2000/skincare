import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ACCENT_COLOR, INTRO_ICON_BG, INTRO_SUBTEXT, INTRO_TEXT } from "../welcome.constants";

export type IntroSlideCardProps = {
  title: string;
  body: string;
  iconName?: keyof typeof Feather.glyphMap;
};

export function IntroSlideCard({ title, body, iconName = "info" }: IntroSlideCardProps) {
  return (
    <View style={{ alignItems: "center", gap: 20 }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          backgroundColor: INTRO_ICON_BG,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={iconName} size={40} color={ACCENT_COLOR} />
      </View>
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 24,
            lineHeight: 32,
            fontWeight: "700",
            textAlign: "center",
            color: INTRO_TEXT,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 16,
            lineHeight: 22,
            color: INTRO_SUBTEXT,
            textAlign: "center",
          }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}
