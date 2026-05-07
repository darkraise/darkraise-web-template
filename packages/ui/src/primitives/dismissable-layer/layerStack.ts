interface LayerEntry {
  id: symbol
  getNode: () => HTMLElement | null
}

const stack: LayerEntry[] = []

export function pushLayer(getNode: () => HTMLElement | null): symbol {
  const id = Symbol("dismissable-layer")
  stack.push({ id, getNode })
  return id
}

export function popLayer(id: symbol): void {
  const idx = stack.findIndex((entry) => entry.id === id)
  if (idx >= 0) stack.splice(idx, 1)
}

// The topmost layer is the deepest in the DOM tree — the layer whose node
// is not contained by any other registered layer's node.
export function isTopLayer(id: symbol): boolean {
  const target = stack.find((entry) => entry.id === id)
  if (!target) return false
  const targetNode = target.getNode()
  if (!targetNode) return false
  for (const entry of stack) {
    if (entry.id === id) continue
    const node = entry.getNode()
    if (node && targetNode.contains(node) && targetNode !== node) {
      // Another layer lives inside this one — this is not the topmost.
      return false
    }
  }
  return true
}
