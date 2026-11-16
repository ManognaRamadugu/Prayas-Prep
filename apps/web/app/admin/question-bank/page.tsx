"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  RefreshCw,
  FileQuestion,
  Clock,
  CheckCircle2,
  Archive,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  marks: number;
  status: string;
  source_type: string;
  created_at: string;
};

const statusStyle: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-gray-200 text-gray-600",
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuestions() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error("Please sign in again.");

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);

      const response = await fetch(
        `${API}/cms/questions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load questions.");
      }

      setQuestions(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQuestions();
  }, [status]);

  const counts = {
    total: questions.length,
    drafts: questions.filter((q) => q.status === "DRAFT").length,
    pending: questions.filter((q) => q.status === "PENDING_REVIEW").length,
    published: questions.filter((q) => q.status === "PUBLISHED").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-700">
            SUPER ADMIN / LEARNING
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Question Bank
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage, review and publish the central question collection.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
  <Link
    href="/admin/question-bank/bulk-upload"
    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
  >
    <FileQuestion size={18} />
    Bulk Upload
  </Link>

  <Link
    href="/admin/question-bank/new"
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
  >
    <Plus size={18} />
    Add New Question
  </Link>
</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total loaded", value: counts.total, icon: FileQuestion },
          { label: "Drafts", value: counts.drafts, icon: Clock },
          { label: "Pending review", value: counts.pending, icon: RefreshCw },
          { label: "Published", value: counts.published, icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{item.label}</p>
                <Icon size={20} className="text-blue-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void loadQuestions();
              }}
              placeholder="Search question text..."
              className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <button
            onClick={() => void loadQuestions()}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Search
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Loading questions...
          </p>
        ) : questions.length === 0 ? (
          <div className="py-14 text-center">
            <Archive className="mx-auto mb-3 text-slate-300" size={38} />
            <h3 className="font-semibold text-slate-800">
              No questions found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add your first question to start building the question bank.
            </p>
            <Link
              href="/admin/question-bank/new"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-blue-700"
            >
              <Plus size={17} /> Create question
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-slate-50">
                    <td className="max-w-md px-4 py-4 font-medium text-slate-800">
                      {question.question_text}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {question.question_type.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-4">{question.difficulty}</td>
                    <td className="px-4 py-4">{question.marks}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[question.status] || "bg-slate-100"}`}>
                        {question.status.replaceAll("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}