import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function QuestionBankLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: assignments, error } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);

  if (error || !assignments?.length) redirect("/unauthorized");

  const roleIds = assignments.map((item) => item.role_id);

  const { data: roles, error: roleError } = await supabase
    .from("roles")
    .select("name")
    .in("id", roleIds);

  if (
    roleError ||
    !roles?.some((role) => role.name === "SUPER_ADMIN")
  ) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}