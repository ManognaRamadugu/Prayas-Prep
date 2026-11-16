
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_student_role_id uuid;
    v_student_id text;
BEGIN
    -- Every authenticated account receives a general profile.
    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );

    -- Only trusted student activation creates a student profile
    -- and assigns the STUDENT role.
    IF NEW.raw_app_meta_data ->> 'provisioning_source'
       = 'student_activation' THEN

        v_student_id := NEW.raw_app_meta_data ->> 'student_id';

        -- Verify that the student record exists, is active,
        -- and has not already been linked.
        IF v_student_id IS NULL OR NOT EXISTS (
            SELECT 1
            FROM public.school_students AS s
            WHERE s.id::text = v_student_id
              AND s.status = 'ACTIVE'
              AND s.linked_user_id IS NULL
        ) THEN
            RAISE EXCEPTION
                'Invalid or unavailable student provisioning record.';
        END IF;

        SELECT id
        INTO v_student_role_id
        FROM public.roles
        WHERE name = 'STUDENT';

        IF v_student_role_id IS NULL THEN
            RAISE EXCEPTION 'STUDENT role does not exist.';
        END IF;

        INSERT INTO public.student_profiles (user_id)
        VALUES (NEW.id);

        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, v_student_role_id);
    END IF;

    RETURN NEW;
END;
$$;
