import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { COLORS } from "@/constants/theme";

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  text: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  textSelected: { color: COLORS.surface },
});