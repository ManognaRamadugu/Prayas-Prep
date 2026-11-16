
"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Users,
  GraduationCap,
  UserCheck,
  Download,
  Filter,
  X,
  Eye,
  Upload,
} from "lucide-react";

import BulkUploadModal from "./components/BulkUploadModal";
import { useStudents } from "./hooks/useStudents";
import type { Student, StudentFormData } from "./types/student";

export default function StudentsPage() {
  const {
    students,
    filteredStudents,
    loading,
    loadError,
    activeCount,
    search,
    setSearch,
    classFilter,
    setClassFilter,
    sectionFilter,
    setSectionFilter,
    statusFilter,
    setStatusFilter,
    addStudent,
    importStudents,
  } = useStudents();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<StudentFormData>({
    name: "",
    rollNumber: "",
    email: "",
    className: "Class 10",
    section: "A",
  });

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingStudent(true);

    try {
      const result = await addStudent(newStudent);
      setFormMessage(result.message);
      setMessageIsError(!result.success);

      if (result.success) {
        setNewStudent({
          name: "",
          rollNumber: "",
          email: "",
          className: "Class 10",
          section: "A",
        });
        setShowAddForm(false);
        setFormMessage("");
      }
    } catch {
      setFormMessage("Unable to save the student. Please try again.");
      setMessageIsError(true);
    } finally {
      setIsSavingStudent(false);
    }
  }

  function exportStudents() {
    const headings = [
      "Name",
      "Roll Number",
      "Email",
      "Class",
      "Section",
      "Status",
    ];

    const rows = filteredStudents.map((student) => [
      student.name,
      student.rollNumber,
      student.email,
      student.className,
      student.section,
      student.status,
    ]);

    const csv = [headings, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "prayas-prep-students.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500";
  return(

<main className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
  <div className="mx-auto max-w-7xl space-y-6">
    {/* Page heading */}
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div className="mb-2 text-sm text-slate-500">
          <Link href="/admin" className="hover:text-blue-600">
            Admin
          </Link>
          <span className="mx-2">/</span>
          <span>Students</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Student Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View, search, filter and manage student records.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportStudents}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
        >
          <Download size={17} />
          Export CSV
        </button>

        <button
          type="button"
          onClick={() => setShowBulkUpload(true)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
        >
          <Upload size={17} />
          Student Upload
        </button>

        <button
          type="button"
          onClick={() => {
            setFormMessage("");
            setMessageIsError(false);
            setShowAddForm(true);
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>
    </div>

    {/* Database loading and error messages */}
    {loadError && (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {loadError}
      </div>
    )}

    {loading && (
      <div
        role="status"
        className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700"
      >
        Loading students from the database...
      </div>
    )}

    {/* Statistics */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Total Students"
        value={students.length}
        description="Students in this school"
        icon={<Users size={21} />}
      />

      <StatCard
        title="Active Students"
        value={activeCount}
        description="Currently marked active"
        icon={<UserCheck size={21} />}
      />

      <StatCard
        title="Classes"
        value={
          new Set(students.map((student) => student.className)).size
        }
        description="Classes represented in the records"
        icon={<GraduationCap size={21} />}
      />
    </div>

    {/* Student table */}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              All Students
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, roll number or email..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <Filter size={16} />
                Filters
              </span>

              <select
                aria-label="Filter by class"
                value={classFilter}
                onChange={(event) =>
                  setClassFilter(event.target.value)
                }
                className={selectClass}
              >
                <option>All Classes</option>

                {Array.from(
                  new Set(
                    students.map((student) => student.className)
                  )
                )
                  .sort(
                    (a, b) =>
                      Number(a.match(/\d+/)?.[0] ?? 0) -
                      Number(b.match(/\d+/)?.[0] ?? 0)
                  )
                  .map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
              </select>

              <select
                aria-label="Filter by section"
                value={sectionFilter}
                onChange={(event) =>
                  setSectionFilter(event.target.value)
                }
                className={selectClass}
              >
                <option>All Sections</option>

                {Array.from(
                  new Set(
                    students.map((student) => student.section)
                  )
                )
                  .sort()
                  .map((section) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
              </select>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className={selectClass}
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setClassFilter("All Classes");
                  setSectionFilter("All Sections");
                  setStatusFilter("All Status");
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Student</th>
                  <th className="px-5 py-4 font-semibold">
                    Roll Number
                  </th>
                  <th className="px-5 py-4 font-semibold">Class</th>
                  <th className="px-5 py-4 font-semibold">Section</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                          {student.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {student.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-600">
                      {student.rollNumber}
                    </td>

                    <td className="px-5 py-4">
                      {student.className}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium">
                        {student.section}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          student.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center"
                    >
                      <Users
                        size={32}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-semibold text-slate-700">
                        No students found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

                    <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Students are sorted by class, section and name.
          </div>
        </section>
      </div>

      {/* Add Student Modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddForm(false);
              setFormMessage("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-student-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Add New Student
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the student's details below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormMessage("");
                }}
                aria-label="Close add student form"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Full name
                </label>
                <input
                  required
                  value={newStudent.name}
                  onChange={(event) =>
                    setNewStudent({
                      ...newStudent,
                      name: event.target.value,
                    })
                  }
                  placeholder="Enter full name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Roll number
                </label>
                <input
                  required
                  value={newStudent.rollNumber}
                  onChange={(event) =>
                    setNewStudent({
                      ...newStudent,
                      rollNumber: event.target.value,
                    })
                  }
                  placeholder="e.g. PP2026007"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(event) =>
                    setNewStudent({
                      ...newStudent,
                      email: event.target.value,
                    })
                  }
                  placeholder="student@example.com"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Class
                  </label>
                  <select
                    required
                    value={newStudent.className}
                    onChange={(event) =>
                      setNewStudent({
                        ...newStudent,
                        className: event.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    {Array.from(
                      { length: 12 },
                      (_, index) => index + 1
                    ).map((classNumber) => (
                      <option
                        key={classNumber}
                        value={`Class ${classNumber}`}
                      >
                        Class {classNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Section
                  </label>
                  <select
                    required
                    value={newStudent.section}
                    onChange={(event) =>
                      setNewStudent({
                        ...newStudent,
                        section: event.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    {["A", "B", "C", "D", "E"].map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formMessage && (
                <p
                  role="alert"
                  className={`text-sm ${
                    messageIsError
                      ? "text-red-600"
                      : "text-emerald-700"
                  }`}
                >
                  {formMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormMessage("");
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
       type="submit"
       disabled={isSavingStudent}
       className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
>
                  {isSavingStudent ? "Saving..." : "Save Student"}
                </button>
                
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Bulk Upload Modal — separate from Add Student Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onImport={importStudents}
        />
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-details-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="student-details-title"
                className="text-xl font-bold text-slate-900"
              >
                Student Details
              </h2>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close student details"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {selectedStudent.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  {selectedStudent.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedStudent.rollNumber}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <DetailRow
                label="Email"
                value={selectedStudent.email}
              />
              <DetailRow
                label="Class"
                value={selectedStudent.className}
              />
              <DetailRow
                label="Section"
                value={selectedStudent.section}
              />
              <DetailRow
                label="Status"
                value={selectedStudent.status}
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-all text-sm font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}
