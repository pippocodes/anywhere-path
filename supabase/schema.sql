-- Anywhere Path — Supabase schema + Row Level Security
--
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- for a fresh project. Safe to re-run: every statement is idempotent
-- (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS before CREATE POLICY).
--
-- Mirrors the app's existing data shapes (src/types.ts) one table per
-- entity, so each has its own RLS policy — nested structures that were
-- already JS objects (a course's modules/topics, a habit's marks) stay as
-- JSONB columns rather than being fully normalized into their own tables.
-- That keeps the schema small and directly reviewable while still giving
-- real per-row ownership enforced by Postgres itself, not just the app's UI.

-- ---------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------
create table if not exists public.courses (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  is_custom boolean not null default false,
  modules jsonb not null default '[]'::jsonb, -- CourseModule[] (each with nested Topic[] — lecture durationSeconds lives inside here, no column needed)
  platform text, -- optional, e.g. "Udemy", "YouTube" — Course Tracker metadata
  instructor text, -- optional
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adds platform/instructor to a courses table created before the Course
-- Tracker rebuild — a no-op on a table created fresh from the statement above.
alter table public.courses add column if not exists platform text;
alter table public.courses add column if not exists instructor text;

-- Roadmap Builder unification: courses get a category (shared with
-- habit_categories — see below) and optional weekly-planner scheduling,
-- same shape as roadmap_docs already has. The actual ALTER TABLE for
-- category_id (it references habit_categories, so it has to come after
-- that table exists) is further down, right after habit_categories.
alter table public.courses add column if not exists start_date date;
alter table public.courses add column if not exists hours_per_day numeric;
alter table public.courses add column if not exists weekdays jsonb; -- number[] (0=Sun..6=Sat)

create index if not exists courses_user_id_idx on public.courses (user_id);

alter table public.courses enable row level security;

drop policy if exists "courses_select_own" on public.courses;
drop policy if exists "courses_insert_own" on public.courses;
drop policy if exists "courses_update_own" on public.courses;
drop policy if exists "courses_delete_own" on public.courses;

create policy "courses_select_own" on public.courses
  for select using (auth.uid() = user_id);
create policy "courses_insert_own" on public.courses
  for insert with check (auth.uid() = user_id);
create policy "courses_update_own" on public.courses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "courses_delete_own" on public.courses
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- roadmap_plans — the classic per-course scheduler result (RoadmapPlan)
-- ---------------------------------------------------------------------
create table if not exists public.roadmap_plans (
  course_id text primary key references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  target_days integer not null,
  daily_hours numeric not null,
  total_hours numeric not null,
  option text not null,
  updated_at timestamptz not null default now()
);

create index if not exists roadmap_plans_user_id_idx on public.roadmap_plans (user_id);

alter table public.roadmap_plans enable row level security;

drop policy if exists "roadmap_plans_select_own" on public.roadmap_plans;
drop policy if exists "roadmap_plans_insert_own" on public.roadmap_plans;
drop policy if exists "roadmap_plans_update_own" on public.roadmap_plans;
drop policy if exists "roadmap_plans_delete_own" on public.roadmap_plans;

create policy "roadmap_plans_select_own" on public.roadmap_plans
  for select using (auth.uid() = user_id);
create policy "roadmap_plans_insert_own" on public.roadmap_plans
  for insert with check (auth.uid() = user_id);
create policy "roadmap_plans_update_own" on public.roadmap_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "roadmap_plans_delete_own" on public.roadmap_plans
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- roadmap_docs — outline-text roadmaps (RoadmapDoc)
-- ---------------------------------------------------------------------
create table if not exists public.roadmap_docs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  outline_text text not null default '',
  start_date date,
  hours_per_day numeric,
  weekdays jsonb, -- number[] (0=Sun..6=Sat)
  completed_paths jsonb not null default '[]'::jsonb, -- string[] of checked-off leaf node ids, read-only view
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adds completed_paths to a roadmap_docs table created before this column
-- existed — a no-op on a table created fresh from the statement above.
alter table public.roadmap_docs add column if not exists completed_paths jsonb not null default '[]'::jsonb;

create index if not exists roadmap_docs_user_id_idx on public.roadmap_docs (user_id);

alter table public.roadmap_docs enable row level security;

drop policy if exists "roadmap_docs_select_own" on public.roadmap_docs;
drop policy if exists "roadmap_docs_insert_own" on public.roadmap_docs;
drop policy if exists "roadmap_docs_update_own" on public.roadmap_docs;
drop policy if exists "roadmap_docs_delete_own" on public.roadmap_docs;

create policy "roadmap_docs_select_own" on public.roadmap_docs
  for select using (auth.uid() = user_id);
create policy "roadmap_docs_insert_own" on public.roadmap_docs
  for insert with check (auth.uid() = user_id);
create policy "roadmap_docs_update_own" on public.roadmap_docs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "roadmap_docs_delete_own" on public.roadmap_docs
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- habit_categories
-- ---------------------------------------------------------------------
create table if not exists public.habit_categories (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  archived boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists habit_categories_user_id_idx on public.habit_categories (user_id);

-- Now that habit_categories exists, courses can reference it — a course's
-- category_id is shared with the habit tracker's own categories (one list,
-- two features). Deleting a category sets this null (app-level cleanup
-- also does this explicitly so cross-device syncs agree, but the FK is a
-- backstop); a null category_id reads as "Other" in the app, not a
-- missing/broken row — no data loss for courses that predate categories.
alter table public.courses add column if not exists category_id text references public.habit_categories (id) on delete set null;
create index if not exists courses_category_id_idx on public.courses (category_id);

alter table public.habit_categories enable row level security;

drop policy if exists "habit_categories_select_own" on public.habit_categories;
drop policy if exists "habit_categories_insert_own" on public.habit_categories;
drop policy if exists "habit_categories_update_own" on public.habit_categories;
drop policy if exists "habit_categories_delete_own" on public.habit_categories;

create policy "habit_categories_select_own" on public.habit_categories
  for select using (auth.uid() = user_id);
create policy "habit_categories_insert_own" on public.habit_categories
  for insert with check (auth.uid() = user_id);
create policy "habit_categories_update_own" on public.habit_categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_categories_delete_own" on public.habit_categories
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------
create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  course_id text references public.courses (id) on delete set null,
  category_id text references public.habit_categories (id) on delete set null,
  marks jsonb not null default '{}'::jsonb, -- Record<'YYYY-MM-DD', 0|1|2>
  archived boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits (user_id);

alter table public.habits enable row level security;

drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;

create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- ai_generate_log — one row per "Generate with AI" call, used only to
-- rate-limit /api/generate per user. Written and read exclusively by that
-- serverless function using the service-role key, which bypasses RLS by
-- design — RLS is still enabled here with NO policies, so the anon/
-- authenticated roles the browser actually uses get zero access either way.
-- ---------------------------------------------------------------------
create table if not exists public.ai_generate_log (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_generate_log_user_created_idx on public.ai_generate_log (user_id, created_at);

alter table public.ai_generate_log enable row level security;
-- Deliberately no policies: this table is service-role-only.

-- ---------------------------------------------------------------------
-- profiles — one row per account, holding the public username used for
-- display ("logged in as ...") and for "log in with username" (see the
-- email_for_username() function below). Created automatically by the
-- on_auth_user_created trigger right after a row lands in auth.users —
-- the app never inserts into this table directly.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: "Alex" and "alex" are the same username.
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- Deliberately no insert/delete policy: rows are created only by the
-- trigger below (SECURITY DEFINER, bypasses RLS) and removed only via the
-- auth.users cascade when an account is deleted.

-- Reads the "username" field passed in supabase.auth.signUp()'s
-- options.data (see AuthContext.signUp) and creates the matching profile
-- row. Runs as SECURITY DEFINER so it can insert despite RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Safe availability check for the live "is this username taken?" indicator
-- on the register form — returns ONLY a boolean, never any row data, so it
-- can't be used to pull anyone's profile. Callable while signed out (the
-- visitor has no session yet mid-signup).
create or replace function public.username_available(check_username text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(check_username)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- Lets the login form accept a username instead of an email: resolves the
-- exact username being logged in with to its account's email, so the
-- browser can call supabase.auth.signInWithPassword() as usual. Returns a
-- single email for a single exact username match (or null) — never a list,
-- never any other profile field — so it can't be used to browse or harvest
-- the user directory, only to complete a login someone is already
-- attempting with a username they already know.
create or replace function public.email_for_username(check_username text)
returns text
language sql
security definer set search_path = public
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(check_username)
  limit 1;
$$;

grant execute on function public.email_for_username(text) to anon;

-- ---------------------------------------------------------------------
-- Done. Every table above has RLS enabled with policies that scope
-- every select/insert/update/delete to `auth.uid() = user_id` — a user
-- can only ever see or change their own rows, enforced by Postgres
-- itself regardless of what the client sends.
-- ---------------------------------------------------------------------
