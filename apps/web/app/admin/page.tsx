import Link from "next/link";

const items = [
  { title: "Master Question Bank", description: "Create and manage platform-wide questions.", href: "/admin/question-bank" },
  { title: "Syllabus Management", description: "Manage exams, curricula, subjects, chapters and topics." },
  { title: "Platform Management", description: "Manage schools and platform access." },
];

export default function SuperAdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-700">Platform Administration</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="mt-2 text-slate-500">Manage Prayas Prep platform content and operations.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <section key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            {item.href && <Link href={item.href} className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline">Open →</Link>}
          </section>
        ))}
      </div>
    </div>
  );
}
