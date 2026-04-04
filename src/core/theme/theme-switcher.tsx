import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import { Label } from "@/core/components/ui/label"
import { Separator } from "@/core/components/ui/separator"
import { cn } from "@/core/lib/utils"
import { useTheme } from "./use-theme"
import { ACCENT_COLORS, SURFACE_COLORS, SURFACE_STYLES } from "./types"
import type { Mode, AccentColor, SurfaceColor, SurfaceStyle } from "./types"
import { accentColors } from "./palettes/accent-colors"
import { surfaceColors } from "./palettes/surface-colors"
import { surfaceStyles } from "./styles/surface-styles"

const modeOptions: { value: Mode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
]

export function ThemeSwitcher() {
  const {
    accentColor,
    surfaceColor,
    surfaceStyle,
    mode,
    setAccentColor,
    setSurfaceColor,
    setSurfaceStyle,
    setMode,
  } = useTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Customize theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Mode
            </Label>
            <div className="mt-1.5 flex gap-1">
              {modeOptions.map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={mode === value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMode(value)}
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Accent Color
            </Label>
            <div className="mt-1.5 grid grid-cols-9 gap-1.5">
              {ACCENT_COLORS.map((color: AccentColor) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    accentColor === color
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                  style={{
                    backgroundColor: `hsl(${accentColors[color][500]})`,
                  }}
                  onClick={() => setAccentColor(color)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Surface Color
            </Label>
            <div className="mt-1.5 grid grid-cols-6 gap-1.5">
              {SURFACE_COLORS.map((color: SurfaceColor) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    surfaceColor === color
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                  style={{
                    backgroundColor: `hsl(${surfaceColors[color][500]})`,
                  }}
                  onClick={() => setSurfaceColor(color)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Surface Style
            </Label>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {SURFACE_STYLES.map((style: SurfaceStyle) => {
                const recipe = surfaceStyles[style]
                return (
                  <button
                    key={style}
                    type="button"
                    className={cn(
                      "rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      surfaceStyle === style
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => setSurfaceStyle(style)}
                  >
                    {recipe.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
