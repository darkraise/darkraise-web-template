import { createContext, useContext } from "react"
import type { NavItem } from "@layout/types"

/** The one item the current path selects, shared by every row of a nav. */
export const ActiveNavItemContext = createContext<NavItem | undefined>(
  undefined,
)

export function useActiveNavItem(): NavItem | undefined {
  return useContext(ActiveNavItemContext)
}
