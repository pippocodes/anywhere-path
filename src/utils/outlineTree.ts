import { arrayMove } from '@dnd-kit/sortable'
import type { Duration, OutlineNode } from '../types'

export function renameNode(nodes: OutlineNode[], id: string, name: string): OutlineNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, name }
    if (node.children.length > 0) return { ...node, children: renameNode(node.children, id, name) }
    return node
  })
}

export function setNodeDuration(nodes: OutlineNode[], id: string, duration: Duration): OutlineNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, duration }
    if (node.children.length > 0) return { ...node, children: setNodeDuration(node.children, id, duration) }
    return node
  })
}

export function deleteNode(nodes: OutlineNode[], id: string): OutlineNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => (node.children.length > 0 ? { ...node, children: deleteNode(node.children, id) } : node))
}

interface Location {
  siblings: OutlineNode[]
  index: number
}

function locate(nodes: OutlineNode[], id: string): Location | null {
  const index = nodes.findIndex((node) => node.id === id)
  if (index !== -1) return { siblings: nodes, index }
  for (const node of nodes) {
    if (node.children.length > 0) {
      const found = locate(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Reorders `activeId` to `overId`'s position, but only when they're
 * siblings (same parent) — dragging across levels is a no-op (returns the
 * original `nodes` reference unchanged) since reparenting via drag isn't
 * supported yet.
 */
export function moveSibling(nodes: OutlineNode[], activeId: string, overId: string): OutlineNode[] {
  const activeLoc = locate(nodes, activeId)
  const overLoc = locate(nodes, overId)
  if (!activeLoc || !overLoc || activeLoc.siblings !== overLoc.siblings) return nodes
  if (activeLoc.index === overLoc.index) return nodes

  function rebuild(list: OutlineNode[]): OutlineNode[] {
    if (list === activeLoc!.siblings) {
      return arrayMove(list, activeLoc!.index, overLoc!.index)
    }
    return list.map((node) => (node.children.length > 0 ? { ...node, children: rebuild(node.children) } : node))
  }

  return rebuild(nodes)
}
