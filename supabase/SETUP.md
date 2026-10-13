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
   **Run**.
3. This creates 6 tables: `courses`, `roadmap_plans`, `roadmap_docs`, `habit_categories`, and
   `habits` each have Row Level Security with a policy that only ever lets a signed-in user see
   or change rows where `user_id` matches their own `auth.uid()` — enforced by Postgres itself,
   not by the app. The sixth, `ai_generate_log`, has RLS on with *no* policies at all (used only
   by `/api/generate` via the service-role key, which bypasses RLS by design — see step 7).
4. Check **Table Editor** in the sidebar — you should see all 6 tables, empty, each with a
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

## 5. Configure email auth (recommended defaults)

Supabase email/password auth works out of the box, but two settings are worth checking:

1. **Authentication** → **URL Configuration**: set **Site URL** to your deployed app's URL (e.g.
   `https://your-app.vercel.app`), and add it (plus `http://localhost:5173` for local dev) under
   **Redirect URLs** — this is where the "reset password" email link sends people back to
   (`/reset-password`, handled by `src/pages/auth/ResetPassword.tsx`).
2. **Authentication** → **Providers** → **Email**: "Confirm email" is on by default, meaning new
   sign-ups get a confirmation email before they can log in (matches the "check your email"
   screen after Sign Up in this app). Turn it off here if you'd rather skip email confirmation
   during development.

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

## How the app uses this

- `src/lib/supabaseClient.ts` creates the client from the two `VITE_` env vars;
  `isSupabaseConfigured` is `false` (and `supabase` is `null`) if either is missing, which is
  what drives the setup notices instead of a crash.
- `src/context/AuthContext.tsx` wraps `supabase.auth` (sign up, log in, log out, password reset).
- `src/components/ProtectedRoute.tsx` guards `/courses`, `/roadmap`, and `/habits`.
- `src/context/AppContext.tsx` loads/saves data from the 5 data tables above once signed in (via
  `src/lib/cloudSync.ts`), and falls back to `localStorage` while signed out.
- On first login, if there's data on that device from before signing in (and the account is
  otherwise empty), a one-time prompt offers to import it — see `MigratePrompt`.
- `api/generate.ts` verifies the caller's Supabase session token, checks `ai_generate_log` for
  the rate limit, calls Claude, and returns the generated outline text — returning a clear 503
  instead of calling Claude at all if any of the four AI-related env vars above are missing.
