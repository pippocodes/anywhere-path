-- Anywhere Path — Phase 3 draft schema: posts, cheers, reports, blocks, admin
--
-- DRAFT FOR REVIEW. Not applied anywhere. Do not run this yet.
-- Once approved, this gets folded into supabase/schema.sql (same idempotent
-- style: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS before CREATE
-- POLICY, etc.) and the owner runs it in the Supabase SQL Editor.
--
-- Builds on tables that already exist in supabase/schema.sql: auth.users,
-- public.profiles, public.friendships. Nothing here touches those tables'
-- own columns or policies.

-- =========================================================================
-- Admin role
--
-- A plain boolean column on profiles would let a signed-in user grant
-- themselves admin with an ordinary update call, since profiles_update_own
-- already lets a user edit any column on their own row. So admin status
-- lives in its OWN table instead, with row level security turned on and
-- NO policies at all — same "service-role-only" pattern already used for
-- ai_generate_log / habit_insights_cache elsewhere in this schema. That
-- means no key the browser ever holds (anon or a logged-in user's own
-- session) can read or write this table under any circumstance. The only
-- way to grant admin is the project owner running one INSERT by hand in
-- the Supabase SQL Editor:
--
--   insert into public.admin_users (user_id) values ('<their auth.users id>');
--
-- Every admin-only policy and function below checks this table through
-- is_admin(), so the check lives in Postgres itself, not in the app's UI.
-- =========================================================================
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Deliberately no policies: nobody using the anon or authenticated role —
-- not even an admin themselves — can read or write this table directly.

-- SECURITY DEFINER so it can see into admin_users despite that table having
-- no policies for the calling role; returns a plain boolean, never a row,
-- so it can't be used to enumerate admins. Safe to call for anyone,
-- including signed-out (returns false).
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select p_user_id is not null and exists (
    select 1 from public.admin_users where user_id = p_user_id
  )
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- =========================================================================
-- blocks — a direct, standalone block between two accounts. Separate from
-- friendships.status = 'blocked' (which can only be reached FROM an
-- existing pending/accepted/declined friendship row) because this needs to
-- work even between two people who have never interacted — e.g. blocking
-- a stranger after seeing one of their public posts.
-- =========================================================================
create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_id_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "blocks_select_own" on public.blocks;
drop policy if exists "blocks_insert_own" on public.blocks;
drop policy if exists "blocks_delete_own" on public.blocks;

-- You can only see who YOU blocked — never whether someone else has
-- blocked you, and never who someone else has blocked.
create policy "blocks_select_own" on public.blocks
  for select using (auth.uid() = blocker_id);
create policy "blocks_insert_own" on public.blocks
  for insert with check (auth.uid() = blocker_id);
create policy "blocks_delete_own" on public.blocks
  for delete using (auth.uid() = blocker_id);
-- No update policy: a block is binary — insert to block, delete to unblock.

-- Bidirectional check used by posts/cheers below. SECURITY DEFINER because
-- blocks_select_own only lets a plain query see rows where YOU are the
-- blocker — a non-definer query couldn't see "did the OTHER person block
-- me", which this needs to check too.
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

-- Small helper for posts' "friends only" visibility. NOT security definer:
-- this is only ever called with the current viewer as one of the two ids,
-- and friendships' own select policy already lets you see any row you're
-- a party to, so no bypass is needed.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b) or (f.addressee_id = a and f.requester_id = b))
  )
$$;

-- =========================================================================
-- posts — a share to the community feed. Always starts private; the
-- author explicitly picks Friends only or Public before it's ever visible
-- to anyone else. `is_removed`/`removed_by`/`removed_reason`/`removed_at`
-- are a MODERATION flag, not a delete — an admin "removing" a post hides
-- it from everyone but the author (who still sees it, marked removed) and
-- keeps a record tied to the report that prompted it. A genuine delete
-- (the author removing their own post for good) is the separate DELETE
-- policy further down, which is a real row delete.
--
-- Table + indexes only here. Its SELECT policies are created further down
-- (see "posts policies"), after public.reports exists below — one of them
-- needs to query reports, and reports.post_id in turn needs this table to
-- already exist, so neither can fully finish first. Same two-pass pattern
-- supabase/schema.sql already uses for shared_items / shared_item_members.
-- =========================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  comments_enabled boolean not null default false,
  is_removed boolean not null default false,
  removed_by uuid references auth.users (id),
  removed_reason text,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_visibility_idx on public.posts (visibility);

alter table public.posts enable row level security;

-- Stops a non-admin update (i.e. the author editing their own post) from
-- also sneaking in a change to the moderation columns — e.g. quietly
-- un-removing a post an admin took down. Admins change these columns only
-- through admin_remove_post()/admin_restore_post() further down, which run
-- as the admin and so pass this check; an ordinary author update simply
-- has these four columns pinned back to their current value.
create or replace function public.posts_protect_moderation_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.is_removed := old.is_removed;
    new.removed_by := old.removed_by;
    new.removed_reason := old.removed_reason;
    new.removed_at := old.removed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_before_update_protect_moderation on public.posts;
create trigger posts_before_update_protect_moderation
  before update on public.posts
  for each row execute function public.posts_protect_moderation_fields();

-- Basic anti-spam cap on the public feed, same shape as friendships'
-- existing rate limit.
create or replace function public.posts_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.posts
  where user_id = new.user_id and created_at > now() - interval '1 hour';
  if recent_count >= 20 then
    raise exception 'Too many posts recently — please wait before posting again.';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_before_insert_rate_limit on public.posts;
create trigger posts_before_insert_rate_limit
  before insert on public.posts
  for each row execute function public.posts_rate_limit();

-- =========================================================================
-- cheers — always-on emoji reactions. One cheer per person per post (a
-- second tap with a different emoji replaces it, it doesn't add a second
-- row) — simpler than letting one person stack several different
-- reactions on the same post.
-- =========================================================================
create table if not exists public.cheers (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (emoji in ('🎉', '👏', '🔥', '💪', '❤️')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.cheers enable row level security;

drop policy if exists "cheers_select" on public.cheers;
drop policy if exists "cheers_insert_own" on public.cheers;
drop policy if exists "cheers_update_own" on public.cheers;
drop policy if exists "cheers_delete_own" on public.cheers;

-- You can see a post's cheers exactly when you can see the post itself —
-- this subquery runs under YOUR OWN role, so it's automatically filtered
-- by posts' own select policies (no separate visibility logic to keep in
-- sync). Works even though posts' policies aren't created until further
-- down — a policy only needs the TABLE to exist, not its other policies,
-- at the time this one is created.
create policy "cheers_select" on public.cheers
  for select using (exists (select 1 from public.posts p where p.id = cheers.post_id));

create policy "cheers_insert_own" on public.cheers
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts p where p.id = cheers.post_id)
  );
create policy "cheers_update_own" on public.cheers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cheers_delete_own" on public.cheers
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- reports — confidential: a report is visible only to the person who
-- filed it and to admins, never to the post's author or anyone else, so
-- reporting someone can't be retaliated against.
-- =========================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  -- One report per person per post — re-tapping "Report" on the same post
  -- doesn't create duplicate queue entries.
  unique (reporter_id, post_id)
);

create index if not exists reports_post_id_idx on public.reports (post_id);
create index if not exists reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

drop policy if exists "reports_select" on public.reports;
drop policy if exists "reports_insert_own" on public.reports;

create policy "reports_select" on public.reports
  for select using (auth.uid() = reporter_id or public.is_admin(auth.uid()));
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);
-- No update/delete policy for ordinary users — status changes only
-- through admin_resolve_report() further down, which runs as the admin.

-- Same anti-spam shape as friendships_rate_limit — caps how many reports
-- one person can file per hour.
create or replace function public.reports_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.reports
  where reporter_id = new.reporter_id and created_at > now() - interval '1 hour';
  if recent_count >= 20 then
    raise exception 'Too many reports recently — please wait before reporting more.';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_before_insert_rate_limit on public.reports;
create trigger reports_before_insert_rate_limit
  before insert on public.reports
  for each row execute function public.reports_rate_limit();

-- =========================================================================
-- posts policies — deferred until here because "posts_select_admin_reported"
-- needs public.reports to already exist.
-- =========================================================================
drop policy if exists "posts_select_own" on public.posts;
drop policy if exists "posts_select_visible" on public.posts;
drop policy if exists "posts_select_admin_reported" on public.posts;
drop policy if exists "posts_insert_own" on public.posts;
drop policy if exists "posts_update_own" on public.posts;
drop policy if exists "posts_delete_own" on public.posts;

-- You always see your own posts, removed or not.
create policy "posts_select_own" on public.posts
  for select using (auth.uid() = user_id);

-- Everyone else: never a removed post, never from someone who's blocked
-- (either direction), and only if it's actually Public or (Friends only
-- and you two are accepted friends).
create policy "posts_select_visible" on public.posts
  for select using (
    not is_removed
    and not public.is_blocked(user_id, auth.uid())
    and (
      visibility = 'public'
      or (visibility = 'friends' and public.are_friends(user_id, auth.uid()))
    )
  );

-- An admin can see a post — including a private one — ONLY once someone
-- has reported it. Not blanket access to every private post on the site.
create policy "posts_select_admin_reported" on public.posts
  for select using (
    public.is_admin(auth.uid())
    and exists (select 1 from public.reports r where r.post_id = posts.id)
  );

create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = user_id);

-- The author can edit their own body/visibility/comments_enabled freely.
-- The moderation columns are protected by the trigger above, so this
-- policy doesn't need to special-case them.
create policy "posts_update_own" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- Admin moderation actions — narrow, single-purpose functions rather than
-- a general UPDATE policy on posts/reports for admins. This keeps an
-- admin's write surface to exactly "remove", "restore", "resolve this
-- report" — never a raw column-by-column update that could, say, rewrite
-- someone else's post body.
-- =========================================================================
create or replace function public.admin_remove_post(p_post_id uuid, p_reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized.';
  end if;
  update public.posts
  set is_removed = true, removed_by = auth.uid(), removed_reason = p_reason, removed_at = now()
  where id = p_post_id;
end;
$$;

grant execute on function public.admin_remove_post(uuid, text) to authenticated;

create or replace function public.admin_restore_post(p_post_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized.';
  end if;
  update public.posts
  set is_removed = false, removed_by = null, removed_reason = null, removed_at = null
  where id = p_post_id;
end;
$$;

grant execute on function public.admin_restore_post(uuid) to authenticated;

create or replace function public.admin_resolve_report(p_report_id uuid, p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized.';
  end if;
  if p_status not in ('reviewed', 'dismissed', 'actioned') then
    raise exception 'Invalid status.';
  end if;
  update public.reports
  set status = p_status, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_report_id;
end;
$$;

grant execute on function public.admin_resolve_report(uuid, text) to authenticated;

-- =========================================================================
-- announcements — admin-authored messages shown to everyone (e.g. a
-- banner). Unlike posts, only an admin can ever write a row here, so a
-- plain admin-gated policy is enough — there's no other user's original
-- content to protect from tampering the way there is on posts.
-- =========================================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id),
  body text not null check (char_length(body) between 1 and 500),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists announcements_active_idx on public.announcements (active);

alter table public.announcements enable row level security;

drop policy if exists "announcements_select" on public.announcements;
drop policy if exists "announcements_insert_admin" on public.announcements;
drop policy if exists "announcements_update_admin" on public.announcements;
drop policy if exists "announcements_delete_admin" on public.announcements;

-- Everyone sees active announcements; an admin also sees retired ones (so
-- the admin page can list history).
create policy "announcements_select" on public.announcements
  for select using (active or public.is_admin(auth.uid()));
create policy "announcements_insert_admin" on public.announcements
  for insert with check (public.is_admin(auth.uid()) and author_id = auth.uid());
create policy "announcements_update_admin" on public.announcements
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "announcements_delete_admin" on public.announcements
  for delete using (public.is_admin(auth.uid()));

-- =========================================================================
-- Realtime: live-updating feed (new posts, cheers landing) and a banner
-- that can appear without a refresh. Reports/blocks/admin_users are
-- deliberately NOT added here — nothing about them needs to feel "live".
-- =========================================================================
do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.cheers;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.announcements;
exception when duplicate_object then null; end $$;
