import { StyleSheet, Text, View } from "react-native";

export default function ProfileHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
});