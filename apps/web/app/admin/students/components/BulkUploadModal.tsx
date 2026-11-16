"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import type { StudentFormData } from "../types/student";

type ImportRejection = {
  row: number;
  rollNumber: string;
  reason: string;
};

type ImportRecord = StudentFormData & {
  sourceRow: number;
};

type Props = {
  onClose: () => void;
  onImport: (
    records: ImportRecord[]
  ) => Promise<{
    importedCount: number;
    rejected: ImportRejection[];
  }>;
};

type PreviewRow = StudentFormData & {
  row: number;
  error: string;
};

const requiredColumns = [
  "name",
  "rollnumber",
  "email",
  "class",
  "section",
];

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function downloadTemplate() {
  const data = [
    ["Name", "Roll Number", "Email", "Class", "Section"],
    ["Aarav Sharma", "PP2026001", "aarav@example.com", "Class 10", "A"],
    ["Ananya Reddy", "PP2026002", "ananya@example.com", "Class 10", "A"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, "prayas-prep-student-template.xlsx");
}

export default function BulkUploadModal({
  onClose,
  onImport,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileError, setFileError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [summary, setSummary] = useState<{
    importedCount: number;
    rejected: ImportRejection[];
  } | null>(null);

  function readFile(file?: File) {
    setFileError("");
    setPreview([]);
    setIsReady(false);
    setSummary(null);

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["xlsx", "csv"].includes(extension)) {
      setFileError("Please select an .xlsx or .csv file.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const bytes = event.target?.result;

        if (!bytes) {
          setFileError("The file could not be read.");
          return;
        }

        const workbook = XLSX.read(bytes, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          setFileError("The file does not contain a worksheet.");
          return;
        }

        const sheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json<
          Record<string, unknown>
        >(sheet, {
          defval: "",
          raw: false,
        });

        if (rawRows.length === 0) {
          setFileError(
            "The selected file contains no student records."
          );
          return;
        }

        const originalHeaders = Object.keys(rawRows[0]);

        const headerMap = new Map(
          originalHeaders.map((header) => [
            normalizeHeader(header),
            header,
          ])
        );

        const missingColumns = requiredColumns.filter(
          (column) => !headerMap.has(column)
        );

        if (missingColumns.length > 0) {
          setFileError(
            `Missing columns: ${missingColumns.join(
              ", "
            )}. Use the template to get the correct headings.`
          );
          return;
        }

        const getValue = (
          row: Record<string, unknown>,
          column: string
        ) => String(row[headerMap.get(column)!] ?? "").trim();

        const seenRollNumbers = new Set<string>();

        const records: PreviewRow[] = rawRows.map(
          (row, index) => {
            const record: StudentFormData = {
              name: getValue(row, "name"),
              rollNumber: getValue(row, "rollnumber"),
              email: getValue(row, "email"),
              className: getValue(row, "class"),
              section: getValue(row, "section").toUpperCase(),
            };

            const errors: string[] = [];
            const normalizedRoll =
              record.rollNumber.trim().toLowerCase();

            if (!record.name) {
              errors.push("Name is required");
            }

            if (!record.rollNumber) {
              errors.push("Roll number is required");
            }

            if (
              !record.email ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)
            ) {
              errors.push("Invalid email");
            }

            if (!/^class\s+\d+$/i.test(record.className)) {
              errors.push("Class must look like Class 10");
            }

            if (!/^[A-Z]$/.test(record.section)) {
              errors.push("Section must be one letter (A-Z)");
            }

            if (
              normalizedRoll &&
              seenRollNumbers.has(normalizedRoll)
            ) {
              errors.push("Duplicate roll number in this file");
            }

            if (normalizedRoll) {
              seenRollNumbers.add(normalizedRoll);
            }

            return {
              ...record,
              row: index + 2,
              error: errors.join("; "),
            };
          }
        );

        setPreview(records);
        setIsReady(records.some((record) => !record.error));

        if (records.every((record) => record.error)) {
          setFileError(
            "No valid rows were found. Correct the errors and upload the file again."
          );
        }
      } catch {
        setFileError(
          "We couldn't read this file. Check that it is a valid Excel or CSV file."
        );
      }
    };

    reader.onerror = () => {
      setFileError(
        "There was a problem reading the selected file."
      );
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (isImporting) return;

    const validRows = preview.filter(
      (record) => !record.error
    );

    const initialRejected: ImportRejection[] = preview
      .filter((record) => Boolean(record.error))
      .map((record) => ({
        row: record.row,
        rollNumber: record.rollNumber || "(blank)",
        reason: record.error,
      }));

    if (validRows.length === 0) {
      setFileError("There are no valid students to import.");
      return;
    }

    setIsImporting(true);
    setIsReady(false);
    setFileError("");

    try {
      const result = await onImport(
        validRows.map(
          ({
            row,
            name,
            rollNumber,
            email,
            className,
            section,
          }) => ({
            sourceRow: row,
            name,
            rollNumber,
            email,
            className,
            section,
          })
        )
      );

      setSummary({
        importedCount: result.importedCount,
        rejected: [
          ...initialRejected,
          ...result.rejected,
        ],
      });
    } catch (error) {
      console.error("Student bulk import failed:", error);

      setFileError(
        "We couldn't save the student records. Check your connection and try again."
      );

      setIsReady(true);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-upload-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">
          <div>
            <h2
              id="bulk-upload-title"
              className="text-xl font-bold text-slate-900"
            >
              Student Upload
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload a spreadsheet, review errors, and import valid records.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close bulk upload"
            disabled={isImporting}
            className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {!summary && (
            <>
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <FileSpreadsheet
                    className="mt-1 shrink-0 text-blue-600"
                    size={23}
                  />

                  <div>
                    <p className="font-semibold text-slate-900">
                      Use the student template
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Required columns: Name, Roll Number, Email, Class, Section.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadTemplate}
                  disabled={isImporting}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  <Download size={16} />
                  Download template
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50 disabled:opacity-50"
              >
                <Upload
                  size={28}
                  className="mb-3 text-blue-600"
                />

                <span className="font-semibold text-slate-800">
                  Choose a student file
                </span>

                <span className="mt-1 text-sm text-slate-500">
                  Excel (.xlsx) or CSV (.csv)
                </span>

                {fileName && (
                  <span className="mt-3 text-sm font-medium text-blue-700">
                    Selected: {fileName}
                  </span>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                disabled={isImporting}
                onChange={(event) => {
                  readFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />

              {fileError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {fileError}
                </p>
              )}

              {isImporting && (
                <p
                  role="status"
                  className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
                >
                  Saving student records to the database. Please wait...
                </p>
              )}

              {preview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                      Total rows: {preview.length}
                    </span>

                    <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                      Valid:{" "}
                      {preview.filter((row) => !row.error).length}
                    </span>

                    <span className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
                      Errors:{" "}
                      {preview.filter((row) => row.error).length}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-3">Row</th>
                          <th className="px-3 py-3">Name</th>
                          <th className="px-3 py-3">Roll Number</th>
                          <th className="px-3 py-3">Email</th>
                          <th className="px-3 py-3">Class</th>
                          <th className="px-3 py-3">Section</th>
                          <th className="px-3 py-3">Validation</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {preview.map((row) => (
                          <tr
                            key={row.row}
                            className={row.error ? "bg-red-50/60" : ""}
                          >
                            <td className="px-3 py-3">
                              {row.row}
                            </td>

                            <td className="px-3 py-3">
                              {row.name || "—"}
                            </td>

                            <td className="px-3 py-3">
                              {row.rollNumber || "—"}
                            </td>

                            <td className="px-3 py-3">
                              {row.email || "—"}
                            </td>

                            <td className="px-3 py-3">
                              {row.className || "—"}
                            </td>

                            <td className="px-3 py-3">
                              {row.section || "—"}
                            </td>

                            <td className="max-w-64 px-3 py-3">
                              {row.error ? (
                                <span className="text-xs text-red-700">
                                  {row.error}
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-emerald-700">
                                  Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-slate-500">
                    Rows with validation errors will be skipped.
                    Duplicate roll numbers already in this school's
                    roster will also be rejected.
                  </p>
                </div>
              )}
            </>
          )}

          {summary && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-800">
                  Import finished
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-900">
                  {summary.importedCount} students imported
                </p>

                <p className="mt-1 text-sm text-emerald-800">
                  {summary.rejected.length} rows rejected or skipped.
                </p>
              </div>

              {summary.rejected.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[500px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-3">File row</th>
                        <th className="px-3 py-3">Roll number</th>
                        <th className="px-3 py-3">Reason</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {summary.rejected.map((item, index) => (
                        <tr key={`${item.row}-${index}`}>
                          <td className="px-3 py-3">
                            {item.row}
                          </td>

                          <td className="px-3 py-3">
                            {item.rollNumber}
                          </td>

                          <td className="px-3 py-3 text-red-700">
                            {item.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-5">
          {summary ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isReady || isImporting}
                onClick={handleImport}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting
                  ? "Importing..."
                  : "Import valid students"}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}