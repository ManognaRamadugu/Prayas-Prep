import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  School,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "SCHOOL MANAGEMENT",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Teachers", href: "/admin/teachers", icon: UserRound },
      { label: "Classes & Sections", href: "/admin/classes", icon: School },
    ],
  },
  {
    title: "LEARNING",
    items: [
      { label: "Tests", href: "/admin/tests", icon: ClipboardList },
      {
        label: "Question Bank",
        href: "/admin/question-bank",
        icon: FileQuestion,
      },
      { label: "Practice", href: "/admin/practice", icon: BookOpen },
    ],
  },
  {
    title: "PERFORMANCE",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      {
        label: "Subscription",
        href: "/admin/subscription",
        icon: CreditCard,
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#073568] px-5 text-white shadow-md md:px-8">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <GraduationCap size={29} />
          </div>

          <div>
            <p className="text-xl font-extrabold tracking-wide sm:text-2xl">
              PRAYAS PREP
            </p>
            <p className="hidden text-[10px] tracking-[0.2em] text-blue-200 sm:block">
              SCHOOL ADMIN PORTAL
            </p>
          </div>
        </Link>

        <div className="hidden text-center lg:block">
          <p className="text-lg font-semibold">School Administration</p>
          <p className="text-xs text-blue-200">
            Manage students, classes, tests and performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 hover:bg-white/10"
          >
            <Bell size={20} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-400" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-400 font-bold">
              A
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold">School Admin</p>
              <p className="text-xs text-blue-200">Administrator</p>
            </div>

            <ChevronDown size={16} className="hidden sm:block" />
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[245px] shrink-0 overflow-y-auto bg-[#082b50] px-3 py-5 text-slate-300 md:block">
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                <Building2 size={22} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  My School
                </p>
                <p className="text-xs text-slate-400">School workspace</p>
              </div>
            </div>
          </div>

          {navigation.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-slate-500">
                {group.title}
              </p>

              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/admin";

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-blue-600 font-semibold text-white shadow-md"
                          : "hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="mt-8 rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-blue-300">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold">School workspace</span>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              School data will be protected by role-based permissions and
              database security.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}