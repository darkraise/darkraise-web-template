import { Moon, Sun, Monitor, Palette, Square, Blend } from "lucide-react"
import { Button } from "../components/button"
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover"
import { Label } from "../components/label"
import { Separator } from "../components/separator"
import { cn } from "../lib/utils"
import { useTheme } from "./use-theme"
import {
  ACCENT_COLORS,
  SURFACE_COLORS,
  SURFACE_STYLES,
  DENSITIES,
  ELEVATIONS,
  RADII,
} from "./types"
import type {
  Mode,
  AccentColor,
  SurfaceColor,
  BackgroundStyle,
  SurfaceStyle,
  Density,
  Elevation,
  Radius,
} from "./types"
import { accentColors } from "./palettes/accent-colors"
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
    backgroundStyle,
    mode,
    density,
    elevation,
    buttonElevation,
    radius,
    config,
    setAccentColor,
    setSurfaceColor,
    setSurfaceStyle,
    setBackgroundStyle,
    setMode,
    setDensity,
    setElevation,
    setButtonElevation,
    setRadius,
  } = useTheme()

  const bgOptions: {
    value: BackgroundStyle
    icon: typeof Square
    label: string
  }[] = [
    { value: "solid", icon: Square, label: "Solid" },
    { value: "gradient", icon: Blend, label: "Gradient" },
  ]

  const { axes } = config.switcher

  const visibleSections = [
    axes.mode && (
      <div key="mode">
        <Label className="text-muted-foreground text-xs font-medium">
          Mode
        </Label>
        <div className="mt-1.5 flex gap-1">
          {modeOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={mode === value ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode(value)}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>
    ),
    axes.backgroundStyle && (
      <div key="backgroundStyle">
        <Label className="text-muted-foreground text-xs font-medium">
          Background
        </Label>
        <div className="mt-1.5 flex gap-1">
          {bgOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={backgroundStyle === value ? "default" : "outline"}
              className="flex-1"
              onClick={() => setBackgroundStyle(value)}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>
    ),
    axes.accentColor && (
      <div key="accentColor">
        <Label className="text-muted-foreground text-xs font-medium">
          Accent Color
        </Label>
        <div className="mt-1.5 grid grid-cols-9 gap-1.5">
          {ACCENT_COLORS.map((color: AccentColor) => (
            <button
              key={color}
              type="button"
              title={color}
              className={cn(
                "h-6 w-6 cursor-pointer rounded-full border-2 transition-transform hover:scale-110",
                accentColor === color
                  ? "border-foreground scale-110"
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
    ),
    axes.surfaceColor && (
      <div key="surfaceColor">
        <Label className="text-muted-foreground text-xs font-medium">
          Surface Color
        </Label>
        <div className="mt-1.5 grid grid-cols-9 gap-1.5">
          {SURFACE_COLORS.map((color: SurfaceColor) => {
            const previewHsl =
              color === "slate" ? "215 16% 47%" : accentColors[color][500]
            return (
              <button
                key={color}
                type="button"
                title={color}
                className={cn(
                  "h-6 w-6 cursor-pointer rounded-full border-2 transition-transform hover:scale-110",
                  surfaceColor === color
                    ? "border-foreground scale-110"
                    : "border-transparent",
                )}
                style={{
                  backgroundColor: `hsl(${previewHsl})`,
                }}
                onClick={() => setSurfaceColor(color)}
              />
            )
          })}
        </div>
      </div>
    ),
    axes.surfaceStyle && (
      <div key="surfaceStyle">
        <Label className="text-muted-foreground text-xs font-medium">
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
                  "cursor-pointer rounded-md px-2 py-1.5 text-left text-xs transition-colors",
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
    ),
    axes.density && (
      <div key="density">
        <Label className="text-muted-foreground text-xs font-medium">
          Density
        </Label>
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          {DENSITIES.map((d: Density) => (
            <button
              key={d}
              type="button"
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 text-left text-xs capitalize transition-colors",
                density === d
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => setDensity(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    ),
    axes.elevation && (
      <div key="elevation">
        <Label className="text-muted-foreground text-xs font-medium">
          Elevation
        </Label>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {ELEVATIONS.map((e: Elevation) => (
            <button
              key={e}
              type="button"
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 text-center text-xs capitalize transition-colors",
                elevation === e
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => setElevation(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    ),
    axes.buttonElevation && (
      <div key="buttonElevation">
        <Label className="text-muted-foreground text-xs font-medium">
          Button Elevation
        </Label>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {ELEVATIONS.map((e: Elevation) => (
            <button
              key={e}
              type="button"
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 text-center text-xs capitalize transition-colors",
                buttonElevation === e
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => setButtonElevation(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    ),
    axes.radius && (
      <div key="radius">
        <Label className="text-muted-foreground text-xs font-medium">
          Radius
        </Label>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {RADII.map((r: Radius) => (
            <button
              key={r}
              type="button"
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 text-center text-xs capitalize transition-colors",
                radius === r
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => setRadius(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    ),
  ].filter(Boolean)

  if (visibleSections.length === 0) return null

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
          {visibleSections.map((section, i) => (
            <div key={i}>
              {section}
              {i < visibleSections.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
