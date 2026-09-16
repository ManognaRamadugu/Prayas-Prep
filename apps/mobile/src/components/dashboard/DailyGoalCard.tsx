import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadow } from '../../constants/theme';
import type { DailyGoal } from '../../types/dashboard';

interface Props {
  goal: DailyGoal;
}

export default function DailyGoalCard({ goal }: Props) {
  const percent = Math.min(100, Math.round((goal.completedMinutes / goal.targetMinutes) * 100));
  const isComplete = percent >= 100;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Today&apos;s Goal</Text>

      <View style={[styles.card, shadow.soft]}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.minutes}>
              {goal.completedMinutes}
              <Text style={styles.minutesTotal}> / {goal.targetMinutes} min</Text>
            </Text>
            <Text style={styles.caption}>
              {isComplete ? 'Daily goal complete' : `${goal.targetMinutes - goal.completedMinutes} min remaining`}
            </Text>
          </View>

          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={14} color={colors.warning} />
            <Text style={styles.streakText}>{goal.streakDays} day streak</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: isComplete ? colors.success : colors.primary },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
  sectionLabel: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  minutes: { ...typography.h1, color: colors.textPrimary },
  minutesTotal: { ...typography.body, color: colors.textTertiary },
  caption: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  streakText: { ...typography.caption, color: colors.warning },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
});
