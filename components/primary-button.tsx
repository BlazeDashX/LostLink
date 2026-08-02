import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

import { COLORS } from "@/constants/theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
  outlined?: boolean;
}

export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  destructive = false,
  outlined = false,
}: PrimaryButtonProps) {
  const backgroundColor = outlined
    ? COLORS.surface
    : destructive
      ? COLORS.danger
      : COLORS.primary;
  const borderColor = destructive ? COLORS.danger : COLORS.primary;
  const textColor = outlined ? borderColor : COLORS.surface;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor, borderColor },
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  label: { fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.5 },
});