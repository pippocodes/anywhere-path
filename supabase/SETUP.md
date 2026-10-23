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
3. This creates 9 tables: `courses`, `roadmap_plans`, `roadmap_docs`, `habit_categories`, and
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
   below for exactly what each returns.
4. Check **Table Editor** in the sidebar — you should see all 9 tables, each with a
   padlock icon (RLS enabled).

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
3. Set these four variables — locally in `.env`/`.env.local`, and on Vercel for deployment (CLI
   `vercel env add <NAME> production`, or dashboard → Project → **Settings** → **Environment
   Variables**; redeploy after adding them):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co       # same project URL as VITE_SUPABASE_URL
   SUPABASE_ANON_KEY=eyJhbGciOi...                      # same value as VITE_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...               # from step 2 above — keep this one secret
   ```
4. Generations are rate-limited to 5 per signed-in user per hour (see
   `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_MS` in `api/_lib/outlineGeneration.ts` if you want
   to change that), logged in the `ai_generate_log` table from step 2.

## 8. Set up AI Habit Insights (optional)

At the top of the Habit Tracker's Tracker tab, "✦ AI Insights" shows a few short, specific
observations about this month's habit data — what to focus on, what's working, and (occasionally)
what to ease up on. It's entirely optional and uses the **same four environment variables as step
7 above** — if you already set those up for "Generate with AI", this works too with no extra
configuration. Without it, that spot on the page falls back to the existing rule-based insights
(or a friendly empty state), never an error.

It runs as its own Vercel serverless function (`api/habit-insights.ts`), receiving only
*aggregated* stats built client-side (`src/utils/habitInsightStats.ts`) — habit names, category
names, streaks, and percentages — never raw dates, notes, emails, or friends' data.

- Results are cached per signed-in user per day in the `habit_insights_cache` table, so reopening
  the Tracker tab the same day serves the cached result instantly instead of calling the model
  again.
- The manual "↻ Refresh" button forces a new generation, which (along with the very first
  generation of the day) counts against a rate limit of 5 AI calls per user per 24 hours — see
  `RATE_LIMIT_MAX_REQUESTS`/`RATE_LIMIT_WINDOW_MS` in `api/_lib/habitInsights.ts` — logged in the
  `ai_habit_insights_log` table from step 2.

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
