
CREATE OR REPLACE FUNCTION public.issue_student_activation_codes(
  p_school_id uuid,
  p_created_by uuid,
  p_expires_at timestamp with time zone,
  p_codes jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  item jsonb;
  student_id_value uuid;
BEGIN
  IF p_school_id IS NULL OR p_created_by IS NULL THEN
    RAISE EXCEPTION 'School and issuing user are required.';
  END IF;

  IF p_expires_at IS NULL OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'Activation code expiry must be in the future.';
  END IF;

  IF p_codes IS NULL
     OR jsonb_typeof(p_codes) <> 'array'
     OR jsonb_array_length(p_codes) = 0 THEN
    RAISE EXCEPTION 'At least one activation code is required.';
  END IF;

  -- SUPER_ADMIN can issue for any school.
  -- SCHOOL_ADMIN can issue only for their assigned school.
  IF NOT (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = p_created_by
        AND r.name = 'SUPER_ADMIN'
    )
    OR EXISTS (
      SELECT 1
      FROM public.school_memberships sm
      WHERE sm.school_id = p_school_id
        AND sm.user_id = p_created_by
        AND sm.membership_role = 'SCHOOL_ADMIN'
        AND sm.status = 'ACTIVE'
    )
  ) THEN
    RAISE EXCEPTION 'The issuing user is not authorized for this school.';
  END IF;

  FOR item IN
    SELECT value FROM jsonb_array_elements(p_codes)
  LOOP
    IF coalesce(item ->> 'student_id', '') = ''
       OR coalesce(item ->> 'code_hash', '') = '' THEN
      RAISE EXCEPTION 'Student IDs and activation code hashes are required.';
    END IF;

    student_id_value := (item ->> 'student_id')::uuid;

    IF NOT EXISTS (
      SELECT 1
      FROM public.school_students ss
      WHERE ss.id = student_id_value
        AND ss.school_id = p_school_id
        AND ss.status = 'ACTIVE'
        AND ss.linked_user_id IS NULL
    ) THEN
      RAISE EXCEPTION 'An activation code references an inactive, linked, or foreign student.';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.student_activation_codes ac
      WHERE ac.student_id = student_id_value
        AND ac.school_id = p_school_id
        AND ac.used_at IS NULL
        AND ac.revoked_at IS NULL
        AND ac.expires_at > now()
    ) THEN
      RAISE EXCEPTION 'A student already has a valid activation code.';
    END IF;
  END LOOP;

  IF (
    SELECT count(DISTINCT value ->> 'student_id')
    FROM jsonb_array_elements(p_codes)
  ) <> jsonb_array_length(p_codes) THEN
    RAISE EXCEPTION 'Duplicate student IDs were supplied.';
  END IF;

  INSERT INTO public.student_activation_codes (
    school_id,
    student_id,
    code_hash,
    created_by,
    expires_at
  )
  SELECT
    p_school_id,
    (value ->> 'student_id')::uuid,
    value ->> 'code_hash',
    p_created_by,
    p_expires_at
  FROM jsonb_array_elements(p_codes) AS codes(value);
END;
$function$;
