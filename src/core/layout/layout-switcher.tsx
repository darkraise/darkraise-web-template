import { PanelLeft, PanelTop, Columns3 } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { useLayoutStore, type LayoutVariant } from "./layout-store"
import { cn } from "@/core/lib/utils"

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
]

export function LayoutSwitcher() {
  const { layout, setLayout } = useLayoutStore()
  const current = LAYOUTS.find((l) => l.value === layout) ?? DEFAULT_LAYOUT
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Switch layout</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LAYOUTS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setLayout(value)}
            className={cn(layout === value && "bg-accent")}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
