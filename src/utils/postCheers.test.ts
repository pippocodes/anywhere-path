import { describe, it, expect } from 'vitest'
import { applyCheer, clearCheer } from './postCheers'
import type { PostWithDetail } from '../types/posts'

function detail(overrides: Partial<PostWithDetail> = {}): PostWithDetail {
  return {
    post: {
      id: 'p1',
      userId: 'owner',
      body: 'hi',
      visibility: 'public',
      commentsEnabled: false,
      isRemoved: false,
      removedReason: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    authorUsername: 'owner',
    isOwner: false,
    cheers: [],
    myCheer: null,
    ...overrides,
  }
}

describe('applyCheer', () => {
  it('adds a new cheer when the user has none yet', () => {
    const result = applyCheer(detail(), 'u1', '🔥')
    expect(result.myCheer).toBe('🔥')
    expect(result.cheers).toHaveLength(1)
    expect(result.cheers[0]).toMatchObject({ userId: 'u1', emoji: '🔥' })
  })

  it('replaces the same user\'s previous cheer instead of adding a second one', () => {
    const withCheer = detail({
      cheers: [{ postId: 'p1', userId: 'u1', emoji: '👏', createdAt: '2026-01-01T00:00:00.000Z' }],
      myCheer: '👏',
    })
    const result = applyCheer(withCheer, 'u1', '🔥')
    expect(result.cheers).toHaveLength(1)
    expect(result.cheers[0].emoji).toBe('🔥')
    expect(result.myCheer).toBe('🔥')
  })

  it('leaves other users\' cheers untouched', () => {
    const withOthers = detail({
      cheers: [{ postId: 'p1', userId: 'someone-else', emoji: '❤️', createdAt: '2026-01-01T00:00:00.000Z' }],
    })
    const result = applyCheer(withOthers, 'u1', '🎉')
    expect(result.cheers).toHaveLength(2)
    expect(result.cheers.find((c) => c.userId === 'someone-else')?.emoji).toBe('❤️')
  })
})

describe('clearCheer', () => {
  it('removes only the given user\'s cheer', () => {
    const withBoth = detail({
      cheers: [
        { postId: 'p1', userId: 'u1', emoji: '🔥', createdAt: '2026-01-01T00:00:00.000Z' },
        { postId: 'p1', userId: 'someone-else', emoji: '❤️', createdAt: '2026-01-01T00:00:00.000Z' },
      ],
      myCheer: '🔥',
    })
    const result = clearCheer(withBoth, 'u1')
    expect(result.cheers).toHaveLength(1)
    expect(result.cheers[0].userId).toBe('someone-else')
    expect(result.myCheer).toBeNull()
  })

  it('is a no-op when the user had no cheer', () => {
    const result = clearCheer(detail(), 'u1')
    expect(result.cheers).toHaveLength(0)
    expect(result.myCheer).toBeNull()
  })
})
