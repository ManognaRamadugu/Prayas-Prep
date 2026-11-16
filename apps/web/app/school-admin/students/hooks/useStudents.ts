"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, StudentFormData } from "../types/student";
async function downloadActivationCsv(studentIds: string[]): Promise<string> {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Your login session has expired. Please sign in again.");
  }

  const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const response = await fetch(
    `${API}/student-accounts/activation-codes/download`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ studentIds }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || "Activation codes could not be generated."
    );
  }

  const csv = await response.text();

  if (!csv.trim()) {
    throw new Error("The activation-code CSV was empty.");
  }

  return csv;
}

function downloadCsvFile(csv: string) {
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "prayas-student-activation-codes.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
type DatabaseStudent = {
  id: string;
  full_name: string;
  roll_number: string;
  email: string |null;
  class_name: string;
  section: string;
  status: string;
};

type ImportRejection = {
  row: number;
  rollNumber: string;
  reason: string;
};

type ImportRecord = StudentFormData & {
  sourceRow?: number;
};

const STUDENT_FIELDS =
  "id, full_name, roll_number, email, class_name, section, status";

function fromDatabase(row: DatabaseStudent): Student {
  return {
    id: row.id,
    name: row.full_name,
    rollNumber: row.roll_number,
    email: row.email ?? "",
    className: row.class_name,
    section: row.section,
    status: row.status === "INACTIVE" ? "Inactive" : "Active",
  };
}

function toDatabase(record: StudentFormData, schoolId: string) {
  return {
    school_id: schoolId,
    linked_user_id: null,
    full_name: record.name.trim(),
    roll_number: record.rollNumber.trim(),
    email: record.email.trim() || null,
    class_name: record.className.trim(),
    section: record.section.trim().toUpperCase(),
    status: "ACTIVE",
  };
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [sectionFilter, setSectionFilter] = useState("All Sections");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Identify the logged-in School Admin's assigned school
  // before loading that school's roster.
  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setLoading(true);
      setLoadError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Please sign in to view student records.");
        }

        const { data: memberships, error: membershipError } =
          await supabase
            .from("school_memberships")
            .select("school_id")
            .eq("user_id", user.id)
            .eq("membership_role", "SCHOOL_ADMIN")
            .eq("status", "ACTIVE");

        if (membershipError) {
          throw new Error(
            "We couldn't verify your school assignment. Please try again."
          );
        }

        if (!memberships || memberships.length !== 1) {
          throw new Error(
            "This account must be assigned to exactly one active school. Please contact the platform administrator."
          );
        }

        const assignedSchoolId = memberships[0].school_id;

        const { data, error } = await supabase
          .from("school_students")
          .select(STUDENT_FIELDS)
          .eq("school_id", assignedSchoolId);

        if (error) {
          throw new Error(
            "We couldn't load this school's students. Please try again."
          );
        }

        if (cancelled) return;

        setSchoolId(assignedSchoolId);
        setStudents(
          ((data ?? []) as DatabaseStudent[]).map(fromDatabase)
        );
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading students."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students
      .filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(term) ||
          student.rollNumber.toLowerCase().includes(term) ||
          (student.email ?? "").toLowerCase().includes(term);

        return (
          matchesSearch &&
          (classFilter === "All Classes" ||
            student.className === classFilter) &&
          (sectionFilter === "All Sections" ||
            student.section === sectionFilter) &&
          (statusFilter === "All Status" ||
            student.status === statusFilter)
        );
      })
      .sort((a, b) => {
        const classA = Number(a.className.match(/\d+/)?.[0] ?? 0);
        const classB = Number(b.className.match(/\d+/)?.[0] ?? 0);

        return (
          classA - classB ||
          a.section.localeCompare(b.section) ||
          a.name.localeCompare(b.name)
        );
      });
  }, [students, search, classFilter, sectionFilter, statusFilter]);

  const activeCount = students.filter(
    (student) => student.status === "Active"
  ).length;

  async function addStudent(data: StudentFormData) {
    const name = data.name.trim();
    const rollNumber = data.rollNumber.trim();
    const email = data.email.trim();
    const className = data.className.trim();
    const section = data.section.trim().toUpperCase();

    if (!name || !rollNumber || !className || !section) {
      return { success: false, message: "Please fill in all fields." };
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: "Please enter a valid email." };
    }

    if (!schoolId) {
      return {
        success: false,
        message: "Your school assignment isn't loaded. Please refresh the page.",
      };
    }

    if (
      students.some(
        (student) =>
          student.rollNumber.toLowerCase() === rollNumber.toLowerCase()
      )
    ) {
      return {
        success: false,
        message: "A student with this roll number already exists.",
      };
    }

    try {
      const supabase = createClient();

      const { data: saved, error } = await supabase
        .from("school_students")
        .insert(toDatabase(
          { name, rollNumber, email, className, section },
          schoolId
        ))
        .select(STUDENT_FIELDS)
        .single();

      if (error) {
        if (error.code === "23505") {
          return {
            success: false,
            message: "A student with this roll number already exists.",
          };
        }

        console.error("Failed to save student:", error);

        return {
          success: false,
          message:
            "Student could not be saved. Check your school access and try again.",
        };
      }

      setStudents((previous) => [
        ...previous,
        fromDatabase(saved as DatabaseStudent),
      ]);

      return { success: true, message: "Student saved successfully." };
    } catch {
      return {
        success: false,
        message: "Unable to save the student. Please try again.",
      };
    }
  }

  async function importStudents(records: ImportRecord[]) {
    const rejected: ImportRejection[] = [];
    const candidates: { record: StudentFormData; row: number }[] = [];

    if (!schoolId) {
      return {
        importedCount: 0,
        rejected: records.map((record, index) => ({
          row: record.sourceRow ?? index + 2,
          rollNumber: record.rollNumber || "(blank)",
          reason: "No active school assignment was found.",
        })),
      };
    }

    const knownRollNumbers = new Set(
      students.map((student) => student.rollNumber.trim().toLowerCase())
    );

    records.forEach((record, index) => {
      const name = record.name.trim();
      const rollNumber = record.rollNumber.trim();
      const email = record.email.trim();
      const className = record.className.trim();
      const section = record.section.trim().toUpperCase();
      const row = record.sourceRow ?? index + 2;

      if (!name || !rollNumber || !className || !section) {
        rejected.push({
          row,
          rollNumber: rollNumber || "(blank)",
          reason: "One or more required fields are missing.",
        });
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  rejected.push({
    row,
    rollNumber,
    reason: "Invalid email.",
  });
  return;
}

      const key = rollNumber.toLowerCase();

      if (knownRollNumbers.has(key)) {
        rejected.push({
          row,
          rollNumber,
          reason: "Duplicate roll number already exists in this school.",
        });
        return;
      }

      knownRollNumbers.add(key);

      candidates.push({
        row,
        record: { name, rollNumber, email, className, section },
      });
    });

    if (candidates.length === 0) {
      return { importedCount: 0, rejected };
    }

    const supabase = createClient();
    const payload = candidates.map(({ record }) =>
      toDatabase(record, schoolId)
    );

    // Try a single bulk insert first.
    const { data: inserted, error: batchError } = await supabase
      .from("school_students")
      .insert(payload)
      .select(STUDENT_FIELDS);

    if (!batchError && inserted) {
      const savedStudents = (inserted as DatabaseStudent[]).map(fromDatabase);

      setStudents((previous) => [...previous, ...savedStudents]);

      return {
        importedCount: savedStudents.length,
        rejected,
      };
    }

    console.error("Bulk student insert failed:", batchError);

    // A duplicate conflict can reject the whole batch.
    // Retry row by row so valid records can still be imported.
    if (batchError?.code === "23505") {
      const savedStudents: Student[] = [];

      for (const candidate of candidates) {
        const { data: saved, error } = await supabase
          .from("school_students")
          .insert(toDatabase(candidate.record, schoolId))
          .select(STUDENT_FIELDS)
          .single();

        if (error) {
          rejected.push({
            row: candidate.row,
            rollNumber: candidate.record.rollNumber,
            reason:
              error.code === "23505"
                ? "Duplicate roll number already exists in this school."
                : "Database could not save this record.",
          });
        } else {
          savedStudents.push(fromDatabase(saved as DatabaseStudent));
        }
      }

      if (savedStudents.length > 0) {
        setStudents((previous) => [...previous, ...savedStudents]);
      }

      return {
        importedCount: savedStudents.length,
        rejected,
      };
    }

    // For permission, connection or other database failures,
    // do not report records as imported.
    return {
      importedCount: 0,
      rejected: [
        ...rejected,
        ...candidates.map(({ record, row }) => ({
          row,
          rollNumber: record.rollNumber,
          reason:
            batchError?.code === "42501"
              ? "Database permission denied. Check this account's school access."
              : "The database couldn't save this batch. Please try again.",
        })),
      ],
    };
  }
  async function updateStudent(
  studentId: string,
  data: StudentFormData
) {
  const name = data.name.trim();
  const rollNumber = data.rollNumber.trim();
  const email = data.email.trim();
  const className = data.className.trim();
  const section = data.section.trim().toUpperCase();

  if (!name || !rollNumber || !className || !section) {
    return {
      success: false,
      message: "Please fill in all required fields.",
    };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Please enter a valid email." };
  }

  if (!schoolId) {
    return { success: false, message: "School assignment not loaded." };
  }

  if (
    students.some(
      (student) =>
        student.id !== studentId &&
        student.rollNumber.toLowerCase() === rollNumber.toLowerCase()
    )
  ) {
    return {
      success: false,
      message: "A student with this roll number already exists.",
    };
  }

  const supabase = createClient();

  const { data: saved, error } = await supabase
    .from("school_students")
    .update({
      full_name: name,
      roll_number: rollNumber,
      email: email || null,
      class_name: className,
      section,
    })
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .select(STUDENT_FIELDS)
    .single();

  if (error || !saved) {
    console.error("Student update failed:", error);
    return {
      success: false,
      message: "Student could not be updated. Please try again.",
    };
  }

  setStudents((previous) =>
    previous.map((student) =>
      student.id === studentId
        ? fromDatabase(saved as DatabaseStudent)
        : student
    )
  );

  return { success: true, message: "Student updated successfully." };
}

  
  async function generateActivationCodes(studentIds: string[]) {
    if (!studentIds.length) {
      return {
        success: false,
        message: "Select at least one student.",
      };
    }

    try {
      const csv = await downloadActivationCsv(studentIds);
      downloadCsvFile(csv);

      return {
        success: true,
        message: "Activation codes generated and downloaded successfully.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate activation codes.",
      };
    }
  }

  return {
    students,
    filteredStudents,
    activeCount,
    loading,
    loadError,
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
    generateActivationCodes,
    updateStudent,
  };
}
