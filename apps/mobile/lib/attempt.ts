import { supabase } from "./supabase";

const PRACTICE_TEST_ID =
  "7d279b5f-ef0f-457c-9853-4468448d4bbe";

export type PracticeHistoryItem = {
  attemptId: string;
  testId: string;
  testName: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  score: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalScore: number;
  percentage: number;
  durationSeconds: number;
  createdAt: string;
};

export type HistoricalReviewOption = {
  id: string;
  optionText: string;
  optionOrder: number;
  isCorrect: boolean;
};

export type HistoricalReviewItem = {
  attemptQuestionId: string;
  questionId: string;
  questionOrder: number;
  questionText: string;
  explanation: string | null;
  hint: string | null;
  marks: number;
  negativeMarks: number;
  options: HistoricalReviewOption[];
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  correctOptionId: string | null;
  correctOptionText: string | null;
  isCorrect: boolean | null;
  marksAwarded: number;
  timeTakenSeconds: number;
};

export async function createPracticeAttempt() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("attempts")
    .insert({
      test_id: PRACTICE_TEST_ID,
      student_id: user.id,
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating practice attempt:", error);
    throw error;
  }

  return data.id;
}

export async function createAttemptQuestions(
  attemptId: string,
  questionIds: string[]
) {
  const rows = questionIds.map((questionId, index) => ({
    attempt_id: attemptId,
    question_id: questionId,
    question_order: index + 1,
  }));

  const { data, error } = await supabase
    .from("attempt_questions")
    .insert(rows)
    .select("id, question_id, question_order");

  if (error) {
    console.error("Error creating attempt questions:", error);
    throw error;
  }

  return data;
}

export async function saveStudentAnswer({
  attemptQuestionId,
  selectedOptionId,
  isCorrect,
  marksAwarded,
  timeTakenSeconds,
}: {
  attemptQuestionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  marksAwarded: number;
  timeTakenSeconds: number;
}) {
  const { data, error } = await supabase
    .from("student_answers")
    .insert({
      attempt_question_id: attemptQuestionId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      marks_awarded: marksAwarded,
      time_taken_seconds: timeTakenSeconds,
      answered_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving student answer:", error);
    throw error;
  }

  return data.id;
}

export async function submitPracticeAttempt(
  attemptId: string,
  score: number
) {
  const { error } = await supabase
    .from("attempts")
    .update({
      status: "SUBMITTED",
      submitted_at: new Date().toISOString(),
      score,
    })
    .eq("id", attemptId);

  if (error) {
    console.error("Error submitting practice attempt:", error);
    throw error;
  }
}

export async function savePracticeResult({
  attemptId,
  totalQuestions,
  attemptedQuestions,
  correctAnswers,
  incorrectAnswers,
  skippedQuestions,
  totalScore,
  percentage,
}: {
  attemptId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalScore: number;
  percentage: number;
}) {
  const { data, error } = await supabase
    .from("results")
    .insert({
      attempt_id: attemptId,
      total_questions: totalQuestions,
      attempted_questions: attemptedQuestions,
      correct_answers: correctAnswers,
      incorrect_answers: incorrectAnswers,
      skipped_questions: skippedQuestions,
      total_score: totalScore,
      percentage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving practice result:", error);
    throw error;
  }

  return data.id;
}

/**
 * Returns the authenticated student's completed practice attempts.
 *
 * The current database model links an attempt to a test, and the test
 * links to a curriculum. A curriculum can contain multiple subjects,
 * so this function intentionally uses the test name as the activity
 * label instead of incorrectly assigning a single subject from the
 * curriculum.
 */
export async function getPracticeHistory(): Promise<
  PracticeHistoryItem[]
> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  const { data, error } = await supabase
    .from("attempts")
    .select(
      `
        id,
        test_id,
        status,
        started_at,
        submitted_at,
        score,
        created_at,
        tests (
          id,
          name,
          test_type,
          total_questions,
          total_marks
        ),
        results (
          id,
          total_questions,
          attempted_questions,
          correct_answers,
          incorrect_answers,
          skipped_questions,
          total_score,
          percentage,
          created_at
        )
      `
    )
    .eq("student_id", user.id)
    .eq("status", "SUBMITTED")
    .eq("test_id", PRACTICE_TEST_ID)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error loading practice history:", error);
    throw error;
  }

  return (data ?? []).map((attempt: any) => {
    const test = Array.isArray(attempt.tests)
      ? attempt.tests[0]
      : attempt.tests;

    const result = Array.isArray(attempt.results)
      ? attempt.results[0]
      : attempt.results;

    const startedAt = new Date(attempt.started_at);
    const submittedAt = attempt.submitted_at
      ? new Date(attempt.submitted_at)
      : null;

    const durationSeconds =
      submittedAt && !Number.isNaN(startedAt.getTime())
        ? Math.max(
            0,
            Math.floor(
              (submittedAt.getTime() - startedAt.getTime()) / 1000
            )
          )
        : 0;

    return {
      attemptId: attempt.id,
      testId: attempt.test_id,
      testName: test?.name ?? "Practice Session",
      status: attempt.status,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at ?? null,
      score: Number(attempt.score ?? result?.total_score ?? 0),
      totalQuestions: Number(
        result?.total_questions ?? test?.total_questions ?? 0
      ),
      attemptedQuestions: Number(
        result?.attempted_questions ?? 0
      ),
      correctAnswers: Number(result?.correct_answers ?? 0),
      incorrectAnswers: Number(result?.incorrect_answers ?? 0),
      skippedQuestions: Number(result?.skipped_questions ?? 0),
      totalScore: Number(
        result?.total_score ?? attempt.score ?? 0
      ),
      percentage: Number(result?.percentage ?? 0),
      durationSeconds,
      createdAt:
        result?.created_at ??
        attempt.created_at ??
        attempt.started_at,
    };
  });
}

/**
 * Loads one completed practice attempt for historical review.
 *
 * The data is loaded in separate queries instead of relying on
 * Supabase's nested foreign-key syntax for every relationship.
 * This keeps the query compatible with the existing schema while
 * preserving the exact question order from the original attempt.
 */
export async function getHistoricalPracticeReview(
  attemptId: string
): Promise<HistoricalReviewItem[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated.");
  }

  // First verify that this attempt belongs to the authenticated user
  // and is a completed practice attempt.
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("id, student_id, test_id, status")
    .eq("id", attemptId)
    .eq("student_id", user.id)
    .eq("test_id", PRACTICE_TEST_ID)
    .eq("status", "SUBMITTED")
    .single();

  if (attemptError) {
    console.error(
      "Error loading historical practice attempt:",
      attemptError
    );
    throw attemptError;
  }

  if (!attempt) {
    throw new Error("Practice attempt not found.");
  }

  // Get the questions exactly in the order in which they appeared.
  const { data: attemptQuestions, error: attemptQuestionsError } =
    await supabase
      .from("attempt_questions")
      .select("id, question_id, question_order")
      .eq("attempt_id", attemptId)
      .order("question_order", { ascending: true });

  if (attemptQuestionsError) {
    console.error(
      "Error loading historical attempt questions:",
      attemptQuestionsError
    );
    throw attemptQuestionsError;
  }

  if (!attemptQuestions || attemptQuestions.length === 0) {
    return [];
  }

  const questionIds = attemptQuestions.map(
    (item) => item.question_id
  );

  const attemptQuestionIds = attemptQuestions.map(
    (item) => item.id
  );

  // Get the question content.
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(
      "id, question_text, explanation, hint, marks, negative_marks"
    )
    .in("id", questionIds);

  if (questionsError) {
    console.error(
      "Error loading historical questions:",
      questionsError
    );
    throw questionsError;
  }

  // Get every option for every question.
  const { data: options, error: optionsError } = await supabase
    .from("question_options")
    .select(
      "id, question_id, option_text, option_order, is_correct"
    )
    .in("question_id", questionIds)
    .order("option_order", { ascending: true });

  if (optionsError) {
    console.error(
      "Error loading historical question options:",
      optionsError
    );
    throw optionsError;
  }

  // Get the student's saved answers for this exact attempt.
  const { data: answers, error: answersError } = await supabase
    .from("student_answers")
    .select(
      "id, attempt_question_id, selected_option_id, is_correct, marks_awarded, time_taken_seconds"
    )
    .in("attempt_question_id", attemptQuestionIds);

  if (answersError) {
    console.error(
      "Error loading historical student answers:",
      answersError
    );
    throw answersError;
  }

  const questionMap = new Map(
    (questions ?? []).map((question) => [
      question.id,
      question,
    ])
  );

  const optionsByQuestion = new Map<
    string,
    HistoricalReviewOption[]
  >();

  for (const option of options ?? []) {
    const existing =
      optionsByQuestion.get(option.question_id) ?? [];

    existing.push({
      id: option.id,
      optionText: option.option_text,
      optionOrder: Number(option.option_order),
      isCorrect: Boolean(option.is_correct),
    });

    optionsByQuestion.set(option.question_id, existing);
  }

  const answerMap = new Map(
    (answers ?? []).map((answer) => [
      answer.attempt_question_id,
      answer,
    ])
  );

  return attemptQuestions.map((attemptQuestion) => {
    const question = questionMap.get(attemptQuestion.question_id);

    if (!question) {
      throw new Error(
        `Question ${attemptQuestion.question_id} could not be loaded.`
      );
    }

    const questionOptions =
      optionsByQuestion.get(attemptQuestion.question_id) ?? [];

    const answer = answerMap.get(attemptQuestion.id);

    const selectedOptionId =
      answer?.selected_option_id ?? null;

    const selectedOption =
      questionOptions.find(
        (option) => option.id === selectedOptionId
      ) ?? null;

    const correctOption =
      questionOptions.find((option) => option.isCorrect) ??
      null;

    return {
      attemptQuestionId: attemptQuestion.id,
      questionId: attemptQuestion.question_id,
      questionOrder: Number(attemptQuestion.question_order),
      questionText: question.question_text,
      explanation: question.explanation ?? null,
      hint: question.hint ?? null,
      marks: Number(question.marks ?? 0),
      negativeMarks: Number(question.negative_marks ?? 0),
      options: questionOptions,
      selectedOptionId,
      selectedOptionText: selectedOption?.optionText ?? null,
      correctOptionId: correctOption?.id ?? null,
      correctOptionText: correctOption?.optionText ?? null,
      isCorrect:
        answer?.is_correct === undefined
          ? null
          : Boolean(answer.is_correct),
      marksAwarded: Number(answer?.marks_awarded ?? 0),
      timeTakenSeconds: Number(
        answer?.time_taken_seconds ?? 0
      ),
    };
  });
}
