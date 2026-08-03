// components/SegmentedControl.tsx
// Generic reusable control backing:
//  - Report Item's Lost/Found switch (SRS 13.8.3 "SegmentedControl")
//  - My Activity's Reports/Claims/Solved tabs (SRS 13.15.3 "SegmentedTabs")
//  - Admin Management's Users/Items/Claims tabs (SRS 13.17.3 "SegmentedTabs")
// One component covers both "SegmentedControl" and "SegmentedTabs" from the
// SRS catalogue since they're the same interaction pattern with two visual
// variants (filled pill-track vs individual outlined pills).
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface SegmentedControlProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  variant?: "track" | "pills";
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "track",
}: SegmentedControlProps<T>) {
  if (variant === "pills") {
    return (
      <View style={styles.pillRow}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.trackButton, active && styles.trackButtonActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.trackText, active && styles.trackTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // "track" variant — one filled pill slides between options (Report Item)
  track: {
    flexDirection: "row",
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    padding: 4,
  },
  trackButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  trackButtonActive: { backgroundColor: "#2563EB" },
  trackText: { fontSize: 14, fontWeight: "600", color: "#1E3A8A" },
  trackTextActive: { color: "#FFFFFF" },

  // "pills" variant — separate outlined pills (My Activity, Admin Management)
  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  pillText: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  pillTextActive: { color: "#FFFFFF" },
});
