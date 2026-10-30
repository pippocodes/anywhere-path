# Supabase setup — Anywhere Path

Accounts and cloud sync use [Supabase](https://supabase.com) (Postgres + Auth). The app runs
fine without this configured — the auth pages just show a setup notice instead of a form, and
`/courses`, `/roadmap`, and `/habits` show the same notice instead of redirecting to login.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (GitHub login is fine).
2. **New project** → pick an organization, name it (e.g. `anywhere-path`), set a database
   password (save it somewhere — you won't need it for this app, but you will if you ever need
   direct Postgres access), choose a region close to you, and create it. It takes a minute or two
   to provision.

## 2. Run the schema

1. In the project dashboard, open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](./schema.sql) from this repo and click
   **Run**. If you set this project up before the username/profile feature was added, just
   re-run the whole file again — every statement is idempotent (`create table if not exists`,
   `drop policy if exists` before `create policy`, etc.), so running it again only adds what's
   missing.
3. This creates 15 tables: `courses`, `roadmap_plans`, `roadmap_docs`, `habit_categories`, and
   `habits` each have Row Level Security with a policy that only ever lets a signed-in user see
   or change rows where `user_id` matches their own `auth.uid()` — enforced by Postgres itself,
   not by the app. `ai_generate_log` and `ai_habit_insights_log` have RLS on with *no* policies
   at all (used only by `/api/generate` and `/api/habit-insights` respectively via the
   service-role key, which bypasses RLS by design — see steps 7-8). `habit_insights_cache` is the
   same service-role-only shape, holding each user's most recent AI habit insights.
   `profiles` holds each account's username — RLS lets a user read/update only their own row,
   rows are created automatically by a trigger on signup (never inserted by the app directly),
   and two small SQL functions (`username_available`, `email_for_username`) back the live
   "is this username taken?" check and "log in with username" — see **How the app uses this**
   below for exactly what each returns. `friendships`, `shared_items`, `shared_item_members`, and
   `shared_item_logs` back the Friends/shared-tracker feature (see the schema file's own comments
   for their relationship-scoped RLS). The newest six — `admin_users`, `blocks`, `posts`,
   `cheers`, `reports`, `announcements` — back the community posts feature (Phase 3): see
   **Granting admin access** below for `admin_users`, which is the one table here with no RLS
   policies at all (service-role-only, same shape as `ai_generate_log`).
4. Check **Table Editor** in the sidebar — you should see all 15 tables, each with a
   padlock icon (RLS enabled).

### Granting admin access

`admin_users` has Row Level Security on with **zero policies** — not even an admin can read or
write it through the app, by design (see the comments above that table in `schema.sql`). To make
an account an admin (for the moderation/announcements page), run this once per account directly
in the SQL Editor, after finding their `auth.users` id in **Authentication** → **Users**:

```sql
insert into public.admin_users (user_id) values ('<their auth.users id>');
```

To revoke it: `delete from public.admin_users where user_id = '<their auth.users id>';`

## 3. Get your API keys

1. Open **Project Settings** (gear icon) → **API**.
2. You need two values:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public** key (under Project API keys) → this is `VITE_SUPABASE_ANON_KEY`
3. The anon key is safe to expose in client-side code — it's what RLS exists to protect. Never
   use the **service_role** key in this app; it bypasses RLS entirely and must never reach the
   browser.

## 4. Set your local env vars

1. Copy `.env.example` to `.env` (or `.env.local`) in the project root, if you haven't already.
2. Fill in the two values from step 3:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Restart `npm run dev` if it was already running (Vite only reads env vars at startup).

## 5. Configure email auth (required — this is what "localhost refused to connect" means)

Every email Supabase sends (signup confirmation, password reset) builds its link from two things:
a **Site URL** / **Redirect URLs** allowlist set in the dashboard, and an `emailRedirectTo` /
`redirectTo` value the app passes when it calls `signUp()` / `resetPasswordForEmail()`. The app
side is already correct — it's built from `src/lib/siteUrl.ts`, which uses the real page origin
(or `VITE_SITE_URL` if you set it) and **never hardcodes `localhost`**. But Supabase only honors
that app-supplied URL if it's in the allowlist below; otherwise it silently falls back to the
Site URL instead, with no error — which is exactly how a confirmation link ends up pointing at
`localhost` in a production email. You must set this in the dashboard; there's no SQL equivalent:

1. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://anywhere-path.vercel.app` (swap in your own domain if different —
     this is the fallback used whenever a redirect isn't in the allowlist below, so it should
     always be your real production URL, never `localhost`).
   - **Redirect URLs** — add every origin/pattern this app can run from:
     ```
     https://anywhere-path.vercel.app/**
     http://localhost:5173/**
     ```
     Add a Vercel preview-deployment pattern too if you test those (e.g.
     `https://anywhere-path-*-pippo-codes.vercel.app/**`). The app links into three paths under
     whichever origin matches: `/auth/callback` (email confirmation, handled by
     `src/pages/auth/AuthCallback.tsx`), `/reset-password` (password reset, handled by
     `src/pages/auth/ResetPassword.tsx`), and `/login` as a fallback.
2. **Authentication** → **Providers** → **Email**: "Confirm email" — **on** means new sign-ups
   must click the confirmation link before they can log in (matches the "check your email" screen
   after Sign Up in this app, and the "Resend confirmation email" button that appears on a login
   attempt against an unconfirmed account); **off** skips that and signs them in immediately after
   registering. Either is fine; just know which one is active, since it changes what a new user
   sees.
3. **Rate limits — read this before testing in production.** Supabase's *built-in* email sender
   (the one active by default, no setup required) is aggressively rate-limited — on the order of a
   few emails per hour project-wide — specifically to push you toward a real provider before
   launch. It's fine for the handful of test signups while you're setting this up, but it **will**
   start silently failing to send (no error surfaced to the user — they just never get the email)
   under any real signup volume. Before relying on this for actual users: **Project Settings** →
   **Authentication** → **SMTP Settings** → enable **Custom SMTP** and point it at a transactional
   email provider (Resend, Postmark, SendGrid, AWS SES, etc.) with your own domain. This also gets
   you out from under Supabase's shared sending reputation, which matters for inbox deliverability.

## 6. Set the Vercel env vars (for deployment)

If this project is linked to Vercel (`vercel link`), either:

**Via the CLI:**
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
# repeat with `preview` and `development` in place of `production` if you want
# the same values there too
vercel env pull --yes   # syncs them back into .env.local for local dev
```

**Or via the dashboard:** Project → **Settings** → **Environment Variables** → add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from step 3, for whichever
environments (Production / Preview / Development) you want. Redeploy afterward — env var changes
don't apply to already-built deployments.

**Optional: `VITE_SITE_URL`.** Auth redirect links (`src/lib/siteUrl.ts`) already fall back to
`window.location.origin`, which is correct for both local dev and production without any extra
config. Set `VITE_SITE_URL` only if you specifically want every redirect link to point at one
fixed domain regardless of where the app happened to be running when the email was sent — e.g.
pinning it to `https://anywhere-path.vercel.app` so a signup started from a preview-deployment URL
still emails a production link. If set, it must also be covered by the **Redirect URLs** allowlist
from step 5.

## 7. Set up "Generate with AI" (optional)

On the roadmap outline page, "Generate with AI" lets you type a goal (e.g. "learn data
structures in 8 weeks, 1h/day") and get back a starter outline in the exact indented format the
app expects, which you can then edit before saving. This is entirely optional — without it, the
button shows a "not set up" message and everything else works exactly the same.

It runs as a Vercel serverless function (`api/generate.ts`), not in the browser, so the API key
is never exposed to visitors. It needs four environment variables, none of them `VITE_`-prefixed
(that prefix ships a value to every browser — the opposite of what a secret key needs):

1. **Get an Anthropic API key**: [console.anthropic.com](https://console.anthropic.com) → **API
   Keys** → **Create Key**. Set usage limits there if you want a hard spending cap.
2. **Get your Supabase service role key**: same place as step 3 above (**Project Settings** →
   **API**), the **service_role** key (also under Project API keys, below anon public). This key
   bypasses RLS — it's what lets the function verify who's calling it and log usage for rate
   limiting, and it must **never** be prefixed `VITE_` or otherwise reach the browser.
3. Set these five variables — locally in `.env`/`.env.local`, and on Vercel for deployment (CLI
   `vercel env add <NAME> production`, or dashboard → Project → **Settings** → **Environment
   Variables**; redeploy after adding them):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-haiku-5-5                      # read by api/_lib/aiModel.ts — no fallback
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co       # same project URL as VITE_SUPABASE_URL
   SUPABASE_ANON_KEY=eyJhbGciOi...                      # same value as VITE_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...               # from step 2 above — keep this one secret
   ```
4. Generations are rate-limited to 2 per signed-in user per rolling week — the free-plan limit,
   and currently the only plan (see `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_MS` in
   `api/_lib/outlineGeneration.ts` if you want to change that), logged in the `ai_generate_log`
   table from step 2.

## 8. Set up push reminders (optional)

Lets a signed-in user turn on push notifications and get a reminder at a time they pick for each
habit — see Settings → Notifications → "Push reminders" in the app. Entirely optional: without
it, that section just shows "Push notifications aren't available" / the subscribe button quietly
fails with a clear error, and everything else works exactly the same.

Three pieces, all in Vercel/Supabase — nothing to change in this repo:

### 8a. Generate a VAPID key pair

VAPID keys are how the app proves to the push service (Chrome's, Apple's, etc.) that it's allowed
to send to a given subscription — a public/private key pair, generated once, never rotated unless
compromised. Run this locally (needs the `web-push` package this repo already depends on):

```bash
npx web-push generate-vapid-keys
```

It prints a **Public Key** and a **Private Key**. Copy both straight into the Vercel env vars
below — don't paste them anywhere else, don't commit them, and don't paste the private key into
this chat or any other AI tool.

### 8b. Set the environment variables

Same two places as step 7 above (local `.env`/`.env.local`, and Vercel → Project → **Settings** →
**Environment Variables**, redeploy after adding):

```
VITE_VAPID_PUBLIC_KEY=<the Public Key from 8a>     # ships to the browser — this half is meant to be public
VAPID_PUBLIC_KEY=<the same Public Key>              # read server-side by api/send-reminders.ts and api/send-test-notification.ts
VAPID_PRIVATE_KEY=<the Private Key from 8a>         # secret — never VITE_-prefixed, never reaches the browser
VAPID_SUBJECT=mailto:you@example.com                # a contact URL/email the push services may use to reach you about abuse
CRON_SECRET=<a random string you generate yourself> # e.g. `openssl rand -hex 32` — shared with the pg_cron job in 8c, nothing else
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are the same three from step 7
— the reminder endpoints reuse them, no new Supabase keys needed.

### 8c. Schedule the sender in Supabase

The actual sending runs as a Vercel function (`api/send-reminders.ts`), checked every minute by a
`pg_cron` job inside Supabase's own Postgres — not Vercel Cron (the free Hobby plan only allows
cron jobs to run once a day, nowhere near enough for per-user reminder times) and not a GitHub
Actions schedule (minute-precision isn't reliable, and it disables itself after 60 days with no
other repo activity). Supabase's `pg_cron` ticks reliably every minute on the free tier and costs
nothing extra.

1. **Database** → **Extensions** in the dashboard → enable **pg_cron** and **pg_net** (search the
   list, toggle each on). These let Postgres schedule a job and make an HTTP call from inside SQL.
2. **SQL Editor** → **New query** → paste the following, filling in your own deployed URL and the
   exact `CRON_SECRET` value you set in 8b, then **Run** (once — this registers a standing job,
   it doesn't need to be re-run on every deploy):
   ```sql
   select cron.schedule(
     'send-reminders-every-minute',
     '* * * * *',
     $$
     select net.http_post(
       url := 'https://<your-deployed-domain>/api/send-reminders',
       headers := jsonb_build_object(
         'Authorization', 'Bearer <your CRON_SECRET value>',
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```
3. Check it's running: **Database** → **Cron** in the dashboard should list `send-reminders-every-minute`
   with recent successful runs. To stop it later: `select cron.unschedule('send-reminders-every-minute');`.

### What to expect on iPhone

Push only works once Anywhere Path has been added to the Home Screen (Share → Add to Home Screen,
or the in-app "Install app" button on supported browsers) — Safari does not deliver push to a
regular browser tab at all. The in-app Notifications settings page already explains this; nothing
extra to configure here.

## How the app uses this

- `src/lib/supabaseClient.ts` creates the client from the two `VITE_` env vars;
  `isSupabaseConfigured` is `false` (and `supabase` is `null`) if either is missing, which is
  what drives the setup notices instead of a crash.
- `src/context/AuthContext.tsx` wraps `supabase.auth` (sign up, log in, log out, password reset,
  resend-confirmation). Sign up passes the chosen username in `options.data.username`, which the
  `handle_new_user` trigger reads to create the matching `profiles` row, plus
  `emailRedirectTo: ${getSiteUrl()}/auth/callback`. Log in accepts an email *or* a username — if
  what's typed doesn't contain `@`, it's resolved to an email first via the `email_for_username`
  RPC, then signed in normally; a username that doesn't resolve falls through to the same generic
  "that email/username or password is incorrect" error as a wrong password, so login never reveals
  whether a given username exists. The one error that *is* shown specifically is an unconfirmed
  email (Supabase's `email_not_confirmed`), with a button to resend the confirmation link — every
  other failure (wrong password, rate limiting, network errors) gets its own distinct message too;
  in dev builds the real `error.message`/`status`/`code` from Supabase is also logged to the
  console for debugging (`import.meta.env.DEV` gate, see `devLog` in `AuthContext.tsx`).
- `src/pages/auth/AuthCallback.tsx` (`/auth/callback`) is where the signup-confirmation email
  link lands. `detectSessionInUrl: true` on the Supabase client (`src/lib/supabaseClient.ts`)
  means supabase-js picks up the session from the URL automatically on load; this page just waits
  for that to produce a signed-in user, shows a welcome toast, and sends them into the app — or,
  if the link was invalid/expired (Supabase appends `error`/`error_description` instead of a
  session), shows that plainly with a way back to sign up again.
- `src/components/ProtectedRoute.tsx` guards `/roadmap`, `/habits`, `/profile`, and `/settings`.
- `src/context/AppContext.tsx` loads/saves data from the 5 data tables above once signed in (via
  `src/lib/cloudSync.ts`), and falls back to `localStorage` while signed out.
- On first login, if there's data on that device from before signing in (and the account is
  otherwise empty), a one-time prompt offers to import it — see `MigratePrompt`.
- `api/generate.ts` verifies the caller's Supabase session token, checks `ai_generate_log` for
  the rate limit, calls Claude, and returns the generated outline text — returning a clear 503
  instead of calling Claude at all if any of the four AI-related env vars above are missing.
- Push reminders: the browser's subscription is saved via `api/save-push-subscription.ts` /
  `api/delete-push-subscription.ts` into `push_subscriptions`; per-habit times and the global
  on/off + quiet hours live in `habit_reminders` / `notification_settings`. Every minute,
  Supabase's own `pg_cron` calls `api/send-reminders.ts` (shared-secret auth, not a user session),
  which matches each user's due reminders (`api/_lib/reminderMatching.ts` — start-date gating,
  one-per-habit-per-day, quiet hours, combining several into one push) and sends via `web-push`.
  `api/send-test-notification.ts` backs the "send me a test notification" button.
