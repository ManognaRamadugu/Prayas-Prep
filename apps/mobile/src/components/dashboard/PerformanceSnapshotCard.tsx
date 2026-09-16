import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadow } from '../../constants/theme';
import type { PerformanceSnapshot } from '../../types/dashboard';

interface Props {
  performance: PerformanceSnapshot;
}

export default function PerformanceSnapshotCard({ performance }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Performance</Text>

      <View style={[styles.card, shadow.soft]}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{performance.overallAccuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{performance.testsCompleted}</Text>
            <Text style={styles.statLabel}>Tests Taken</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{performance.percentile}th</Text>
            <Text style={styles.statLabel}>Percentile</Text>
          </View>
        </View>

        <View style={styles.insightRow}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
          <Text style={styles.insightText}>
            Focus area: <Text style={styles.insightTopic}>{performance.weakestTopic}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl, marginBottom: spacing.xxl },
  sectionLabel: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { ...typography.h1, color: colors.textPrimary },
  statLabel: { ...typography.micro, color: colors.textTertiary },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  insightText: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  insightTopic: { color: colors.warning, fontWeight: '700' },
});
