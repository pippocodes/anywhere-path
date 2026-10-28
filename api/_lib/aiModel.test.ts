import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAnthropicModel } from './aiModel.js'

describe('getAnthropicModel', () => {
  const original = process.env.ANTHROPIC_MODEL

  beforeEach(() => {
    delete process.env.ANTHROPIC_MODEL
  })

  afterEach(() => {
    if (original === undefined) delete process.env.ANTHROPIC_MODEL
    else process.env.ANTHROPIC_MODEL = original
  })

  it('returns the value of ANTHROPIC_MODEL when set', () => {
    process.env.ANTHROPIC_MODEL = 'claude-haiku-5-5'
    expect(getAnthropicModel()).toBe('claude-haiku-5-5')
  })

  it('returns undefined when unset, with no fallback to a different model', () => {
    expect(getAnthropicModel()).toBeUndefined()
  })
})
