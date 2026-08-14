import type { NavItem } from "./types"

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
