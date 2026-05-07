"use client"

import {
  useDialog,
  type UseDialogOptions,
  type UseDialogReturn,
} from "@components/dialog"

export type UseAlertDialogOptions = Omit<UseDialogOptions, "role">
export type UseAlertDialogReturn = UseDialogReturn

export function useAlertDialog(
  options: UseAlertDialogOptions = {},
): UseAlertDialogReturn {
  return useDialog({ ...options, role: "alertdialog" })
}
