BEGIN;

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.school_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_role text NOT NULL
    CHECK (membership_role IN ('SCHOOL_ADMIN', 'TEACHER')),
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id)
);

CREATE INDEX school_memberships_user_status_idx
  ON public.school_memberships (user_id, status);

CREATE TABLE public.school_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  linked_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL CHECK (length(btrim(full_name)) > 0),
  roll_number text NOT NULL CHECK (length(btrim(roll_number)) > 0),
  username text NOT NULL,
  email text NOT NULL CHECK (length(btrim(email)) > 0),
  class_name text NOT NULL CHECK (length(btrim(class_name)) > 0),
  section text NOT NULL CHECK (length(btrim(section)) > 0),
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, username)
);

CREATE UNIQUE INDEX school_students_roll_number_ci_idx
  ON public.school_students (school_id, lower(roll_number));

CREATE INDEX school_students_school_class_idx
  ON public.school_students (school_id, class_name, section);

CREATE OR REPLACE FUNCTION public.set_school_student_username()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.username IS NULL OR btrim(NEW.username) = '' THEN
    NEW.username := lower(regexp_replace(btrim(NEW.roll_number), '[^a-zA-Z0-9._-]', '', 'g'));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER school_student_username_before_write
  BEFORE INSERT OR UPDATE OF roll_number, username
  ON public.school_students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_school_student_username();

CREATE TABLE public.student_activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX student_activation_codes_student_idx
  ON public.student_activation_codes (student_id, expires_at DESC)
  WHERE redeemed_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage schools"
  ON public.schools FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "School members view their school"
  ON public.schools FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.school_memberships sm
      WHERE sm.school_id = schools.id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Users view own school memberships"
  ON public.school_memberships FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_platform_admin());

CREATE POLICY "Platform admins manage school memberships"
  ON public.school_memberships FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "School admins view students"
  ON public.school_students FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.school_memberships sm
      WHERE sm.school_id = school_students.school_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.membership_role = 'SCHOOL_ADMIN'
        AND sm.status = 'ACTIVE'
    )
  );

CREATE POLICY "School admins add students"
  ON public.school_students FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.school_memberships sm
      WHERE sm.school_id = school_students.school_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.membership_role = 'SCHOOL_ADMIN'
        AND sm.status = 'ACTIVE'
    )
  );

CREATE POLICY "School admins update students"
  ON public.school_students FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.school_memberships sm
      WHERE sm.school_id = school_students.school_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.membership_role = 'SCHOOL_ADMIN'
        AND sm.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.school_memberships sm
      WHERE sm.school_id = school_students.school_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.membership_role = 'SCHOOL_ADMIN'
        AND sm.status = 'ACTIVE'
    )
  );

CREATE POLICY "School admins remove students"
  ON public.school_students FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.school_memberships sm
      WHERE sm.school_id = school_students.school_id
        AND sm.user_id = (SELECT auth.uid())
        AND sm.membership_role = 'SCHOOL_ADMIN'
        AND sm.status = 'ACTIVE'
    )
  );

GRANT SELECT ON public.schools, public.school_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_students TO authenticated;
GRANT ALL ON public.schools, public.school_memberships,
  public.school_students, public.student_activation_codes TO service_role;

CREATE OR REPLACE FUNCTION public.issue_student_activation_codes(
  p_school_id uuid,
  p_created_by uuid,
  p_expires_at timestamptz,
  p_codes jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  item jsonb;
BEGIN
  IF p_expires_at <= now() THEN
    RAISE EXCEPTION 'Activation code expiry must be in the future.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.school_memberships sm
    WHERE sm.school_id = p_school_id
      AND sm.user_id = p_created_by
      AND sm.membership_role = 'SCHOOL_ADMIN'
      AND sm.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'The issuing user is not an active school administrator.';
  END IF;

  IF jsonb_typeof(p_codes) <> 'array' OR jsonb_array_length(p_codes) = 0 THEN
    RAISE EXCEPTION 'At least one activation code is required.';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_codes)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.school_students ss
      WHERE ss.id = (item ->> 'student_id')::uuid
        AND ss.school_id = p_school_id
        AND ss.status = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'An activation code references an inactive or foreign student.';
    END IF;

    IF coalesce(item ->> 'code_hash', '') = '' THEN
      RAISE EXCEPTION 'Activation code hashes cannot be empty.';
    END IF;
  END LOOP;

  UPDATE public.student_activation_codes
  SET revoked_at = now()
  WHERE school_id = p_school_id
    AND redeemed_at IS NULL
    AND revoked_at IS NULL;

  INSERT INTO public.student_activation_codes (
    school_id, student_id, code_hash, created_by, expires_at
  )
  SELECT p_school_id, (value ->> 'student_id')::uuid,
    value ->> 'code_hash', p_created_by, p_expires_at
  FROM jsonb_array_elements(p_codes) AS codes(value);
END;
$function$;

REVOKE ALL ON FUNCTION public.issue_student_activation_codes(uuid, uuid, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_student_activation_codes(uuid, uuid, timestamptz, jsonb) TO service_role;

COMMIT;
