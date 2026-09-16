import { supabase } from "./supabase";


export type PracticeOption = {
  id: string;
  option_text: string;
  option_order: number;
};

export type PracticeQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  explanation: string | null;
  marks: number;
  negative_marks: number;
  options: PracticeOption[];
};

export async function getPracticeQuestions(
  subjectId: string,
  limit: number = 5
): Promise<PracticeQuestion[]> {
  /*
   * Get questions connected to topics
   * belonging to the selected subject.
   */
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      question_type,
      difficulty,
      explanation,
      marks,
      negative_marks,
      question_topics!inner (
        topic_id,
        topics!inner (
          id,
          chapter_id,
          chapters!inner (
            id,
            curriculum_subject_id,
            curriculum_subjects!inner (
              id,
              subject_id
            )
          )
        )
      ),
      question_options (
        id,
        option_text,
        option_order
      )
    `)
    .eq("is_active", true)
    .eq("question_type", "SINGLE_CHOICE")
    .eq(
      "question_topics.topics.chapters.curriculum_subjects.subject_id",
      subjectId
    )
    .limit(limit);

  if (error) {
    console.error("Error loading practice questions:", error);
    throw error;
  }

  return (data ?? []).map((question) => ({
    id: question.id,
    question_text: question.question_text,
    question_type: question.question_type,
    difficulty: question.difficulty,
    explanation: question.explanation,
    marks: Number(question.marks),
    negative_marks: Number(question.negative_marks),
    options: [...(question.question_options ?? [])].sort(
      (a, b) => a.option_order - b.option_order
    ),
  }));
}