import { StyleSheet, Text, View } from "react-native";

export default function BrandLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>LL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 32,
  },

  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
  },
});