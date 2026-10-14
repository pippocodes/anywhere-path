import type { OutlineNode } from '../types'
import { computeNodeMinutes } from './outlineParser'

/** Flattens a tree down to its leaf nodes (the actual checkable topics). */
export function collectLeaves(nodes: OutlineNode[]): OutlineNode[] {
  const leaves: OutlineNode[] = []
  function visit(node: OutlineNode) {
    if (node.children.length === 0) leaves.push(node)
    else node.children.forEach(visit)
  }
  nodes.forEach(visit)
  return leaves
}

export interface RoadmapProgress {
  totalCount: number
  completedCount: number
  totalMinutes: number
  completedMinutes: number
  percent: number // 0-100, by minutes (falls back to by-count if nothing has a duration)
}

/** Completion against a saved RoadmapDoc's `completedPaths` — weighted by minutes where available. */
export function computeProgress(nodes: OutlineNode[], completedPaths: string[] | undefined): RoadmapProgress {
  const leaves = collectLeaves(nodes)
  const done = new Set(completedPaths ?? [])

  const totalCount = leaves.length
  const completedCount = leaves.filter((n) => done.has(n.id)).length
  const totalMinutes = leaves.reduce((sum, n) => sum + computeNodeMinutes(n), 0)
  const completedMinutes = leaves.filter((n) => done.has(n.id)).reduce((sum, n) => sum + computeNodeMinutes(n), 0)

  const percent = totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return { totalCount, completedCount, totalMinutes, completedMinutes, percent }
}
