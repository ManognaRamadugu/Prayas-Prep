import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '../../constants/theme';

interface Props {
  studentName: string;
  examLabel: string;
  unreadNotifications: number;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardHeader({
  studentName,
  examLabel,
  unreadNotifications,
  onPressNotifications,
  onPressProfile,
}: Props) {
  const firstName = studentName.split(' ')[0];

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
        <View style={styles.examChip}>
          <View style={styles.dot} />
          <Text style={styles.examChipText}>{examLabel}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={onPressNotifications}
          hitSlop={8}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
            </View>
          )}
        </Pressable>

        <Pressable style={styles.avatar} onPress={onPressProfile} accessibilityLabel="Profile">
          <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  textBlock: { flexShrink: 1, gap: spacing.xs },
  greeting: { ...typography.h1, color: colors.textPrimary },
  examChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  examChipText: { ...typography.caption, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarText: { ...typography.bodyStrong, color: colors.primary },
});
