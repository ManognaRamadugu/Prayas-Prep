import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your account doesn't have permission to access the Admin Portal.
          Please sign in with an authorized account.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-[#172b59] px-6 py-3 font-semibold text-white hover:bg-[#223d79]"
        >
          Return to Login
        </Link>
      </div>
    </main>
  );
}