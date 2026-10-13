import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import {
  isRateLimited,
  validateGoal,
  cleanGeneratedOutline,
  buildSystemPrompt,
  buildUserPrompt,
  RATE_LIMIT_WINDOW_MS,
} from './_lib/outlineGeneration'

/**
 * POST /api/generate  { goal: string }  ->  { outlineText: string }
 *
 * Requires `Authorization: Bearer <supabase access token>` — the caller
 * must be a signed-in user (enforced here, independent of Supabase RLS,
 * since this is the only thing gating the Anthropic key's use). Rate
 * limited per user via the ai_generate_log table (service-role only,
 * see supabase/schema.sql). Degrades to a 503 with a clear message,
 * never a crash, whenever any required env var is missing — the rest of
 * the app works fully without this endpoint configured at all.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      message: `AI generation isn't set up on this deployment yet (missing: ${missing}). See supabase/SETUP.md.`,
    })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Log in to use AI generation.' })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'unauthorized', message: 'Your session has expired — log in again.' })
  }
  const userId = userData.user.id

  const goalValidation = validateGoal(req.body?.goal)
  if (!goalValidation.valid) {
    return res.status(400).json({ error: 'invalid_request', message: goalValidation.error })
  }
  const goal: string = req.body.goal

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count, error: countError } = await adminClient
    .from('ai_generate_log')
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
      message: "You've reached the hourly limit for AI generation. Try again later, or write the outline by hand.",
    })
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })

  let outlineText: string
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2000,
      output_config: { effort: 'medium' },
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(goal) }],
    })

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({
        error: 'generation_failed',
        message: "The AI couldn't generate a roadmap for that goal — try rephrasing it, or write the outline by hand.",
      })
    }

    let text = ''
    for (const block of response.content) {
      if (block.type === 'text') text += block.text
    }
    if (!text.trim()) {
      return res.status(502).json({
        error: 'generation_failed',
        message: "The AI didn't return anything usable — try again, or write the outline by hand.",
      })
    }
    outlineText = cleanGeneratedOutline(text)
  } catch (err) {
    console.error('Anthropic request failed', err)
    if (err instanceof Anthropic.RateLimitError) {
      return res
        .status(503)
        .json({ error: 'upstream_rate_limited', message: 'AI generation is busy right now — try again in a moment.' })
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return res
        .status(503)
        .json({ error: 'not_configured', message: 'AI generation is misconfigured (invalid API key). See supabase/SETUP.md.' })
    }
    return res.status(502).json({
      error: 'generation_failed',
      message: "Couldn't reach the AI right now — try again shortly, or write the outline by hand.",
    })
  }

  // Best-effort usage log for rate limiting — a logging failure shouldn't fail an otherwise-successful generation.
  const { error: logError } = await adminClient.from('ai_generate_log').insert({ user_id: userId })
  if (logError) console.error('Failed to log AI generation usage', logError)

  return res.status(200).json({ outlineText })
}
