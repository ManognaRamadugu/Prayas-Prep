
-- ============================================================
-- PRAYAS PREP
-- Practice Content - Missing Tables
-- ============================================================

-- 1. QUESTION ↔ TOPIC
-- Many-to-many relationship

create table public.question_topics (
  question_id uuid not null
    references public.questions(id)
    on delete cascade,

  topic_id uuid not null
    references public.topics(id)
    on delete cascade,

  primary key (question_id, topic_id)
);


-- 2. ONE-WORD ANSWERS

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),

  question_id uuid not null
    references public.questions(id)
    on delete cascade,

  answer_text text not null,

  created_at timestamptz not null default now(),

  constraint question_answers_question_unique
    unique (question_id, answer_text)
);


-- 3. EXAM RULES

create table public.exam_rules (
  id uuid primary key default gen_random_uuid(),

  exam_id uuid not null
    references public.exams(id)
    on delete cascade,

  question_type text not null,

  marks numeric(5,2) not null,

  negative_marks numeric(5,2) not null default 0,

  created_at timestamptz not null default now(),

  constraint exam_rules_type_check
    check (question_type in ('MCQ', 'ONE_WORD')),

  constraint exam_rules_marks_check
    check (marks >= 0),

  constraint exam_rules_negative_marks_check
    check (negative_marks >= 0),

  constraint exam_rules_exam_type_unique
    unique (exam_id, question_type)
);


-- 4. INDEXES

create index question_topics_topic_id_idx
  on public.question_topics(topic_id);

create index question_answers_question_id_idx
  on public.question_answers(question_id);

create index exam_rules_exam_id_idx
  on public.exam_rules(exam_id);


-- 5. ROW LEVEL SECURITY

alter table public.question_topics enable row level security;
alter table public.question_answers enable row level security;
alter table public.exam_rules enable row level security;


-- 6. READ POLICIES

create policy "Authenticated users can view question topics"
on public.question_topics
for select
to authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_topics.question_id
      and q.is_active = true
  )
);

create policy "Authenticated users can view question answers"
on public.question_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_answers.question_id
      and q.is_active = true
  )
);

create policy "Authenticated users can view exam rules"
on public.exam_rules
for select
to authenticated
using (
  exists (
    select 1
    from public.exams e
    where e.id = exam_rules.exam_id
      and e.is_active = true
  )
);


-- 7. POSTGRESQL PRIVILEGES

grant select on public.question_topics to authenticated;
grant select on public.question_answers to authenticated;
grant select on public.exam_rules to authenticated;
