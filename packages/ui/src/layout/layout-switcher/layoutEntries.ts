import { PanelLeft, PanelTop, Columns3, Columns2 } from "lucide-react"
import type { LayoutVariant } from "@layout/layoutStore"

type LayoutEntry = {
  value: LayoutVariant
  label: string
  icon: typeof PanelLeft
}

export const DEFAULT_LAYOUT: LayoutEntry = {
  value: "sidebar",
  label: "Sidebar",
  icon: PanelLeft,
}

const LAYOUTS: LayoutEntry[] = [
  DEFAULT_LAYOUT,
  { value: "top-nav", label: "Top Navigation", icon: PanelTop },
  { value: "stacked", label: "Stacked", icon: Columns3 },
  { value: "split-panel", label: "Split Panel", icon: Columns2 },
]

export function layoutEntries(variants?: LayoutVariant[]): LayoutEntry[] {
  return variants
    ? LAYOUTS.filter((entry) => variants.includes(entry.value))
    : LAYOUTS
}
