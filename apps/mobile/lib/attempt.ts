import { supabase } from "./supabase";

const PRACTICE_TEST_ID =
  "7d279b5f-ef0f-457c-9853-4468448d4bbe";

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
