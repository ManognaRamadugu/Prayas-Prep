import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "Total Students",
    value: "1,240",
    change: "+12.8%",
    icon: Users,
    tone: "blue",
  },
  {
    label: "Classes",
    value: "56",
    change: "+4 this term",
    icon: GraduationCap,
    tone: "green",
  },
  {
    label: "Tests Conducted",
    value: "28",
    change: "+6 this month",
    icon: FileText,
    tone: "orange",
  },
  {
    label: "Avg. Completion",
    value: "78%",
    change: "+5.2%",
    icon: Activity,
    tone: "purple",
  },
] as const;

const tests = [
  {
    name: "JEE Mock Test 5",
    detail: "Class 11–12 · Physics, Chemistry, Mathematics",
    date: "Today · 10:00 AM",
    status: "Ongoing",
    color: "blue",
  },
  {
    name: "Physics Unit Test",
    detail: "Class 11 · Physics",
    date: "Tomorrow · 09:30 AM",
    status: "Scheduled",
    color: "purple",
  },
  {
    name: "Chemistry Quiz",
    detail: "Class 12 · Chemistry",
    date: "20 Oct · 02:00 PM",
    status: "Scheduled",
    color: "orange",
  },
];

const activity = [
  { text: "New student added", time: "12 min ago", color: "blue" },
  { text: "Test published", time: "35 min ago", color: "green" },
  { text: "Class 12A created", time: "1 hour ago", color: "purple" },
  { text: "Results released", time: "2 hours ago", color: "orange" },
];

const bars = [
  { month: "May", value: 38 },
  { month: "Jun", value: 54 },
  { month: "Jul", value: 45 },
  { month: "Aug", value: 68 },
  { month: "Sep", value: 57 },
  { month: "Oct", value: 82 },
];

const toneStyles = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  purple: "bg-violet-50 text-violet-700",
};

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm text-slate-500">
            School Admin / Dashboard
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Good morning, Admin! 👋
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Here&apos;s what&apos;s happening at your school today.
          </p>
        </div>

        <button
          type="button"
          className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
          <CalendarDays size={17} />
          This month
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneStyles[stat.tone]}`}
                >
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-700">
                <ArrowUpRight size={15} />
                {stat.change}

                <span className="font-normal text-slate-400">
                  {" "}compared with last month
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Upcoming &amp; Ongoing Tests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep track of scheduled assessments
              </p>
            </div>

            <a
              href="/admin/tests"
              className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View all <ArrowRight size={15} />
            </a>
          </div>

          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.name}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[test.color as keyof typeof toneStyles]}`}
                  >
                    <BookOpen size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {test.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {test.detail}
                    </p>

                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <Clock3 size={13} />
                      {test.date}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    test.status === "Ongoing"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {test.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-bold text-slate-900">Test Participation</h2>

            <p className="mt-1 text-sm text-slate-500">
              Monthly participation overview
            </p>
          </div>

          <div className="flex h-[220px] items-end justify-around gap-3 border-b border-l border-slate-200 px-3 pb-0 pt-5">
            {bars.map((bar) => (
              <div
                key={bar.month}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[10px] text-slate-500">
                  {bar.value}%
                </span>

                <div className="flex h-[160px] w-full items-end justify-center">
                  <div
                    className={`w-full max-w-10 rounded-t-md ${
                      bar.month === "Oct" ? "bg-blue-700" : "bg-blue-300"
                    }`}
                    style={{ height: `${bar.value}%` }}
                    title={`${bar.month}: ${bar.value}%`}
                  />
                </div>

                <span className="pb-2 text-xs text-slate-500">
                  {bar.month}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Current participation
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-800">78%</p>
            </div>

            <div className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
              <ArrowUpRight size={17} /> 8.4%
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Recent Activity</h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest school updates
              </p>
            </div>

            <Activity size={20} className="text-slate-400" />
          </div>

          <div className="space-y-5">
            {activity.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.color === "blue"
                      ? "bg-blue-500"
                      : item.color === "green"
                        ? "bg-emerald-500"
                        : item.color === "purple"
                          ? "bg-violet-500"
                          : "bg-orange-500"
                  }`}
                />

                <p className="flex-1 text-sm font-medium text-slate-700">
                  {item.text}
                </p>

                <span className="text-xs text-slate-400">{item.time}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">Quick Overview</h2>

          <p className="mt-1 text-sm text-slate-500">
            Important tasks at a glance
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Clock3 size={20} />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Tests awaiting completion
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Check ongoing test submissions
                </p>
              </div>

              <span className="text-lg font-bold text-amber-700">3</span>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Results ready
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Assessments ready for review
                </p>
              </div>

              <span className="text-lg font-bold text-emerald-700">8</span>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <ArrowDownRight size={20} />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Students needing support
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Review students with declining scores
                </p>
              </div>

              <span className="text-lg font-bold text-rose-700">12</span>
            </div>
          </div>
        </article>
      </section>

      <p className="pb-2 text-center text-xs text-slate-400">
        Prayas Prep · School Administration Portal
      </p>
    </div>
  );
}