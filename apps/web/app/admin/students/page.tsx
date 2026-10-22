"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Users,
  GraduationCap,
  UserCheck,
  MoreHorizontal,
  Download,
  Filter,
  ChevronDown,
  ArrowUpRight,
  X,
} from "lucide-react";

type Student = {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  className: string;
  section: string;
  status: "Active" | "Inactive";
};

const initialStudents: Student[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    rollNumber: "PP2026001",
    email: "aarav@example.com",
    className: "Class 10",
    section: "A",
    status: "Active",
  },
  {
    id: 2,
    name: "Ananya Reddy",
    rollNumber: "PP2026002",
    email: "ananya@example.com",
    className: "Class 10",
    section: "A",
    status: "Active",
  },
  {
    id: 3,
    name: "Rahul Kumar",
    rollNumber: "PP2026003",
    email: "rahul@example.com",
    className: "Class 10",
    section: "B",
    status: "Active",
  },
  {
    id: 4,
    name: "Diya Patel",
    rollNumber: "PP2026004",
    email: "diya@example.com",
    className: "Class 9",
    section: "A",
    status: "Inactive",
  },
  {
    id: 5,
    name: "Arjun Reddy",
    rollNumber: "PP2026005",
    email: "arjun@example.com",
    className: "Class 9",
    section: "B",
    status: "Active",
  },
  {
    id: 6,
    name: "Saanvi Rao",
    rollNumber: "PP2026006",
    email: "saanvi@example.com",
    className: "Class 10",
    section: "A",
    status: "Active",
  },
];

export default function StudentsPage() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [newStudent, setNewStudent] = useState({
    name: "",
    rollNumber: "",
    email: "",
    className: "Class 10",
    section: "A",
  });

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        classFilter === "All Classes" ||
        student.className === classFilter;

      const matchesStatus =
        statusFilter === "All Status" ||
        student.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  const activeCount = students.filter(
    (student) => student.status === "Active"
  ).length;

  function handleAddStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const student: Student = {
      id: Date.now(),
      ...newStudent,
      status: "Active",
    };

    setStudents((previous) => [student, ...previous]);
    setNewStudent({
      name: "",
      rollNumber: "",
      email: "",
      className: "Class 10",
      section: "A",
    });
    setShowAddForm(false);
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
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prayas-prep-students.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 sm:p-8">
      {/* Page heading */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/admin" className="hover:text-blue-700">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-blue-700">Students</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Students Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage student records, classes, and enrollment.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* Statistics cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Students"
          value={students.length.toLocaleString()}
          subtitle="Students in this demo"
          icon={<Users size={21} />}
          iconBg="bg-blue-100 text-blue-700"
        />

        <StatCard
          title="Active Students"
          value={activeCount.toLocaleString()}
          subtitle="Currently active"
          icon={<UserCheck size={21} />}
          iconBg="bg-emerald-100 text-emerald-700"
        />

        <StatCard
          title="Classes"
          value={new Set(students.map((student) => student.className)).size.toString()}
          subtitle="Classes represented"
          icon={<GraduationCap size={21} />}
          iconBg="bg-violet-100 text-violet-700"
        />

        <StatCard
          title="Inactive Students"
          value={(students.length - activeCount).toLocaleString()}
          subtitle="Not currently active"
          icon={<Users size={21} />}
          iconBg="bg-amber-100 text-amber-700"
        />
      </div>

      {/* Students table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Students
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter student records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                aria-label="Search students"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-60"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                aria-label="Filter by class"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 sm:w-40"
              >
                <option>All Classes</option>
                <option>Class 9</option>
                <option>Class 10</option>
                <option>Class 11</option>
                <option>Class 12</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <button
              onClick={exportStudents}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={17} />
              Export
            </button>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {["All Status", "Active", "Inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">Roll Number</th>
                <th className="px-5 py-4 font-semibold">Class</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {student.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
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

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {student.rollNumber}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-700">
                      {student.className}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Section {student.section}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        student.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          student.status === "Active"
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {student.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      aria-label={`View ${student.name}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No students found. Try changing your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredStudents.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {students.length}
            </span>{" "}
            students
          </p>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <ArrowUpRight size={14} className="text-blue-600" />
              Student records
            </span>
          </div>
        </div>
      </section>

      {/* Add student modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Student
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a student to this demo list.
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <FormField label="Student Name">
                <input
                  required
                  value={newStudent.name}
                  onChange={(event) =>
                    setNewStudent({ ...newStudent, name: event.target.value })
                  }
                  placeholder="Enter full name"
                  className="form-input"
                />
              </FormField>

              <FormField label="Roll Number">
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
                  className="form-input"
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  required
                  type="email"
                  value={newStudent.email}
                  onChange={(event) =>
                    setNewStudent({ ...newStudent, email: event.target.value })
                  }
                  placeholder="student@example.com"
                  className="form-input"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Class">
                  <select
                    value={newStudent.className}
                    onChange={(event) =>
                      setNewStudent({
                        ...newStudent,
                        className: event.target.value,
                      })
                    }
                    className="form-input"
                  >
                    <option>Class 9</option>
                    <option>Class 10</option>
                    <option>Class 11</option>
                    <option>Class 12</option>
                  </select>
                </FormField>

                <FormField label="Section">
                  <select
                    value={newStudent.section}
                    onChange={(event) =>
                      setNewStudent({
                        ...newStudent,
                        section: event.target.value,
                      })
                    }
                    className="form-input"
                  >
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </FormField>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student details modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Student Details
              </h2>
              <button
                onClick={() => setSelectedStudent(null)}
                aria-label="Close student details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {selectedStudent.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedStudent.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedStudent.rollNumber}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl bg-slate-50 p-4 text-sm">
              <DetailRow label="Email" value={selectedStudent.email} />
              <DetailRow label="Class" value={selectedStudent.className} />
              <DetailRow label="Section" value={selectedStudent.section} />
              <DetailRow label="Status" value={selectedStudent.status} />
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>{icon}</div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="break-all text-right font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}
