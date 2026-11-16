
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Pencil,
  Layers,
  ListTree,
  Loader2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Exam = {
  id: string;
  name: string;
  code: string;
};

type Curriculum = {
  id: string;
  name: string;
  exam_id: string;
};

type Grade = {
  id: string;
  name: string;
  code: string;
};

type Subject = {
  id: string;
  mapping_id: string;
  name: string;
  code: string;
  grade_id: string | null;
  is_legacy_mapping?: boolean;
};

type Chapter = {
  id: string;
  curriculum_subject_id: string;
  name: string;
  description?: string;
  sequence: number;
  is_active: boolean;
};

type Topic = {
  id: string;
  chapter_id: string;
  name: string;
  description?: string;
  sequence: number;
  is_active: boolean;
};

export default function SyllabusPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [examId, setExamId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function api(path: string, options: RequestInit = {}) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      throw new Error("Please sign in again.");
    }

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || result.error || "The request failed."
      );
    }

    return result;
  }

  async function loadExams() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/cms/exams");
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExams();
  }, []);

  // Load curricula when exam changes
  useEffect(() => {
    setCurriculumId("");
    setGradeId("");
    setSubjectId("");
    setChapterId("");
    setCurricula([]);
    setGrades([]);
    setSubjects([]);
    setChapters([]);
    setTopics([]);

    if (!examId) return;

    let cancelled = false;

    api(`/cms/curricula?examId=${encodeURIComponent(examId)}`)
      .then((data) => {
        if (!cancelled) {
          setCurricula(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unable to load curricula.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [examId]);

  // Load grades when curriculum changes
  useEffect(() => {
    setGradeId("");
    setSubjectId("");
    setChapterId("");
    setGrades([]);
    setSubjects([]);
    setChapters([]);
    setTopics([]);

    if (!curriculumId) return;

    let cancelled = false;

    api(`/cms/grades?curriculumId=${encodeURIComponent(curriculumId)}`)
      .then((data) => {
        if (!cancelled) {
          setGrades(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unable to load grades.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [curriculumId]);

  // Load subjects for selected grade.
  // Backend must include both grade-specific and legacy mappings.
  useEffect(() => {
    setSubjectId("");
    setChapterId("");
    setSubjects([]);
    setChapters([]);
    setTopics([]);

    if (!curriculumId || !gradeId) return;

    let cancelled = false;

    api(
      `/cms/subjects?curriculumId=${encodeURIComponent(
        curriculumId
      )}&gradeId=${encodeURIComponent(gradeId)}`
    )
      .then((data) => {
        if (!cancelled) {
          setSubjects(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unable to load subjects.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [curriculumId, gradeId]);

  // Load chapters for selected subject.
  // Backend must include legacy mappings when filtering by grade.
  useEffect(() => {
    setChapterId("");
    setChapters([]);
    setTopics([]);

    if (!curriculumId || !gradeId || !subjectId) return;

    let cancelled = false;

    api(
      `/cms/chapters?subjectId=${encodeURIComponent(
        subjectId
      )}&curriculumId=${encodeURIComponent(
        curriculumId
      )}&gradeId=${encodeURIComponent(gradeId)}`
    )
      .then((data) => {
        if (!cancelled) {
          setChapters(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unable to load chapters.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [curriculumId, gradeId, subjectId]);

  // Load topics for selected chapter
  useEffect(() => {
    setTopics([]);

    if (!chapterId) return;

    let cancelled = false;

    api(`/cms/topics?chapterId=${encodeURIComponent(chapterId)}`)
      .then((data) => {
        if (!cancelled) {
          setTopics(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unable to load topics.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  // Create subject
  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api("/cms/syllabus/subjects", {
        method: "POST",
        body: JSON.stringify({
          exam_id: examId,
          curriculum_id: curriculumId,
          grade_id: gradeId,
          name: subjectName.trim(),
          code: subjectCode.trim().toUpperCase(),
          sequence: subjects.length + 1,
        }),
      });

      setSubjectName("");
      setSubjectCode("");

      const data = await api(
        `/cms/subjects?curriculumId=${encodeURIComponent(
          curriculumId
        )}&gradeId=${encodeURIComponent(gradeId)}`
      );

      setSubjects(Array.isArray(data) ? data : []);
      setMessage("Subject added successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add subject.");
    } finally {
      setSaving(false);
    }
  }

  // Create chapter
  async function createChapter(e: React.FormEvent) {
    e.preventDefault();

    const selectedSubject = subjects.find((s) => s.id === subjectId);

    if (!selectedSubject?.mapping_id) {
      setError(
        "The selected subject mapping was not found. Refresh and try again."
      );
      return;
    }

    // Do not add chapters to an unassigned legacy mapping.
    if (selectedSubject.is_legacy_mapping) {
      setError(
        "This is an existing legacy subject mapping. You can view its chapters, but assign the subject to a grade before adding new chapters."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api("/cms/syllabus/chapters", {
        method: "POST",
        body: JSON.stringify({
          curriculum_subject_id: selectedSubject.mapping_id,
          name: chapterName.trim(),
          description: chapterDescription.trim(),
          sequence: chapters.length + 1,
        }),
      });

      setChapterName("");
      setChapterDescription("");

      const data = await api(
        `/cms/chapters?subjectId=${encodeURIComponent(
          subjectId
        )}&curriculumId=${encodeURIComponent(
          curriculumId
        )}&gradeId=${encodeURIComponent(gradeId)}`
      );

      setChapters(Array.isArray(data) ? data : []);
      setMessage("Chapter created successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create chapter."
      );
    } finally {
      setSaving(false);
    }
  }

  // Create topic
  async function createTopic(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api("/cms/syllabus/topics", {
        method: "POST",
        body: JSON.stringify({
          chapter_id: chapterId,
          name: topicName.trim(),
          description: topicDescription.trim(),
          sequence: topics.length + 1,
        }),
      });

      setTopicName("");
      setTopicDescription("");

      const data = await api(
        `/cms/topics?chapterId=${encodeURIComponent(chapterId)}`
      );

      setTopics(Array.isArray(data) ? data : []);
      setMessage("Topic created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create topic.");
    } finally {
      setSaving(false);
    }
  }

  // Edit chapter or topic
  async function editItem(
    type: "chapters" | "topics",
    item: Chapter | Topic
  ) {
    const name = window.prompt("Enter the updated name:", item.name);

    if (name === null || !name.trim()) return;

    const description = window.prompt(
      "Enter the updated description:",
      item.description || ""
    );

    if (description === null) return;

    setError("");
    setMessage("");

    try {
      await api(`/cms/syllabus/${type}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      if (type === "chapters") {
        const data = await api(
          `/cms/chapters?subjectId=${encodeURIComponent(
            subjectId
          )}&curriculumId=${encodeURIComponent(
            curriculumId
          )}&gradeId=${encodeURIComponent(gradeId)}`
        );

        setChapters(Array.isArray(data) ? data : []);
      } else {
        const data = await api(
          `/cms/topics?chapterId=${encodeURIComponent(chapterId)}`
        );

        setTopics(Array.isArray(data) ? data : []);
      }

      setMessage(
        `${type === "chapters" ? "Chapter" : "Topic"} updated.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update item."
      );
    }
  }

  const selectClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const isLegacySubject = Boolean(selectedSubject?.is_legacy_mapping);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-700">
            SUPER ADMIN / LEARNING
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Syllabus Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organize exams, grades, subjects, chapters and topics.
          </p>
        </div>

        <button
          onClick={() => void loadExams()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
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

      {/* Select syllabus */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <BookOpen size={22} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">Select syllabus</h2>
            <p className="text-sm text-slate-500">
              Choose the exam, curriculum and grade to manage its syllabus.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Exam
            <select
              className={selectClass}
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            >
              <option value="">Select exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Curriculum
            <select
              className={selectClass}
              value={curriculumId}
              disabled={!examId}
              onChange={(e) => setCurriculumId(e.target.value)}
            >
              <option value="">Select curriculum</option>
              {curricula.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Grade
            <select
              className={selectClass}
              value={gradeId}
              disabled={!curriculumId}
              onChange={(e) => setGradeId(e.target.value)}
            >
              <option value="">Select grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Subject
            <select
              className={selectClass}
              value={subjectId}
              disabled={!gradeId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                  {subject.is_legacy_mapping
                    ? " (Legacy - grade unassigned)"
                    : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Add subject */}
      {gradeId && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
              <Plus size={22} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Add a subject</h2>
              <p className="text-sm text-slate-500">
                Create a subject and map it to the selected grade.
              </p>
            </div>
          </div>

          <form
            onSubmit={createSubject}
            className="grid gap-4 md:grid-cols-3"
          >
            <input
              className={inputClass}
              placeholder="Subject name (e.g. Physics)"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />

            <input
              className={inputClass}
              placeholder="Subject code (e.g. PHY)"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              required
            />

            <button
              disabled={saving}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#172b45] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              <Plus size={17} />
              Add subject
            </button>
          </form>
        </section>
      )}

      {/* Chapters and topics */}
      {subjectId && (
        <section className="grid gap-6 xl:grid-cols-2">
          {/* Chapters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <Layers size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">Chapters</h2>
                <p className="text-sm text-slate-500">
                  View and manage chapters for the selected subject.
                </p>
              </div>
            </div>

            {isLegacySubject && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This is a legacy subject mapping with no assigned grade.
                Existing chapters are visible, but you cannot add new chapters
                until the mapping is assigned to a grade.
              </div>
            )}

            <form onSubmit={createChapter} className="space-y-3">
              <input
                className={inputClass}
                placeholder="Chapter name"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                required
                disabled={isLegacySubject}
              />

              <textarea
                className={inputClass}
                placeholder="Chapter description (optional)"
                value={chapterDescription}
                onChange={(e) => setChapterDescription(e.target.value)}
                rows={2}
                disabled={isLegacySubject}
              />

              <button
                disabled={saving || isLegacySubject}
                className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                <Plus size={17} />
                Add chapter
              </button>
            </form>

            <div className="mt-6 space-y-2">
              {chapters.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No chapters found for this subject.
                </p>
              ) : (
                chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                  >
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setChapterId(chapter.id)}
                    >
                      <p className="font-semibold text-slate-800">
                        {chapter.sequence}. {chapter.name}
                      </p>

                      {chapter.description && (
                        <p className="mt-1 text-xs text-slate-500">
                          {chapter.description}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-blue-700">
                        {chapterId === chapter.id
                          ? "Selected"
                          : "Select to manage topics"}
                      </p>
                    </button>

                    <button
                      title="Edit chapter"
                      onClick={() => void editItem("chapters", chapter)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                    >
                      <Pencil size={17} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Topics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
                <ListTree size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">Topics</h2>
                <p className="text-sm text-slate-500">
                  Add topics under a selected chapter.
                </p>
              </div>
            </div>

            {chapterId ? (
              <>
                <form onSubmit={createTopic} className="space-y-3">
                  <input
                    className={inputClass}
                    placeholder="Topic name"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    required
                  />

                  <textarea
                    className={inputClass}
                    placeholder="Topic description (optional)"
                    value={topicDescription}
                    onChange={(e) => setTopicDescription(e.target.value)}
                    rows={2}
                  />

                  <button
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                  >
                    <Plus size={17} />
                    Add topic
                  </button>
                </form>

                <div className="mt-6 space-y-2">
                  {topics.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No topics found in this chapter.
                    </p>
                  ) : (
                    topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {topic.sequence}. {topic.name}
                          </p>

                          {topic.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {topic.description}
                            </p>
                          )}
                        </div>

                        <button
                          title="Edit topic"
                          onClick={() => void editItem("topics", topic)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-purple-700"
                        >
                          <Pencil size={17} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                Select a chapter to view and manage its topics.
              </p>
            )}
          </div>
        </section>
      )}

      {!gradeId && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          {loading ? (
            <Loader2 className="mx-auto animate-spin text-blue-600" />
          ) : (
            <BookOpen className="mx-auto text-slate-400" size={36} />
          )}

          <h3 className="mt-4 font-semibold text-slate-800">
            Select an exam, curriculum and grade
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Your syllabus management workspace will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
