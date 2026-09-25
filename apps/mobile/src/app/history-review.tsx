import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  colors,
  spacing,
  typography,
  radii,
  shadow,
} from "../constants/theme";

import {
  getHistoricalPracticeReview,
  type HistoricalReviewItem,
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

function formatMarks(value: number) {
  const numericValue = Number(value) || 0;

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return numericValue.toFixed(2);
}

export default function HistoryReviewScreen() {
  const router = useRouter();

  const { attemptId } = useLocalSearchParams<{
    attemptId?: string | string[];
  }>();

  const resolvedAttemptId = Array.isArray(attemptId)
    ? attemptId[0]
    : attemptId;

  const [questions, setQuestions] = useState<
    HistoricalReviewItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReview() {
      if (!resolvedAttemptId) {
        setError("This practice session could not be identified.");
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const data = await getHistoricalPracticeReview(
          resolvedAttemptId
        );

        setQuestions(data);
      } catch (loadError) {
        console.error(
          "Could not load historical practice review:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load this practice review."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReview();
  }, [resolvedAttemptId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.stateTitle}>
            Loading practice review...
          </Text>

          <Text style={styles.stateText}>
            Fetching your answers and explanations.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={colors.danger}
            />
          </View>

          <Text style={styles.stateTitle}>
            Couldn&apos;t load the review
          </Text>

          <Text style={styles.stateText}>{error}</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>
              Back to History
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back to practice history"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>PRACTICE REVIEW</Text>

            <Text style={styles.title}>
              Review Answers
            </Text>

            <Text style={styles.subtitle}>
              Review your answers, correct answers, marks, and
              explanations.
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="analytics-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              Completed Practice
            </Text>

            <Text style={styles.summaryText}>
              {questions.length}{" "}
              {questions.length === 1 ? "question" : "questions"}{" "}
              reviewed
            </Text>
          </View>
        </View>

        {questions.map((question) => {
          const answered = question.selectedOptionId !== null;
          const correct = question.isCorrect === true;
          const incorrect = question.isCorrect === false;

          return (
            <View
              key={question.attemptQuestionId}
              style={styles.questionCard}
            >
              <View style={styles.questionHeader}>
                <View style={styles.questionNumber}>
                  <Text style={styles.questionNumberText}>
                    {question.questionOrder}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    correct
                      ? styles.statusCorrect
                      : incorrect
                        ? styles.statusIncorrect
                        : styles.statusSkipped,
                  ]}
                >
                  <Ionicons
                    name={
                      correct
                        ? "checkmark-circle"
                        : incorrect
                          ? "close-circle"
                          : "remove-circle"
                    }
                    size={16}
                    color={
                      correct
                        ? colors.success
                        : incorrect
                          ? colors.danger
                          : colors.textTertiary
                    }
                  />

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: correct
                          ? colors.success
                          : incorrect
                            ? colors.danger
                            : colors.textTertiary,
                      },
                    ]}
                  >
                    {correct
                      ? "Correct"
                      : incorrect
                        ? "Incorrect"
                        : "Skipped"}
                  </Text>
                </View>
              </View>

              <Text style={styles.questionText}>
                {question.questionText}
              </Text>

              <View style={styles.answerBlock}>
                <Text style={styles.label}>Your Answer</Text>

                {answered ? (
                  <View
                    style={[
                      styles.answerBox,
                      correct
                        ? styles.answerCorrect
                        : styles.answerIncorrect,
                    ]}
                  >
                    <Ionicons
                      name={
                        correct
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={19}
                      color={
                        correct
                          ? colors.success
                          : colors.danger
                      }
                    />

                    <Text
                      style={[
                        styles.answerText,
                        {
                          color: correct
                            ? colors.success
                            : colors.danger,
                        },
                      ]}
                    >
                      {question.selectedOptionText ??
                        "Answer unavailable"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.answerBox}>
                    <Ionicons
                      name="remove-circle-outline"
                      size={19}
                      color={colors.textTertiary}
                    />

                    <Text style={styles.skippedText}>
                      Not answered
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.answerBlock}>
                <Text style={styles.label}>Correct Answer</Text>

                <View
                  style={[
                    styles.answerBox,
                    styles.answerCorrect,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color={colors.success}
                  />

                  <Text
                    style={[
                      styles.answerText,
                      { color: colors.success },
                    ]}
                  >
                    {question.correctOptionText ??
                      "Correct answer unavailable"}
                  </Text>
                </View>
              </View>

              <View style={styles.marksRow}>
                <View style={styles.marksBlock}>
                  <Text style={styles.label}>Marks</Text>

                  <Text
                    style={[
                      styles.marksValue,
                      {
                        color:
                          question.marksAwarded >= 0
                            ? colors.success
                            : colors.danger,
                      },
                    ]}
                  >
                    {question.marksAwarded >= 0 ? "+" : ""}
                    {formatMarks(question.marksAwarded)}
                  </Text>
                </View>

                <View style={styles.timeBlock}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={colors.textSecondary}
                  />

                  <Text style={styles.timeText}>
                    {formatDuration(
                      question.timeTakenSeconds
                    )}
                  </Text>
                </View>
              </View>

              {question.explanation ? (
                <View style={styles.explanationCard}>
                  <View style={styles.explanationHeader}>
                    <Ionicons
                      name="bulb-outline"
                      size={20}
                      color={colors.primary}
                    />

                    <Text style={styles.explanationTitle}>
                      Explanation
                    </Text>
                  </View>

                  <Text style={styles.explanationText}>
                    {question.explanation}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {questions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="document-text-outline"
              size={36}
              color={colors.primary}
            />

            <Text style={styles.emptyTitle}>
              No questions found
            </Text>

            <Text style={styles.emptyText}>
              There are no saved questions available for this
              practice session.
            </Text>
          </View>
        ) : null}

        <Pressable
          style={styles.backToHistoryButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={colors.primary}
          />

          <Text style={styles.backToHistoryText}>
            Back to Practice History
          </Text>
        </Pressable>
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
    marginBottom: spacing.lg,
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

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },

  summaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },

  questionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  questionNumber: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  questionNumberText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },

  statusCorrect: {
    backgroundColor: colors.successSoft,
  },

  statusIncorrect: {
    backgroundColor: colors.dangerSoft,
  },

  statusSkipped: {
    backgroundColor: colors.border,
  },

  statusText: {
    ...typography.caption,
    fontWeight: "700",
  },

  questionText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },

  answerBlock: {
    marginBottom: spacing.md,
  },

  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },

  answerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },

  answerCorrect: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },

  answerIncorrect: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },

  answerText: {
    ...typography.body,
    flex: 1,
    lineHeight: 21,
  },

  skippedText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },

  marksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },

  marksBlock: {
    alignItems: "flex-start",
  },

  marksValue: {
    ...typography.h2,
    marginTop: 2,
  },

  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.lg,
  },

  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  explanationCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  explanationTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },

  explanationText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadow.soft,
  },

  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.md,
  },

  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },

  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.surface,
  },

  backToHistoryButton: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  backToHistoryText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
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
    textAlign: "center",
    marginTop: spacing.md,
  },

  stateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
