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
3. This creates 5 tables (`courses`, `roadmap_plans`, `roadmap_docs`, `habit_categories`,
   `habits`), each with Row Level Security turned on and a policy that only ever lets a signed-in
   user see or change rows where `user_id` matches their own `auth.uid()` — enforced by Postgres
   itself, not by the app.
4. Check **Table Editor** in the sidebar — you should see all 5 tables, empty, each with a
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

## How the app uses this

- `src/lib/supabaseClient.ts` creates the client from the two env vars; `isSupabaseConfigured` is
  `false` (and `supabase` is `null`) if either is missing, which is what drives the setup notices
  instead of a crash.
- `src/context/AuthContext.tsx` wraps `supabase.auth` (sign up, log in, log out, password reset).
- `src/components/ProtectedRoute.tsx` guards `/courses`, `/roadmap`, and `/habits`.
- `src/context/AppContext.tsx` loads/saves data from the 5 tables above once signed in (via
  `src/lib/cloudSync.ts`), and falls back to `localStorage` while signed out.
- On first login, if there's data on that device from before signing in (and the account is
  otherwise empty), a one-time prompt offers to import it — see `MigratePrompt`.
