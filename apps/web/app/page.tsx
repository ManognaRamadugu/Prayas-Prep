
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Laptop,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
} from "lucide-react";

const exams = [
  {
    name: "JEE Main",
    subtitle: "Engineering entrance preparation",
    subjects: "Physics · Chemistry · Mathematics",
    icon: Atom,
    color: "bg-blue-50 text-blue-700",
    tag: "Engineering",
  },
  {
    name: "NEET UG",
    subtitle: "Medical entrance preparation",
    subjects: "Physics · Chemistry · Biology",
    icon: Dna,
    color: "bg-emerald-50 text-emerald-700",
    tag: "Medical",
  },
  {
    name: "TS EAMCET",
    subtitle: "State-level entrance preparation",
    subjects: "Physics · Chemistry · Mathematics",
    icon: FlaskConical,
    color: "bg-violet-50 text-violet-700",
    tag: "State Entrance",
  },
  {
    name: "IIT Foundation",
    subtitle: "Build strong academic fundamentals",
    subjects: "Classes 6–12",
    icon: Calculator,
    color: "bg-amber-50 text-amber-700",
    tag: "Foundation",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Structured Syllabus",
    description:
      "Explore subjects, chapters and topics organized according to your selected exam.",
  },
  {
    icon: BrainCircuit,
    title: "Question Practice",
    description:
      "Strengthen your understanding with organized practice questions and explanations.",
  },
  {
    icon: Target,
    title: "Mock Tests",
    description:
      "Prepare for your entrance examination with exam-focused test practice.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Performance Tracking",
    description:
      "Understand your scores, identify improvement areas and track your progress.",
  },
  {
    icon: Trophy,
    title: "Weekly Tests",
    description:
      "Stay consistent with tests assigned through your school.",
  },
  {
    icon: Laptop,
    title: "Learn Anywhere",
    description:
      "Access your preparation journey through the Prayas Prep learning platform.",
  },
];

const steps = [
  "Create your student account",
  "Choose your exam and preparation path",
  "Learn topics and practice questions",
  "Take tests and track your progress",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#073568] text-white shadow-lg shadow-blue-950/15">
              <GraduationCap size={27} />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-[#073568]">
                PRAYAS PREP
              </p>
              <p className="text-[9px] font-semibold tracking-[0.22em] text-slate-500">
                LEARN · PRACTICE · ACHIEVE
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <Link href="#exams" className="transition hover:text-blue-700">
              Exams
            </Link>
            <Link href="#features" className="transition hover:text-blue-700">
              Features
            </Link>
            <Link href="#how-it-works" className="transition hover:text-blue-700">
              How It Works
            </Link>
            <Link href="#about" className="transition hover:text-blue-700">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-[#073568] transition hover:bg-blue-50 sm:block"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#073568] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-950/15 transition hover:bg-blue-800"
            >
              Get Started <ArrowRight className="ml-1 inline" size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#061f40] text-white">
        <div className="absolute -right-40 -top-40 -z-10 h-[550px] w-[550px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-4 py-2 text-xs font-medium text-blue-100">
              <Sparkles size={15} />
              Your journey towards success starts here
            </div>

            <h1 className="max-w-3xl text-4xl leading-[1.13] font-black tracking-tight sm:text-5xl lg:text-6xl">
              Prepare smarter.
              <span className="mt-2 block text-blue-300">
                Achieve greater.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-blue-100/80 sm:text-lg">
              One learning platform for your entrance exam journey. Learn
              concepts, practice questions, take tests and track your progress
              with Prayas Prep.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#073568] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Start Your Preparation <ArrowRight className="ml-2 inline" size={17} />
              </Link>
              <Link
                href="#features"
                className="rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Features
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 text-sm text-blue-100/80">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-300" />
                Structured learning
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-300" />
                Exam-focused practice
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-300" />
                Progress tracking
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Your learning journey</p>
                  <h2 className="mt-1 text-2xl font-bold">Starts Today!</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-300/20 text-blue-200">
                  <GraduationCap size={28} />
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-white p-5 text-slate-900 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Choose your goal</p>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Get started
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {exams.slice(0, 3).map((exam) => {
                    const Icon = exam.icon;
                    return (
                      <div
                        key={exam.name}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                      >
                        <div className={`rounded-lg p-2 ${exam.color}`}>
                          <Icon size={21} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">{exam.name}</p>
                          <p className="text-xs text-slate-500">{exam.tag}</p>
                        </div>
                        <ChevronRight size={18} className="text-slate-400" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-4">
                  <BookOpen className="mb-2 text-blue-200" size={22} />
                  <p className="text-sm font-bold">Learn</p>
                  <p className="mt-1 text-xs text-blue-100/70">
                    Understand concepts
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <Target className="mb-2 text-emerald-200" size={22} />
                  <p className="text-sm font-bold">Practice</p>
                  <p className="mt-1 text-xs text-blue-100/70">
                    Improve every day
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 top-24 hidden rounded-xl bg-white p-3 text-slate-800 shadow-xl sm:block">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <Trophy size={19} />
                </div>
                <div>
                  <p className="text-xs font-bold">Keep progressing</p>
                  <p className="text-[10px] text-slate-500">
                    One step at a time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam categories */}
      <section id="exams" className="scroll-mt-24 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
              Choose your path
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#082b50] sm:text-4xl">
              One platform. Multiple goals.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Select your examination and follow a preparation journey
              designed around your academic goals.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {exams.map((exam) => {
              const Icon = exam.icon;
              return (
                <div
                  key={exam.name}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div className={`mb-5 inline-flex rounded-xl p-3 ${exam.color}`}>
                    <Icon size={27} />
                  </div>
                  <p className="text-xs font-bold tracking-wide text-blue-700 uppercase">
                    {exam.tag}
                  </p>
                  <h3 className="mt-2 text-xl font-extrabold text-[#082b50]">
                    {exam.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {exam.subtitle}
                  </p>
                  <div className="my-5 h-px bg-slate-100" />
                  <p className="text-xs leading-5 text-slate-600">
                    {exam.subjects}
                  </p>
                  <Link
                    href="/register"
                    className="mt-6 inline-flex items-center text-sm font-bold text-blue-700 transition group-hover:gap-2"
                  >
                    Get started <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
              Everything in one place
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#082b50] sm:text-4xl">
              Tools to make your preparation count.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              A focused learning experience that helps you stay organized,
              practice consistently and understand your performance.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#082b50]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 px-5 py-20 sm:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
              Simple and focused
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#082b50] sm:text-4xl">
              Your preparation journey in four steps.
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              Start with your goal, follow your learning path and keep
              improving through regular practice and assessments.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center rounded-xl bg-[#073568] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Create Your Account <ArrowRight className="ml-2" size={17} />
            </Link>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-5 rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-black text-blue-700">
                  0{index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#082b50]">{step}</p>
                </div>
                <ChevronRight className="text-slate-400" size={20} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / trust */}
      <section id="about" className="scroll-mt-24 bg-[#082b50] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-300 uppercase">
              About Prayas Prep
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-black sm:text-4xl">
              Every great achievement begins with a sincere effort.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-blue-100/75">
              Prayas Prep is designed to bring structured academic learning,
              question practice and assessment into one connected platform.
              Our aim is to help students prepare with clarity, consistency
              and confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="mb-4 text-blue-300" size={28} />
              <p className="font-bold">Structured learning</p>
              <p className="mt-2 text-sm leading-6 text-blue-100/60">
                Organized learning paths for different exams.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Users className="mb-4 text-blue-300" size={28} />
              <p className="font-bold">Connected learning</p>
              <p className="mt-2 text-sm leading-6 text-blue-100/60">
                Student and school learning experiences.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Target className="mb-4 text-blue-300" size={28} />
              <p className="font-bold">Goal oriented</p>
              <p className="mt-2 text-sm leading-6 text-blue-100/60">
                Preparation aligned with your chosen exam.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ChartNoAxesCombined className="mb-4 text-blue-300" size={28} />
              <p className="font-bold">Progress focused</p>
              <p className="mt-2 text-sm leading-6 text-blue-100/60">
                Review performance and identify improvement areas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-blue-50 px-6 py-14 text-center sm:px-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
            <GraduationCap size={30} />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-[#082b50] sm:text-4xl">
            Ready to begin your journey?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            Take the first step towards your academic goals. Create your
            Prayas Prep account and begin your preparation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-[#073568] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Register Now <ArrowRight className="ml-2 inline" size={16} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-[#073568] transition hover:bg-slate-50"
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#061f40] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <GraduationCap size={25} />
              </div>
              <span className="text-xl font-black tracking-wide">
                PRAYAS PREP
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/65">
              A focused learning platform for students preparing for
              competitive examinations and building strong academic
              foundations.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-4 space-y-3 text-sm text-blue-100/65">
              <Link href="#exams" className="block hover:text-white">Examinations</Link>
              <Link href="#features" className="block hover:text-white">Features</Link>
              <Link href="#how-it-works" className="block hover:text-white">How It Works</Link>
              <Link href="#about" className="block hover:text-white">About Us</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Your Account</h3>
            <div className="mt-4 space-y-3 text-sm text-blue-100/65">
              <Link href="/login" className="block hover:text-white">Login</Link>
              <Link href="/register" className="block hover:text-white">Student Registration</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-blue-100/50">
          © {new Date().getFullYear()} Prayas Prep. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
