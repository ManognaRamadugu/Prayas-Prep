import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadow } from '../../constants/theme';
import type { SubjectProgress } from '../../types/dashboard';

interface Props {
  subjects: SubjectProgress[];
  onPressSubject?: (subject: SubjectProgress) => void;
}

export default function SubjectProgressSection({ subjects, onPressSubject }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>Subjects</Text>
        <Text style={styles.viewAll}>View all</Text>
      </View>

      <View style={styles.list}>
        {subjects.map((subject) => (
          <Pressable
            key={subject.id}
            onPress={() => onPressSubject?.(subject)}
            style={({ pressed }) => [styles.row, shadow.soft, pressed && styles.rowPressed]}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${subject.color}22` }]}>
              <Ionicons name={subject.icon as any} size={18} color={subject.color} />
            </View>

            <View style={styles.middle}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${subject.progressPercent}%`, backgroundColor: subject.color },
                  ]}
                />
              </View>
            </View>

            <View style={styles.right}>
              <Text style={styles.progressPercent}>{subject.progressPercent}%</Text>
              <Text style={styles.accuracy}>{subject.accuracyPercent}% accuracy</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: { ...typography.h2, color: colors.textPrimary },
  viewAll: { ...typography.caption, color: colors.primary },
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { opacity: 0.85 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, gap: spacing.sm },
  subjectName: { ...typography.bodyStrong, color: colors.textPrimary },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2.5 },
  right: { alignItems: 'flex-end' },
  progressPercent: { ...typography.bodyStrong, color: colors.textPrimary },
  accuracy: { ...typography.micro, color: colors.textTertiary, marginTop: 2 },
});
