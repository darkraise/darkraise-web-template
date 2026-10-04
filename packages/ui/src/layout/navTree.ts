import type { NavGroup, NavItem } from "./types"

/**
 * Exact match, or a strict path-segment prefix — the trailing slash guards
 * against `/settings` claiming `/settings-old`.
 */
export function isPathMatch(currentPath: string, href: string): boolean {
  return currentPath === href || currentPath.startsWith(href + "/")
}

/**
 * Whether an item, or anything nested under it, covers the current path.
 * A child's `href` need not sit under its parent's, so this walks the tree
 * rather than trusting the parent's prefix alone.
 */
export function coversPath(item: NavItem, currentPath: string): boolean {
  if (isPathMatch(currentPath, item.href)) return true
  return item.children?.some((child) => coversPath(child, currentPath)) ?? false
}

/**
 * The one item the current path selects: the longest `href` that is the path
 * or a whole-segment prefix of it. On a tie the deeper item wins, so an index
 * child sharing its parent's `href` is the active one, not both.
 */
export function findActiveItem(
  items: readonly NavItem[],
  currentPath: string,
): NavItem | undefined {
  let active: NavItem | undefined
  let activeDepth = -1
  const queue = items.map((item) => ({ item, depth: 0 }))
  for (const { item, depth } of queue) {
    if (isPathMatch(currentPath, item.href)) {
      const longer = !active || item.href.length > active.href.length
      const deeperTie =
        active !== undefined &&
        item.href.length === active.href.length &&
        depth > activeDepth
      if (longer || deeperTie) {
        active = item
        activeDepth = depth
      }
    }
    for (const child of item.children ?? []) {
      queue.push({ item: child, depth: depth + 1 })
    }
  }
  return active
}

/** Whether `target` is `item` or sits anywhere below it. */
export function containsItem(
  item: NavItem,
  target: NavItem | undefined,
): boolean {
  if (!target) return false
  if (item === target) return true
  return item.children?.some((child) => containsItem(child, target)) ?? false
}

/**
 * Every reachable destination in the tree, depth-first, for the command
 * palette. Nested items are real pages, so leaving them out would make
 * nesting an item the same as hiding it from search.
 *
 * De-duplicated by `href`: a section parent commonly points at the same page
 * as its index child, and `SearchCommand` keys its rows on the href.
 */
export function flattenNavItems(
  nav: NavGroup[],
): Array<{ label: string; href: string }> {
  const seen = new Set<string>()
  const flat: Array<{ label: string; href: string }> = []

  const walk = (items: NavItem[]) => {
    for (const item of items) {
      if (!seen.has(item.href)) {
        seen.add(item.href)
        flat.push({ label: item.label, href: item.href })
      }
      if (item.children) walk(item.children)
    }
  }

  for (const group of nav) walk(group.items)
  return flat
}
