interface LayerEntry {
  id: symbol
  /** Every layer this one renders inside, outermost first — read from React, so it crosses portals. */
  ancestors: readonly symbol[]
  getNode: () => HTMLElement | null
}

const stack: LayerEntry[] = []

export function pushLayer(
  id: symbol,
  ancestors: readonly symbol[],
  getNode: () => HTMLElement | null,
): void {
  stack.push({ id, ancestors, getNode })
}

export function popLayer(id: symbol): void {
  const idx = stack.findIndex((entry) => entry.id === id)
  if (idx >= 0) stack.splice(idx, 1)
}

// A pointer/focus target counts as "inside" a layer when it lands within that
// layer's own node OR within any layer stacked above it (opened later). Nested
// floating layers — e.g. a Select opened inside a Dialog — portal their content
// out of the DOM subtree, so `node.contains` alone cannot see them; consulting
// the stack restores the nesting relationship and stops the lower layer from
// treating a click on the higher layer as an outside dismissal.
export function isTargetInLayerOrAbove(id: symbol, target: Node): boolean {
  const idx = stack.findIndex((entry) => entry.id === id)
  if (idx < 0) return false
  for (const entry of stack.slice(idx)) {
    const node = entry.getNode()
    if (node && node.contains(target)) return true
  }
  return false
}

// A layer is topmost while no other registered layer renders inside it. The
// nesting comes from React rather than from the DOM or the push order: a
// nested layer that portals out (a dialog opened from a sheet) is not inside
// its parent's node, and React runs a child's effects before its parent's, so
// a layer mounted in the same commit as its parent is pushed first.
export function isTopLayer(id: symbol): boolean {
  if (!stack.some((entry) => entry.id === id)) return false
  return !stack.some((entry) => entry.ancestors.includes(id))
}
