"use client"

import {
  useMenu,
  type UseMenuOptions,
  type UseMenuReturn,
} from "@components/_internal/useMenu"

export type UseNavigationMenuOptions = UseMenuOptions
export type UseNavigationMenuReturn = UseMenuReturn

export function useNavigationMenu(
  options: UseNavigationMenuOptions = {},
): UseNavigationMenuReturn {
  return useMenu({ orientation: "horizontal", ...options })
}
