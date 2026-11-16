import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: assignments, error } = await supabase
    .from("user_roles").select("role_id").eq("user_id", user.id);

  if (error || !assignments?.length) redirect("/unauthorized");

  const { data: roles } = await supabase
    .from("roles").select("name").in("id", assignments.map((r) => r.role_id));

  if (!roles?.some((r) => r.name === "STUDENT")) redirect("/unauthorized");

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-blue-700">PRAYAS PREP · STUDENT PORTAL</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome to your learning dashboard!</h1>
        <p className="mt-2 text-slate-500">Your preparation. Your progress. Your future.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {["My Learning", "Practice Questions", "Mock Tests"].map((name) => (
            <section key={name} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-900">{name}</h2>
              <p className="mt-2 text-sm text-slate-500">Your {name.toLowerCase()} will appear here.</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
