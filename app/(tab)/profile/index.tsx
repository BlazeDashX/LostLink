import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/app-header";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const { currentUserId, users } = useApp();
  const currentUser = users.find((user) => user.id === currentUserId);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.name}>{currentUser?.name || "User Profile"}</Text>
          {currentUser?.email ? <Text style={styles.detail}>{currentUser.email}</Text> : null}
          {currentUser?.role ? <Text style={styles.detail}>Role: {currentUser.role}</Text> : null}
          {currentUser?.phone ? <Text style={styles.detail}>Phone: {currentUser.phone}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  name: { color: COLORS.text, fontSize: 20, fontWeight: "800", marginBottom: SPACING.xs },
  detail: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
});
