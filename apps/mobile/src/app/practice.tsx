import { useEffect, useState } from "react";
import {
  Pressable,
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
  startStudySession,
  finishStudySession,
} from "../../lib/study";
import {
  getPracticeQuestions,
  type PracticeQuestion,
} from "../../lib/questions";

const subjects = [
  {
    id: "physics",
    name: "Physics",
    icon: "planet-outline" as const,
    databaseId: "df357a52-3be7-45ef-b360-a01d55a06ab6",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: "flask-outline" as const,
    databaseId: "6325d1a7-6631-4f88-83c7-bf69c6eacaad",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    icon: "calculator-outline" as const,
    databaseId: "707de415-5e2b-4a6d-bd95-aade14fcc4ab",
  },
];

export default function PracticeScreen() {
  const router = useRouter();

  const [selectedSubject, setSelectedSubject] =
    useState("physics");
    const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [loadingQuestions, setLoadingQuestions] = useState(false);
const [questionError, setQuestionError] = useState<string | null>(null);
const [selectedOptionId, setSelectedOptionId] =
  useState<string | null>(null);
  const currentQuestion =
  questions[currentQuestionIndex] ?? null;

  const [sessionId, setSessionId] = useState<string | null>(
    null
  );

  const [startedAt, setStartedAt] = useState<string | null>(
    null
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const isStudying = sessionId !== null;

  /*
   * Timer
   */
  useEffect(() => {
    if (!isStudying || !startedAt) {
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const start = new Date(startedAt).getTime();

      const seconds = Math.max(
        0,
        Math.floor((now - start) / 1000)
      );

      setElapsedSeconds(seconds);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isStudying, startedAt]);

  async function handleStartPractice() {
  try {
    setStarting(true);
    setLoadingQuestions(true);
    setQuestionError(null);

    const selected = subjects.find(
      (subject) => subject.id === selectedSubject
    );

    if (!selected) {
      throw new Error("Selected subject not found.");
    }

    // Start the study session
    const session = await startStudySession("practice");

    // Fetch questions for the selected subject
    const fetchedQuestions = await getPracticeQuestions(
      selected.databaseId,
      5
    );

    if (fetchedQuestions.length === 0) {
      throw new Error(
        "No practice questions are available for this subject yet."
      );
    }

    setQuestions(fetchedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);

    setSessionId(session.id);
    setStartedAt(session.started_at);
    setElapsedSeconds(0);
  } catch (error) {
    console.error("Could not start practice:", error);

    setQuestionError(
      error instanceof Error
        ? error.message
        : "Could not load practice questions."
    );
  } finally {
    setStarting(false);
    setLoadingQuestions(false);
  }
}
  async function handleFinishPractice() {
    if (!sessionId || !startedAt) {
      return;
    }

    try {
      setFinishing(true);

      await finishStudySession(
        sessionId,
        startedAt
      );

      setSessionId(null);
      setStartedAt(null);
      setElapsedSeconds(0);

      router.back();
    } catch (error) {
      console.error("Could not finish practice:", error);
    } finally {
      setFinishing(false);
    }
  }

  function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  /*
   * Studying screen
   */
if (isStudying) {
  const subject = subjects.find(
    (item) => item.id === selectedSubject
  );

  const currentQuestion =
    questions[currentQuestionIndex] ?? null;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.studyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.studyHeader}>
          <View style={styles.studyHeaderTop}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                STUDY SESSION
              </Text>
            </View>

            <Text style={styles.timerSmall}>
              {formatTime(elapsedSeconds)}
            </Text>
          </View>

          <Text style={styles.studySubject}>
            {subject?.name}
          </Text>
        </View>

        {/* Loading */}
        {loadingQuestions && (
          <View style={styles.loadingCard}>
            <Ionicons
              name="hourglass-outline"
              size={28}
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading your practice questions...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loadingQuestions && questionError && (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={colors.danger}
            />

            <Text style={styles.errorText}>
              {questionError}
            </Text>
          </View>
        )}

        {/* Question */}
        {!loadingQuestions &&
          !questionError &&
          currentQuestion && (
            <View style={styles.questionSection}>
              <View style={styles.questionProgressRow}>
                <Text style={styles.questionNumber}>
                  Question {currentQuestionIndex + 1} of{" "}
                  {questions.length}
                </Text>

                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>
                    {currentQuestion.difficulty}
                  </Text>
                </View>
              </View>

              <View style={styles.questionCard}>
                <Text style={styles.questionText}>
                  {currentQuestion.question_text}
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option) => {
                  const selected =
                    selectedOptionId === option.id;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() =>
                        setSelectedOptionId(option.id)
                      }
                      style={[
                        styles.optionCard,
                        selected &&
                          styles.optionCardSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.optionCircle,
                          selected &&
                            styles.optionCircleSelected,
                        ]}
                      >
                        {selected && (
                          <View
                            style={
                              styles.optionCircleInner
                            }
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.optionText,
                          selected &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.option_text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                disabled={!selectedOptionId}
                style={[
                  styles.nextButton,
                  !selectedOptionId &&
                    styles.buttonDisabled,
                ]}
              >
                <Text style={styles.nextButtonText}>
                  Next Question
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.textInverse}
                />
              </Pressable>
            </View>
          )}

        {/* Finish */}
        <View style={styles.studyBottom}>
          <Text style={styles.encouragement}>
            Stay focused. You've got this. 💪
          </Text>

          <Pressable
            onPress={handleFinishPractice}
            disabled={finishing}
            style={[
              styles.finishButton,
              finishing && styles.buttonDisabled,
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={colors.textInverse}
            />

            <Text style={styles.finishButtonText}>
              {finishing
                ? "Saving..."
                : "Finish Session"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

  /*
   * Practice selection screen
   */
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>
            Practice
          </Text>

          <Text style={styles.subtitle}>
            Strengthen your concepts with focused
            practice.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Choose a subject
        </Text>

        <View style={styles.subjectList}>
          {subjects.map((subject) => {
            const selected =
              selectedSubject === subject.id;

            return (
              <Pressable
                key={subject.id}
                onPress={() =>
                  setSelectedSubject(subject.id)
                }
                style={[
                  styles.subjectCard,
                  selected &&
                    styles.subjectCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    selected &&
                      styles.iconCircleSelected,
                  ]}
                >
                  <Ionicons
                    name={subject.icon}
                    size={22}
                    color={
                      selected
                        ? colors.textInverse
                        : colors.primary
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.subjectName,
                    selected &&
                      styles.subjectNameSelected,
                  ]}
                >
                  {subject.name}
                </Text>

                <Ionicons
                  name={
                    selected
                      ? "checkmark-circle"
                      : "chevron-forward"
                  }
                  size={22}
                  color={
                    selected
                      ? colors.success
                      : colors.textTertiary
                  }
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.primary}
          />

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Focused practice
            </Text>

            <Text style={styles.infoDescription}>
              Your study time will be recorded
              automatically while you practice.
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.startButton,
            starting && styles.buttonDisabled,
          ]}
          onPress={handleStartPractice}
          disabled={starting}
        >
          <Ionicons
            name="play"
            size={20}
            color={colors.textInverse}
          />

          <Text style={styles.startButtonText}>
            {starting
              ? "Starting..."
              : "Start Practice"}
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
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },

  header: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
  },

  title: {
    ...typography.display,
    color: colors.textPrimary,
  },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },

  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  subjectList: {
    gap: spacing.md,
  },

  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.soft,
  },

  subjectCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  iconCircleSelected: {
    backgroundColor: colors.primary,
  },

  subjectName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },

  subjectNameSelected: {
    color: colors.primary,
  },

  infoCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xxxl,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  infoDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  startButtonText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },

  studyContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
    paddingBottom: spacing.xxl,
  },

  studyHeader: {
    paddingTop: spacing.xl,
    alignItems: "center",
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },

  liveText: {
    ...typography.micro,
    color: colors.success,
    letterSpacing: 1,
  },

  studySubject: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },

  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },

  timer: {
    fontSize: 42,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
    letterSpacing: 1,
  },

  timerLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  studyBottom: {
    alignItems: "center",
  },

  encouragement: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  finishButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: radii.lg,
    paddingVertical: 16,
    ...shadow.soft,
  },

  finishButtonText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  studyContent: {
  paddingHorizontal: spacing.xl,
  paddingBottom: 40,
},

studyHeaderTop: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

timerSmall: {
  ...typography.bodyStrong,
  color: colors.textPrimary,
  backgroundColor: colors.surface,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
},

loadingCard: {
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.surface,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.xxxl,
  marginTop: spacing.xxxl,
},

loadingText: {
  ...typography.body,
  color: colors.textSecondary,
  marginTop: spacing.md,
  textAlign: "center",
},

errorCard: {
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.dangerSoft,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.danger,
  padding: spacing.xl,
  marginTop: spacing.xxxl,
},

errorText: {
  ...typography.body,
  color: colors.textPrimary,
  marginTop: spacing.md,
  textAlign: "center",
},

questionSection: {
  marginTop: spacing.xxxl,
},

questionProgressRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.md,
},

questionNumber: {
  ...typography.caption,
  color: colors.textSecondary,
},

difficultyBadge: {
  backgroundColor: colors.primarySoft,
  borderRadius: radii.pill,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
},

difficultyText: {
  ...typography.micro,
  color: colors.primary,
},

questionCard: {
  backgroundColor: colors.surface,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.xl,
  ...shadow.soft,
},

questionText: {
  ...typography.bodyStrong,
  color: colors.textPrimary,
  lineHeight: 25,
},

optionsContainer: {
  marginTop: spacing.lg,
  gap: spacing.md,
},

optionCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.lg,
  gap: spacing.md,
},

optionCardSelected: {
  borderColor: colors.primary,
  backgroundColor: colors.primarySoft,
},

optionCircle: {
  width: 22,
  height: 22,
  borderRadius: radii.pill,
  borderWidth: 2,
  borderColor: colors.textTertiary,
  alignItems: "center",
  justifyContent: "center",
},

optionCircleSelected: {
  borderColor: colors.primary,
},

optionCircleInner: {
  width: 10,
  height: 10,
  borderRadius: radii.pill,
  backgroundColor: colors.primary,
},

optionText: {
  ...typography.body,
  color: colors.textPrimary,
  flex: 1,
  lineHeight: 22,
},

optionTextSelected: {
  color: colors.primary,
},

nextButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  backgroundColor: colors.primary,
  borderRadius: radii.lg,
  paddingVertical: 16,
  marginTop: spacing.xl,
  ...shadow.soft,
},

nextButtonText: {
  ...typography.bodyStrong,
  color: colors.textInverse,
}
});