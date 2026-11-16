
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  async function handleForgotPassword() {
    setError("");
    setResetMessage("");

    const value = identifier.trim();

    if (!value) {
      setError("Enter your email address first.");
      return;
    }

    // Student usernames do not support email password recovery.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(
        "Password reset by email requires an email address. If you are a student without a registered email, contact your School Admin."
      );
      return;
    }

    setResetLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(value, {
          redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetMessage(
        "If your account exists, a reset email has been sent. Check your inbox and spam folder."
      );
    } catch {
      setError("Unable to send the reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    const value = identifier.trim();

    try {
      const supabase = createClient();

      // 1. Determine whether the user entered an email or username.
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      let loginEmail = value;

      // 2. Resolve student username to its internal Supabase email.
      if (!isEmail) {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const response = await fetch(
          `${apiUrl}/student-accounts/resolve-username`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: value,
            }),
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.email) {
          setError("Invalid username or password.");
          return;
        }

        loginEmail = result.email;
      }

      // 3. Sign in through Supabase.
      const { data: authData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

      if (loginError || !authData.user) {
        setError("Invalid username/email or password.");
        return;
      }

      // 4. Find the roles assigned to this user.
      const { data: assignments, error: roleError } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", authData.user.id);

      if (roleError) {
        console.error("Role lookup failed:", roleError);
        await supabase.auth.signOut();
        setError("Unable to verify your role. Please try again.");
        return;
      }

      if (!assignments?.length) {
        console.error("No role assignments found:", authData.user.id);
        await supabase.auth.signOut();
        setError(
          "No role assigned to this account. Contact an administrator."
        );
        return;
      }

      // 5. Get role names.
      const roleIds = assignments.map(
        (assignment) => assignment.role_id
      );

      const { data: roles, error: rolesError } = await supabase
        .from("roles")
        .select("name")
        .in("id", roleIds);

      if (rolesError || !roles?.length) {
        await supabase.auth.signOut();
        setError("Unable to verify your account role.");
        return;
      }

      // 6. Redirect according to role.
      if (roles.some((role) => role.name === "SUPER_ADMIN")) {
        router.replace("/admin");
      } else if (roles.some((role) => role.name === "SCHOOL_ADMIN")) {
        router.replace("/school-admin");
      } else if (roles.some((role) => role.name === "STUDENT")) {
        router.replace("/dashboard");
      } else {
        await supabase.auth.signOut();
        setError("Your account does not have an authorized role.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">

        {/* Welcome panel */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#101d40] p-8 text-white sm:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/10" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-400/10" />

          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              🎓
            </div>

            <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
              Prayas Prep
            </h1>

            <p className="mt-4 max-w-sm text-base leading-7 text-slate-300">
              Your preparation. Your progress. Your future.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="mb-5 h-1 w-14 rounded-full bg-blue-400" />

            <h2 className="text-xl font-semibold">
              Every step takes you closer.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Continue your learning journey, practise questions,
              and keep track of your progress in one place.
            </p>
          </div>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Welcome back
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              Sign in
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your username or email address to continue.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Username or email address
                </label>

                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Enter username or email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-sm font-semibold text-blue-900 hover:underline disabled:opacity-60"
                >
                  {resetLoading
                    ? "Sending reset link..."
                    : "Forgot password?"}
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {resetMessage && (
                <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {resetMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#172b59] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#223d79] focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to Prayas Prep"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Prayas Prep · Learn, practise, and progress.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
