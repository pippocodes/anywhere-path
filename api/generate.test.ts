import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './generate.js'

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
      return res
    },
    setHeader() {
      return res
    },
  }
  return res
}

describe('POST /api/generate with no Anthropic credentials configured', () => {
  const savedEnv = { ...process.env }

  beforeEach(() => {
    // Supabase is configured; only the AI side (no API key yet, no model
    // chosen) is missing — the real state of this deployment right now.
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_MODEL
  })

  afterEach(() => {
    process.env = { ...savedEnv }
  })

  it('returns a clean 503 "not configured" error without calling Anthropic', async () => {
    const req = { method: 'POST', headers: {}, body: { goal: 'learn guitar' } } as VercelRequest
    const res = mockRes()

    await handler(req, res as unknown as VercelResponse)

    expect(res.statusCode).toBe(503)
    expect(res.body).toMatchObject({ error: 'not_configured' })
    const message = (res.body as { message: string }).message
    expect(message).toContain('ANTHROPIC_API_KEY')
    expect(message).toContain('ANTHROPIC_MODEL')
  })
})
