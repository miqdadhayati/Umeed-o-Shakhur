-- ============================================================================
-- Umeed o Shakhur — LMS schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is idempotent: re-running it is safe.
--
-- SECURITY MODEL
-- --------------
-- 1. Nobody can create an account directly against Supabase Auth from the
--    browser. Signup happens only through our own server routes, which hold
--    the service-role key and decide the role. The client never sends a role.
-- 2. Every table is deny-by-default. RLS is on and there is no blanket policy.
-- 3. `profiles.role` is immutable after creation, enforced by a trigger that
--    fires even for the service role.
-- 4. Policy helper functions are SECURITY DEFINER so that a policy on
--    `profiles` can read `profiles` without recursing into its own policy.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'teacher');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (length(trim(full_name)) between 2 and 80),
  role        user_role not null default 'student',
  created_at  timestamptz not null default now()
);

-- A class is one camp / cohort. Its join code is what lets a student in.
create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 2 and 80),
  join_code   text not null unique check (join_code ~ '^[A-Z0-9]{6,10}$'),
  expires_at  timestamptz,
  max_uses    integer check (max_uses is null or max_uses > 0),
  uses        integer not null default 0,
  active      boolean not null default true,
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists class_members (
  class_id   uuid not null references classes (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, profile_id)
);

-- Content tables. A null class_id means "everyone" (whole-NGO notice).
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid references classes (id) on delete cascade,
  title      text not null check (length(trim(title)) between 2 and 140),
  body       text not null check (length(trim(body)) between 1 and 4000),
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists assignments (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid references classes (id) on delete cascade,
  title        text not null check (length(trim(title)) between 2 and 140),
  instructions text not null check (length(trim(instructions)) between 1 and 4000),
  due_on       date,
  created_by   uuid references profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Books and links. Kept deliberately simple: a title and somewhere to go.
create table if not exists resources (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid references classes (id) on delete cascade,
  title       text not null check (length(trim(title)) between 2 and 140),
  description text check (description is null or length(description) <= 500),
  url         text not null check (url ~* '^https?://'),
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Teacher signup gate
--
-- A teacher applicant never receives their own code. The code is emailed to
-- the NGO's own inbox, so a human who knows the staff has to hand it over.
-- Codes are stored hashed; the plaintext exists only in that one email.
-- ---------------------------------------------------------------------------
create table if not exists teacher_signup_requests (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  full_name   text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists teacher_requests_email_idx
  on teacher_signup_requests (lower(email), created_at desc);

-- Generic throttle bucket, keyed by action + identifier (email, IP, code).
create table if not exists rate_limits (
  bucket      text not null,
  identifier  text not null,
  window_start timestamptz not null default now(),
  count       integer not null default 0,
  primary key (bucket, identifier)
);

-- ---------------------------------------------------------------------------
-- Immutability of role
--
-- Without this, anything that can UPDATE a profile row could hand itself
-- 'teacher'. The trigger fires for the service role too, so even a bug in our
-- own server code cannot silently escalate someone.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_role_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'profiles.role is immutable; delete and re-create the account instead';
  end if;
  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_immutable on profiles;
create trigger profiles_role_immutable
  before update on profiles
  for each row execute function public.enforce_role_immutable();

-- ---------------------------------------------------------------------------
-- Policy helpers (SECURITY DEFINER — they bypass RLS, which is what stops
-- a policy on `profiles` from recursing into itself)
-- ---------------------------------------------------------------------------

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

create or replace function public.my_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select class_id from class_members where profile_id = auth.uid();
$$;

-- True when the signed-in user may read content attached to this class.
-- Null class_id = whole-NGO content, visible to every signed-in user.
create or replace function public.can_read_class(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      target is null
      or public.is_teacher()
      or target in (select public.my_class_ids())
    );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles                enable row level security;
alter table classes                 enable row level security;
alter table class_members           enable row level security;
alter table announcements           enable row level security;
alter table assignments             enable row level security;
alter table resources               enable row level security;
alter table teacher_signup_requests enable row level security;
alter table rate_limits             enable row level security;

-- These two are touched only by server routes holding the service-role key,
-- which bypasses RLS. Enabling RLS with zero policies makes them unreachable
-- from the browser, which is exactly what we want.
-- (no policies for teacher_signup_requests / rate_limits — deny all)

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select_self on profiles;
create policy profiles_select_self on profiles
  for select using (id = auth.uid());

drop policy if exists profiles_select_teacher on profiles;
create policy profiles_select_teacher on profiles
  for select using (public.is_teacher());

-- Only the display name is user-editable; the trigger above guards `role`.
drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- classes -------------------------------------------------------------------
-- Teachers only. RLS is row-level, not column-level, so letting students read
-- their own class row would also hand them its join_code — including a *new*
-- code after a rotation, which would defeat the point of rotating. Students
-- never need this table: content visibility is resolved by can_read_class(),
-- which reads their membership through a SECURITY DEFINER helper instead.
drop policy if exists classes_select_member on classes;
drop policy if exists classes_select_teacher on classes;
create policy classes_select_teacher on classes
  for select using (public.is_teacher());

drop policy if exists classes_insert_teacher on classes;
create policy classes_insert_teacher on classes
  for insert with check (public.is_teacher());

drop policy if exists classes_update_teacher on classes;
create policy classes_update_teacher on classes
  for update using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists classes_delete_teacher on classes;
create policy classes_delete_teacher on classes
  for delete using (public.is_teacher());

-- class_members -------------------------------------------------------------
drop policy if exists members_select on class_members;
create policy members_select on class_members
  for select using (profile_id = auth.uid() or public.is_teacher());

drop policy if exists members_write_teacher on class_members;
create policy members_write_teacher on class_members
  for all using (public.is_teacher()) with check (public.is_teacher());

-- announcements / assignments / resources -----------------------------------
-- Same shape for all three: members read, teachers write.

drop policy if exists announcements_select on announcements;
create policy announcements_select on announcements
  for select using (public.can_read_class(class_id));

drop policy if exists announcements_write on announcements;
create policy announcements_write on announcements
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists assignments_select on assignments;
create policy assignments_select on assignments
  for select using (public.can_read_class(class_id));

drop policy if exists assignments_write on assignments;
create policy assignments_write on assignments
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists resources_select on resources;
create policy resources_select on resources
  for select using (public.can_read_class(class_id));

drop policy if exists resources_write on resources;
create policy resources_write on resources
  for all using (public.is_teacher()) with check (public.is_teacher());

-- ---------------------------------------------------------------------------
-- Join-code redemption
--
-- SECURITY DEFINER so an anonymous signup can atomically validate and consume
-- a code without being able to SELECT the classes table (which would let
-- someone enumerate every code). Returns the class id, or null if invalid.
-- The `uses` increment and the validity check happen in one statement, so two
-- simultaneous signups cannot both take the last remaining seat.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_join_code(code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  matched uuid;
begin
  update classes
     set uses = uses + 1
   where join_code = upper(trim(code))
     and active
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses < max_uses)
  returning id into matched;

  return matched;  -- null when the code is wrong, expired, full, or disabled
end;
$$;

revoke all on function public.redeem_join_code(text) from public, anon, authenticated;

-- Give a seat back when signup fails after the code was already consumed
-- (duplicate email, database error). Without this, every failed attempt would
-- permanently shrink a capped class.
create or replace function public.release_join_code_seat(target_class uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update classes set uses = greatest(uses - 1, 0) where id = target_class;
$$;

revoke all on function public.release_join_code_seat(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Convenience view: a class with its member count, for the teacher console.
-- ---------------------------------------------------------------------------
create or replace view class_overview
with (security_invoker = true) as
  select c.*, (select count(*) from class_members m where m.class_id = c.id) as member_count
  from classes c;
