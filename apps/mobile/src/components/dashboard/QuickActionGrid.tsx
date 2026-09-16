import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  spacing,
  typography,
  radii,
  shadow,
} from "../../constants/theme";
import type { QuickAction } from "../../types/dashboard";

interface Props {
  actions: QuickAction[];
  onPressAction?: (action: QuickAction) => void;
}

export default function QuickActionGrid({
  actions,
  onPressAction,
}: Props) {
  return (
    <View style={styles.wrap}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={({ pressed }) => [
            styles.tile,
            shadow.soft,
            pressed && styles.tilePressed,
          ]}
          onPress={() => onPressAction?.(action)}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name={action.icon as any}
              size={20}
              color={colors.primary}
            />
          </View>

          <Text
            style={styles.label}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    gap: spacing.md,
  },

  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  tilePressed: {
    opacity: 0.85,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
});