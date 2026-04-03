import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { useTheme } from "./use-theme"
import { THEMES, MODES } from "./types"
import type { Mode } from "./types"

const modeIcons: Record<Mode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ThemeSwitcher() {
  const { theme, mode, setTheme, setMode } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        {MODES.map((m) => {
          const Icon = modeIcons[m]
          return (
            <DropdownMenuItem
              key={m}
              onClick={() => setMode(m)}
              className={mode === m ? "bg-accent" : ""}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="capitalize">{m}</span>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color</DropdownMenuLabel>
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={theme === t ? "bg-accent" : ""}
          >
            <span className="capitalize">{t}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
