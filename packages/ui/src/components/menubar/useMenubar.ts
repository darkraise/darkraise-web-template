"use client"

import {
  useMenu,
  type UseMenuOptions,
  type UseMenuReturn,
} from "@components/_internal/useMenu"

export type UseMenubarOptions = UseMenuOptions
export type UseMenubarReturn = UseMenuReturn

export function useMenubar(options: UseMenubarOptions = {}): UseMenubarReturn {
  return useMenu({ orientation: "horizontal", ...options })
}
