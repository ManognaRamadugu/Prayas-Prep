-- ============================================================
-- PRAYAS PREP
-- Seed Exams and Subjects
-- ============================================================

-- ============================================================
-- 1. EXAMS
-- ============================================================

insert into public.exams (
  code,
  name,
  is_active
)
values
  ('JEE', 'JEE Main', true),
  ('NEET', 'NEET UG', true),
  ('EAMCET', 'TS EAMCET', true),
  ('FOUNDATION', 'IIT Foundation', true);


-- ============================================================
-- 2. SUBJECTS
-- ============================================================

insert into public.subjects (
  exam_id,
  name,
  code,
  display_order
)
select
  e.id,
  s.name,
  s.code,
  s.display_order
from public.exams e
join (
  values
    ('JEE', 'Physics', 'PHYSICS', 1),
    ('JEE', 'Chemistry', 'CHEMISTRY', 2),
    ('JEE', 'Mathematics', 'MATHEMATICS', 3),

    ('NEET', 'Physics', 'PHYSICS', 1),
    ('NEET', 'Chemistry', 'CHEMISTRY', 2),
    ('NEET', 'Biology', 'BIOLOGY', 3),

    ('EAMCET', 'Physics', 'PHYSICS', 1),
    ('EAMCET', 'Chemistry', 'CHEMISTRY', 2),
    ('EAMCET', 'Mathematics', 'MATHEMATICS', 3),

    ('FOUNDATION', 'Physics', 'PHYSICS', 1),
    ('FOUNDATION', 'Chemistry', 'CHEMISTRY', 2),
    ('FOUNDATION', 'Mathematics', 'MATHEMATICS', 3)
) as s(exam_code, name, code, display_order)
  on e.code = s.exam_code;