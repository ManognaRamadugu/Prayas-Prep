
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Student, StudentFormData } from "../types/student";

type Props = {
  student: Student;
  onClose: () => void;
  onSave: (studentId: string, data: StudentFormData) => Promise<{
    success: boolean;
    message: string;
  }>;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function EditStudentModal({
  student,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<StudentFormData>({
    name: student.name,
    rollNumber: student.rollNumber,
    email: student.email ?? "",
    className: student.className,
    section: student.section,
  });

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email ?? "",
      className: student.className,
      section: student.section,
    });
  }, [student]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage("");

    try {
      const result = await onSave(student.id, form);
      setMessage(result.message);

      if (result.success) onClose();
    } catch {
      setMessage("Unable to update student. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-student-title"
        className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 id="edit-student-title" className="text-xl font-bold text-slate-900">
              Edit Student
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update student details.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Roll number</label>
            <input
              required
              className={inputClass}
              value={form.rollNumber}
              onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email (Optional)</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Class</label>
              <select
                required
                className={inputClass}
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
              >
                {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map(
                  (value) => <option key={value}>{value}</option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Section</label>
              <select
                required
                className={inputClass}
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                {["A", "B", "C", "D", "E"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <p role="alert" className="text-sm text-red-600">{message}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
