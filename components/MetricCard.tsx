// components/MetricCard.tsx
// SRS 17.1 — "Admin dashboard count card." Props: label, value, statusColor.
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MetricCardProps {
  label: string;
  value: number;
  bg: string;
  statusColor: string;
}

export default function MetricCard({ label, value, bg, statusColor }: MetricCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: statusColor }]}>{label}</Text>
      <Text style={[styles.value, { color: statusColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "47%", borderRadius: 14, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600" },
  value: { fontSize: 26, fontWeight: "800", marginTop: 6 },
});
