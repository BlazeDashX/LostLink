import { StyleSheet, Text, View } from "react-native";
import { COLORS, SPACING } from "@/constants/theme";

interface AnswerCardProps {
  question: string;
  answer: string;
}

export default function AnswerCard({ question, answer }: AnswerCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.answer}>{answer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  question: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  answer: { color: COLORS.text, fontSize: 14, lineHeight: 21 },
});