import { type ReactNode } from "react";
import { Text, View } from "react-native";

import type { RoutineIntake } from "@/features/scans/face-analysis-api";
import { type RoutineIntakeAnswers } from "@/features/scans/routine-intake-store";
import { Chip, PrimaryButton, SecondaryButton } from "@/lib/ui/facefit-components";

import { resultStyles } from "../styles";

const styles = resultStyles;

type OptionConfig<T extends string> = {
  value: T;
  label: string;
};

const SENSITIVITY_OPTIONS: OptionConfig<RoutineIntakeAnswers["sensitivity"]>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "unsure", label: "Unsure" },
];

const PREGNANCY_OPTIONS: OptionConfig<RoutineIntakeAnswers["pregnancy"]>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const RX_OPTIONS: OptionConfig<RoutineIntakeAnswers["rxTopical"]>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];

const ALLERGY_OPTIONS: OptionConfig<string>[] = [
  { value: "fragrance", label: "Fragrance" },
  { value: "lanolin", label: "Lanolin" },
  { value: "nut_oils", label: "Nut oils" },
  { value: "chemical_sunscreen_filters", label: "Chemical SPF filters" },
  { value: "parabens", label: "Parabens" },
  { value: "none", label: "None" },
  { value: "unsure", label: "Unsure" },
];

const FITZPATRICK_OPTIONS: OptionConfig<RoutineIntakeAnswers["fitzpatrick"]>[] = [
  { value: "I-II", label: "I–II (burns easily)" },
  { value: "III-IV", label: "III–IV (sometimes burns)" },
  { value: "V-VI", label: "V–VI (rarely burns)" },
  { value: "unsure", label: "Unsure" },
];

const ACTIVES_OPTIONS: OptionConfig<string>[] = [
  { value: "retinoid_retinol", label: "Retinoid / retinol" },
  { value: "benzoyl_peroxide", label: "Benzoyl peroxide" },
  { value: "salicylic_acid", label: "Salicylic acid" },
  { value: "vitamin_c", label: "Vitamin C" },
  { value: "aha", label: "AHA" },
  { value: "azelaic_acid", label: "Azelaic acid" },
  { value: "none", label: "None" },
  { value: "unsure", label: "Unsure" },
];

type RoutineIntakeFormProps = {
  value: RoutineIntakeAnswers;
  onChange: (next: RoutineIntakeAnswers) => void;
  onSubmit: () => void;
  submitting: boolean;
  canCancel: boolean;
  onCancel: () => void;
};

export function RoutineIntakeForm({
  value,
  onChange,
  onSubmit,
  submitting,
  canCancel,
  onCancel,
}: RoutineIntakeFormProps) {
  const handleSingleChange = <K extends keyof RoutineIntakeAnswers>(key: K, nextValue: RoutineIntakeAnswers[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const handleMultiToggle = (key: "allergies" | "currentActives", entry: string) => {
    const current = value[key];
    const exclusive = entry === "none" || entry === "unsure";
    let next: string[];
    if (current.includes(entry)) {
      next = current.filter((option) => option !== entry);
    } else {
      next = exclusive ? [entry] : current.filter((option) => option !== "none" && option !== "unsure");
      next = [...next, entry];
    }
    if (!next.length) {
      next = ["none"];
    }
    onChange({ ...value, [key]: Array.from(new Set(next)) });
  };

  return (
    <View style={{ gap: 20 }}>
      <IntakeQuestion
        title="How does your skin react to new products?"
        description="Answering helps us pick the right strength for actives."
      >
        <View style={styles.intakeChipRow}>
          {SENSITIVITY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.sensitivity === option.value}
              onPress={() => handleSingleChange("sensitivity", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion
        title="Are you pregnant, trying, or nursing?"
        description="We skip retinoids and hydroquinone when this is yes or unspecified."
      >
        <View style={styles.intakeChipRow}>
          {PREGNANCY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.pregnancy === option.value}
              onPress={() => handleSingleChange("pregnancy", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion
        title="Prescription creams on your face?"
        description="Let us know if you already use tretinoin, adapalene, steroids, etc."
      >
        <View style={styles.intakeChipRow}>
          {RX_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.rxTopical === option.value}
              onPress={() => handleSingleChange("rxTopical", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion title="Avoid any of these?">
        <View style={styles.intakeChipRow}>
          {ALLERGY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.allergies.includes(option.value)}
              onPress={() => handleMultiToggle("allergies", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion title="How does your bare skin react to sun?">
        <View style={styles.intakeChipRow}>
          {FITZPATRICK_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.fitzpatrick === option.value}
              onPress={() => handleSingleChange("fitzpatrick", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <IntakeQuestion title="Already using any of these?">
        <View style={styles.intakeChipRow}>
          {ACTIVES_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value.currentActives.includes(option.value)}
              onPress={() => handleMultiToggle("currentActives", option.value)}
            />
          ))}
        </View>
      </IntakeQuestion>

      <View style={styles.intakeActions}>
        <PrimaryButton
          label={submitting ? "Saving..." : "Save & generate routine"}
          onPress={onSubmit}
          disabled={submitting}
        />
        {canCancel ? <SecondaryButton label="Cancel" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

type RoutineIntakeSummaryProps = {
  answers: RoutineIntakeAnswers;
  ready: boolean;
  completed: boolean;
};

export function RoutineIntakeSummary({ answers, ready, completed }: RoutineIntakeSummaryProps) {
  if (!ready) {
    return <Text style={styles.subtitle}>Loading your routine inputs…</Text>;
  }
  if (!completed) {
    return (
      <View style={styles.summaryCallout}>
        <Text style={styles.subtitle}>Fill the quick form to personalize every recommendation.</Text>
      </View>
    );
  }
  const entries = [
    { label: "Sensitivity", value: formatOptionLabel(SENSITIVITY_OPTIONS, answers.sensitivity) },
    { label: "Pregnancy", value: formatOptionLabel(PREGNANCY_OPTIONS, answers.pregnancy) },
    { label: "Rx topicals", value: formatOptionLabel(RX_OPTIONS, answers.rxTopical) },
    {
      label: "Allergies",
      value: formatListSummary(answers.allergies, ALLERGY_OPTIONS),
    },
    { label: "Fitzpatrick", value: formatOptionLabel(FITZPATRICK_OPTIONS, answers.fitzpatrick) },
    {
      label: "Current actives",
      value: formatListSummary(answers.currentActives, ACTIVES_OPTIONS),
    },
  ];
  return (
    <View style={styles.summaryGrid}>
      {entries.map((entry) => (
        <View key={entry.label} style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{entry.label}</Text>
          <Text style={styles.summaryValue}>{entry.value}</Text>
        </View>
      ))}
    </View>
  );
}

function IntakeQuestion({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.intakeSection}>
      <Text style={styles.intakeTitle}>{title}</Text>
      {description ? <Text style={styles.intakeDescription}>{description}</Text> : null}
      {children}
    </View>
  );
}

function formatOptionLabel<T extends string>(options: OptionConfig<T>[], value: T) {
  const match = options.find((option) => option.value === value);
  return match?.label ?? value;
}

function formatListSummary(selected: string[], options: OptionConfig<string>[]) {
  if (!selected.length || selected.includes("none")) {
    return "None";
  }
  if (selected.includes("unsure")) {
    return "Unsure";
  }
  return selected
    .map((entry) => formatOptionLabel(options, entry))
    .join(", ");
}

export function convertAnswersToPayload(answers: RoutineIntakeAnswers): RoutineIntake {
  return {
    sensitivity: answers.sensitivity,
    pregnancy: answers.pregnancy,
    rx_topical: answers.rxTopical,
    allergies: normalizeMultiForApi(answers.allergies),
    current_actives: normalizeMultiForApi(answers.currentActives),
    fitzpatrick: answers.fitzpatrick,
  };
}

function normalizeMultiForApi(values: string[]) {
  if (!values.length || values.includes("none")) return [];
  if (values.includes("unsure")) return ["unsure"];
  return values;
}
