import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { isRateLimited, validateStats, parseInsightsResponse, buildSystemPrompt, buildUserPrompt, RATE_LIMIT_WINDOW_MS } from './_lib/habitInsights.js'

/**
 * POST /api/habit-insights  { stats: HabitInsightStats, force?: boolean }  ->  { insights, cached }
 *
 * Requires `Authorization: Bearer <supabase access token>`. Receives ONLY
 * the aggregated stats built by src/utils/habitInsightStats.ts (habit
 * names, category names, streaks, percentages) — never notes, emails, or
 * friends' data. Caches one result per user per day in
 * habit_insights_cache and serves that back on repeat calls the same day
 * unless `force` is set; only an actual AI call (cache miss or forced
 * refresh) counts against the 5/day rate limit in ai_habit_insights_log.
 * Degrades to a clear error with no crash whenever any required env var is
 * missing, the model call fails, or its response doesn't parse — the
 * client falls back to rule-based insights in every one of those cases.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Belt-and-suspenders: whatever goes wrong anywhere in here, the caller
  // always gets back JSON, never a bare platform error page it can't parse.
  try {
    return await handleHabitInsights(req, res)
  } catch (err) {
    console.error('Unhandled error in /api/habit-insights', err)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'server_error', message: 'Something went wrong on our end — try again shortly.' })
    }
  }
}

async function handleHabitInsights(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed', message: 'Use POST.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !anthropicApiKey) {
    const missing = [
      !anthropicApiKey && 'ANTHROPIC_API_KEY',
      !supabaseUrl && 'SUPABASE_URL',
      !supabaseAnonKey && 'SUPABASE_ANON_KEY',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ]
      .filter(Boolean)
      .join(', ')
    return res.status(503).json({
      error: 'not_configured',
      message: `AI habit insights aren't set up on this deployment yet (missing: ${missing}). See supabase/SETUP.md.`,
    })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Log in to see AI insights.' })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'unauthorized', message: 'Your session has expired — log in again.' })
  }
  const userId = userData.user.id

  const validation = validateStats(req.body?.stats)
  if (!validation.valid || !validation.stats) {
    return res.status(400).json({ error: 'invalid_request', message: validation.error })
  }
  const stats = validation.stats
  const force = req.body?.force === true

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const today = new Date().toISOString().slice(0, 10)

  if (!force) {
    const { data: cached, error: cacheError } = await adminClient
      .from('habit_insights_cache')
      .select('insight_date, insights')
      .eq('user_id', userId)
      .maybeSingle()

    if (cacheError) {
      console.error('Habit insights cache lookup failed', cacheError)
    } else if (cached && cached.insight_date === today) {
      return res.status(200).json({ insights: cached.insights, cached: true })
    }
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count, error: countError } = await adminClient
    .from('ai_habit_insights_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart)

  if (countError) {
    console.error('Rate limit check failed', countError)
    return res.status(500).json({ error: 'server_error', message: 'Could not check your usage — try again shortly.' })
  }

  if (isRateLimited(count ?? 0)) {
    return res.status(429).json({
      error: 'rate_limited',
      message: "You've reached today's limit for AI insight refreshes — try again tomorrow.",
    })
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })

  let insights: ReturnType<typeof parseInsightsResponse>
  try {
    const response = await anthropic.messages.create(
      {
        model: 'claude-opus-5',
        max_tokens: 1000,
        output_config: { effort: 'medium' },
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: buildUserPrompt(stats) }],
      },
      // Comfortably under this function's 60s maxDuration (vercel.json) —
      // so this returns a controlled JSON error instead of the platform
      // killing the function and returning its own non-JSON error page.
      { timeout: 55_000 }
    )

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({ error: 'generation_failed', message: 'Could not generate insights right now.' })
    }

    let text = ''
    for (const block of response.content) {
      if (block.type === 'text') text += block.text
    }
    if (!text.trim()) {
      return res.status(502).json({ error: 'generation_failed', message: 'Could not generate insights right now.' })
    }
    insights = parseInsightsResponse(text)
  } catch (err) {
    console.error('Habit insights generation failed', err)
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return res.status(504).json({ error: 'timeout', message: 'Generating insights took too long and timed out — try again shortly.' })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res
        .status(503)
        .json({ error: 'upstream_rate_limited', message: 'AI insights are busy right now — try again in a moment.' })
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return res
        .status(503)
        .json({ error: 'not_configured', message: 'AI insights are misconfigured (invalid API key). See supabase/SETUP.md.' })
    }
    return res.status(502).json({ error: 'generation_failed', message: 'Could not generate insights right now.' })
  }

  const { error: upsertError } = await adminClient
    .from('habit_insights_cache')
    .upsert({ user_id: userId, insight_date: today, insights }, { onConflict: 'user_id' })
  if (upsertError) console.error('Failed to cache habit insights', upsertError)

  // Best-effort usage log for rate limiting — a logging failure shouldn't fail an otherwise-successful generation.
  const { error: logError } = await adminClient.from('ai_habit_insights_log').insert({ user_id: userId })
  if (logError) console.error('Failed to log AI habit insights usage', logError)

  return res.status(200).json({ insights, cached: false })
}
