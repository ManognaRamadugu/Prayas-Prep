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
  createPracticeAttempt,
  createAttemptQuestions,
  saveStudentAnswer,
  submitPracticeAttempt,
  savePracticeResult,
} from "../../lib/attempt";
import {
  getPracticeQuestions,
  checkPracticeAnswer,
  type PracticeQuestion,
} from "../../lib/questions";

// =========================================================
// SUBJECTS
// =========================================================

const subjects = [
  {
    id: "physics",
    name: "Physics",
    icon: "planet-outline" as const,
    databaseId:
      "df357a52-3be7-45ef-b360-a01d55a06ab6",
  },

  {
    id: "chemistry",
    name: "Chemistry",
    icon: "flask-outline" as const,
    databaseId:
      "6325d1a7-6631-4f88-83c7-bf69c6eacaad",
  },

  {
    id: "mathematics",
    name: "Mathematics",
    icon: "calculator-outline" as const,
    databaseId:
      "707de415-5e2b-4a6d-bd95-aade14fcc4ab",
  },
];

// =========================================================
// SCREEN
// =========================================================

export default function PracticeScreen() {
  const router = useRouter();

  // =======================================================
  // SUBJECT
  // =======================================================

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState("physics");

  // =======================================================
  // QUESTIONS
  // =======================================================

  const [
    questions,
    setQuestions,
  ] = useState<PracticeQuestion[]>(
    []
  );

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [
    loadingQuestions,
    setLoadingQuestions,
  ] = useState(false);

  const [
    questionError,
    setQuestionError,
  ] = useState<string | null>(
    null
  );

  const currentQuestion =
    questions[
      currentQuestionIndex
    ] ?? null;
    const [attemptId, setAttemptId] =
  useState<string | null>(null);

const [attemptQuestions, setAttemptQuestions] =
  useState<
    {
      id: string;
      question_id: string;
      question_order: number;
    }[]
  >([]);

  // =======================================================
  // ANSWER
  // =======================================================

  const [
    selectedOptionId,
    setSelectedOptionId,
  ] = useState<string | null>(
    null
  );

  // =======================================================
  // SCORE
  // =======================================================

  const [
    score,
    setScore,
  ] = useState(0);

  const [
    correctAnswers,
    setCorrectAnswers,
  ] = useState(0);

  const [
    wrongAnswers,
    setWrongAnswers,
  ] = useState(0);

  // =======================================================
  // RESULTS
  // =======================================================

  const [
    showResults,
    setShowResults,
  ] = useState(false);

  // =======================================================
  // STUDY SESSION
  // =======================================================

  const [
    sessionId,
    setSessionId,
  ] = useState<string | null>(
    null
  );

  const [
    startedAt,
    setStartedAt,
  ] = useState<string | null>(
    null
  );

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    finishing,
    setFinishing,
  ] = useState(false);

  const [
    checkingAnswer,
    setCheckingAnswer,
  ] = useState(false);

  const isStudying =
    sessionId !== null;

  // =========================================================
  // TIMER
  // =========================================================

  useEffect(() => {
    if (
      !isStudying ||
      !startedAt
    ) {
      return;
    }

    const updateTimer = () => {
      const now =
        Date.now();

      const start =
        new Date(
          startedAt
        ).getTime();

      const seconds =
        Math.max(
          0,
          Math.floor(
            (now - start) /
              1000
          )
        );

      setElapsedSeconds(
        seconds
      );
    };

    updateTimer();

    const interval =
      setInterval(
        updateTimer,
        1000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [
    isStudying,
    startedAt,
  ]);

  // =========================================================
  // START PRACTICE
  // =========================================================

  async function handleStartPractice() {
  try {
    setStarting(true);
    setLoadingQuestions(true);
    setQuestionError(null);

    // Reset previous practice state
    setScore(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setShowResults(false);
    setAttemptId(null);
    setAttemptQuestions([]);

    const selected = subjects.find(
      (subject) => subject.id === selectedSubject
    );

    if (!selected) {
      throw new Error("Selected subject not found.");
    }

    // -----------------------------------------------------
    // 1. Create database attempt
    // -----------------------------------------------------

    const newAttemptId =
      await createPracticeAttempt();

    console.log(
      "Created practice attempt:",
      newAttemptId
    );

    // -----------------------------------------------------
    // 2. Fetch 15 questions
    // -----------------------------------------------------

    const fetchedQuestions =
      await getPracticeQuestions(
        selected.databaseId,
        15
      );

    if (fetchedQuestions.length === 0) {
      throw new Error(
        "No practice questions are available for this subject yet."
      );
    }

    // -----------------------------------------------------
    // 3. Create attempt_questions
    // -----------------------------------------------------

    const createdAttemptQuestions =
      await createAttemptQuestions(
        newAttemptId,
        fetchedQuestions.map(
          (question) => question.id
        )
      );

    if (
      createdAttemptQuestions.length !==
      fetchedQuestions.length
    ) {
      throw new Error(
        "Could not create all attempt questions."
      );
    }

    console.log(
      "Created attempt questions:",
      createdAttemptQuestions.length
    );

    // -----------------------------------------------------
    // 4. Start study session
    // -----------------------------------------------------

    const session =
      await startStudySession("practice");

    // -----------------------------------------------------
    // 5. Update UI state
    // -----------------------------------------------------

    setAttemptId(newAttemptId);
    setAttemptQuestions(
      createdAttemptQuestions
    );

    setQuestions(
      fetchedQuestions
    );

    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);

    setScore(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);

    setSessionId(session.id);
    setStartedAt(session.started_at);
    setElapsedSeconds(0);

    console.log(
      "Practice started successfully."
    );
  } catch (error) {
    console.error(
      "Could not start practice:",
      error
    );

    setQuestionError(
      error instanceof Error
        ? error.message
        : "Could not start practice."
    );
  } finally {
    setStarting(false);
    setLoadingQuestions(false);
  }
}
  // =========================================================
  // CHECK ANSWER + NEXT QUESTION
  // =========================================================

  async function handleNextQuestion() {
  if (
    !selectedOptionId ||
    !currentQuestion ||
    !attemptId ||
    checkingAnswer
  ) {
    return;
  }

  try {
    setCheckingAnswer(true);

    // -----------------------------------------------------
    // Find database record for current question
    // -----------------------------------------------------

    const currentAttemptQuestion =
      attemptQuestions.find(
        (item) =>
          item.question_id ===
          currentQuestion.id
      );

    if (!currentAttemptQuestion) {
      throw new Error(
        "Could not find attempt question."
      );
    }

    // -----------------------------------------------------
    // Check answer securely through RPC
    // -----------------------------------------------------

    const result =
      await checkPracticeAnswer(
        currentQuestion.id,
        selectedOptionId
      );

    const earnedMarks =
      Number(result.marks);

    console.log(
      "Answer result:",
      result
    );

    // -----------------------------------------------------
    // Save answer
    // -----------------------------------------------------

    await saveStudentAnswer({
      attemptQuestionId:
        currentAttemptQuestion.id,

      selectedOptionId,

      isCorrect:
        result.is_correct,

      marksAwarded:
        earnedMarks,

      timeTakenSeconds:
        Math.max(
          0,
          elapsedSeconds
        ),
    });

    console.log(
      "Student answer saved."
    );

    // -----------------------------------------------------
    // Calculate updated score
    // -----------------------------------------------------

    const updatedScore =
      score + earnedMarks;

    const updatedCorrectAnswers =
      result.is_correct
        ? correctAnswers + 1
        : correctAnswers;

    const updatedWrongAnswers =
      result.is_correct
        ? wrongAnswers
        : wrongAnswers + 1;

    setScore(updatedScore);

    setCorrectAnswers(
      updatedCorrectAnswers
    );

    setWrongAnswers(
      updatedWrongAnswers
    );

    // -----------------------------------------------------
    // More questions
    // -----------------------------------------------------

    if (
      currentQuestionIndex <
      questions.length - 1
    ) {
      setCurrentQuestionIndex(
        (previous) =>
          previous + 1
      );

      setSelectedOptionId(null);

      return;
    }

    // -----------------------------------------------------
    // LAST QUESTION
    // -----------------------------------------------------

    const totalQuestions =
      questions.length;

    const attemptedQuestions =
      updatedCorrectAnswers +
      updatedWrongAnswers;

    const skippedQuestions =
      totalQuestions -
      attemptedQuestions;

    const totalMarks =
      questions.reduce(
        (total, question) =>
          total +
          Number(question.marks),
        0
      );

    const percentage =
      totalMarks > 0
        ? Number(
            (
              (updatedScore /
                totalMarks) *
              100
            ).toFixed(2)
          )
        : 0;

    // -----------------------------------------------------
    // Save final result
    // -----------------------------------------------------

    await savePracticeResult({
      attemptId,

      totalQuestions,

      attemptedQuestions,

      correctAnswers:
        updatedCorrectAnswers,

      incorrectAnswers:
        updatedWrongAnswers,

      skippedQuestions,

      totalScore:
        updatedScore,

      percentage,
    });

    console.log(
      "Practice result saved."
    );

    // -----------------------------------------------------
    // Submit attempt
    // -----------------------------------------------------

    await submitPracticeAttempt(
      attemptId,
      updatedScore
    );

    console.log(
      "Practice attempt submitted."
    );

    // -----------------------------------------------------
    // Finish study session
    // -----------------------------------------------------

    if (
      sessionId &&
      startedAt
    ) {
      try {
        await finishStudySession(
          sessionId,
          startedAt
        );
      } catch (finishError) {
        console.error(
          "Could not finish study session:",
          finishError
        );
      }
    }

    setSessionId(null);
    setStartedAt(null);
    setElapsedSeconds(0);

    // -----------------------------------------------------
    // Show results
    // -----------------------------------------------------

    setShowResults(true);
  } catch (error) {
    console.error(
      "Could not process answer:",
      error
    );

    setQuestionError(
      error instanceof Error
        ? error.message
        : "Could not save your answer."
    );
  } finally {
    setCheckingAnswer(false);
  }
}
  // =========================================================
  // FINISH SESSION MANUALLY
  // =========================================================

  async function handleFinishPractice() {
    if (
      !sessionId ||
      !startedAt
    ) {
      return;
    }

    try {
      setFinishing(true);

      await finishStudySession(
        sessionId,
        startedAt
      );

      setSessionId(
        null
      );

      setStartedAt(
        null
      );

      setElapsedSeconds(
        0
      );

      router.back();
    } catch (error) {
      console.error(
        "Could not finish practice:",
        error
      );
    } finally {
      setFinishing(false);
    }
  }

  // =========================================================
  // FORMAT TIME
  // =========================================================

  function formatTime(
    totalSeconds: number
  ) {
    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) /
          60
      );

    const seconds =
      totalSeconds % 60;

    if (hours > 0) {
      return `${String(
        hours
      ).padStart(
        2,
        "0"
      )}:${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        seconds
      ).padStart(
        2,
        "0"
      )}`;
    }

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      seconds
    ).padStart(
      2,
      "0"
    )}`;
  }

  // =========================================================
  // RESULTS SCREEN
  // =========================================================

  if (showResults) {
    const totalMarks =
      questions.reduce(
        (
          total,
          question
        ) =>
          total +
          Number(
            question.marks
          ),
        0
      );

    const answered =
      correctAnswers +
      wrongAnswers;

    const accuracy =
      answered > 0
        ? Math.round(
            (correctAnswers /
              answered) *
              100
          )
        : 0;

    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
        edges={["top"]}
      >
        <ScrollView
          style={
            styles.container
          }
          contentContainerStyle={
            styles.resultsContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* RESULTS HEADER */}

          <View
            style={
              styles.resultsHeader
            }
          >
            <Ionicons
              name="trophy"
              size={64}
              color={
                colors.warning
              }
            />

            <Text
              style={
                styles.resultsTitle
              }
            >
              Practice Complete!
            </Text>

            <Text
              style={
                styles.resultsSubtitle
              }
            >
              Great work. Here's
              your performance.
            </Text>
          </View>

          {/* SCORE */}

          <View
            style={
              styles.scoreCard
            }
          >
            <Text
              style={
                styles.scoreLabel
              }
            >
              YOUR SCORE
            </Text>

            <Text
              style={
                styles.scoreValue
              }
            >
              {score}

              <Text
                style={
                  styles.scoreTotal
                }
              >
                {" "}
                / {totalMarks}
              </Text>
            </Text>
          </View>

          {/* STATISTICS */}

          <View
            style={
              styles.statsRow
            }
          >
            <View
              style={
                styles.statCard
              }
            >
              <Text
                style={
                  styles.statValue
                }
              >
                {correctAnswers}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Correct
              </Text>
            </View>

            <View
              style={
                styles.statCard
              }
            >
              <Text
                style={
                  styles.statValue
                }
              >
                {wrongAnswers}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Wrong
              </Text>
            </View>

            <View
              style={
                styles.statCard
              }
            >
              <Text
                style={
                  styles.statValue
                }
              >
                {accuracy}%
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Accuracy
              </Text>
            </View>
          </View>

          {/* PRACTICE AGAIN */}

          <Pressable
            style={
              styles.finishButton
            }
            onPress={() => {
              setShowResults(
                false
              );

              setQuestions(
                []
              );

              setCurrentQuestionIndex(
                0
              );

              setSelectedOptionId(
                null
              );

              setScore(0);

              setCorrectAnswers(
                0
              );

              setWrongAnswers(
                0
              );

              setQuestionError(
                null
              );
            }}
          >
            <Text
              style={
                styles.finishButtonText
              }
            >
              Practice Again
            </Text>
          </Pressable>

          {/* DASHBOARD */}

          <Pressable
            style={
              styles.backToDashboardButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backToDashboardText
              }
            >
              Back to Dashboard
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================
  // QUESTION SCREEN
  // =========================================================

  if (isStudying) {
    const subject =
      subjects.find(
        (item) =>
          item.id ===
          selectedSubject
      );

    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
        edges={["top"]}
      >
        <ScrollView
          style={
            styles.container
          }
          contentContainerStyle={
            styles.studyContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* HEADER */}

          <View
            style={
              styles.studyHeader
            }
          >
            <View
              style={
                styles.studyHeaderTop
              }
            >
              <View
                style={
                  styles.liveIndicator
                }
              >
                <View
                  style={
                    styles.liveDot
                  }
                />

                <Text
                  style={
                    styles.liveText
                  }
                >
                  STUDY SESSION
                </Text>
              </View>

              <Text
                style={
                  styles.timerSmall
                }
              >
                {formatTime(
                  elapsedSeconds
                )}
              </Text>
            </View>

            <Text
              style={
                styles.studySubject
              }
            >
              {subject?.name}
            </Text>
          </View>

          {/* LOADING */}

          {loadingQuestions && (
            <View
              style={
                styles.loadingCard
              }
            >
              <Ionicons
                name="hourglass-outline"
                size={28}
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading your
                practice questions...
              </Text>
            </View>
          )}

          {/* ERROR */}

          {!loadingQuestions &&
            questionError && (
              <View
                style={
                  styles.errorCard
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color={
                    colors.danger
                  }
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {questionError}
                </Text>
              </View>
            )}

          {/* QUESTION */}

          {!loadingQuestions &&
            !questionError &&
            currentQuestion && (
              <View
                style={
                  styles.questionSection
                }
              >
                {/* QUESTION NUMBER */}

                <View
                  style={
                    styles.questionProgressRow
                  }
                >
                  <Text
                    style={
                      styles.questionNumber
                    }
                  >
                    Question{" "}
                    {currentQuestionIndex +
                      1}{" "}
                    of{" "}
                    {questions.length}
                  </Text>

                  <View
                    style={
                      styles.difficultyBadge
                    }
                  >
                    <Text
                      style={
                        styles.difficultyText
                      }
                    >
                      {
                        currentQuestion.difficulty
                      }
                    </Text>
                  </View>
                </View>

                {/* QUESTION CARD */}

                <View
                  style={
                    styles.questionCard
                  }
                >
                  <Text
                    style={
                      styles.questionText
                    }
                  >
                    {
                      currentQuestion.question_text
                    }
                  </Text>
                </View>

                {/* OPTIONS */}

                <View
                  style={
                    styles.optionsContainer
                  }
                >
                  {currentQuestion.options.map(
                    (
                      option,
                      index
                    ) => {
                      const selected =
                        selectedOptionId ===
                        option.id;

                      const optionLabel =
                        String.fromCharCode(
                          65 +
                            index
                        );

                      return (
                        <Pressable
                          key={
                            option.id
                          }
                          onPress={() =>
                            setSelectedOptionId(
                              option.id
                            )
                          }
                          disabled={
                            checkingAnswer
                          }
                          style={[
                            styles.optionCard,
                            selected &&
                              styles.optionCardSelected,
                          ]}
                        >
                          {/* RADIO */}

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

                          {/* LABEL */}

                          <Text
                            style={
                              styles.optionLabel
                            }
                          >
                            {optionLabel}.
                          </Text>

                          {/* TEXT */}

                          <Text
                            style={[
                              styles.optionText,
                              selected &&
                                styles.optionTextSelected,
                            ]}
                          >
                            {
                              option.option_text
                            }
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>

                {/* NEXT */}

                <Pressable
                  onPress={
                    handleNextQuestion
                  }
                  disabled={
                    !selectedOptionId ||
                    checkingAnswer
                  }
                  style={[
                    styles.nextButton,
                    (!selectedOptionId ||
                      checkingAnswer) &&
                      styles.buttonDisabled,
                  ]}
                >
                  <Text
                    style={
                      styles.nextButtonText
                    }
                  >
                    {checkingAnswer
                      ? "Checking..."
                      : currentQuestionIndex ===
                          questions.length -
                            1
                        ? "Finish"
                        : "Next Question"}
                  </Text>

                  <Ionicons
                    name={
                      currentQuestionIndex ===
                      questions.length -
                        1
                        ? "checkmark"
                        : "arrow-forward"
                    }
                    size={20}
                    color={
                      colors.textInverse
                    }
                  />
                </Pressable>
              </View>
            )}

          {/* FINISH SESSION */}

          <View
            style={
              styles.studyBottom
            }
          >
            <Text
              style={
                styles.encouragement
              }
            >
              Stay focused. You've
              got this. 💪
            </Text>

            <Pressable
              onPress={
                handleFinishPractice
              }
              disabled={
                finishing
              }
              style={[
                styles.finishButton,
                finishing &&
                  styles.buttonDisabled,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={
                  colors.textInverse
                }
              />

              <Text
                style={
                  styles.finishButtonText
                }
              >
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

  // =========================================================
  // SUBJECT SELECTION SCREEN
  // =========================================================

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={["top"]}
    >
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* BACK */}

        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={
              colors.textPrimary
            }
          />
        </Pressable>

        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.title
            }
          >
            Practice
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Strengthen your concepts
            with focused practice.
          </Text>
        </View>

        {/* SUBJECT TITLE */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Choose a subject
        </Text>

        {/* SUBJECT LIST */}

        <View
          style={
            styles.subjectList
          }
        >
          {subjects.map(
            (subject) => {
              const selected =
                selectedSubject ===
                subject.id;

              return (
                <Pressable
                  key={
                    subject.id
                  }
                  onPress={() =>
                    setSelectedSubject(
                      subject.id
                    )
                  }
                  style={[
                    styles.subjectCard,
                    selected &&
                      styles.subjectCardSelected,
                  ]}
                >
                  {/* ICON */}

                  <View
                    style={[
                      styles.iconCircle,
                      selected &&
                        styles.iconCircleSelected,
                    ]}
                  >
                    <Ionicons
                      name={
                        subject.icon
                      }
                      size={22}
                      color={
                        selected
                          ? colors.textInverse
                          : colors.primary
                      }
                    />
                  </View>

                  {/* NAME */}

                  <Text
                    style={[
                      styles.subjectName,
                      selected &&
                        styles.subjectNameSelected,
                    ]}
                  >
                    {
                      subject.name
                    }
                  </Text>

                  {/* CHECK */}

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
            }
          )}
        </View>

        {/* INFO */}

        <View
          style={
            styles.infoCard
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={
              colors.primary
            }
          />

          <View
            style={
              styles.infoText
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Focused practice
            </Text>

            <Text
              style={
                styles.infoDescription
              }
            >
              Your study time will
              be recorded
              automatically while
              you practice.
            </Text>
          </View>
        </View>

        {/* START */}

        <Pressable
          style={[
            styles.startButton,
            starting &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleStartPractice
          }
          disabled={
            starting
          }
        >
          <Ionicons
            name="play"
            size={20}
            color={
              colors.textInverse
            }
          />

          <Text
            style={
              styles.startButtonText
            }
          >
            {starting
              ? "Starting..."
              : "Start Practice"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    content: {
      paddingHorizontal:
        spacing.xl,
      paddingBottom: 48,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius:
        radii.pill,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems: "center",
      justifyContent:
        "center",
      marginTop:
        spacing.sm,
    },

    header: {
      marginTop:
        spacing.xxl,
      marginBottom:
        spacing.xxxl,
    },

    title: {
      ...typography.display,
      color:
        colors.textPrimary,
    },

    subtitle: {
      ...typography.body,
      color:
        colors.textSecondary,
      marginTop:
        spacing.sm,
      lineHeight: 22,
    },

    sectionTitle: {
      ...typography.h2,
      color:
        colors.textPrimary,
      marginBottom:
        spacing.md,
    },

    subjectList: {
      gap: spacing.md,
    },

    subjectCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding:
        spacing.lg,
      gap: spacing.md,
      ...shadow.soft,
    },

    subjectCardSelected: {
      borderColor:
        colors.primary,
      backgroundColor:
        colors.primarySoft,
    },

    iconCircle: {
      width: 44,
      height: 44,
      borderRadius:
        radii.pill,
      backgroundColor:
        colors.primarySoft,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    iconCircleSelected: {
      backgroundColor:
        colors.primary,
    },

    subjectName: {
      ...typography.bodyStrong,
      color:
        colors.textPrimary,
      flex: 1,
    },

    subjectNameSelected: {
      color:
        colors.primary,
    },

    infoCard: {
      flexDirection:
        "row",
      gap: spacing.md,
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding:
        spacing.lg,
      marginTop:
        spacing.xxxl,
    },

    infoText: {
      flex: 1,
    },

    infoTitle: {
      ...typography.bodyStrong,
      color:
        colors.textPrimary,
      marginBottom:
        spacing.xs,
    },

    infoDescription: {
      ...typography.caption,
      color:
        colors.textSecondary,
      lineHeight: 19,
    },

    startButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      backgroundColor:
        colors.primary,
      borderRadius:
        radii.lg,
      paddingVertical: 16,
      marginTop:
        spacing.xxl,
      marginBottom:
        spacing.lg,
      ...shadow.soft,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    startButtonText: {
      ...typography.bodyStrong,
      color:
        colors.textInverse,
    },

    // =====================================================
    // STUDY
    // =====================================================

    studyContent: {
      paddingHorizontal:
        spacing.xl,
      paddingBottom: 40,
    },

    studyHeader: {
      paddingTop:
        spacing.xl,
    },

    studyHeaderTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    liveIndicator: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: spacing.xs,
    },

    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        colors.success,
    },

    liveText: {
      ...typography.micro,
      color:
        colors.success,
      letterSpacing: 1,
    },

    timerSmall: {
      ...typography.bodyStrong,
      color:
        colors.textPrimary,
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.pill,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.sm,
    },

    studySubject: {
      ...typography.h1,
      color:
        colors.textPrimary,
      marginTop:
        spacing.md,
    },

    loadingCard: {
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding:
        spacing.xxxl,
      marginTop:
        spacing.xxxl,
    },

    loadingText: {
      ...typography.body,
      color:
        colors.textSecondary,
      marginTop:
        spacing.md,
      textAlign:
        "center",
    },

    errorCard: {
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.dangerSoft,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.danger,
      padding:
        spacing.xl,
      marginTop:
        spacing.xxxl,
    },

    errorText: {
      ...typography.body,
      color:
        colors.textPrimary,
      marginTop:
        spacing.md,
      textAlign:
        "center",
    },

    questionSection: {
      marginTop:
        spacing.xxxl,
    },

    questionProgressRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom:
        spacing.md,
    },

    questionNumber: {
      ...typography.caption,
      color:
        colors.textSecondary,
    },

    difficultyBadge: {
      backgroundColor:
        colors.primarySoft,
      borderRadius:
        radii.pill,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.xs,
    },

    difficultyText: {
      ...typography.micro,
      color:
        colors.primary,
    },

    questionCard: {
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding:
        spacing.xl,
      ...shadow.soft,
    },

    questionText: {
      ...typography.bodyStrong,
      color:
        colors.textPrimary,
      lineHeight: 25,
    },

    optionsContainer: {
      marginTop:
        spacing.lg,
      gap: spacing.md,
    },

    optionCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding:
        spacing.lg,
      gap: spacing.md,
    },

    optionCardSelected: {
      borderColor:
        colors.primary,
      backgroundColor:
        colors.primarySoft,
    },

    optionCircle: {
      width: 22,
      height: 22,
      borderRadius:
        radii.pill,
      borderWidth: 2,
      borderColor:
        colors.textTertiary,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    optionCircleSelected: {
      borderColor:
        colors.primary,
    },

    optionCircleInner: {
      width: 10,
      height: 10,
      borderRadius:
        radii.pill,
      backgroundColor:
        colors.primary,
    },

    optionLabel: {
      ...typography.bodyStrong,
      color:
        colors.textSecondary,
      width: 22,
    },

    optionText: {
      ...typography.body,
      color:
        colors.textPrimary,
      flex: 1,
      lineHeight: 22,
    },

    optionTextSelected: {
      color:
        colors.primary,
    },

    nextButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      backgroundColor:
        colors.primary,
      borderRadius:
        radii.lg,
      paddingVertical: 16,
      marginTop:
        spacing.xl,
      ...shadow.soft,
    },

    nextButtonText: {
      ...typography.bodyStrong,
      color:
        colors.textInverse,
    },

    studyBottom: {
      alignItems:
        "center",
      marginTop:
        spacing.xxxl,
    },

    encouragement: {
      ...typography.body,
      color:
        colors.textSecondary,
      marginBottom:
        spacing.xl,
    },

    finishButton: {
      width: "100%",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.sm,
      backgroundColor:
        colors.success,
      borderRadius:
        radii.lg,
      paddingVertical: 16,
      ...shadow.soft,
    },

    finishButtonText: {
      ...typography.bodyStrong,
      color:
        colors.textInverse,
    },

    // =====================================================
    // RESULTS
    // =====================================================

    resultsContent: {
      paddingHorizontal:
        spacing.xl,
      paddingBottom: 48,
    },

    resultsHeader: {
      alignItems:
        "center",
      marginTop:
        spacing.xxxl,
    },

    resultsTitle: {
      ...typography.display,
      color:
        colors.textPrimary,
      marginTop:
        spacing.lg,
      textAlign:
        "center",
    },

    resultsSubtitle: {
      ...typography.body,
      color:
        colors.textSecondary,
      marginTop:
        spacing.sm,
      textAlign:
        "center",
    },

    scoreCard: {
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.xl,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems:
        "center",
      paddingVertical:
        spacing.xxxl,
      marginTop:
        spacing.xxxl,
      ...shadow.card,
    },

    scoreLabel: {
      ...typography.micro,
      color:
        colors.textSecondary,
      letterSpacing: 1,
    },

    scoreValue: {
      fontSize: 48,
      fontWeight:
        "700",
      color:
        colors.primary,
      marginTop:
        spacing.sm,
    },

    scoreTotal: {
      fontSize: 24,
      color:
        colors.textSecondary,
    },

    statsRow: {
      flexDirection:
        "row",
      gap: spacing.sm,
      marginTop:
        spacing.lg,
    },

    statCard: {
      flex: 1,
      backgroundColor:
        colors.surface,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems:
        "center",
      paddingVertical:
        spacing.lg,
    },

    statValue: {
      fontSize: 22,
      fontWeight:
        "700",
      color:
        colors.textPrimary,
    },

    statLabel: {
      ...typography.caption,
      color:
        colors.textSecondary,
      marginTop:
        spacing.xs,
    },

    backToDashboardButton: {
      alignItems:
        "center",
      paddingVertical:
        spacing.lg,
      marginTop:
        spacing.md,
    },

    backToDashboardText: {
      ...typography.bodyStrong,
      color:
        colors.primary,
    },
  });