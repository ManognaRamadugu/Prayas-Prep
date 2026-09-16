-- ============================================================
-- PRAYAS PREP
-- Initial Database Schema
-- Part 1: Foundation + Curriculum
-- ============================================================

-- UUID generation
create extension if not exists "pgcrypto";


-- ============================================================
-- ENUM TYPES
-- ============================================================

create type public.question_type as enum (
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'NUMERICAL',
  'TRUE_FALSE'
);

create type public.question_difficulty as enum (
  'EASY',
  'MEDIUM',
  'HARD'
);

create type public.question_source as enum (
  'VERIFIED',
  'TEACHER_CREATED',
  'AI_GENERATED',
  'IMPORTED',
  'PREVIOUS_YEAR'
);

create type public.test_type as enum (
  'PRACTICE',
  'CHAPTER_TEST',
  'SUBJECT_TEST',
  'MOCK_TEST',
  'ADAPTIVE_TEST'
);

create type public.attempt_status as enum (
  'IN_PROGRESS',
  'SUBMITTED',
  'ABANDONED'
);


-- ============================================================
-- 1. EXAMS
-- ============================================================

create table public.exams (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 2. ACADEMIC LEVELS
-- ============================================================

create table public.academic_levels (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,
  level_type text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 3. CURRICULA
-- ============================================================

create table public.curricula (
  id uuid primary key default gen_random_uuid(),

  exam_id uuid not null references public.exams(id)
    on delete restrict,

  academic_level_id uuid not null references public.academic_levels(id)
    on delete restrict,

  name text not null,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (exam_id, academic_level_id)
);


-- ============================================================
-- 4. SUBJECTS
-- ============================================================

create table public.subjects (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 5. CURRICULUM SUBJECTS
-- ============================================================

create table public.curriculum_subjects (
  id uuid primary key default gen_random_uuid(),

  curriculum_id uuid not null references public.curricula(id)
    on delete cascade,

  subject_id uuid not null references public.subjects(id)
    on delete restrict,

  sequence integer not null default 1,

  created_at timestamptz not null default now(),

  unique (curriculum_id, subject_id)
);


-- ============================================================
-- 6. CHAPTERS
-- ============================================================

create table public.chapters (
  id uuid primary key default gen_random_uuid(),

  curriculum_subject_id uuid not null
    references public.curriculum_subjects(id)
    on delete cascade,

  name text not null,
  description text,

  sequence integer not null default 1,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (curriculum_subject_id, name)
);


-- ============================================================
-- 7. TOPICS
-- ============================================================

create table public.topics (
  id uuid primary key default gen_random_uuid(),

  chapter_id uuid not null
    references public.chapters(id)
    on delete cascade,

  name text not null,
  description text,

  sequence integer not null default 1,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (chapter_id, name)
);


-- ============================================================
-- 8. CONCEPTS
-- ============================================================

create table public.concepts (
  id uuid primary key default gen_random_uuid(),

  topic_id uuid not null
    references public.topics(id)
    on delete cascade,

  name text not null,
  description text,

  sequence integer not null default 1,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (topic_id, name)
);
-- ============================================================
-- PART 2A: USERS
-- ============================================================

-- ============================================================
-- 9. PROFILES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id)
    on delete cascade,

  full_name text,
  avatar_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 10. ROLES
-- ============================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,
  description text,

  created_at timestamptz not null default now()
);


-- ============================================================
-- 11. USER ROLES
-- ============================================================

create table public.user_roles (
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  role_id uuid not null
    references public.roles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  primary key (user_id, role_id)
);


-- ============================================================
-- 12. STUDENT PROFILES
-- ============================================================

create table public.student_profiles (
  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  date_of_birth date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 13. STUDENT CURRICULA
-- ============================================================

create table public.student_curricula (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.student_profiles(user_id)
    on delete cascade,

  curriculum_id uuid not null
    references public.curricula(id)
    on delete restrict,

  is_primary boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (student_id, curriculum_id)
);
-- ============================================================
-- PART 2B: QUESTION BANK
-- ============================================================

-- ============================================================
-- 14. QUESTIONS
-- ============================================================

create table public.questions (
  id uuid primary key default gen_random_uuid(),

  question_text text not null,

  question_type public.question_type not null,

  difficulty public.question_difficulty not null,

  explanation text,

  marks numeric(6,2) not null default 1.00,
  negative_marks numeric(6,2) not null default 0.00,

  source_type public.question_source not null,

  is_active boolean not null default true,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================================
-- 15. QUESTION OPTIONS
-- ============================================================

create table public.question_options (
  id uuid primary key default gen_random_uuid(),

  question_id uuid not null
    references public.questions(id)
    on delete cascade,

  option_text text not null,

  option_order integer not null,

  is_correct boolean not null default false,

  created_at timestamptz not null default now(),

  unique (question_id, option_order)
);


-- ============================================================
-- 16. QUESTION CONCEPTS
-- ============================================================

create table public.question_concepts (
  question_id uuid not null
    references public.questions(id)
    on delete cascade,

  concept_id uuid not null
    references public.concepts(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  primary key (question_id, concept_id)
);
-- ============================================================
-- PART 3: TESTS & ASSESSMENTS
-- ============================================================


-- ============================================================
-- 17. TESTS
-- ============================================================

create table public.tests (
  id uuid primary key default gen_random_uuid(),

  curriculum_id uuid not null
    references public.curricula(id)
    on delete restrict,

  name text not null,

  description text,

  test_type public.test_type not null,

  duration_minutes integer not null
    check (duration_minutes > 0),

  total_questions integer not null
    check (total_questions > 0),

  total_marks numeric(8,2) not null
    check (total_marks >= 0),

  positive_marks numeric(6,2) not null default 1.00
    check (positive_marks >= 0),

  negative_marks numeric(6,2) not null default 0.00
    check (negative_marks >= 0),

  max_attempts integer
    check (max_attempts is null or max_attempts > 0),

  is_active boolean not null default true,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, curriculum_id)
);

-- ============================================================
-- 18. TEST SECTIONS
-- ============================================================

create table public.test_sections (
  id uuid primary key default gen_random_uuid(),

  test_id uuid not null,

  curriculum_subject_id uuid not null,

  name text not null,

  question_count integer not null
    check (question_count > 0),

  sequence integer not null
    check (sequence > 0),

  created_at timestamptz not null default now(),

  unique (test_id, sequence),

  foreign key (test_id)
    references public.tests(id)
    on delete cascade,

  foreign key (test_id, curriculum_subject_id)
    references public.tests(id, curriculum_id)
    on delete restrict
);
-- ============================================================
-- 19. ATTEMPTS
-- ============================================================

create table public.attempts (
  id uuid primary key default gen_random_uuid(),

  test_id uuid not null
    references public.tests(id)
    on delete restrict,

  student_id uuid not null
    references public.student_profiles(user_id)
    on delete cascade,

  started_at timestamptz not null default now(),

  submitted_at timestamptz,

  status public.attempt_status not null default 'IN_PROGRESS',

  score numeric(8,2),

  created_at timestamptz not null default now(),

  check (
    submitted_at is null
    or submitted_at >= started_at
  )
);


-- ============================================================
-- 20. ATTEMPT QUESTIONS
-- ============================================================

create table public.attempt_questions (
  id uuid primary key default gen_random_uuid(),

  attempt_id uuid not null
    references public.attempts(id)
    on delete cascade,

  question_id uuid not null
    references public.questions(id)
    on delete restrict,

  question_order integer not null
    check (question_order > 0),

  created_at timestamptz not null default now(),

  unique (attempt_id, question_order),

  unique (attempt_id, question_id)
);


-- ============================================================
-- 21. STUDENT ANSWERS
-- ============================================================

create table public.student_answers (
  id uuid primary key default gen_random_uuid(),

  attempt_question_id uuid not null
    references public.attempt_questions(id)
    on delete cascade,

  selected_option_id uuid
    references public.question_options(id)
    on delete set null,

  answer_text text,

  is_correct boolean,

  time_taken_seconds integer
    check (
      time_taken_seconds is null
      or time_taken_seconds >= 0
    ),

  marks_awarded numeric(8,2),

  answered_at timestamptz not null default now(),

  unique (attempt_question_id)
);


-- ============================================================
-- 22. RESULTS
-- ============================================================

create table public.results (
  id uuid primary key default gen_random_uuid(),

  attempt_id uuid not null unique
    references public.attempts(id)
    on delete cascade,

  total_questions integer not null default 0
    check (total_questions >= 0),

  attempted_questions integer not null default 0
    check (attempted_questions >= 0),

  correct_answers integer not null default 0
    check (correct_answers >= 0),

  incorrect_answers integer not null default 0
    check (incorrect_answers >= 0),

  skipped_questions integer not null default 0
    check (skipped_questions >= 0),

  total_score numeric(8,2) not null default 0,

  percentage numeric(5,2)
    check (
      percentage is null
      or (percentage >= 0 and percentage <= 100)
    ),

  created_at timestamptz not null default now()
);
-- ============================================================
-- PART 4: PERFORMANCE & RECOMMENDATIONS
-- ============================================================


-- ============================================================
-- 23. PERFORMANCE METRICS
-- ============================================================

create table public.performance_metrics (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.student_profiles(user_id)
    on delete cascade,

  curriculum_id uuid not null
    references public.curricula(id)
    on delete restrict,

  subject_id uuid
    references public.subjects(id)
    on delete restrict,

  chapter_id uuid
    references public.chapters(id)
    on delete restrict,

  topic_id uuid
    references public.topics(id)
    on delete restrict,

  concept_id uuid
    references public.concepts(id)
    on delete restrict,

  attempts_count integer not null default 0
    check (attempts_count >= 0),

  questions_attempted integer not null default 0
    check (questions_attempted >= 0),

  correct_answers integer not null default 0
    check (correct_answers >= 0),

  accuracy numeric(5,2)
    check (
      accuracy is null
      or (accuracy >= 0 and accuracy <= 100)
    ),

  average_time_seconds numeric(10,2)
    check (
      average_time_seconds is null
      or average_time_seconds >= 0
    ),

  last_attempted_at timestamptz,

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 24. RECOMMENDATIONS
-- ============================================================

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.student_profiles(user_id)
    on delete cascade,

  concept_id uuid not null
    references public.concepts(id)
    on delete restrict,

  recommendation_type text not null,

  priority integer not null default 1
    check (priority > 0),

  reason text,

  is_completed boolean not null default false,

  created_at timestamptz not null default now(),

  completed_at timestamptz
);
-- ============================================================
-- PART 5: PERFORMANCE INDEXES
-- ============================================================

create index idx_curricula_exam_id
  on public.curricula(exam_id);

create index idx_curricula_academic_level_id
  on public.curricula(academic_level_id);

create index idx_curriculum_subjects_curriculum_id
  on public.curriculum_subjects(curriculum_id);

create index idx_curriculum_subjects_subject_id
  on public.curriculum_subjects(subject_id);

create index idx_chapters_curriculum_subject_id
  on public.chapters(curriculum_subject_id);

create index idx_topics_chapter_id
  on public.topics(chapter_id);

create index idx_concepts_topic_id
  on public.concepts(topic_id);

create index idx_student_curricula_student_id
  on public.student_curricula(student_id);

create index idx_student_curricula_curriculum_id
  on public.student_curricula(curriculum_id);

create index idx_question_concepts_question_id
  on public.question_concepts(question_id);

create index idx_question_concepts_concept_id
  on public.question_concepts(concept_id);

create index idx_questions_created_by
  on public.questions(created_by);

create index idx_question_options_question_id
  on public.question_options(question_id);

create index idx_tests_curriculum_id
  on public.tests(curriculum_id);

create index idx_tests_created_by
  on public.tests(created_by);

create index idx_test_sections_test_id
  on public.test_sections(test_id);

create index idx_test_sections_curriculum_subject_id
  on public.test_sections(curriculum_subject_id);

create index idx_attempts_student_id
  on public.attempts(student_id);

create index idx_attempts_test_id
  on public.attempts(test_id);

create index idx_attempt_questions_attempt_id
  on public.attempt_questions(attempt_id);

create index idx_attempt_questions_question_id
  on public.attempt_questions(question_id);

create index idx_student_answers_attempt_question_id
  on public.student_answers(attempt_question_id);

create index idx_performance_student_curriculum
  on public.performance_metrics(student_id, curriculum_id);

create index idx_performance_concept_id
  on public.performance_metrics(concept_id);

create index idx_recommendations_student_id
  on public.recommendations(student_id);

create index idx_recommendations_concept_id
  on public.recommendations(concept_id);