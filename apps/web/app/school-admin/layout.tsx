import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SchoolAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: assignments, error } = await supabase
    .from("user_roles").select("role_id").eq("user_id", user.id);

  if (error || !assignments?.length) redirect("/unauthorized");

  const { data: roles } = await supabase
    .from("roles").select("name").in("id", assignments.map((r) => r.role_id));

  if (!roles?.some((r) => r.name === "SCHOOL_ADMIN")) redirect("/unauthorized");

  const { data: memberships, error: membershipError } = await supabase
    .from("school_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("membership_role", "SCHOOL_ADMIN")
    .eq("status", "ACTIVE");

  if (membershipError || memberships?.length !== 1) redirect("/unauthorized");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex h-[72px] items-center justify-between bg-[#073568] px-6 text-white">
        <Link href="/school-admin" className="text-xl font-extrabold">PRAYAS PREP</Link>
        <span className="text-sm font-semibold">SCHOOL ADMIN PORTAL</span>
      </header>
      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="w-60 shrink-0 bg-[#082b50] p-5 text-white">
          <p className="mb-5 text-xs font-bold tracking-widest text-blue-300">SCHOOL WORKSPACE</p>
          <nav className="space-y-2 text-sm">
            <Link className="block rounded-lg p-3 hover:bg-white/10" href="/school-admin">Dashboard</Link>
            <Link className="block rounded-lg p-3 hover:bg-white/10" href="/school-admin/students">Students</Link>
            <Link className="block rounded-lg p-3 hover:bg-white/10" href="/school-admin/question-bank">Question Bank</Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
