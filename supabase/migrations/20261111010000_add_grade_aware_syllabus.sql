
BEGIN;

-- =========================================================
-- 1. Create the master grades table
-- =========================================================

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    sequence INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. Create curriculum-to-grade mappings
-- =========================================================

CREATE TABLE IF NOT EXISTS public.curriculum_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID NOT NULL
        REFERENCES public.curricula(id) ON DELETE CASCADE,
    grade_id UUID NOT NULL
        REFERENCES public.grades(id) ON DELETE RESTRICT,
    sequence INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT curriculum_grades_curriculum_grade_key
        UNIQUE (curriculum_id, grade_id)
);

-- =========================================================
-- 3. Seed Classes 6 to 12
-- =========================================================

INSERT INTO public.grades (name, code, sequence)
VALUES
    ('Class 6', 'CLASS_6', 6),
    ('Class 7', 'CLASS_7', 7),
    ('Class 8', 'CLASS_8', 8),
    ('Class 9', 'CLASS_9', 9),
    ('Class 10', 'CLASS_10', 10),
    ('Class 11', 'CLASS_11', 11),
    ('Class 12', 'CLASS_12', 12)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    sequence = EXCLUDED.sequence,
    updated_at = NOW();

-- =========================================================
-- 4. Assign grades to existing curricula
--
-- Classes 6-12 academic level -> Classes 6-12
-- Classes 11-12 academic level -> Classes 11-12
-- Class 9 academic level -> Class 9
-- =========================================================

INSERT INTO public.curriculum_grades (
    curriculum_id,
    grade_id,
    sequence
)
SELECT
    c.id,
    g.id,
    g.sequence
FROM public.curricula c
JOIN public.academic_levels al
    ON al.id = c.academic_level_id
CROSS JOIN public.grades g
WHERE
    (
        al.code = 'CLASS_6_12'
        AND g.code IN (
            'CLASS_6',
            'CLASS_7',
            'CLASS_8',
            'CLASS_9',
            'CLASS_10',
            'CLASS_11',
            'CLASS_12'
        )
    )
    OR
    (
        al.code = 'CLASS_11_12'
        AND g.code IN ('CLASS_11', 'CLASS_12')
    )
    OR
    (
        al.code = 'CLASS_9'
        AND g.code = 'CLASS_9'
    )
ON CONFLICT (curriculum_id, grade_id) DO NOTHING;

-- =========================================================
-- 5. Add grade_id to curriculum_subjects
--
-- Nullable temporarily to preserve existing mappings.
-- Existing records will remain NULL until explicitly assigned.
-- =========================================================

ALTER TABLE public.curriculum_subjects
ADD COLUMN IF NOT EXISTS grade_id UUID;

-- =========================================================
-- 6. Replace the old curriculum-subject uniqueness rule
--
-- Legacy mappings: one subject per curriculum when grade_id IS NULL.
-- New mappings: one subject per curriculum per grade.
-- =========================================================

ALTER TABLE public.curriculum_subjects
DROP CONSTRAINT IF EXISTS
    curriculum_subjects_curriculum_id_subject_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS
    curriculum_subjects_legacy_unique_idx
ON public.curriculum_subjects (
    curriculum_id,
    subject_id
)
WHERE grade_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
    curriculum_subjects_grade_unique_idx
ON public.curriculum_subjects (
    curriculum_id,
    grade_id,
    subject_id
)
WHERE grade_id IS NOT NULL;

-- =========================================================
-- 7. Enforce that the selected grade belongs to the curriculum
-- =========================================================

ALTER TABLE public.curriculum_subjects
DROP CONSTRAINT IF EXISTS
    curriculum_subjects_curriculum_grade_fkey;

ALTER TABLE public.curriculum_subjects
ADD CONSTRAINT curriculum_subjects_curriculum_grade_fkey
FOREIGN KEY (curriculum_id, grade_id)
REFERENCES public.curriculum_grades (
    curriculum_id,
    grade_id
)
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
    idx_curriculum_subjects_grade_id
ON public.curriculum_subjects (grade_id);

-- =========================================================
-- 8. Enable RLS on the new tables
-- =========================================================

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_grades ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read grade definitions.

DROP POLICY IF EXISTS
    "Authenticated users can read grades"
ON public.grades;

CREATE POLICY "Authenticated users can read grades"
ON public.grades
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can read curriculum-grade mappings.

DROP POLICY IF EXISTS
    "Authenticated users can read curriculum grades"
ON public.curriculum_grades;

CREATE POLICY "Authenticated users can read curriculum grades"
ON public.curriculum_grades
FOR SELECT
TO authenticated
USING (true);

-- =========================================================
-- 9. Documentation
-- =========================================================

COMMENT ON TABLE public.grades IS
'Master list of individual academic grades, such as Class 6 to Class 12.';

COMMENT ON TABLE public.curriculum_grades IS
'Defines which individual grades are supported by each curriculum.';

COMMENT ON COLUMN public.curriculum_subjects.grade_id IS
'Optional grade-specific subject mapping. NULL preserves legacy curriculum-level mappings.';

COMMIT;
