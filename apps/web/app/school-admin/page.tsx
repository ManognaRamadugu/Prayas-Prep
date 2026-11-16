
import Link from "next/link";
import { Users, Upload, BookOpen, ArrowRight } from "lucide-react";

const dashboardItems = [
  {
    title: "Student Management",
    description:
      "Add students, upload student records, search, filter and manage your school's student roster.",
    href: "/school-admin/students",
    button: "Manage Students",
    icon: Users,
  },
  {
    title: "Bulk Student Upload",
    description:
      "Import multiple student records using the existing student upload functionality.",
    href: "/school-admin/students",
    button: "Upload Students",
    icon: Upload,
  },
];

export default function SchoolAdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-blue-700">
          School Workspace
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          School Admin Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your school's students and academic resources.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {dashboardItems.map((item) => {
          const Icon = item.icon;

          return (
            <section
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={24} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                {item.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>

              <Link
                href={item.href}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#073568] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900"
              >
                {item.button}
                <ArrowRight size={16} />
              </Link>
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-blue-700" size={22} />
          <h2 className="font-bold text-slate-900">
            School Administration
          </h2>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          You can manage student records belonging to your assigned school.
          Your access is restricted by your School Admin membership.
        </p>
      </section>
    </div>
  );
}
