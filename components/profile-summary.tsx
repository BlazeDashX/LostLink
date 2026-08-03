import { StyleSheet, Text, View } from "react-native";

type Props = {
  name: string;
  email: string;
};

export default function ProfileSummary({
  name,
  email,
}: Props) {

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>
          {initials}
        </Text>
      </View>

      <Text style={styles.name}>
        {name}
      </Text>

      <Text style={styles.email}>
        {email}
      </Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          Verified User
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F0FF",

    justifyContent: "center",
    alignItems: "center",
  },

  initials: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4B6BFB",
  },

  name: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  email: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },

  badge: {
    marginTop: 12,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
  },
});