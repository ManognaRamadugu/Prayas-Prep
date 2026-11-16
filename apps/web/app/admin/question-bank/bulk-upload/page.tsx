
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Item = {
  id: string;
  name: string;
};

type QuestionInput = {
  question_text: string;
  question_type:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "NUMERICAL"
    | "TRUE_FALSE";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  source_type:
    | "VERIFIED"
    | "IMPORTED"
    | "PREVIOUS_YEAR"
    | "TEACHER_CREATED";
  explanation?: string;
  hint?: string;
  marks: number;
  negative_marks: number;
  tags: string[];
  is_group_question: boolean;
  topic_ids: string[];
  options?: { option_text: string; is_correct: boolean }[];
  answer_text?: string;
};

type PreviewRow = {
  excelRow: number;
  question: QuestionInput;
  errors: string[];
};

const headers = [
  "question_text",
  "question_type",
  "difficulty",
  "source_type",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_options",
  "answer_text",
  "explanation",
  "hint",
  "marks",
  "negative_marks",
  "tags",
  "is_group_question",
];

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function downloadTemplate() {
  const example = [
    {
      question_text: "What is the SI unit of force?",
      question_type: "SINGLE_CHOICE",
      difficulty: "EASY",
      source_type: "IMPORTED",
      option_a: "Newton",
      option_b: "Joule",
      option_c: "Watt",
      option_d: "Pascal",
      correct_options: "A",
      answer_text: "",
      explanation: "Force is measured in Newtons.",
      hint: "Think about Newton's second law.",
      marks: 4,
      negative_marks: 1,
      tags: "Physics,Mechanics",
      is_group_question: "false",
    },
    {
      question_text: "What is the value of pi?",
      question_type: "NUMERICAL",
      difficulty: "MEDIUM",
      source_type: "IMPORTED",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_options: "",
      answer_text: "3.14159",
      explanation: "Pi is approximately 3.14159.",
      hint: "",
      marks: 4,
      negative_marks: 1,
      tags: "Mathematics",
      is_group_question: "false",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(example, {
    header: headers,
  });
  worksheet["!cols"] = headers.map(() => ({ wch: 22 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
  XLSX.writeFile(workbook, "Prayas_Prep_Question_Template.xlsx");
}

function parseFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: "" }
        );

        resolve(
          rows.map((row) => {
            const normalized: Record<string, unknown> = {};
            Object.entries(row).forEach(([key, value]) => {
              normalized[key.trim().toLowerCase().replace(/\s+/g, "_")] =
                value;
            });
            return normalized;
          })
        );
      } catch {
        reject(new Error("Unable to read this file. Check its format."));
      }
    };

    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsArrayBuffer(file);
  });
}

function validateRows(
  rawRows: Record<string, unknown>[],
  topicId: string
): PreviewRow[] {
  return rawRows.map((row, index) => {
    const errors: string[] = [];

    const questionText = clean(row.question_text);
    const type = clean(row.question_type).toUpperCase();
    const difficulty = clean(row.difficulty).toUpperCase();
    const source = clean(row.source_type).toUpperCase() || "IMPORTED";

    const allowedTypes = [
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "NUMERICAL",
      "TRUE_FALSE",
    ];

    const allowedDifficulties = ["EASY", "MEDIUM", "HARD"];
    const allowedSources = [
      "VERIFIED",
      "IMPORTED",
      "PREVIOUS_YEAR",
      "TEACHER_CREATED",
    ];

    if (!questionText) errors.push("Question text is required.");
    if (!allowedTypes.includes(type)) errors.push("Invalid question type.");
    if (!allowedDifficulties.includes(difficulty))
      errors.push("Invalid difficulty.");
    if (!allowedSources.includes(source))
      errors.push("Invalid source type.");

    const marks = Number(row.marks === "" ? 1 : row.marks);
    const negativeMarks = Number(
      row.negative_marks === "" ? 0 : row.negative_marks
    );

    if (!Number.isFinite(marks) || marks < 0)
      errors.push("Marks must be a non-negative number.");

    if (!Number.isFinite(negativeMarks) || negativeMarks < 0)
      errors.push("Negative marks must be a non-negative number.");

    const answerText = clean(row.answer_text);
    const correctLabels = clean(row.correct_options)
      .toUpperCase()
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const optionLabels = ["A", "B", "C", "D"];
    const options = optionLabels
      .map((label) => ({
        option_text: clean(row[`option_${label.toLowerCase()}`]),
        is_correct: correctLabels.includes(label),
      }))
      .filter((option) => option.option_text !== "");

    if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
      if (options.length < 2)
        errors.push("At least two options are required.");

      if (options.filter((option) => option.is_correct).length === 0)
        errors.push("Enter the correct option letter(s), e.g. A or A,C.");

      if (
        type === "SINGLE_CHOICE" &&
        options.filter((option) => option.is_correct).length !== 1
      ) {
        errors.push("Single-choice questions need exactly one correct option.");
      }

      if (correctLabels.some((label) => !optionLabels.includes(label)))
        errors.push("Correct options must use A, B, C or D.");
    } else if (!answerText) {
      errors.push("Answer text is required.");
    }

    if (!topicId) errors.push("Select a topic before importing.");

    const tags = clean(row.tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const isGroup = ["true", "yes", "1"].includes(
      clean(row.is_group_question).toLowerCase()
    );

    const question: QuestionInput = {
      question_text: questionText,
      question_type: type as QuestionInput["question_type"],
      difficulty: difficulty as QuestionInput["difficulty"],
      source_type: source as QuestionInput["source_type"],
      explanation: clean(row.explanation),
      hint: clean(row.hint),
      marks: Number.isFinite(marks) ? marks : 1,
      negative_marks: Number.isFinite(negativeMarks) ? negativeMarks : 0,
      tags,
      is_group_question: isGroup,
      topic_ids: topicId ? [topicId] : [],
      ...(type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE"
        ? { options }
        : { answer_text: answerText }),
    };

    return {
      excelRow: index + 2,
      question,
      errors,
    };
  });
}

export default function BulkUploadPage() {
  const [exams, setExams] = useState<Item[]>([]);
  const [curricula, setCurricula] = useState<Item[]>([]);
  const [subjects, setSubjects] = useState<Item[]>([]);
  const [chapters, setChapters] = useState<Item[]>([]);
  const [topics, setTopics] = useState<Item[]>([]);

  const [examId, setExamId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function request(path: string) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) throw new Error("Please sign in again.");

    const response = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load syllabus data.");
    }

    return result;
  }

  useEffect(() => {
    request("/cms/exams")
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
  }, []);

  async function loadCurricula(id: string) {
    setExamId(id);
    setCurriculumId("");
    setSubjectId("");
    setChapterId("");
    setTopicId("");
    setCurricula([]);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setRows([]);

    if (!id) return;

    setLoadingOptions(true);
    try {
      const data = await request(`/cms/curricula?examId=${id}`);
      setCurricula(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load curricula.");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadSubjects(id: string) {
    setCurriculumId(id);
    setSubjectId("");
    setChapterId("");
    setTopicId("");
    setChapters([]);
    setTopics([]);
    setRows([]);

    if (!id) return;

    setLoadingOptions(true);
    try {
      const data = await request(`/cms/subjects?curriculumId=${id}`);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load subjects.");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadChapters(id: string) {
    setSubjectId(id);
    setChapterId("");
    setTopicId("");
    setTopics([]);
    setRows([]);

    if (!id) return;

    setLoadingOptions(true);
    try {
      const data = await request(
        `/cms/chapters?subjectId=${id}&curriculumId=${curriculumId}`
      );
      setChapters(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load chapters.");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadTopics(id: string) {
    setChapterId(id);
    setTopicId("");
    setRows([]);

    if (!id) return;

    setLoadingOptions(true);
    try {
      const data = await request(`/cms/topics?chapterId=${id}`);
      setTopics(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load topics.");
    } finally {
      setLoadingOptions(false);
    }
  }

  function handleTopicChange(id: string) {
    setTopicId(id);
    setRows((current) =>
      current.map((row) => ({
        ...row,
        question: { ...row.question, topic_ids: id ? [id] : [] },
        errors: row.errors.filter(
          (message) => message !== "Select a topic before importing."
        ).concat(id ? [] : ["Select a topic before importing."]),
      }))
    );
  }

  async function handleFile(file?: File) {
    if (!file) return;

    setError("");
    setSuccess("");
    setRows([]);
    setFileName(file.name);

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension || "")) {
      setError("Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    setParsing(true);
    try {
      const rawRows = await parseFile(file);

      if (!rawRows.length) {
        throw new Error("The uploaded file contains no question rows.");
      }

      if (rawRows.length > 500) {
        throw new Error("Maximum 500 questions per upload.");
      }

      const missingHeaders = ["question_text", "question_type", "difficulty"]
        .filter((header) => !(header in rawRows[0]));

      if (missingHeaders.length) {
        throw new Error(
          `Missing required columns: ${missingHeaders.join(", ")}`
        );
      }

      setRows(validateRows(rawRows, topicId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process file.");
    } finally {
      setParsing(false);
    }
  }

  const validCount = useMemo(
    () => rows.filter((row) => row.errors.length === 0).length,
    [rows]
  );

  const invalidCount = rows.length - validCount;

  async function importQuestions() {
    if (!rows.length || invalidCount > 0 || !topicId) return;

    setImporting(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) throw new Error("Please sign in again.");

      const response = await fetch(`${API}/cms/questions/bulk-import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: rows.map((row) => row.question),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : "Bulk import failed. No questions were imported."
        );
      }

      setSuccess(
        `Successfully imported ${result.imported_count ?? rows.length} questions as drafts.`
      );
      setRows([]);
      setFileName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div>
        <Link
          href="/admin/question-bank"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Question Bank
        </Link>

        <p className="text-sm font-medium text-blue-700">
          SUPER ADMIN / LEARNING
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Bulk Question Upload
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Upload predefined questions using an Excel or CSV file.
        </p>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} className="shrink-0" />
          {success}
        </div>
      )}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">
              1. Select syllabus mapping
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose where all questions in this upload belong.
            </p>
          </div>
          {loadingOptions && (
            <Loader2 className="animate-spin text-blue-600" size={20} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <select
            value={examId}
            onChange={(e) => void loadCurricula(e.target.value)}
            className="rounded-xl border p-3 text-sm"
          >
            <option value="">Select exam</option>
            {exams.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            value={curriculumId}
            onChange={(e) => void loadSubjects(e.target.value)}
            disabled={!examId}
            className="rounded-xl border p-3 text-sm disabled:bg-slate-50"
          >
            <option value="">Select curriculum</option>
            {curricula.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            value={subjectId}
            onChange={(e) => void loadChapters(e.target.value)}
            disabled={!curriculumId}
            className="rounded-xl border p-3 text-sm disabled:bg-slate-50"
          >
            <option value="">Select subject</option>
            {subjects.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            value={chapterId}
            onChange={(e) => void loadTopics(e.target.value)}
            disabled={!subjectId}
            className="rounded-xl border p-3 text-sm disabled:bg-slate-50"
          >
            <option value="">Select chapter</option>
            {chapters.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            value={topicId}
            onChange={(e) => handleTopicChange(e.target.value)}
            disabled={!chapterId}
            className="rounded-xl border p-3 text-sm disabled:bg-slate-50"
          >
            <option value="">Select topic</option>
            {topics.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          2. Upload question file
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Download the template first, fill in your questions, and upload it.
        </p>

        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          <Download size={18} />
          Download Excel Template
        </button>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center hover:border-blue-400 hover:bg-blue-50/40">
          {parsing ? (
            <Loader2 size={34} className="animate-spin text-blue-600" />
          ) : (
            <Upload size={34} className="text-blue-600" />
          )}
          <span className="mt-3 font-semibold text-slate-800">
            {parsing ? "Reading file..." : "Choose an Excel or CSV file"}
          </span>
          <span className="mt-1 text-sm text-slate-500">
            .xlsx, .xls or .csv · Maximum 500 questions
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={parsing}
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </label>

        {fileName && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <FileSpreadsheet className="text-green-600" size={20} />
              {fileName}
            </div>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setFileName("");
                setError("");
                setSuccess("");
              }}
              className="text-slate-400 hover:text-red-600"
              aria-label="Remove uploaded file"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}

        <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Question types:</strong> SINGLE_CHOICE, MULTIPLE_CHOICE,
          NUMERICAL, TRUE_FALSE.
          <br />
          <strong>Difficulty:</strong> EASY, MEDIUM, HARD.
          <br />
          <strong>Correct options:</strong> Use A, B, C, D or A,C for multiple
          correct answers.
          <br />
          <strong>Tags:</strong> Separate multiple tags with commas.
        </div>
      </section>

      {rows.length > 0 && (
        <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">
                3. Preview and validate
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review every row before importing.
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="rounded-lg bg-green-50 px-3 py-2 font-semibold text-green-700">
                {validCount} Valid
              </span>
              <span className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700">
                {invalidCount} Errors
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Excel row</th>
                  <th className="px-3 py-3">Question</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Difficulty</th>
                  <th className="px-3 py-3">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.excelRow} className="align-top">
                    <td className="px-3 py-4">{row.excelRow}</td>
                    <td className="max-w-sm px-3 py-4">
                      <p className="line-clamp-3 font-medium text-slate-800">
                        {row.question.question_text || "(Empty question)"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      {row.question.question_type.replaceAll("_", " ")}
                    </td>
                    <td className="px-3 py-4">
                      {row.question.difficulty}
                    </td>
                    <td className="px-3 py-4">
                      {row.errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 font-medium text-green-700">
                          <CheckCircle2 size={16} /> Valid
                        </span>
                      ) : (
                        <ul className="list-inside list-disc space-y-1 text-xs text-red-600">
                          {row.errors.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              All rows must be valid before importing. Maximum 500 per batch.
            </p>
            <button
              type="button"
              onClick={() => void importQuestions()}
              disabled={
                importing ||
                parsing ||
                !topicId ||
                rows.length === 0 ||
                invalidCount > 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {importing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              {importing ? "Importing..." : `Import ${validCount} Questions`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
