export type SidebarActiveBar = "bar" | "ring" | "both"

/**
 * Collapses the prop's boolean shorthands onto the three-way vocabulary.
 * `undefined` survives as `undefined` — the caller must be able to tell
 * "leave the preset alone" apart from any of the three explicit looks.
 */
export function resolveActiveBar(
  activeBar: boolean | SidebarActiveBar | undefined,
): SidebarActiveBar | undefined {
  if (activeBar === undefined) return undefined
  if (activeBar === true) return "bar"
  if (activeBar === false) return "ring"
  return activeBar
}
