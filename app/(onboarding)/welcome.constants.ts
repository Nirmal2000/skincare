import type { ViewStyle } from "react-native";

export const INTRO_SLIDE_COUNT = 2;
export const ACCENT_COLOR = "#F18A1B";
export const INTRO_BG = "#F9F5EF";
export const INTRO_ICON_BG = "#FFF2E3";
export const INTRO_TEXT = "#1D1207";
export const INTRO_SUBTEXT = "#6E6256";
export const INTRO_CARD_STYLE: ViewStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: 32,
  paddingVertical: 32,
  paddingHorizontal: 28,
  shadowColor: "rgba(21, 12, 6, 0.15)",
  shadowOpacity: 1,
  shadowRadius: 32,
  shadowOffset: { width: 0, height: 16 },
  elevation: 6,
};

export const DEFAULT_AGE = 24;
export const AGE_VALUES = Array.from({ length: 53 }, (_, index) => 18 + index);
export const WHEEL_PADDING = 2;
export const AGE_WHEEL_DATA: (number | null)[] = [
  ...Array(WHEEL_PADDING).fill(null),
  ...AGE_VALUES,
  ...Array(WHEEL_PADDING).fill(null),
];
export const WHEEL_ITEM_HEIGHT = 44;
export const WHEEL_WINDOW_BG = "rgba(241, 138, 27, 0.12)";
export const WHEEL_WINDOW_BORDER = "rgba(241, 138, 27, 0.4)";

export const SLIDES = [
  {
    title: "Natural You. Real Results.",
    body: "Makeup-free, one face, good light. We only need one photo per scan.",
    iconName: "camera",
  },
  {
    title: "Private & Local.",
    body: "Photos stay on this device for 30 days. Delete anytime from Settings.",
    iconName: "lock",
  },
  {
    title: "Age helps personalize.",
    body: "Choose your precise age so BetterSkin can tailor non-medical tips.",
    iconName: "calendar",
  },
] as const;

export type SlideContent = (typeof SLIDES)[number];
