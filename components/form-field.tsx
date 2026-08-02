import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: KeyboardTypeOptions;
}

export default function FormField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  multiline = false,
  autoCapitalize = "sentences",
  keyboardType = "default",
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, multiline && styles.multiline, error && styles.inputError]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.lg },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    outlineStyle: "none",
  } as any,
  multiline: { minHeight: 96 },
  inputError: { backgroundColor: "#FFF7F7", borderColor: COLORS.danger },
  error: { color: COLORS.danger, fontSize: 11, marginTop: 5 },
});