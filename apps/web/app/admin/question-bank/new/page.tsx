"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Item = {
  id: string;
  name: string;
  code?: string;
  is_active?: boolean;
};

type Option = {
  option_text: string;
  is_correct: boolean;
};

export default function NewQuestionPage() {
  const router = useRouter();

  const [exams, setExams] = useState<Item[]>([]);
  const [curricula, setCurricula] = useState<Item[]>([]);
  const [subjects, setSubjects] = useState<Item[]>([]);
  const [chapters, setChapters] = useState<Item[]>([]);
  const [topics, setTopics] = useState<Item[]>([]);

  const [examId, setExamId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicIds, setTopicIds] = useState<string[]>([]);

  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("SINGLE_CHOICE");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [sourceType, setSourceType] = useState("VERIFIED");
  const [options, setOptions] = useState<Option[]>([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ]);
  const [answerText, setAnswerText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [hint, setHint] = useState("");
  const [tags, setTags] = useState("");
  const [marks, setMarks] = useState("1");
  const [negativeMarks, setNegativeMarks] = useState("0");
  const [isGroupQuestion, setIsGroupQuestion] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(path: string, options: RequestInit = {}) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) throw new Error("Your login session has expired. Please sign in again.");

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Request failed.");
    }

    return result;
  }

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await request("/cms/exams");
        setExams(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load exams.");
      } finally {
        setPageLoading(false);
      }
    }

    void loadExams();
  }, []);

  useEffect(() => {
    if (!examId) {
      setCurricula([]);
      setCurriculumId("");
      return;
    }

    void request(`/cms/curricula?examId=${encodeURIComponent(examId)}`)
      .then((data) => setCurricula(data ?? []))
      .catch((err) => setError(err.message));
  }, [examId]);

  useEffect(() => {
    if (!curriculumId) {
      setSubjects([]);
      setSubjectId("");
      return;
    }

    void request(`/cms/subjects?curriculumId=${encodeURIComponent(curriculumId)}`)
      .then((data) => setSubjects(data ?? []))
      .catch((err) => setError(err.message));
  }, [curriculumId]);

  useEffect(() => {
    if (!subjectId || !curriculumId) {
      setChapters([]);
      setChapterId("");
      return;
    }

    const params = new URLSearchParams({
      subjectId,
      curriculumId,
    });

    void request(`/cms/chapters?${params}`)
      .then((data) => setChapters(data ?? []))
      .catch((err) => setError(err.message));
  }, [subjectId, curriculumId]);

  useEffect(() => {
    if (!chapterId) {
      setTopics([]);
      setTopicIds([]);
      return;
    }

    void request(`/cms/topics?chapterId=${encodeURIComponent(chapterId)}`)
      .then((data) => setTopics(data ?? []))
      .catch((err) => setError(err.message));
  }, [chapterId]);

  function changeQuestionType(type: string) {
    setQuestionType(type);
    setAnswerText("");

    if (type === "TRUE_FALSE") {
      setOptions([
        { option_text: "True", is_correct: false },
        { option_text: "False", is_correct: false },
      ]);
    } else if (type === "NUMERICAL") {
      setOptions([]);
    } else {
      setOptions([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ]);
    }
  }

  function updateOption(index: number, field: keyof Option, value: string | boolean) {
    setOptions((current) =>
      current.map((option, i) => {
        if (i !== index) return option;

        if (field === "is_correct" && value === true && questionType === "SINGLE_CHOICE") {
          return { ...option, is_correct: true };
        }

        return { ...option, [field]: value };
      }).map((option, i) => {
        if (
          field === "is_correct" &&
          questionType === "SINGLE_CHOICE" &&
          value === true &&
          i !== index
        ) {
          return { ...option, is_correct: false };
        }
        return option;
      })
    );
  }

  function toggleTopic(id: string) {
    setTopicIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function saveQuestion(submitForReview: boolean) {
    setError("");
    setMessage("");

    if (!questionText.trim()) {
      setError("Enter the question text.");
      return;
    }

    if (!topicIds.length) {
      setError("Select at least one topic.");
      return;
    }

    if (
      questionType === "SINGLE_CHOICE" ||
      questionType === "MULTIPLE_CHOICE"
    ) {
      const validOptions = options.filter((o) => o.option_text.trim());

      if (validOptions.length < 2) {
        setError("Enter at least two options.");
        return;
      }

      if (!validOptions.some((o) => o.is_correct)) {
        setError("Mark the correct answer.");
        return;
      }

      if (
        questionType === "SINGLE_CHOICE" &&
        validOptions.filter((o) => o.is_correct).length !== 1
      ) {
        setError("Single-choice questions must have exactly one correct answer.");
        return;
      }
    } else if (!answerText.trim()) {
      setError("Enter the correct answer.");
      return;
    }

    const payload = {
      question_text: questionText.trim(),
      question_type: questionType,
      difficulty,
      source_type: sourceType,
      explanation,
      hint,
      marks: Number(marks),
      negative_marks: Number(negativeMarks),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      is_group_question: isGroupQuestion,
      topic_ids: topicIds,
      options:
        questionType === "SINGLE_CHOICE" ||
        questionType === "MULTIPLE_CHOICE"
          ? options.filter((o) => o.option_text.trim())
          : questionType === "TRUE_FALSE"
            ? options
            : [],
      answer_text:
        questionType === "NUMERICAL" ? answerText.trim() : undefined,
    };

    setLoading(true);

    try {
      const result = await request("/cms/questions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (submitForReview) {
        if (!result.id) {
          throw new Error("Question was saved, but its ID was not returned. Please check the Question Bank before retrying.");
        }

        await request(`/cms/questions/${result.id}/submit-review`, {
          method: "POST",
        });
      }

      setMessage(
        submitForReview
          ? "Question submitted for review successfully."
          : "Question saved as draft successfully."
      );

      router.push("/admin/question-bank");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save question.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "text-sm font-semibold text-slate-700";

  if (pageLoading) {
    return <p className="p-8 text-slate-500">Loading syllabus...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <Link
        href="/admin/question-bank"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700"
      >
        <ArrowLeft size={17} /> Back to Question Bank
      </Link>

      <div>
        <p className="text-sm font-semibold text-blue-700">
          QUESTION BANK / CREATE
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Add New Question
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a question and map it to the relevant syllabus topics.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Syllabus mapping */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Syllabus Mapping</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose where this question belongs.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {[
            {
              label: "Exam",
              value: examId,
              setter: setExamId,
              items: exams,
              placeholder: "Select exam",
            },
            {
              label: "Curriculum",
              value: curriculumId,
              setter: setCurriculumId,
              items: curricula,
              placeholder: "Select curriculum",
            },
            {
              label: "Subject",
              value: subjectId,
              setter: setSubjectId,
              items: subjects,
              placeholder: "Select subject",
            },
            {
              label: "Chapter",
              value: chapterId,
              setter: setChapterId,
              items: chapters,
              placeholder: "Select chapter",
            },
          ].map((field) => (
            <label key={field.label} className={labelClass}>
              {field.label}
              <select
                className={fieldClass}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
              >
                <option value="">{field.placeholder}</option>
                {field.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-5">
          <p className={labelClass}>Topics</p>
          <div className="mt-2 rounded-xl border border-slate-200 p-4">
            {!chapterId ? (
              <p className="text-sm text-slate-400">
                Select a chapter to load topics.
              </p>
            ) : topics.length === 0 ? (
              <p className="text-sm text-slate-400">
                No topics found for this chapter.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {topics.map((topic) => (
                  <label key={topic.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={topicIds.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="h-4 w-4 accent-blue-700"
                    />
                    {topic.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            You can associate one question with multiple topics.
          </p>
        </div>
      </section>

      {/* Question details */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Question Details</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Question Type
            <select
              className={fieldClass}
              value={questionType}
              onChange={(e) => changeQuestionType(e.target.value)}
            >
              <option value="SINGLE_CHOICE">Single Correct Option</option>
              <option value="MULTIPLE_CHOICE">Multiple Correct Options</option>
              <option value="NUMERICAL">Numerical Answer</option>
              <option value="TRUE_FALSE">True / False</option>
            </select>
          </label>

          <label className={labelClass}>
            Difficulty
            <select
              className={fieldClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>

          <label className={labelClass}>
            Source
            <select
              className={fieldClass}
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              <option value="VERIFIED">Verified</option>
              <option value="IMPORTED">Imported</option>
              <option value="PREVIOUS_YEAR">Previous Year</option>
              <option value="TEACHER_CREATED">Teacher Created</option>
            </select>
          </label>

          <label className={labelClass}>
            Tags
            <input
              className={fieldClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Algebra, Important, JEE Main"
            />
          </label>
        </div>

        <div className="mt-5">
          <label className={labelClass}>
            Question Text
            <textarea
              rows={6}
              className={fieldClass}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the complete question here..."
            />
          </label>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isGroupQuestion}
            onChange={(e) => setIsGroupQuestion(e.target.checked)}
            className="h-4 w-4 accent-blue-700"
          />
          This is a group question
        </label>
      </section>

      {/* Answer options */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Answer Options
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {questionType === "SINGLE_CHOICE"
                ? "Select exactly one correct answer."
                : questionType === "MULTIPLE_CHOICE"
                  ? "Select all correct answers."
                  : questionType === "TRUE_FALSE"
                    ? "Select True or False as the correct answer."
                    : "Enter the numerical answer below."}
            </p>
          </div>

          {(questionType === "SINGLE_CHOICE" ||
            questionType === "MULTIPLE_CHOICE") && (
            <button
              type="button"
              onClick={() =>
                setOptions((current) => [
                  ...current,
                  { option_text: "", is_correct: false },
                ])
              }
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Plus size={16} /> Add Option
            </button>
          )}
        </div>

        {questionType === "NUMERICAL" ? (
          <label className={`${labelClass} mt-5 block`}>
            Correct Numerical Answer
            <input
              className={fieldClass}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Enter numerical answer"
            />
          </label>
        ) : (
          <div className="mt-5 space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border p-3"
              >
                <input
                  type="checkbox"
                  checked={option.is_correct}
                  onChange={(e) =>
                    updateOption(index, "is_correct", e.target.checked)
                  }
                  className="h-5 w-5 accent-green-600"
                  aria-label={`Mark option ${index + 1} correct`}
                />

                <span className="w-7 text-sm font-bold text-slate-400">
                  {String.fromCharCode(65 + index)}.
                </span>

                <input
                  className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={option.option_text}
                  disabled={questionType === "TRUE_FALSE"}
                  onChange={(e) =>
                    updateOption(index, "option_text", e.target.value)
                  }
                  placeholder={`Enter option ${index + 1}`}
                />

                {(questionType === "SINGLE_CHOICE" ||
                  questionType === "MULTIPLE_CHOICE") &&
                  options.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((current) =>
                          current.filter((_, i) => i !== index)
                        )
                      }
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      aria-label="Remove option"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}

        {questionType === "TRUE_FALSE" && (
          <p className="mt-3 text-xs text-slate-500">
            Select the checkbox beside the correct answer.
          </p>
        )}
      </section>

      {/* Explanation */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Explanation & Hint
        </h2>

        <label className={`${labelClass} mt-5 block`}>
          Explanation
          <textarea
            rows={4}
            className={fieldClass}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain how to solve this question..."
          />
        </label>

        <label className={`${labelClass} mt-5 block`}>
          Hint (Optional)
          <textarea
            rows={2}
            className={fieldClass}
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Give students a helpful clue..."
          />
        </label>
      </section>

      {/* Advanced options */}
      <section className="rounded-2xl border bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex w-full items-center justify-between p-6 text-left font-bold text-slate-800"
        >
          Advanced Options
          <span>{advancedOpen ? "−" : "+"}</span>
        </button>

        {advancedOpen && (
          <div className="grid gap-5 border-t p-6 md:grid-cols-2">
            <label className={labelClass}>
              Marks
              <input
                type="number"
                min="0"
                step="0.25"
                className={fieldClass}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </label>

            <label className={labelClass}>
              Negative Marks
              <input
                type="number"
                min="0"
                step="0.25"
                className={fieldClass}
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(e.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="sticky bottom-3 flex flex-wrap justify-end gap-3 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur">
        <Link
          href="/admin/question-bank"
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="button"
          disabled={loading}
          onClick={() => void saveQuestion(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-700 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          <Save size={17} />
          Save Draft
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => void saveQuestion(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          <Send size={17} />
          {loading ? "Saving..." : "Submit for Review"}
        </button>
      </div>
    </div>
  );
}
