
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl sm:p-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101d40] text-2xl font-bold text-white">
          P
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-blue-700">
          Join Prayas Prep
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Activate your account
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          Student accounts are created through your school.
          To get started, ask your school administrator for
          your username and activation code.
        </p>

        <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-slate-900">
            Already have your activation details?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Activate your account using your username,
            activation code, and a new password.
          </p>

          <Link
            href="/student-activation"
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#172b59] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#223d79]"
          >
            Activate Student Account
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Already activated your account?
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline"
          >
            Sign in to Prayas Prep
          </Link>
        </div>
      </div>
    </main>
  );
}
