import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

export default function PrivacyNotice() {
  return (
    <View style={styles.container}>
      <Ionicons color={COLORS.warning} name="lock-closed-outline" size={22} />
      <Text style={styles.text}>
        Your answers are private and visible only in the claim-review workflow. Do not enter full card,
        account, password, or government identification numbers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warningLight,
    borderColor: "#FDE68A",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
  },
  text: { color: "#92400E", flex: 1, fontSize: 12, lineHeight: 18 },
});