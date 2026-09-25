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
    practiceDurationSeconds,
    setPracticeDurationSeconds,
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

  const [showHint, setShowHint] = useState(false);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);

  const [
    reviewAnswers,
    setReviewAnswers,
  ] = useState<
    {
      questionId: string;
      selectedOptionId: string;
      correctOptionId: string;
      isCorrect: boolean;
    }[]
  >([]);

  const [showReview, setShowReview] = useState(false);

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
    setShowHint(false);
    setAnswerChecked(false);
    setAnswerCorrect(null);
    setCorrectOptionId(null);
    setReviewAnswers([]);
    setShowReview(false);

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
    setPracticeDurationSeconds(0);

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
      !currentQuestion ||
      !attemptId ||
      checkingAnswer
    ) {
      return;
    }

    // -----------------------------------------------------
    // If this question has already been checked,
    // this button now means "Next Question" or "Finish".
    // -----------------------------------------------------

    if (answerChecked) {
      if (
        currentQuestionIndex <
        questions.length - 1
      ) {
        setCurrentQuestionIndex(
          (previous) =>
            previous + 1
        );

        setSelectedOptionId(null);
        setShowHint(false);
        setAnswerChecked(false);
        setAnswerCorrect(null);
        setCorrectOptionId(null);

        return;
      }

      // ---------------------------------------------------
      // LAST QUESTION - save final result
      // ---------------------------------------------------

      try {
        setCheckingAnswer(true);

        const totalQuestions =
          questions.length;

        const attemptedQuestions =
          correctAnswers +
          wrongAnswers;

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
                Math.max(
                  0,
                  Math.min(
                    100,
                    (score /
                      totalMarks) *
                      100
                  )
                ).toFixed(2)
              )
            : 0;

        // -------------------------------------------------
        // Save final result
        // -------------------------------------------------

        await savePracticeResult({
          attemptId,

          totalQuestions,

          attemptedQuestions,

          correctAnswers,

          incorrectAnswers:
            wrongAnswers,

          skippedQuestions,

          totalScore:
            score,

          percentage,
        });

        console.log(
          "Practice result saved."
        );

        // -------------------------------------------------
        // Submit attempt
        // -------------------------------------------------

        await submitPracticeAttempt(
          attemptId,
          score
        );

        console.log(
          "Practice attempt submitted."
        );

        // -------------------------------------------------
        // Finish study session
        // -------------------------------------------------

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

        setPracticeDurationSeconds(
          elapsedSeconds
        );

        setSessionId(null);
        setStartedAt(null);
        setElapsedSeconds(0);

        // -------------------------------------------------
        // Show results
        // -------------------------------------------------

        setShowResults(true);
      } catch (error) {
        console.error(
          "Could not finish practice:",
          error
        );

        setQuestionError(
          error instanceof Error
            ? error.message
            : "Could not finish practice."
        );
      } finally {
        setCheckingAnswer(false);
      }

      return;
    }

    // -----------------------------------------------------
    // First tap - check and save the answer
    // -----------------------------------------------------

    if (!selectedOptionId) {
      return;
    }

    try {
      setCheckingAnswer(true);

      // ---------------------------------------------------
      // Find database record for current question
      // ---------------------------------------------------

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

      // ---------------------------------------------------
      // Check answer securely through RPC
      // ---------------------------------------------------

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

      // ---------------------------------------------------
      // Save answer
      // ---------------------------------------------------

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

      // ---------------------------------------------------
      // Calculate updated score
      // ---------------------------------------------------

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

      // ---------------------------------------------------
      // Store feedback for this question
      // ---------------------------------------------------

      setAnswerCorrect(
        result.is_correct
      );

      setCorrectOptionId(
        result.correct_option_id
      );

      setReviewAnswers((previous) => [
        ...previous,
        {
          questionId: currentQuestion.id,
          selectedOptionId,
          correctOptionId: result.correct_option_id,
          isCorrect: result.is_correct,
        },
      ]);

      setAnswerChecked(true);
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

    const skipped = Math.max(
      0,
      questions.length - answered
    );

    const accuracy =
      answered > 0
        ? Math.round(
            (correctAnswers /
              answered) *
              100
          )
        : 0;

    const scorePercentage =
      totalMarks > 0
        ? Math.max(
            0,
            Math.round(
              (score / totalMarks) *
                100
            )
          )
        : 0;

    const subjectName =
      subjects.find(
        (item) =>
          item.id === selectedSubject
      )?.name ?? "Subject";

    const performanceMessage =
      accuracy >= 80
        ? "Strong concept understanding. Keep practicing to maintain your consistency."
        : accuracy >= 60
          ? "Good progress. Review the questions you missed and strengthen those concepts."
          : "Use this practice as a learning checkpoint. Review the explanations and try again.";

    if (showReview) {
      return (
        <SafeAreaView
          style={styles.safeArea}
          edges={["top"]}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => setShowReview(false)}
              style={styles.reviewBackButton}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={colors.textPrimary}
              />
              <Text style={styles.reviewBackText}>
                Back to Results
              </Text>
            </Pressable>

            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>
                Review Answers
              </Text>
              <Text style={styles.reviewSubtitle}>
                Review each question, your answer, and the correct answer.
              </Text>
            </View>

            {questions.map((question, index) => {
              const answer = reviewAnswers.find(
                (item) => item.questionId === question.id
              );

              const selectedOption = question.options.find(
                (option) => option.id === answer?.selectedOptionId
              );

              const correctOption = question.options.find(
                (option) => option.id === answer?.correctOptionId
              );

              return (
                <View
                  key={question.id}
                  style={styles.reviewQuestionCard}
                >
                  <View style={styles.reviewQuestionHeader}>
                    <Text style={styles.reviewQuestionNumber}>
                      Question {index + 1}
                    </Text>

                    <View
                      style={[
                        styles.reviewStatusBadge,
                        answer?.isCorrect
                          ? styles.reviewStatusCorrect
                          : styles.reviewStatusIncorrect,
                      ]}
                    >
                      <Ionicons
                        name={
                          answer?.isCorrect
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={16}
                        color={
                          answer?.isCorrect
                            ? colors.success
                            : colors.danger
                        }
                      />
                      <Text
                        style={[
                          styles.reviewStatusText,
                          {
                            color: answer?.isCorrect
                              ? colors.success
                              : colors.danger,
                          },
                        ]}
                      >
                        {answer?.isCorrect ? "Correct" : "Incorrect"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reviewQuestionText}>
                    {question.question_text}
                  </Text>

                  <View style={styles.reviewAnswerBlock}>
                    <Text style={styles.reviewLabel}>
                      Your Answer
                    </Text>
                    <Text
                      style={[
                        styles.reviewAnswerText,
                        answer?.isCorrect
                          ? styles.reviewCorrectAnswerText
                          : styles.reviewWrongAnswerText,
                      ]}
                    >
                      {selectedOption?.option_text ?? "Not answered"}
                    </Text>
                  </View>

                  <View style={styles.reviewAnswerBlock}>
                    <Text style={styles.reviewLabel}>
                      Correct Answer
                    </Text>
                    <Text style={styles.reviewCorrectAnswerText}>
                      {correctOption?.option_text ?? "Unavailable"}
                    </Text>
                  </View>

                  <View style={styles.reviewMarksRow}>
                    <Text style={styles.reviewLabel}>
                      Marks
                    </Text>
                    <Text style={styles.reviewMarksText}>
                      {answer?.isCorrect
                        ? `+${Number(question.marks)}`
                        : `-${Number(question.negative_marks)}`}
                    </Text>
                  </View>

                  {question.explanation && (
                    <View style={styles.reviewExplanation}>
                      <Text style={styles.reviewLabel}>
                        Explanation
                      </Text>
                      <Text style={styles.reviewExplanationText}>
                        {question.explanation}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            <Pressable
              style={styles.backToResultsButton}
              onPress={() => setShowReview(false)}
            >
              <Text style={styles.backToResultsText}>
                Back to Results
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      );
    }

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
              {subjectName.toUpperCase()} · PRACTICE SCORE
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

            <View
              style={
                styles.scorePercentageBadge
              }
            >
              <Text
                style={
                  styles.scorePercentageText
                }
              >
                {scorePercentage}% score
              </Text>
            </View>
          </View>

          {/* PERFORMANCE OVERVIEW */}

          <Text
            style={
              styles.resultsSectionTitle
            }
          >
            Performance Overview
          </Text>

          <View
            style={
              styles.statsGrid
            }
          >
            <View
              style={
                styles.statCard
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={
                  colors.success
                }
              />

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
              <Ionicons
                name="close-circle-outline"
                size={22}
                color={
                  colors.danger
                }
              />

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
                Incorrect
              </Text>
            </View>

            <View
              style={
                styles.statCard
              }
            >
              <Ionicons
                name="analytics-outline"
                size={22}
                color={
                  colors.primary
                }
              />

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

            <View
              style={
                styles.statCard
              }
            >
              <Ionicons
                name="time-outline"
                size={22}
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.statValue
                }
              >
                {formatTime(
                  practiceDurationSeconds
                )}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Time Spent
              </Text>
            </View>
          </View>

          {/* QUESTION SUMMARY */}

          <View
            style={
              styles.summaryCard
            }
          >
            <Text
              style={
                styles.summaryTitle
              }
            >
              Question Summary
            </Text>

            <View
              style={
                styles.summaryRow
              }
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Total Questions
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {questions.length}
              </Text>
            </View>

            <View
              style={
                styles.summaryDivider
              }
            />

            <View
              style={
                styles.summaryRow
              }
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Attempted
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {answered}
              </Text>
            </View>

            <View
              style={
                styles.summaryDivider
              }
            />

            <View
              style={
                styles.summaryRow
              }
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Skipped
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {skipped}
              </Text>
            </View>
          </View>

          {/* LEARNING INSIGHT */}

          <View
            style={
              styles.insightCard
            }
          >
            <View
              style={
                styles.insightIcon
              }
            >
              <Ionicons
                name="bulb-outline"
                size={22}
                color={
                  colors.primary
                }
              />
            </View>

            <View
              style={
                styles.insightContent
              }
            >
              <Text
                style={
                  styles.insightTitle
                }
              >
                Learning Insight
              </Text>

              <Text
                style={
                  styles.insightText
                }
              >
                {performanceMessage}
              </Text>
            </View>
          </View>

          {/* REVIEW ANSWERS */}

          <Pressable
            style={
              styles.reviewButton
            }
            onPress={() =>
              setShowReview(true)
            }
          >
            <Ionicons
              name="list-outline"
              size={20}
              color={colors.primary}
            />
            <Text
              style={
                styles.reviewButtonText
              }
            >
              Review Answers
            </Text>
          </Pressable>

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

              setPracticeDurationSeconds(0);

              setShowHint(false);
              setAnswerChecked(false);
              setAnswerCorrect(null);
              setCorrectOptionId(null);
              setReviewAnswers([]);
              setShowReview(false);

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

                {/* HINT */}

                {currentQuestion.hint && !answerChecked && (
                  <View
                    style={
                      styles.hintSection
                    }
                  >
                    <Pressable
                      onPress={() =>
                        setShowHint(
                          (previous) =>
                            !previous
                        )
                      }
                      style={
                        styles.hintButton
                      }
                    >
                      <Ionicons
                        name="bulb-outline"
                        size={20}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={
                          styles.hintButtonText
                        }
                      >
                        {showHint
                          ? "Hide Hint"
                          : "Show Hint"}
                      </Text>
                    </Pressable>

                    {showHint && (
                      <View
                        style={
                          styles.hintCard
                        }
                      >
                        <Text
                          style={
                            styles.hintTitle
                          }
                        >
                          Hint
                        </Text>

                        <Text
                          style={
                            styles.hintText
                          }
                        >
                          {
                            currentQuestion.hint
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                )}

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

                      const isCorrectOption =
                        answerChecked &&
                        correctOptionId ===
                          option.id;

                      const isWrongSelected =
                        answerChecked &&
                        selected &&
                        !answerCorrect;

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
                            checkingAnswer ||
                            answerChecked
                          }
                          style={[
                            styles.optionCard,
                            selected &&
                              styles.optionCardSelected,
                            isCorrectOption &&
                              styles.optionCardCorrect,
                            isWrongSelected &&
                              styles.optionCardIncorrect,
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

                          {isCorrectOption && (
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color={
                                colors.success
                              }
                            />
                          )}

                          {isWrongSelected && (
                            <Ionicons
                              name="close-circle"
                              size={22}
                              color={
                                colors.danger
                              }
                            />
                          )}
                        </Pressable>
                      );
                    }
                  )}
                </View>

                {/* ANSWER FEEDBACK */}

                {answerChecked && (
                  <View
                    style={[
                      styles.feedbackCard,
                      answerCorrect
                        ? styles.feedbackCorrect
                        : styles.feedbackIncorrect,
                    ]}
                  >
                    <View
                      style={
                        styles.feedbackHeader
                      }
                    >
                      <Ionicons
                        name={
                          answerCorrect
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={26}
                        color={
                          answerCorrect
                            ? colors.success
                            : colors.danger
                        }
                      />

                      <Text
                        style={
                          styles.feedbackTitle
                        }
                      >
                        {answerCorrect
                          ? "Correct!"
                          : "Incorrect"}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.correctAnswerLabel
                      }
                    >
                      Correct Answer
                    </Text>

                    <Text
                      style={
                        styles.correctAnswerText
                      }
                    >
                      {currentQuestion.options.find(
                        (option) =>
                          option.id ===
                          correctOptionId
                      )?.option_text ??
                        "Correct answer unavailable"}
                    </Text>

                    {currentQuestion.explanation && (
                      <View
                        style={
                          styles.explanationSection
                        }
                      >
                        <Text
                          style={
                            styles.explanationLabel
                          }
                        >
                          Explanation
                        </Text>

                        <Text
                          style={
                            styles.explanationText
                          }
                        >
                          {
                            currentQuestion.explanation
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* NEXT */}

                <Pressable
                  onPress={
                    handleNextQuestion
                  }
                  disabled={
                    (!selectedOptionId &&
                      !answerChecked) ||
                    checkingAnswer
                  }
                  style={[
                    styles.nextButton,
                    ((!selectedOptionId &&
                      !answerChecked) ||
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
                      : answerChecked
                        ? currentQuestionIndex ===
                            questions.length -
                              1
                          ? "Finish Practice"
                          : "Next Question"
                        : "Check Answer"}
                  </Text>

                  <Ionicons
                    name={
                      answerChecked &&
                      currentQuestionIndex ===
                        questions.length -
                          1
                        ? "checkmark"
                        : answerChecked
                          ? "arrow-forward"
                          : "checkmark-circle-outline"
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

    // =====================================================
    // HINT + FEEDBACK
    // =====================================================

    hintSection: {
      marginTop:
        spacing.lg,
    },

    hintButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: spacing.sm,
      alignSelf: "flex-start",
      paddingVertical:
        spacing.sm,
      paddingHorizontal:
        spacing.md,
      borderRadius:
        radii.pill,
      backgroundColor:
        colors.primarySoft,
    },

    hintButtonText: {
      ...typography.bodyStrong,
      color:
        colors.primary,
    },

    hintCard: {
      marginTop:
        spacing.sm,
      backgroundColor:
        colors.primarySoft,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      borderColor:
        colors.primary,
      padding:
        spacing.lg,
    },

    hintTitle: {
      ...typography.bodyStrong,
      color:
        colors.primary,
      marginBottom:
        spacing.xs,
    },

    hintText: {
      ...typography.body,
      color:
        colors.textPrimary,
      lineHeight: 22,
    },

    optionCardCorrect: {
      borderColor:
        colors.success,
      backgroundColor:
        colors.primarySoft,
    },

    optionCardIncorrect: {
      borderColor:
        colors.danger,
      backgroundColor:
        colors.dangerSoft,
    },

    feedbackCard: {
      marginTop:
        spacing.lg,
      borderRadius:
        radii.lg,
      borderWidth: 1,
      padding:
        spacing.lg,
    },

    feedbackCorrect: {
      borderColor:
        colors.success,
      backgroundColor:
        colors.primarySoft,
    },

    feedbackIncorrect: {
      borderColor:
        colors.danger,
      backgroundColor:
        colors.dangerSoft,
    },

    feedbackHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: spacing.sm,
    },

    feedbackTitle: {
      ...typography.h2,
      color:
        colors.textPrimary,
    },

    correctAnswerLabel: {
      ...typography.caption,
      color:
        colors.textSecondary,
      marginTop:
        spacing.md,
    },

    correctAnswerText: {
      ...typography.bodyStrong,
      color:
        colors.textPrimary,
      marginTop:
        spacing.xs,
      lineHeight: 22,
    },

    explanationSection: {
      marginTop:
        spacing.md,
      paddingTop:
        spacing.md,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
    },

    explanationLabel: {
      ...typography.bodyStrong,
      color:
        colors.textPrimary,
      marginBottom:
        spacing.xs,
    },

    explanationText: {
      ...typography.body,
      color:
        colors.textSecondary,
      lineHeight: 22,
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

    scorePercentageBadge: {
      marginTop:
        spacing.md,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.xs,
      borderRadius:
        radii.pill,
      backgroundColor:
        colors.primarySoft,
    },

    scorePercentageText: {
      ...typography.caption,
      color:
        colors.primary,
    },

    resultsSectionTitle: {
      ...typography.h2,
      color:
        colors.textPrimary,
      marginTop:
        spacing.xxxl,
      marginBottom:
        spacing.md,
    },

    statsGrid: {
      flexDirection:
        "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },

    statCard: {
      width: "48.5%",
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

    // =====================================================
    // RESULTS SUMMARY + INSIGHT
    // =====================================================

    summaryCard: {
      marginTop: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...shadow.soft,
    },

    summaryTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },

    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
    },

    summaryLabel: {
      ...typography.body,
      color: colors.textSecondary,
    },

    summaryValue: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },

    summaryDivider: {
      height: 1,
      backgroundColor: colors.border,
    },

    insightCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      marginTop: spacing.lg,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: spacing.lg,
    },

    insightIcon: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },

    insightContent: {
      flex: 1,
    },

    insightTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },

    insightText: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    // =====================================================
    // QUESTION REVIEW
    // =====================================================

    reviewButton: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 16,
      marginTop: spacing.xxl,
    },

    reviewButtonText: {
      ...typography.bodyStrong,
      color: colors.primary,
    },

    reviewBackButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      alignSelf: "flex-start",
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
    },

    reviewBackText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },

    reviewHeader: {
      marginTop: spacing.xxl,
      marginBottom: spacing.xl,
    },

    reviewTitle: {
      ...typography.display,
      color: colors.textPrimary,
    },

    reviewSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 22,
    },

    reviewQuestionCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadow.soft,
    },

    reviewQuestionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },

    reviewQuestionNumber: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },

    reviewStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },

    reviewStatusCorrect: {
      backgroundColor: colors.primarySoft,
    },

    reviewStatusIncorrect: {
      backgroundColor: colors.dangerSoft,
    },

    reviewStatusText: {
      ...typography.micro,
    },

    reviewQuestionText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      lineHeight: 24,
    },

    reviewAnswerBlock: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    reviewLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },

    reviewAnswerText: {
      ...typography.bodyStrong,
      lineHeight: 22,
    },

    reviewCorrectAnswerText: {
      color: colors.success,
    },

    reviewWrongAnswerText: {
      color: colors.danger,
    },

    reviewMarksRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    reviewMarksText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },

    reviewExplanation: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    reviewExplanationText: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    backToResultsButton: {
      alignItems: "center",
      paddingVertical: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },

    backToResultsText: {
      ...typography.bodyStrong,
      color: colors.primary,
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