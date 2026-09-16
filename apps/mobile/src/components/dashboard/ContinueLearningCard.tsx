import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadow } from '../../constants/theme';
import type { ContinueLearningItem } from '../../types/dashboard';

interface Props {
  item: ContinueLearningItem;
  onPress?: () => void;
}

export default function ContinueLearningCard({ item, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Continue Learning</Text>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          shadow.soft,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="play" size={18} color={colors.textInverse} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.subjectChapter} numberOfLines={1}>
            {item.subjectName} · {item.chapterName}
          </Text>
          <Text style={styles.topic} numberOfLines={1}>{item.topicName}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${item.progressPercent}%` }]} />
          </View>
        </View>

        <View style={styles.rightBlock}>
          <Text style={styles.minutesLeft}>{item.estimatedMinutesLeft}m left</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
  sectionLabel: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.85 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 6 },
  subjectChapter: { ...typography.caption, color: colors.textSecondary },
  topic: { ...typography.bodyStrong, color: colors.textPrimary },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  rightBlock: { alignItems: 'flex-end', gap: 6 },
  minutesLeft: { ...typography.caption, color: colors.textTertiary },
});
