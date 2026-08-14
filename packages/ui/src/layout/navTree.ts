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
