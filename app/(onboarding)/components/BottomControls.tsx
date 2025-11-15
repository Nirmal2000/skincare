import { View, type StyleProp, type ViewStyle } from "react-native";

import { PrimaryButton } from "@/lib/ui/facefit-components";

export type BottomControlsProps = {
  isFinalSlide: boolean;
  canContinue: boolean;
  saving: boolean;
  onContinue: () => void;
  accentButtonStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function BottomControls({
  isFinalSlide,
  canContinue,
  saving,
  onContinue,
  accentButtonStyle,
  style,
}: BottomControlsProps) {
  return (
    <View style={[{ marginTop: 24 }, style]}>
      <View
        style={{
          flexDirection: "row",
          marginTop: 0,
          alignItems: "center",
          justifyContent: "flex-end",
          alignSelf: "flex-end",
        }}
      >
        <PrimaryButton
          label={isFinalSlide ? "Continue" : "Next"}
          style={accentButtonStyle}
          onPress={onContinue}
          disabled={!canContinue || saving}
        />
      </View>
    </View>
  );
}
