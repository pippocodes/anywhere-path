-- Anywhere Path — Push notifications schema (DRAFT, NOT REVIEWED, NOT APPLIED)
--
-- Proposed for branch `notifications`, Part 1 (design review). Do NOT run
-- this against the real project yet. Once approved, this content moves
-- into supabase/schema.sql proper (same style/conventions as the rest of
-- that file: idempotent, RLS on every table, DROP POLICY IF EXISTS before
-- CREATE POLICY) rather than staying as a separate file long-term.
--
-- Mirrors the existing habits/plans/courses tables' column names and RLS
-- pattern exactly (see supabase/schema.sql) so nothing here introduces a
-- new convention.

-- ---------------------------------------------------------------------
-- push_subscriptions — one row per browser/device a user has granted
-- push permission on (a phone and a laptop both installed = two rows).
-- `endpoint` is the push service URL the browser handed back from
-- PushManager.subscribe() — unique per device per browser, so it doubles
-- as the natural de-dupe key (re-subscribing the same device upserts,
-- doesn't create a second row). p256dh/auth are the encryption keys the
-- server needs to address this subscription — see RFC 8291; the
-- `web-push` npm library both of the sender-side options below use
-- consumes these three fields verbatim.
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
-- Deliberately no update policy: a changed subscription is a new endpoint
-- (the browser issues a fresh one), so the client deletes the stale row
-- and inserts the new one rather than editing in place.
-- The scheduled sender (see below) reads across ALL users' rows using the
-- service-role key, which bypasses RLS entirely — these policies only
-- govern what the browser itself (anon/authenticated role) can do.

-- ---------------------------------------------------------------------
-- notification_settings — one row per user, the global controls: the
-- single off switch, the timezone reminder times are interpreted in
-- (captured once on the client via Intl.DateTimeFormat().resolvedOptions().timeZone,
-- not re-asked per habit), and an optional quiet-hours window that
-- suppresses sends regardless of what a habit's own reminder time says —
-- a safety clamp for "I set a reminder for 11pm without thinking about
-- it", not the primary scheduling mechanism.
-- ---------------------------------------------------------------------
create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  timezone text not null default 'UTC', -- IANA name, e.g. "Europe/Berlin"
  quiet_hours_start time, -- null = no quiet hours set
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
drop policy if exists "notification_settings_insert_own" on public.notification_settings;
drop policy if exists "notification_settings_update_own" on public.notification_settings;

create policy "notification_settings_select_own" on public.notification_settings
  for select using (auth.uid() = user_id);
create policy "notification_settings_insert_own" on public.notification_settings
  for insert with check (auth.uid() = user_id);
create policy "notification_settings_update_own" on public.notification_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- No delete policy — "turn everything off" sets enabled = false, it
-- doesn't remove the row (there's nothing sensitive in it to delete, and
-- keeping the row means the timezone/quiet-hours choices survive being
-- switched back on later).

-- ---------------------------------------------------------------------
-- habit_reminders — one row per habit the user has actually turned a
-- reminder ON for (opt-in per habit, not an automatic default — matches
-- "each user picks the time per habit": picking is a deliberate action,
-- so a freshly created habit stays quiet until its reminder is set).
-- remind_at is a plain HH:MM with no timezone of its own — it's read
-- against notification_settings.timezone for that same user.
-- last_sent_date is the idempotency guard behind "at most one reminder
-- per habit per day": the sender checks and sets this in the same
-- transaction as sending, so a cron tick that overlaps a slow previous
-- run (or a manual retry) can never double-send for the same habit on
-- the same calendar day.
-- ---------------------------------------------------------------------
create table if not exists public.habit_reminders (
  habit_id text primary key references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  remind_at time not null,
  enabled boolean not null default true,
  last_sent_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habit_reminders_user_id_idx on public.habit_reminders (user_id);
-- The scheduled sender's actual hot-path query — "every enabled reminder
-- whose time-of-day matches the current minute, across every user" — scans
-- this index directly instead of the whole table.
create index if not exists habit_reminders_remind_at_idx on public.habit_reminders (remind_at) where enabled;

alter table public.habit_reminders enable row level security;

drop policy if exists "habit_reminders_select_own" on public.habit_reminders;
drop policy if exists "habit_reminders_insert_own" on public.habit_reminders;
drop policy if exists "habit_reminders_update_own" on public.habit_reminders;
drop policy if exists "habit_reminders_delete_own" on public.habit_reminders;

create policy "habit_reminders_select_own" on public.habit_reminders
  for select using (auth.uid() = user_id);
create policy "habit_reminders_insert_own" on public.habit_reminders
  for insert with check (auth.uid() = user_id);
create policy "habit_reminders_update_own" on public.habit_reminders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_reminders_delete_own" on public.habit_reminders
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- What is deliberately NOT a new column: whether a habit is "due" today
-- (not yet marked done, and its linked plan/course has actually reached
-- its start_date) is computed fresh at send time from habits/plans/courses
-- exactly like isHabitStarted() already does client-side
-- (src/utils/reminders.ts) — not duplicated into a second source of
-- truth here. The sender re-implements/reuses that same check in
-- TypeScript (see Part 2), not in SQL, so there's exactly one place that
-- rule lives.
-- ---------------------------------------------------------------------
