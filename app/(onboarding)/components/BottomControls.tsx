import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import {
  PrimaryButton,
  ProgressDots,
  SecondaryButton,
} from "@/lib/ui/facefit-components";

import { ACCENT_COLOR } from "../welcome.constants";

export type BottomControlsProps = {
  currentSlide: number;
  totalSlides: number;
  isFinalSlide: boolean;
  canContinue: boolean;
  saving: boolean;
  onBack: () => void;
  onContinue: () => void;
  accentButtonStyle?: StyleProp<ViewStyle>;
  showBack: boolean;
  finePrintColor: string;
  style?: StyleProp<ViewStyle>;
};

export function BottomControls({
  currentSlide,
  totalSlides,
  isFinalSlide,
  canContinue,
  saving,
  onBack,
  onContinue,
  accentButtonStyle,
  showBack,
  finePrintColor,
  style,
}: BottomControlsProps) {
  return (
    <View style={[{ marginTop: 24 }, style]}>
      <ProgressDots
        total={totalSlides}
        current={currentSlide}
        activeColor={ACCENT_COLOR}
        idleColor="rgba(241, 138, 27, 0.25)"
        activeWidth={20}
      />
      <View
        style={{
          flexDirection: "row",
          gap: showBack ? 12 : 0,
          marginTop: 16,
          alignItems: "center",
        }}
      >
        {showBack ? (
          <SecondaryButton label="Back" style={{ width: 116 }} onPress={onBack} />
        ) : null}
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={isFinalSlide ? "Continue" : "Next"}
            style={[accentButtonStyle]}
            onPress={onContinue}
            disabled={!canContinue || saving}
          />
        </View>
      </View>
      <Text
        style={{
          textAlign: "center",
          marginTop: 12,
          color: finePrintColor,
          fontSize: 13,
        }}
      >
        By continuing you agree to BetterSkin storing your age information locally.
      </Text>
    </View>
  );
}
