-- ============================================================
-- PRAYAS PREP
-- Practice Content Foundation
-- Extending Existing Questions Schema
-- ============================================================


-- ============================================================
-- 1. CONNECT SUBJECTS TO EXAMS
-- ============================================================

alter table public.subjects
add column exam_id uuid
references public.exams(id)
on delete cascade;

create index subjects_exam_id_idx
on public.subjects(exam_id);


-- ============================================================
-- 2. QUESTION ↔ TOPIC
-- Many-to-many relationship
-- ============================================================

create table public.question_topics (
  question_id uuid not null
    references public.questions(id)
    on delete cascade,

  topic_id uuid not null
    references public.topics(id)
    on delete cascade,

  primary key (question_id, topic_id)
);

create index question_topics_topic_id_idx
on public.question_topics(topic_id);


-- ============================================================
-- 3. ONE-WORD ANSWERS
-- ============================================================

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),

  question_id uuid not null
    references public.questions(id)
    on delete cascade,

  answer_text text not null,

  created_at timestamptz not null default now(),

  constraint question_answers_unique
    unique (question_id, answer_text)
);

create index question_answers_question_id_idx
on public.question_answers(question_id);


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.question_topics enable row level security;

alter table public.question_answers enable row level security;


-- ============================================================
-- 5. READ POLICIES
-- ============================================================

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


-- ============================================================
-- 6. POSTGRESQL PRIVILEGES
-- ============================================================

grant select
on public.question_topics
to authenticated;

grant select
on public.question_answers
to authenticated;

grant select
on public.subjects
to authenticated;