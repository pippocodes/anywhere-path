// Single source of truth for which Anthropic model id the AI endpoints call.
// Never hard-code a model id elsewhere — read it from here, which reads it
// from ANTHROPIC_MODEL. No fallback: if it's unset, the caller must treat
// that the same as any other missing AI env var (503 "not configured"),
// not silently run a different model.

export function getAnthropicModel(): string | undefined {
  return process.env.ANTHROPIC_MODEL
}
