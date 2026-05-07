"use client"

import {
  useMenu,
  type UseMenuOptions,
  type UseMenuReturn,
} from "@components/_internal/useMenu"

export type UseSelectOptions = UseMenuOptions
export type UseSelectReturn = UseMenuReturn

export function useSelect(options: UseSelectOptions = {}): UseSelectReturn {
  return useMenu(options)
}
