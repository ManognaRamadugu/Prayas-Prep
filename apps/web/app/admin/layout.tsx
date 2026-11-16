import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: assignments, error } = await supabase
    .from("user_roles").select("role_id").eq("user_id", user.id);

  if (error || !assignments?.length) redirect("/unauthorized");

  const { data: roles } = await supabase
    .from("roles").select("name").in("id", assignments.map((r) => r.role_id));

  if (!roles?.some((r) => r.name === "SUPER_ADMIN")) redirect("/unauthorized");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex h-[72px] items-center justify-between bg-[#101d40] px-6 text-white">
        <Link href="/admin" className="text-xl font-extrabold">PRAYAS PREP</Link>
        <span className="text-sm font-semibold">SUPER ADMIN PORTAL</span>
      </header>
      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="w-60 shrink-0 bg-[#172b45] p-5 text-white">
          <p className="mb-5 text-xs font-bold tracking-widest text-blue-300">PLATFORM MANAGEMENT</p>
          <nav className="space-y-2 text-sm">
            <Link className="block rounded-lg p-3 hover:bg-white/10" href="/admin">Dashboard</Link>
            <Link className="block rounded-lg p-3 hover:bg-white/10" href="/admin/question-bank">Master Question Bank</Link>
            <Link
  className="block rounded-lg p-3 hover:bg-white/10"
  href="/admin/syllabus"
>
  Syllabus Management
</Link></nav>
        </aside>
        <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
