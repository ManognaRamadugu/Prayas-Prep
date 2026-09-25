import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  colors,
  spacing,
  typography,
  radii,
  shadow,
} from "../constants/theme";

import {
  getPracticeHistory,
  type PracticeHistoryItem,
} from "../../lib/attempt";

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds}s`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatScore(score: number) {
  const numericScore = Number(score) || 0;

  if (Number.isInteger(numericScore)) {
    return String(numericScore);
  }

  return numericScore.toFixed(2);
}

export default function HistoryScreen() {
  const router = useRouter();

  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);

      const data = await getPracticeHistory();

      setHistory(data);
    } catch (error) {
      console.error("Could not load practice history:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not load practice history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function handleRefresh() {
    setRefreshing(true);
    loadHistory();
  }
function handleOpenAttempt(item: PracticeHistoryItem) {
  router.push(
    `/history-review?attemptId=${encodeURIComponent(item.attemptId)}`
  );
}

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.stateTitle}>
            Loading practice history...
          </Text>

          <Text style={styles.stateText}>
            Fetching your completed practice sessions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              PERFORMANCE
            </Text>

            <Text style={styles.title}>
              Practice History
            </Text>

            <Text style={styles.subtitle}>
              Review your completed practice sessions and track your progress.
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={colors.danger}
              />
            </View>

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Couldn&apos;t load history
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  loadHistory();
                }}
              >
                <Text style={styles.retryButtonText}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {!error && history.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="bar-chart-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No practice history yet
            </Text>

            <Text style={styles.emptyText}>
              Complete your first practice session and your results will appear
              here.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/practice")}
            >
              <Ionicons
                name="play"
                size={18}
                color={colors.surface}
              />

              <Text style={styles.primaryButtonText}>
                Start Practice
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!error && history.length > 0 ? (
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Completed Sessions
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {history.length}{" "}
                  {history.length === 1 ? "session" : "sessions"}
                </Text>
              </View>

              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>
                  {history.length}
                </Text>
              </View>
            </View>

            {history.map((item, index) => {
              const percentage = Math.max(
                0,
                Math.min(100, Number(item.percentage) || 0)
              );

              return (
                <Pressable
                  key={item.attemptId}
                  style={styles.historyCard}
                  onPress={() => handleOpenAttempt(item)}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.activityIcon}>
                      <Ionicons
                        name="school-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.activityInfo}>
                      <Text
                        style={styles.activityName}
                        numberOfLines={2}
                      >
                        {item.testName}
                      </Text>

                      <Text style={styles.dateText}>
                        {formatDate(
                          item.submittedAt ?? item.createdAt
                        )}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </View>

                  <View style={styles.scoreRow}>
                    <View>
                      <Text style={styles.scoreLabel}>
                        Score
                      </Text>

                      <Text style={styles.scoreValue}>
                        {formatScore(item.totalScore)}
                        <Text style={styles.scoreMaximum}>
                          {" "}
                          /{" "}
                          {formatScore(
                            item.totalQuestions *
                              4
                          )}
                        </Text>
                      </Text>
                    </View>

                    <View style={styles.percentageBlock}>
                      <Text style={styles.percentageValue}>
                        {Math.round(percentage)}%
                      </Text>

                      <Text style={styles.percentageLabel}>
                        Score
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={17}
                          color={colors.success}
                        />
                      </View>

                      <Text style={styles.statText}>
                        {item.correctAnswers} Correct
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Ionicons
                          name="close-circle-outline"
                          size={17}
                          color={colors.danger}
                        />
                      </View>

                      <Text style={styles.statText}>
                        {item.incorrectAnswers} Wrong
                      </Text>
                    </View>

                    {item.skippedQuestions > 0 ? (
                      <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                          <Ionicons
                            name="remove-circle-outline"
                            size={17}
                            color={colors.textTertiary}
                          />
                        </View>

                        <Text style={styles.statText}>
                          {item.skippedQuestions} Skipped
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.bottomRow}>
                    <View style={styles.timeBlock}>
                      <Ionicons
                        name="time-outline"
                        size={17}
                        color={colors.textSecondary}
                      />

                      <Text style={styles.timeText}>
                        {formatDuration(item.durationSeconds)}
                      </Text>
                    </View>

                    <Text style={styles.sessionNumber}>
                      Session {history.length - index}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },

  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: spacing.xs,
  },

  historySection: {
    marginTop: spacing.xs,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },

  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  historyCount: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  historyCountText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  historyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  activityInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },

  activityName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    lineHeight: 21,
  },

  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },

  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  scoreValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: 2,
  },

  scoreMaximum: {
    ...typography.body,
    color: colors.textSecondary,
  },

  percentageBlock: {
    alignItems: "flex-end",
  },

  percentageValue: {
    ...typography.h2,
    color: colors.primary,
  },

  percentageLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  progressTrack: {
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginTop: spacing.md,
  },

  progressFill: {
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  statIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  statText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },

  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  sessionNumber: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.soft,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
  },

  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.surface,
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  errorIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },

  errorText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: spacing.xs,
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },

  retryButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  stateTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: "center",
  },

  stateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
