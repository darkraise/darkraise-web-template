// One-time migration: `canvasTint` was folded into `backgroundIntensity`. The
// two axes shared three value names (subtle, balanced, vivid) and `neutral`
// carries over as the merged axis's new lowest step, so a stored tint seeds the
// merged key directly with no value mapping.
//
// This matters most for the exact user the tint axis was built for — someone on
// a solid background who set `neutral` to kill the dark-mode page tint. Without
// the seed they silently get the tint back.
//
// A value already stored under the merged key wins: it was a deliberate choice
// on the axis that survives, whereas the tint is being retired.
export function migrateCanvasTintKey(ls: Storage): void {
  const oldKey = "theme-canvas-tint"
  const newKey = "theme-bg-intensity"
  const oldVal = ls.getItem(oldKey)
  if (oldVal === null) return
  if (ls.getItem(newKey) === null) {
    ls.setItem(newKey, oldVal)
  }
  ls.removeItem(oldKey)
}
