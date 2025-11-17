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
  // {
  //   title: "Natural You. Real Results.",
  //   body: "Makeup-free, one face, good light. We only need one photo per scan.",
  //   iconName: "camera",
  // },
  // {
  //   title: "Private & Local.",
  //   body: "Photos stay on this device for 30 days. Delete anytime from Settings.",
  //   iconName: "lock",
  // },
  {
    title: "Age helps personalize.",
    body: "Choose your precise age so BetterSkin can tailor non-medical tips.",
    iconName: "calendar",
  },
] as const;

export type SlideContent = (typeof SLIDES)[number];

export const ROUTINE_QUESTIONS = [
  {
    id: "sensitivity",
    title: "How does your skin react to new products?",
    description: "Answering helps us pick the right strength for actives.",
    type: "single",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "pregnancy",
    title: "Are you pregnant, trying, or nursing?",
    description: "We skip retinoids and hydroquinone when this is yes or unspecified.",
    type: "single",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  {
    id: "rxTopical",
    title: "Prescription creams on your face?",
    description: "Let us know if you already use tretinoin, adapalene, steroids, etc.",
    type: "single",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "allergies",
    title: "Avoid any of these?",
    description: null,
    type: "multi",
    options: [
      { value: "fragrance", label: "Fragrance" },
      { value: "lanolin", label: "Lanolin" },
      { value: "nut_oils", label: "Nut oils" },
      { value: "chemical_sunscreen_filters", label: "Chemical SPF filters" },
      { value: "parabens", label: "Parabens" },
      { value: "none", label: "None" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "fitzpatrick",
    title: "How does your bare skin react to sun?",
    description: null,
    type: "single",
    options: [
      { value: "I-II", label: "I–II (burns easily)" },
      { value: "III-IV", label: "III–IV (sometimes burns)" },
      { value: "V-VI", label: "V–VI (rarely burns)" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "currentActives",
    title: "Already using any of these?",
    description: null,
    type: "multi",
    options: [
      { value: "retinoid_retinol", label: "Retinoid / retinol" },
      { value: "benzoyl_peroxide", label: "Benzoyl peroxide" },
      { value: "salicylic_acid", label: "Salicylic acid" },
      { value: "vitamin_c", label: "Vitamin C" },
      { value: "aha", label: "AHA" },
      { value: "azelaic_acid", label: "Azelaic acid" },
      { value: "none", label: "None" },
      { value: "unsure", label: "Unsure" },
    ],
  },
] as const;

export type RoutineQuestion = (typeof ROUTINE_QUESTIONS)[number];
