"use client"

import {
  useRadioGroup,
  type UseRadioGroupOptions,
} from "@components/radio-group"

export type SegmentGroupOrientation = "horizontal" | "vertical"

export type UseSegmentGroupOptions = UseRadioGroupOptions

export function useSegmentGroup(options: UseSegmentGroupOptions) {
  return useRadioGroup(options)
}
