import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, shadow } from '../../constants/theme';

interface Props {
  overallProgressPercent: number;
  examLabel: string;
  daysToExam: number;
}

const RING_SIZE = 76;
const STROKE = 7;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PreparationProgressCard({
  overallProgressPercent,
  examLabel,
  daysToExam,
}: Props) {
  const clamped = Math.max(0, Math.min(100, overallProgressPercent));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <LinearGradient
      colors={colors.gradientDark}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadow.card]}
    >
      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringLabel}>
          <Text style={styles.ringPercent}>{clamped}%</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.label}>Overall Preparation</Text>
        <Text style={styles.examLabel}>{examLabel}</Text>
        {daysToExam > 0 ? (
          <View style={styles.countdownPill}>
            <Text style={styles.countdownText}>{daysToExam} days to go</Text>
          </View>
        ) : (
          <View style={[styles.countdownPill, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.countdownText, { color: colors.success }]}>On track</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute' },
  ringPercent: { ...typography.h2, color: colors.textPrimary },
  info: { flex: 1, gap: spacing.xs },
  label: { ...typography.micro, color: colors.textTertiary, textTransform: 'uppercase' },
  examLabel: { ...typography.h2, color: colors.textPrimary },
  countdownPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  countdownText: { ...typography.caption, color: colors.primary },
});
