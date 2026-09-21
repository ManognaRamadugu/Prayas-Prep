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
  // =========================================================
  // 1. Get curriculum-subject mappings
  // =========================================================

  const {
    data: curriculumSubjects,
    error: csError,
  } = await supabase
    .from("curriculum_subjects")
    .select("id, curriculum_id, subject_id")
    .eq("subject_id", subjectId);

  console.log(
    "DEBUG subjectId:",
    subjectId
  );

  console.log(
    "DEBUG curriculumSubjects:",
    curriculumSubjects
  );

  console.log(
    "DEBUG csError:",
    csError
  );

  if (csError) {
    console.error(
      "Error loading curriculum subjects:",
      csError
    );

    throw csError;
  }

  const curriculumSubjectIds =
    (curriculumSubjects ?? []).map(
      (item) => item.id
    );

  console.log(
    "DEBUG curriculumSubjectIds:",
    curriculumSubjectIds
  );

  if (
    curriculumSubjectIds.length === 0
  ) {
    return [];
  }

  // =========================================================
  // 2. Get chapters
  // =========================================================

  const {
    data: chapters,
    error: chapterError,
  } = await supabase
    .from("chapters")
    .select(
      "id, curriculum_subject_id, name"
    )
    .in(
      "curriculum_subject_id",
      curriculumSubjectIds
    );

  console.log(
    "DEBUG chapters:",
    chapters
  );

  console.log(
    "DEBUG chapterError:",
    chapterError
  );

  if (chapterError) {
    console.error(
      "Error loading chapters:",
      chapterError
    );

    throw chapterError;
  }

  const chapterIds =
    (chapters ?? []).map(
      (chapter) => chapter.id
    );

  console.log(
    "DEBUG chapterIds:",
    chapterIds
  );

  if (chapterIds.length === 0) {
    return [];
  }

  // =========================================================
  // 3. Get topics
  // =========================================================

  const {
    data: topics,
    error: topicError,
  } = await supabase
    .from("topics")
    .select(
      "id, chapter_id, name"
    )
    .in(
      "chapter_id",
      chapterIds
    );

  console.log(
    "DEBUG topics:",
    topics
  );

  console.log(
    "DEBUG topicError:",
    topicError
  );

  if (topicError) {
    console.error(
      "Error loading topics:",
      topicError
    );

    throw topicError;
  }

  const topicIds =
    (topics ?? []).map(
      (topic) => topic.id
    );

  console.log(
    "DEBUG topicIds:",
    topicIds
  );

  if (topicIds.length === 0) {
    return [];
  }

  // =========================================================
  // 4. Get question-topic mappings
  // =========================================================

  const {
    data: questionTopics,
    error: qtError,
  } = await supabase
    .from("question_topics")
    .select(
      "question_id, topic_id"
    )
    .in(
      "topic_id",
      topicIds
    );

  console.log(
    "DEBUG questionTopics:",
    questionTopics
  );

  console.log(
    "DEBUG qtError:",
    qtError
  );

  if (qtError) {
    console.error(
      "Error loading question topics:",
      qtError
    );

    throw qtError;
  }

  const questionIds = [
    ...new Set(
      (questionTopics ?? []).map(
        (item) =>
          item.question_id
      )
    ),
  ];

  console.log(
    "DEBUG questionIds:",
    questionIds
  );

  if (questionIds.length === 0) {
    return [];
  }

  // =========================================================
  // 5. Get questions + options
  // =========================================================

  const {
    data: questions,
    error: questionError,
  } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      question_type,
      difficulty,
      explanation,
      marks,
      negative_marks,
      question_options (
        id,
        option_text,
        option_order
      )
    `)
    .in(
      "id",
      questionIds
    )
    .eq(
      "is_active",
      true
    )
    .eq(
      "question_type",
      "SINGLE_CHOICE"
    )
    .limit(limit);

  console.log(
    "DEBUG questions:",
    questions
  );

  console.log(
    "DEBUG questionError:",
    questionError
  );

  if (questionError) {
    console.error(
      "Error loading questions:",
      questionError
    );

    throw questionError;
  }

  // =========================================================
  // 6. Convert database data
  // =========================================================

  return (questions ?? []).map(
    (question) => ({
      id: question.id,

      question_text:
        question.question_text,

      question_type:
        question.question_type,

      difficulty:
        question.difficulty,

      explanation:
        question.explanation,

      marks:
        Number(question.marks),

      negative_marks:
        Number(
          question.negative_marks
        ),

      options:
        [
          ...(question.question_options ??
            []),
        ].sort(
          (a, b) =>
            a.option_order -
            b.option_order
        ),
    })
  );
}

// =========================================================
// CHECK PRACTICE ANSWER
// =========================================================

export async function checkPracticeAnswer(
  questionId: string,
  optionId: string
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "check_practice_answer",
    {
      p_question_id:
        questionId,

      p_option_id:
        optionId,
    }
  );

  if (error) {
    console.error(
      "Error checking answer:",
      error
    );

    throw error;
  }

  return data as {
    is_correct: boolean;
    marks: number;
  };
}