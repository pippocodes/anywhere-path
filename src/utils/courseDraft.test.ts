import { describe, it, expect } from 'vitest'
import { cloneModuleWithNewIds, isModuleTreeComplete, makeEmptyModule, makeEmptyTopic } from './courseDraft'

describe('isModuleTreeComplete', () => {
  it('is false when a module has no name', () => {
    const m = makeEmptyModule()
    expect(isModuleTreeComplete([m])).toBe(false)
  })

  it('is false when a topic has no duration', () => {
    const topic = { ...makeEmptyTopic(), name: 'Intro' }
    const m = { ...makeEmptyModule(), name: 'Section', topics: [topic] }
    expect(isModuleTreeComplete([m])).toBe(false)
  })

  it('is true for a fully filled-in tree, including nested sub-modules', () => {
    const leafTopic = { ...makeEmptyTopic(), name: 'Intro', durationSeconds: 300 }
    const subModule = { ...makeEmptyModule(), name: 'Sub', topics: [leafTopic] }
    const module = { ...makeEmptyModule(), name: 'Section', topics: [], modules: [subModule] }
    expect(isModuleTreeComplete([module])).toBe(true)
  })

  it('is false when a nested sub-module is incomplete', () => {
    const subModule = { ...makeEmptyModule(), name: '', topics: [] }
    const module = { ...makeEmptyModule(), name: 'Section', topics: [], modules: [subModule] }
    expect(isModuleTreeComplete([module])).toBe(false)
  })
})

describe('cloneModuleWithNewIds', () => {
  it('assigns a fresh id to the module, every topic, and every nested module', () => {
    const topic = { ...makeEmptyTopic(), name: 'Intro', durationSeconds: 60 }
    const sub = { ...makeEmptyModule(), name: 'Sub', topics: [topic] }
    const original = { ...makeEmptyModule(), name: 'Section', topics: [topic], modules: [sub] }

    const copy = cloneModuleWithNewIds(original)

    expect(copy.id).not.toBe(original.id)
    expect(copy.topics[0].id).not.toBe(original.topics[0].id)
    expect(copy.modules![0].id).not.toBe(original.modules![0].id)
    expect(copy.modules![0].topics[0].id).not.toBe(original.modules![0].topics[0].id)
    // Content is preserved, only ids change.
    expect(copy.name).toBe(original.name)
    expect(copy.topics[0].name).toBe(original.topics[0].name)
  })
})
