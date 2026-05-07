"use client"

import {
  useVirtualizer,
  type UseVirtualizerOptions,
  type UseVirtualizerReturn,
} from "@primitives/virtualizer"

export type UseVirtualizedDropdownMenuOptions = UseVirtualizerOptions
export type UseVirtualizedDropdownMenuReturn = UseVirtualizerReturn

export function useVirtualizedDropdownMenu(
  options: UseVirtualizedDropdownMenuOptions,
): UseVirtualizedDropdownMenuReturn {
  return useVirtualizer(options)
}
