"use client"

import * as React from "react"

import type { UsePopoverReturn } from "./usePopover"

interface PopoverContextValue extends UsePopoverReturn {
  setReference: (node: HTMLElement | null) => void
  setAnchor: (node: HTMLElement | null) => void
  reference: HTMLElement | null
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopoverContext(consumer: string): PopoverContextValue {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Popover>`)
  return ctx
}

export { PopoverContext, usePopoverContext }
export type { PopoverContextValue }
