import { describe, it, expect } from 'vitest'
import { parseOutline, serializeOutline } from './outlineParser'
import { renameNode, setNodeDuration, deleteNode, moveSibling } from './outlineTree'

function outline() {
  return parseOutline(
    ['Topic', '  Subtopic A', '    Module 1 (1h)', '    Module 2 (2h)', '  Subtopic B', '    Module 3 (1h)'].join('\n')
  ).nodes
}

describe('renameNode', () => {
  it('renames only the targeted node, leaving everything else untouched', () => {
    const nodes = outline()
    const moduleId = nodes[0].children[0].children[0].id
    const renamed = renameNode(nodes, moduleId, 'Renamed Module')

    expect(renamed[0].children[0].children[0].name).toBe('Renamed Module')
    expect(renamed[0].children[0].children[1].name).toBe('Module 2') // sibling untouched
    expect(renamed[0].name).toBe('Topic') // ancestor untouched
  })
})

describe('setNodeDuration', () => {
  it('updates only the targeted node duration', () => {
    const nodes = outline()
    const moduleId = nodes[0].children[0].children[1].id
    const updated = setNodeDuration(nodes, moduleId, { value: 5, unit: 'h' })

    expect(updated[0].children[0].children[1].duration).toEqual({ value: 5, unit: 'h' })
    expect(updated[0].children[0].children[0].duration).toEqual({ value: 1, unit: 'h' }) // sibling untouched
  })
})

describe('deleteNode', () => {
  it('removes a leaf node from its parent', () => {
    const nodes = outline()
    const moduleId = nodes[0].children[0].children[0].id
    const result = deleteNode(nodes, moduleId)
    expect(result[0].children[0].children).toHaveLength(1)
    expect(result[0].children[0].children[0].name).toBe('Module 2')
  })

  it('removes a container node and its whole subtree', () => {
    const nodes = outline()
    const subtopicAId = nodes[0].children[0].id
    const result = deleteNode(nodes, subtopicAId)
    expect(result[0].children).toHaveLength(1)
    expect(result[0].children[0].name).toBe('Subtopic B')
  })
})

describe('moveSibling', () => {
  it('reorders two siblings within the same parent', () => {
    const nodes = outline()
    const subtopicA = nodes[0].children[0]
    const [module1, module2] = subtopicA.children

    const result = moveSibling(nodes, module1.id, module2.id)
    const reorderedModules = result[0].children[0].children
    expect(reorderedModules.map((n) => n.name)).toEqual(['Module 2', 'Module 1'])
  })

  it('is a no-op (same reference) when dragged onto itself', () => {
    const nodes = outline()
    const moduleId = nodes[0].children[0].children[0].id
    const result = moveSibling(nodes, moduleId, moduleId)
    expect(result).toBe(nodes)
  })

  it('is a no-op (same reference) across different parents', () => {
    const nodes = outline()
    const moduleInA = nodes[0].children[0].children[0].id
    const moduleInB = nodes[0].children[1].children[0].id
    const result = moveSibling(nodes, moduleInA, moduleInB)
    expect(result).toBe(nodes)
  })

  it('reorders top-level topics too', () => {
    const { nodes } = parseOutline(['Topic A (1h)', 'Topic B (1h)'].join('\n'))
    const result = moveSibling(nodes, nodes[0].id, nodes[1].id)
    expect(result.map((n) => n.name)).toEqual(['Topic B', 'Topic A'])
  })
})

describe('tree edits round-trip through serializeOutline', () => {
  it('produces outline text that reparses to the same edited tree', () => {
    const nodes = outline()
    const moduleId = nodes[0].children[0].children[0].id
    const edited = setNodeDuration(renameNode(nodes, moduleId, 'Renamed'), moduleId, { value: 3, unit: 'h' })

    const text = serializeOutline(edited)
    const reparsed = parseOutline(text)

    expect(reparsed.errors).toEqual([])
    expect(reparsed.nodes[0].children[0].children[0]).toMatchObject({
      name: 'Renamed',
      duration: { value: 3, unit: 'h' },
    })
  })
})
