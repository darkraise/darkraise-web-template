"use client"

import {
  useMenu,
  type UseMenuOptions,
  type UseMenuReturn,
} from "@components/_internal/useMenu"

export type UseContextMenuOptions = UseMenuOptions
export type UseContextMenuReturn = UseMenuReturn

export function useContextMenu(
  options: UseContextMenuOptions = {},
): UseContextMenuReturn {
  return useMenu(options)
}
