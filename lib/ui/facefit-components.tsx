import { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewProps,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

type ButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, style, ...rest }: ButtonProps) {
  const resolvedStyle = StyleSheet.flatten(style);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.buttonBase,
        styles.buttonPrimary,
        pressed && styles.buttonPressed,
        rest.disabled && styles.buttonDisabled,
        resolvedStyle,
      ]}
      {...rest}
    >
      <Text style={styles.buttonPrimaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, style, ...rest }: ButtonProps) {
  const resolvedStyle = StyleSheet.flatten(style);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.buttonBase,
        styles.buttonSecondary,
        pressed && styles.buttonPressedLight,
        rest.disabled && styles.buttonDisabled,
        resolvedStyle,
      ]}
      {...rest}
    >
      <Text style={styles.buttonSecondaryText}>{label}</Text>
    </Pressable>
  );
}

type CardProps = ViewProps & {
  title?: string;
  children: ReactNode;
};

export function Card({ title, style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

type ChipProps = Omit<PressableProps, "style"> & {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected, style, ...rest }: ChipProps) {
  const resolvedStyle = StyleSheet.flatten(style);
  return (
    <Pressable
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        resolvedStyle,
      ]}
      {...rest}
    >
      <Text style={selected ? styles.chipTextSelected : styles.chipText}>
        {label}
      </Text>
    </Pressable>
  );
}

type ProgressDotsProps = {
  total: number;
  current: number;
  activeColor?: string;
  idleColor?: string;
  activeWidth?: number;
  idleWidth?: number;
};

export function ProgressDots({
  total,
  current,
  activeColor = "#000000",
  idleColor = "#DCDCE0",
  activeWidth = 16,
  idleWidth = 8,
}: ProgressDotsProps) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        const width = isActive ? activeWidth : idleWidth;
        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.progressDotBase,
              {
                backgroundColor: isActive ? activeColor : idleColor,
                width,
                borderRadius: width / 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  buttonPrimary: {
    backgroundColor: "#000000",
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E6EA",
  },
  buttonSecondaryText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonPressedLight: {
    backgroundColor: "#F5F5F7",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  card: {
    backgroundColor: "#F5F5F7",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#0A0A0A",
  },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginVertical: 4,
    borderWidth: 1,
  },
  chipIdle: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E6EA",
  },
  chipSelected: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  chipText: {
    color: "#0A0A0A",
    fontSize: 14,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  progressDotBase: {
    height: 8,
  },
});
