
BEGIN;

-- 1. Ensure the final Super Admin role exists.
INSERT INTO public.roles (name, description)
VALUES ('SUPER_ADMIN', 'Full Prayas Prep platform administrator')
ON CONFLICT (name) DO NOTHING;


-- 2. Transfer all legacy ADMIN assignments to SUPER_ADMIN.
DO $$
DECLARE
    old_admin_role_id UUID;
    super_admin_role_id UUID;
BEGIN
    SELECT id
    INTO old_admin_role_id
    FROM public.roles
    WHERE name = 'ADMIN';

    SELECT id
    INTO super_admin_role_id
    FROM public.roles
    WHERE name = 'SUPER_ADMIN';

    IF super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'SUPER_ADMIN role was not found.';
    END IF;

    IF old_admin_role_id IS NOT NULL THEN

        -- Preserve every existing ADMIN user's account.
        INSERT INTO public.user_roles (user_id, role_id)
        SELECT user_id, super_admin_role_id
        FROM public.user_roles
        WHERE role_id = old_admin_role_id
        ON CONFLICT (user_id, role_id) DO NOTHING;

        -- Remove old ADMIN assignments.
        DELETE FROM public.user_roles
        WHERE role_id = old_admin_role_id;

        -- Remove obsolete ADMIN role.
        DELETE FROM public.roles
        WHERE id = old_admin_role_id;

    END IF;
END;
$$;


-- 3. Make SUPER_ADMIN the only platform administrator role.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.name = 'SUPER_ADMIN'
    );
$function$;

COMMIT;
