"use client"

import {
  useDialog,
  type UseDialogOptions,
  type UseDialogReturn,
} from "@components/dialog"

export type UseSheetOptions = UseDialogOptions
export type UseSheetReturn = UseDialogReturn

export function useSheet(options: UseSheetOptions = {}): UseSheetReturn {
  return useDialog(options)
}
