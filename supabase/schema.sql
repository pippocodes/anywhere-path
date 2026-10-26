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
-- ai_habit_insights_log — same shape and purpose as ai_generate_log
-- above, but for /api/habit-insights: one row per actual AI call (a
-- cache hit doesn't insert here), used only to rate-limit regeneration.
-- ---------------------------------------------------------------------
create table if not exists public.ai_habit_insights_log (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_habit_insights_log_user_created_idx on public.ai_habit_insights_log (user_id, created_at);

alter table public.ai_habit_insights_log enable row level security;
-- Deliberately no policies: this table is service-role-only.

-- ---------------------------------------------------------------------
-- habit_insights_cache — one row per user, holding the most recently
-- generated AI habit insights and the date they were generated for, so
-- the Tracker tab can show today's insights instantly on repeat visits
-- without re-calling the model. Overwritten (upsert on user_id) by the
-- next generation — deliberately no history kept here. Service-role-only,
-- same as the tables above.
-- ---------------------------------------------------------------------
create table if not exists public.habit_insights_cache (
  user_id uuid primary key references auth.users (id) on delete cascade,
  insight_date date not null,
  insights jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.habit_insights_cache enable row level security;
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

-- Theme + color-mode persistence (settings page, redesign Step 1). Both
-- apply instantly from localStorage client-side; these columns just let the
-- same choice follow the user to another device on login.
alter table public.profiles
  add column if not exists theme text not null default 'plum',
  add column if not exists color_mode text not null default 'system';

alter table public.profiles
  drop constraint if exists profiles_theme_check,
  drop constraint if exists profiles_color_mode_check;

alter table public.profiles
  add constraint profiles_theme_check
    check (theme in ('plum', 'carousel', 'burgundy', 'strawberry')),
  add constraint profiles_color_mode_check
    check (color_mode in ('system', 'light', 'dark'));

-- Default changed to Carousel + System (theming round 2, Step 1). The
-- one-time backfill of existing rows to match is run separately, NOT
-- here — this file is re-run on every future migration, and an `update`
-- left in it would reset everyone's theme choice back to carousel/system
-- every single time, which is not what a "default" means.
alter table public.profiles
  alter column theme set default 'carousel',
  alter column color_mode set default 'system';

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
-- Profile rebuild (Settings redesign Step 3): public/private visibility,
-- an optional "About me" blurb, and a 30-day username-change cooldown.
-- All additive. is_public defaults to false, so every EXISTING account
-- becomes private the moment this runs (the app isn't public yet) — no
-- separate backfill needed, since a new NOT NULL column's own DEFAULT
-- already applies to existing rows.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_public boolean not null default false,
  add column if not exists about text not null default '',
  add column if not exists username_changed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_about_length_check;
alter table public.profiles
  add constraint profiles_about_length_check check (char_length(about) <= 160);

-- Enforces the 30-day username-change cooldown server-side, independent
-- of the client UI — mirrors shared_items_enforce_limit()'s prefixed-error
-- convention so the client can detect this specific case and show a
-- friendly "try again on <date>" message instead of a generic error.
create or replace function public.profiles_enforce_username_cooldown()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.username is distinct from old.username then
    if old.username_changed_at is not null and old.username_changed_at > now() - interval '30 days' then
      raise exception 'USERNAME_COOLDOWN: you can next change your username on %',
        to_char(old.username_changed_at + interval '30 days', 'YYYY-MM-DD');
    end if;
    new.username_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_before_update_username_cooldown on public.profiles;
create trigger profiles_before_update_username_cooldown
  before update on public.profiles
  for each row execute function public.profiles_enforce_username_cooldown();

-- Mobile fixes round 2, Fix 7/9: controls whether the daily "catch-up"
-- popup (pending habits/tasks due today) is allowed to show. On by
-- default; the popup itself is still gated on there being pending items
-- and not having already shown today (tracked client-side).
alter table public.profiles
  add column if not exists catchup_reminder_enabled boolean not null default true;

-- ---------------------------------------------------------------------
-- plans — "plan how/when to finish something" (Roadmap Builder Step 3).
-- Distinct from roadmap_docs (the older outline-text saved-roadmap
-- system, untouched) and from roadmap_plans (the older courseId-keyed
-- scheduler result). A plan's `steps` is always its own flattened,
-- schedulable snapshot regardless of source — source_course_id is kept
-- only so a course-sourced plan can be resynced on request later, not for
-- a live foreign-key-style binding to the course's current structure.
-- ---------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category_id text references public.habit_categories (id) on delete set null,
  source_type text not null check (source_type in ('course', 'ai', 'custom')),
  source_course_id text references public.courses (id) on delete set null,
  steps jsonb not null default '[]'::jsonb, -- PlanStep[]: { id, title, estimatedSeconds, done }
  start_date date not null,
  days integer not null,
  hours_per_day numeric not null,
  weekdays jsonb not null default '[0,1,2,3,4,5,6]'::jsonb, -- number[] (0=Sun..6=Sat)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans (user_id);
create index if not exists plans_source_course_id_idx on public.plans (source_course_id);

alter table public.plans enable row level security;

drop policy if exists "plans_select_own" on public.plans;
drop policy if exists "plans_insert_own" on public.plans;
drop policy if exists "plans_update_own" on public.plans;
drop policy if exists "plans_delete_own" on public.plans;

create policy "plans_select_own" on public.plans
  for select using (auth.uid() = user_id);
create policy "plans_insert_own" on public.plans
  for insert with check (auth.uid() = user_id);
create policy "plans_update_own" on public.plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plans_delete_own" on public.plans
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- habits: link to a plan, and an optional daily target time (Roadmap
-- Builder Step 4 — "habit tracker ties into courses and roadmaps").
-- Additive only: existing habit rows get plan_id/target_seconds = null,
-- same meaning as "not linked" / "no target" they already had.
-- ---------------------------------------------------------------------
alter table public.habits add column if not exists plan_id text references public.plans (id) on delete set null;
alter table public.habits add column if not exists target_seconds integer;

create index if not exists habits_plan_id_idx on public.habits (plan_id);

-- =======================================================================
-- Friends & shared tracking (Roadmap Builder Step 5).
--
-- Unlike every table above (one row per signed-in user, scoped by
-- `auth.uid() = user_id`), these tables are inherently two-or-more-party:
-- a friendship involves two accounts, a shared item's logs are written by
-- every member. RLS here is "can I see/touch THIS row because of a
-- relationship", not "is this MY row" — see the policies below. Status
-- transitions (accept/decline/block, invite/accept/leave/remove) are
-- validated in BEFORE triggers rather than RLS alone, since RLS can
-- restrict which rows you touch but not which column changes are valid
-- for a given role.
-- =======================================================================

-- ---------------------------------------------------------------------
-- friendships — one row per pair, regardless of status. `blocked_by`
-- records who placed a block (only they may remove/unblock it).
-- ---------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  blocked_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

-- At most one live (pending/accepted/blocked) relationship per unordered
-- pair — a declined request falls outside this partial index, so either
-- side can send a fresh request later.
create unique index if not exists friendships_unique_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
  where status in ('pending', 'accepted', 'blocked');

create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select" on public.friendships;
drop policy if exists "friendships_insert" on public.friendships;
drop policy if exists "friendships_update" on public.friendships;
drop policy if exists "friendships_delete" on public.friendships;

create policy "friendships_select" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_insert" on public.friendships
  for insert with check (auth.uid() = requester_id and status = 'pending');
create policy "friendships_update" on public.friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);
-- Cancel (requester, while pending), remove/unfriend (either, while
-- accepted), or unblock (only whoever placed the block) all go through
-- DELETE — there's no "declined" cleanup needed since it's just left as a
-- row that no longer blocks a fresh request.
create policy "friendships_delete" on public.friendships
  for delete using (
    (auth.uid() = requester_id or auth.uid() = addressee_id)
    and (status <> 'blocked' or blocked_by = auth.uid())
  );

-- Validates the only transitions a status UPDATE is allowed to make —
-- RLS above just confirms you're a party to the row.
create or replace function public.friendships_validate_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    if auth.uid() <> old.addressee_id then
      raise exception 'Only the addressee can accept or decline a friend request.';
    end if;
  elsif new.status = 'blocked' and old.status <> 'blocked' then
    if auth.uid() <> old.requester_id and auth.uid() <> old.addressee_id then
      raise exception 'Not a party to this friendship.';
    end if;
    new.blocked_by := auth.uid();
  else
    raise exception 'Invalid friendship status transition.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists friendships_before_update on public.friendships;
create trigger friendships_before_update
  before update on public.friendships
  for each row execute function public.friendships_validate_update();

-- Server-side rate limit on sending requests — "server-side rate-limited
-- requests" per spec, not just a client-side debounce.
create or replace function public.friendships_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.friendships
  where requester_id = new.requester_id
    and created_at > now() - interval '1 hour';
  if recent_count >= 20 then
    raise exception 'Too many friend requests sent recently — please wait before sending more.';
  end if;
  return new;
end;
$$;

drop trigger if exists friendships_before_insert_rate_limit on public.friendships;
create trigger friendships_before_insert_rate_limit
  before insert on public.friendships
  for each row execute function public.friendships_rate_limit();

-- Username search for "add a friend" — never exposes email, SECURITY
-- DEFINER so it can read across profiles despite the select_own/
-- select_connected RLS above (search must find people you're NOT yet
-- connected to). Requires 3+ characters, excludes yourself, capped at 20.
-- Profile rebuild (Step 3): a partial (prefix) match only surfaces PUBLIC
-- profiles — a private profile is findable only by its exact full
-- username, so private accounts can still be added by someone who already
-- knows the whole name, but don't show up to casual prefix browsing.
create or replace function public.search_users(query text)
returns table (id uuid, username text)
language sql
security definer set search_path = public
stable
as $$
  select p.id, p.username
  from public.profiles p
  where length(trim(query)) >= 3
    and p.id <> auth.uid()
    and (
      (p.is_public and p.username ilike trim(query) || '%')
      or lower(p.username) = lower(trim(query))
    )
  order by p.username
  limit 20
$$;

grant execute on function public.search_users(text) to authenticated;

-- ---------------------------------------------------------------------
-- profile_browse_log — rate-limits people_you_can_add() below, same
-- shape/purpose as ai_generate_log. Written and read only from inside
-- that SECURITY DEFINER function; never queried directly by the client
-- (no grants, and RLS has no policies either way).
-- ---------------------------------------------------------------------
create table if not exists public.profile_browse_log (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists profile_browse_log_user_created_idx on public.profile_browse_log (user_id, created_at);

alter table public.profile_browse_log enable row level security;
-- Deliberately no policies.

-- Paginated "People you can add" directory for the Friends page: public
-- profiles only, excluding yourself and anyone you already have a live
-- relationship with (pending, accepted, or blocked — in either
-- direction). All filtering happens here, server-side — the client never
-- filters this list itself. Rate-limited to 30 calls/minute per user to
-- discourage directory scraping.
create or replace function public.people_you_can_add(p_limit integer default 20, p_offset integer default 0)
returns table (id uuid, username text, about text)
language plpgsql
security definer set search_path = public
as $$
declare
  recent_count integer;
  capped_limit integer := least(greatest(p_limit, 1), 50);
  capped_offset integer := greatest(p_offset, 0);
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  select count(*) into recent_count
  from public.profile_browse_log
  where user_id = auth.uid() and created_at > now() - interval '1 minute';
  if recent_count >= 30 then
    raise exception 'Too many requests — please wait a moment.';
  end if;

  insert into public.profile_browse_log (user_id) values (auth.uid());

  return query
    select p.id, p.username, p.about
    from public.profiles p
    where p.is_public
      and p.id <> auth.uid()
      and not exists (
        select 1 from public.friendships f
        where (
            (f.requester_id = auth.uid() and f.addressee_id = p.id)
            or (f.addressee_id = auth.uid() and f.requester_id = p.id)
          )
          and f.status in ('pending', 'accepted', 'blocked')
      )
    order by p.username
    limit capped_limit offset capped_offset;
end;
$$;

grant execute on function public.people_you_can_add(integer, integer) to authenticated;

-- ---------------------------------------------------------------------
-- shared_items — one habit or course an owner has shared. `item_id` is a
-- loose text reference (polymorphic: a habits.id or courses.id) rather
-- than an FK, validated against ownership client-side at creation time;
-- `title` is a denormalized snapshot so members can see what it's called
-- without needing access to the owner's own habits/courses rows.
-- ---------------------------------------------------------------------
create table if not exists public.shared_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('habit', 'course')),
  item_id text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists shared_items_owner_idx on public.shared_items (owner_id);

alter table public.shared_items enable row level security;
-- Policies for shared_items are created further below, after
-- shared_item_members exists — shared_items_select needs to reference it.

-- Free-plan limit: at most 2 OWNED shared items — enforced here, not just
-- in the UI, per spec ("enforced SERVER-SIDE in a DB function/policy").
-- The message is prefixed so client code can detect this specific error
-- and show the "Upgrade to share more" panel instead of a generic one.
create or replace function public.shared_items_enforce_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owned_count integer;
begin
  select count(*) into owned_count from public.shared_items where owner_id = new.owner_id;
  if owned_count >= 2 then
    raise exception 'FREE_PLAN_SHARE_LIMIT: the free plan allows sharing up to 2 items.';
  end if;
  return new;
end;
$$;

drop trigger if exists shared_items_before_insert_limit on public.shared_items;
create trigger shared_items_before_insert_limit
  before insert on public.shared_items
  for each row execute function public.shared_items_enforce_limit();

-- ---------------------------------------------------------------------
-- shared_item_members — one row per invited/joined friend. The owner is
-- not a member row; they're implicit via shared_items.owner_id.
-- ---------------------------------------------------------------------
create table if not exists public.shared_item_members (
  shared_item_id uuid not null references public.shared_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'accepted', 'left', 'removed')),
  joined_at timestamptz,
  primary key (shared_item_id, user_id)
);

create index if not exists shared_item_members_user_idx on public.shared_item_members (user_id);

alter table public.shared_item_members enable row level security;

drop policy if exists "shared_item_members_select" on public.shared_item_members;
drop policy if exists "shared_item_members_insert" on public.shared_item_members;
drop policy if exists "shared_item_members_update" on public.shared_item_members;

-- Checks membership WITHOUT going through shared_item_members' own RLS —
-- SECURITY DEFINER runs this as the function owner, which bypasses RLS,
-- so the policy below can ask "is auth.uid() a member of this item" from
-- inside shared_item_members' own SELECT policy without Postgres seeing
-- it as the table querying itself under its own policy (which it detects
-- and refuses as infinite recursion, error 42P17).
create or replace function public.is_shared_item_member(p_shared_item_id uuid, p_user_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.shared_item_members
    where shared_item_id = p_shared_item_id and user_id = p_user_id
  )
$$;

-- is_shared_item_member()'s counterpart for the owner side — used for
-- exactly the same reason: shared_items_select and shared_item_members'
-- own policies each reference the OTHER table, so a raw EXISTS on
-- shared_items here would trigger shared_items_select, which (before this
-- fix) itself raw-EXISTS'd back into shared_item_members — an indirect
-- two-table recursion cycle, not just the direct self-reference fixed
-- above. Routing every cross-table check in both policies through these
-- two SECURITY DEFINER functions breaks the cycle in both directions.
create or replace function public.is_shared_item_owner(p_shared_item_id uuid, p_user_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.shared_items
    where id = p_shared_item_id and owner_id = p_user_id
  )
$$;

create or replace function public.is_accepted_shared_item_member(p_shared_item_id uuid, p_user_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.shared_item_members
    where shared_item_id = p_shared_item_id and user_id = p_user_id and status = 'accepted'
  )
$$;

create policy "shared_item_members_select" on public.shared_item_members
  for select using (
    user_id = auth.uid()
    or public.is_shared_item_owner(shared_item_id, auth.uid())
    or public.is_shared_item_member(shared_item_id, auth.uid())
  );
create policy "shared_item_members_insert" on public.shared_item_members
  for insert with check (public.is_shared_item_owner(shared_item_id, auth.uid()));
create policy "shared_item_members_update" on public.shared_item_members
  for update using (
    user_id = auth.uid()
    or public.is_shared_item_owner(shared_item_id, auth.uid())
  );

-- Owner may only invite an accepted friend, and never themselves.
create or replace function public.shared_item_members_validate_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  is_friend boolean;
begin
  select owner_id into v_owner from public.shared_items where id = new.shared_item_id;
  if new.user_id = v_owner then
    raise exception 'Cannot invite the owner as a member.';
  end if;
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = v_owner and f.addressee_id = new.user_id)
        or (f.addressee_id = v_owner and f.requester_id = new.user_id))
  ) into is_friend;
  if not is_friend then
    raise exception 'Can only share with an accepted friend.';
  end if;
  new.status := 'invited';
  new.joined_at := null;
  return new;
end;
$$;

drop trigger if exists shared_item_members_before_insert on public.shared_item_members;
create trigger shared_item_members_before_insert
  before insert on public.shared_item_members
  for each row execute function public.shared_item_members_validate_insert();

-- The owner may only move a member to 'removed'; a member may only
-- accept their own invite or leave.
create or replace function public.shared_item_members_validate_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.shared_items where id = new.shared_item_id;
  if auth.uid() = v_owner then
    if new.status <> 'removed' then
      raise exception 'The owner may only remove a member.';
    end if;
  elsif auth.uid() = old.user_id then
    if old.status = 'invited' and new.status = 'accepted' then
      new.joined_at := now();
    elsif new.status = 'left' then
      null;
    else
      raise exception 'Invalid member status transition.';
    end if;
  else
    raise exception 'Not authorized to change this membership.';
  end if;
  return new;
end;
$$;

drop trigger if exists shared_item_members_before_update on public.shared_item_members;
create trigger shared_item_members_before_update
  before update on public.shared_item_members
  for each row execute function public.shared_item_members_validate_update();

-- shared_items policies, deferred to here since shared_items_select
-- needs shared_item_members to already exist.
drop policy if exists "shared_items_select" on public.shared_items;
drop policy if exists "shared_items_insert" on public.shared_items;
drop policy if exists "shared_items_update" on public.shared_items;
drop policy if exists "shared_items_delete" on public.shared_items;

create policy "shared_items_select" on public.shared_items
  for select using (
    auth.uid() = owner_id
    or public.is_shared_item_member(id, auth.uid())
  );
create policy "shared_items_insert" on public.shared_items
  for insert with check (auth.uid() = owner_id);
create policy "shared_items_update" on public.shared_items
  for update using (auth.uid() = owner_id);
create policy "shared_items_delete" on public.shared_items
  for delete using (auth.uid() = owner_id);

-- Lets a user see the username (nothing else) of anyone they have a live
-- relationship with — friend, pending request either direction, or a
-- fellow member/owner of a shared item. Additive: this is a SECOND
-- permissive SELECT policy alongside profiles_select_own (from the
-- original schema), and Postgres OR's permissive policies together, so
-- "see my own profile" still works unchanged. Placed here (not right
-- after `profiles` above) because it references shared_items/
-- shared_item_members, which must already exist.
drop policy if exists "profiles_select_connected" on public.profiles;
create policy "profiles_select_connected" on public.profiles
  for select using (
    exists (
      select 1 from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
         or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
    )
    or exists (
      select 1 from public.shared_item_members m1
      join public.shared_item_members m2 on m1.shared_item_id = m2.shared_item_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
    or exists (
      select 1 from public.shared_items si
      join public.shared_item_members m on m.shared_item_id = si.id
      where si.owner_id = profiles.id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.shared_item_members m
      join public.shared_items si on si.id = m.shared_item_id
      where si.owner_id = auth.uid() and m.user_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------
-- shared_item_logs — one row per member per shared item per day.
-- `state` mirrors habits.marks' 0/1/2 (none/partial/full) semantics —
-- the same tri-state tap-to-cycle the personal habit tracker already
-- uses, applied here across every member of a shared item.
-- ---------------------------------------------------------------------
create table if not exists public.shared_item_logs (
  shared_item_id uuid not null references public.shared_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  state smallint not null default 0 check (state in (0, 1, 2)),
  updated_at timestamptz not null default now(),
  primary key (shared_item_id, user_id, log_date)
);

alter table public.shared_item_logs enable row level security;

drop policy if exists "shared_item_logs_select" on public.shared_item_logs;
drop policy if exists "shared_item_logs_insert" on public.shared_item_logs;
drop policy if exists "shared_item_logs_update" on public.shared_item_logs;

-- Every accepted member (and the owner) can see every member's state —
-- that's the whole point of the "together" view — but each person can
-- only ever write their OWN row.
create policy "shared_item_logs_select" on public.shared_item_logs
  for select using (
    public.is_shared_item_owner(shared_item_id, auth.uid())
    or public.is_accepted_shared_item_member(shared_item_id, auth.uid())
  );
create policy "shared_item_logs_insert" on public.shared_item_logs
  for insert with check (
    user_id = auth.uid()
    and (
      public.is_shared_item_owner(shared_item_id, auth.uid())
      or public.is_accepted_shared_item_member(shared_item_id, auth.uid())
    )
  );
create policy "shared_item_logs_update" on public.shared_item_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime: lets clients subscribe to live changes on these three tables
-- (incoming friend requests, invite accept/leave/remove, tick updates on
-- a shared item) via supabase-js .channel(...).on('postgres_changes', ...).
-- Wrapped so re-running this migration is safe even if already added.
do $$ begin
  alter publication supabase_realtime add table public.friendships;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.shared_item_members;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.shared_item_logs;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Done. Every table above has RLS enabled with policies that scope
-- every select/insert/update/delete to `auth.uid() = user_id` (or, for
-- the friends/shared-tracking tables added last, to "a party to this
-- relationship") — enforced by Postgres itself regardless of what the
-- client sends.
-- ---------------------------------------------------------------------
