import { PanelLeft, PanelTop, Columns3, Columns2 } from "lucide-react"
import { Button } from "@components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import { useLayoutStore, type LayoutVariant } from "@layout/layoutStore"

type LayoutEntry = {
  value: LayoutVariant
  label: string
  icon: typeof PanelLeft
}

const DEFAULT_LAYOUT: LayoutEntry = {
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

export interface LayoutSwitcherProps {
  /**
   * Which variants this app can render. `split-panel` needs a `panel`, so an
   * app without one leaves it out rather than offering a shell it cannot
   * build. Defaults to all four.
   */
  variants?: LayoutVariant[]
}

export function LayoutSwitcher({ variants }: LayoutSwitcherProps = {}) {
  const { layout, setLayout } = useLayoutStore()
  const entries = variants
    ? LAYOUTS.filter((entry) => variants.includes(entry.value))
    : LAYOUTS
  const current = entries.find((l) => l.value === layout) ?? DEFAULT_LAYOUT
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CurrentIcon className="size-[var(--icon-size)]" />
          <span className="sr-only">Switch layout</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {entries.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setLayout(value)}
            className="dr-layout-switcher-item"
            data-active={layout === value ? "true" : undefined}
          >
            <Icon className="dr-layout-switcher-item-icon" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
