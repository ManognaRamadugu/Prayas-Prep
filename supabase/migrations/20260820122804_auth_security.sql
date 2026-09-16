-- ============================================================
-- PRAYAS PREP
-- Migration: Auth Security
-- Part 1: Roles
-- ============================================================

insert into public.roles (name, description)
values
  ('STUDENT', 'Prayas Prep student'),
  ('ADMIN', 'Prayas Prep administrator')
on conflict (name) do nothing;

-- ============================================================
-- Part 2: Automatic User Profile Creation
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  student_role_id uuid;
begin

  -- Create the general profile
  insert into public.profiles (
    id,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  -- Create the student profile
  insert into public.student_profiles (
    user_id
  )
  values (
    new.id
  );

  -- Find the STUDENT role
  select id
  into student_role_id
  from public.roles
  where name = 'STUDENT';

  -- Assign STUDENT role
  if student_role_id is not null then
    insert into public.user_roles (
      user_id,
      role_id
    )
    values (
      new.id,
      student_role_id
    );
  end if;

  return new;
end;
$$;


create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
  -- ============================================================
-- Part 3: Enable Row Level Security
-- ============================================================

alter table public.profiles enable row level security;

alter table public.roles enable row level security;

alter table public.user_roles enable row level security;

alter table public.student_profiles enable row level security;

alter table public.student_curricula enable row level security;
-- ============================================================
-- Part 4: Profiles Policies
-- ============================================================

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);


create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);
-- ============================================================
-- Part 5: Student Profile Policies
-- ============================================================

create policy "Students can view their own student profile"
on public.student_profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);


create policy "Students can update their own student profile"
on public.student_profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);
-- ============================================================
-- Part 6: Student Curriculum Policies
-- ============================================================

create policy "Students can view their own curricula"
on public.student_curricula
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = student_id
);


create policy "Students can select their own curricula"
on public.student_curricula
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = student_id
);


create policy "Students can update their own curricula"
on public.student_curricula
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = student_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = student_id
);


create policy "Students can remove their own curricula"
on public.student_curricula
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = student_id
);
-- ============================================================
-- Part 7: User Role Policies
-- ============================================================

create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);
-- ============================================================
-- Part 8: Roles Policy
-- ============================================================

create policy "Authenticated users can view roles"
on public.roles
for select
to authenticated
using (true);