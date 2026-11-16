"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, StudentFormData } from "../types/student";

type DatabaseStudent = {
  id: string;
  full_name: string;
  roll_number: string;
  email: string;
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
    email: row.email,
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

async function downloadActivationCsv(
  studentIds: string[],
): Promise<string | null> {
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
    },
  );

  if (!response.ok) {
    let message = "Activation codes could not be generated.";

    try {
      const errorData = await response.json();
      if (typeof errorData.message === "string") {
        message = errorData.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
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
          student.email.toLowerCase().includes(term);

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

  if (!name || !rollNumber || !email || !className || !section) {
    return { success: false, message: "Please fill in all fields." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
      .insert(
        toDatabase(
          { name, rollNumber, email, className, section },
          schoolId
        )
      )
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
        message: "Student could not be saved. Check your school access and try again.",
      };
    }

    const savedStudent = saved as DatabaseStudent;

    setStudents((previous) => [
      ...previous,
      fromDatabase(savedStudent),
    ]);

    // Generate an activation code only for this newly added student.
    try {
      const csv = await downloadActivationCsv([savedStudent.id]);
      if (!csv) {
  throw new Error("Activation-code CSV was empty.");
}

downloadCsvFile(csv);

      return {
        success: true,
        message: "Student saved successfully! Activation credentials downloaded.",
      };
    } catch (activationError) {
      console.error(
        "Student saved, but activation-code generation failed:",
        activationError
      );

      const message =
        activationError instanceof Error
          ? activationError.message
          : "Unknown activation-code error.";

      return {
        success: true,
        message: `Student saved, but activation credentials could not be generated. ${message} Please contact the administrator before sharing login details.`,
      };
    }
  } catch (error) {
    console.error("Unable to add student:", error);

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
      activationError: null as string | null,
    };
  }

  const knownRollNumbers = new Set(
    students.map((student) => student.rollNumber.trim().toLowerCase()),
  );

  records.forEach((record, index) => {
    const name = record.name.trim();
    const rollNumber = record.rollNumber.trim();
    const email = record.email.trim();
    const className = record.className.trim();
    const section = record.section.trim().toUpperCase();
    const row = record.sourceRow ?? index + 2;

    if (!name || !rollNumber || !email || !className || !section) {
      rejected.push({
        row,
        rollNumber: rollNumber || "(blank)",
        reason: "One or more required fields are missing.",
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
    return {
      importedCount: 0,
      rejected,
      activationError: null as string | null,
    };
  }

  const supabase = createClient();
  const payload = candidates.map(({ record }) =>
    toDatabase(record, schoolId),
  );

  const savedStudents: DatabaseStudent[] = [];

  // Try a single bulk insert first.
  const { data: inserted, error: batchError } = await supabase
    .from("school_students")
    .insert(payload)
    .select(STUDENT_FIELDS);

  if (!batchError && inserted) {
    savedStudents.push(...(inserted as DatabaseStudent[]));
  } else {
    console.error("Bulk student insert failed:", batchError);

    // Retry individually only for duplicate conflicts.
    if (batchError?.code === "23505") {
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
        } else if (saved) {
          savedStudents.push(saved as DatabaseStudent);
        }
      }
    } else {
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
        activationError: null as string | null,
      };
    }
  }

  if (savedStudents.length === 0) {
    return {
      importedCount: 0,
      rejected,
      activationError: null as string | null,
    };
  }

  // Update the student roster before requesting activation codes.
  const savedStudentViews = savedStudents.map(fromDatabase);

  setStudents((previous) => [
    ...previous,
    ...savedStudentViews,
  ]);

  // Generate activation codes only for records inserted in this upload.
  let activationError: string | null = null;

  try {
    const studentIds = savedStudents.map((student) => student.id);

    const csv = await downloadActivationCsv(studentIds);

    if (csv) {
      downloadCsvFile(csv);
    }
  } catch (error) {
    console.error("Activation-code generation failed:", error);

    activationError =
      error instanceof Error
        ? error.message
        : "Students were imported, but activation codes could not be generated.";
  }

  return {
    importedCount: savedStudents.length,
    rejected,
    activationError,
  };
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
  };
}