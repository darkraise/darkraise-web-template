"use client"

import {
  useMenu,
  type UseMenuOptions,
  type UseMenuReturn,
} from "@components/_internal/useMenu"

export type UseDropdownMenuOptions = UseMenuOptions
export type UseDropdownMenuReturn = UseMenuReturn

export function useDropdownMenu(
  options: UseDropdownMenuOptions = {},
): UseDropdownMenuReturn {
  return useMenu(options)
}
