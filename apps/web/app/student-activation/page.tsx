
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function StudentActivationPage() {
  const [username, setUsername] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const response = await fetch(
        `${apiUrl}/student-accounts/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            activationCode: activationCode.trim().toUpperCase(),
            password,
            email: email.trim() || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;

        throw new Error(
          message || "Unable to activate your account."
        );
      }

      setSuccess(true);

      setUsername("");
      setActivationCode("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
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
              Your learning journey starts here.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Activate the account created for you by your school
              administrator and start preparing with Prayas Prep.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-300">
              <p>✓ Use your school-provided username.</p>
              <p>✓ Enter your personal activation code.</p>
              <p>✓ Create your own secure password.</p>
            </div>
          </div>
        </section>

        {/* Activation form */}
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Student registration
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              Activate account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the details provided by your school to activate
              your student account.
            </p>

            {success ? (
              <div className="mt-8 space-y-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <div className="text-3xl">🎉</div>

                  <h3 className="mt-3 text-lg font-bold text-green-800">
                    Account activated!
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-green-700">
                    Your student account has been created successfully.
                    You can now proceed to student sign-in.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-xl bg-[#172b59] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#223d79]"
                >
                  Continue to sign in
                </Link>

                <p className="text-center text-xs text-slate-400">
                  Username-based sign-in will be enabled in the next step.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleActivation}
                className="mt-8 space-y-5"
              >
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Student username
                  </label>

                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    placeholder="Enter your school username"
                    required
                    minLength={3}
                    maxLength={50}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                {/* Activation code */}
                <div>
                  <label
                    htmlFor="activationCode"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Activation code
                  </label>

                  <input
                    id="activationCode"
                    type="text"
                    autoComplete="off"
                    value={activationCode}
                    onChange={(event) =>
                      setActivationCode(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-F0-9-]/g, "")
                      )
                    }
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    required
                    maxLength={19}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm tracking-wider text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Enter the code provided by your school.
                  </p>
                </div>

                {/* Optional email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address{" "}
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Create password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Create a password"
                      required
                      minLength={8}
                      maxLength={72}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute inset-y-0 right-3 text-sm font-medium text-blue-700 hover:text-blue-900"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm your password"
                      required
                      minLength={8}
                      maxLength={72}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-3 text-sm font-medium text-blue-700 hover:text-blue-900"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-[#172b59] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#223d79] focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Activating account..." : "Activate my account"}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Prayas Prep · Learn, practise, and progress.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
