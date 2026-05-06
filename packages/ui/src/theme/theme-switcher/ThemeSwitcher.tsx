import { Moon, Sun, Monitor, Palette, Square, Blend } from "lucide-react"
import { Button } from "@components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@components/popover"
import { Label } from "@components/label"
import { Separator } from "@components/separator"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { useTheme } from "@theme/useTheme"
import {
  ACCENT_COLORS,
  SURFACE_COLORS,
  SURFACE_STYLES,
  DENSITIES,
  ELEVATIONS,
  RADII,
} from "@theme/types"
import type {
  Mode,
  AccentColor,
  SurfaceColor,
  BackgroundStyle,
  SurfaceStyle,
  Density,
  Elevation,
  Radius,
} from "@theme/types"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceStyles } from "@theme/styles/surfaceStyles"
import "./theme-switcher.css"

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
        <Label className="dr-theme-switcher-section-label">Mode</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value) setMode(value as Mode)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols="3"
        >
          {modeOptions.map(({ value, icon: Icon, label }) => (
            <ToggleGroupItem key={value} value={value}>
              <Icon className="dr-theme-switcher-row-icon" />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.backgroundStyle && (
      <div key="backgroundStyle">
        <Label className="dr-theme-switcher-section-label">Background</Label>
        <ToggleGroup
          type="single"
          value={backgroundStyle}
          onValueChange={(value) => {
            if (value) setBackgroundStyle(value as BackgroundStyle)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols="2"
        >
          {bgOptions.map(({ value, icon: Icon, label }) => (
            <ToggleGroupItem key={value} value={value}>
              <Icon className="dr-theme-switcher-row-icon" />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.accentColor && (
      <div key="accentColor">
        <Label className="dr-theme-switcher-section-label">Accent Color</Label>
        <div className="dr-theme-switcher-swatch-grid">
          {ACCENT_COLORS.map((color: AccentColor) => (
            <button
              key={color}
              type="button"
              title={color}
              className="dr-theme-switcher-swatch"
              data-active={accentColor === color ? "true" : undefined}
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
        <Label className="dr-theme-switcher-section-label">Surface Color</Label>
        <div className="dr-theme-switcher-swatch-grid">
          {SURFACE_COLORS.map((color: SurfaceColor) => {
            const previewHsl =
              color === "slate" ? "215 16% 47%" : accentColors[color][500]
            return (
              <button
                key={color}
                type="button"
                title={color}
                className="dr-theme-switcher-swatch"
                data-active={surfaceColor === color ? "true" : undefined}
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
        <Label className="dr-theme-switcher-section-label">Surface Style</Label>
        <ToggleGroup
          type="single"
          value={surfaceStyle}
          onValueChange={(value) => {
            if (value) setSurfaceStyle(value as SurfaceStyle)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols="2"
        >
          {SURFACE_STYLES.map((style: SurfaceStyle) => (
            <ToggleGroupItem key={style} value={style}>
              {surfaceStyles[style].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.density && (
      <div key="density">
        <Label className="dr-theme-switcher-section-label">Density</Label>
        <ToggleGroup
          type="single"
          value={density}
          onValueChange={(value) => {
            if (value) setDensity(value as Density)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols="2"
        >
          {DENSITIES.map((d: Density) => (
            <ToggleGroupItem key={d} value={d} className="capitalize">
              {d}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.elevation && (
      <div key="elevation">
        <Label className="dr-theme-switcher-section-label">Elevation</Label>
        <ToggleGroup
          type="single"
          value={elevation}
          onValueChange={(value) => {
            if (value) setElevation(value as Elevation)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols="4"
        >
          {ELEVATIONS.map((e: Elevation) => (
            <ToggleGroupItem key={e} value={e} className="capitalize">
              {e}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.buttonElevation && (
      <div key="buttonElevation">
        <Label className="dr-theme-switcher-section-label">
          Button Elevation
        </Label>
        <ToggleGroup
          type="single"
          value={buttonElevation}
          onValueChange={(value) => {
            if (value) setButtonElevation(value as Elevation)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols="4"
        >
          {ELEVATIONS.map((e: Elevation) => (
            <ToggleGroupItem key={e} value={e} className="capitalize">
              {e}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.radius && (
      <div key="radius">
        <Label className="dr-theme-switcher-section-label">Radius</Label>
        <ToggleGroup
          type="single"
          value={radius}
          onValueChange={(value) => {
            if (value) setRadius(value as Radius)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols="4"
        >
          {RADII.map((r: Radius) => (
            <ToggleGroupItem key={r} value={r} className="capitalize">
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
