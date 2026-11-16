
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
      } else if (session) {
        setReady(true);
      } else {
        setError(
          "Your password-reset session is missing or expired. Please request a new reset email."
        );
      }

      setCheckingSession(false);
    }

    void checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();

      setPassword("");
      setConfirmPassword("");
      setReady(false);
      setSuccess(true);
    } catch {
      setError("Unable to update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Reset your password
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Prayas Prep · Set a new password for your account.
          </p>
        </div>

        {checkingSession ? (
          <p className="text-sm text-slate-600">
            Verifying your password-reset session...
          </p>
        ) : success ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              Your password has been updated successfully. You can now sign in
              using your new password.
            </p>

            <Link
              href="/login"
              className="block rounded-lg bg-blue-900 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p
                role="alert"
                className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {ready && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    New password
                  </label>

                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm new password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Re-enter your password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-blue-900 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Updating password..." : "Save New Password"}
                </button>
              </form>
            )}

            {!ready && (
              <Link
                href="/login"
                className="inline-block text-sm font-semibold text-blue-900 hover:underline"
              >
                Return to Login
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
