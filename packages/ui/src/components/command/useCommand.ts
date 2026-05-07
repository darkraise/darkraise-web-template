"use client"

import {
  useCombobox,
  type UseComboboxOptions,
  type UseComboboxReturn,
} from "@components/combobox"

export type UseCommandOptions = UseComboboxOptions
export type UseCommandReturn = UseComboboxReturn

export function useCommand(options: UseCommandOptions): UseCommandReturn {
  return useCombobox(options)
}
