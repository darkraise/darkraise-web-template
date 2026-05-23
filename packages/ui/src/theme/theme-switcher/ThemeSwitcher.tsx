import { Moon, Sun, Monitor, Palette, Square, Blend } from "lucide-react"
import { Button } from "@components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@components/popover"
import { Label } from "@components/label"
import { Separator } from "@components/separator"
import { Slider } from "@components/slider"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { useTheme } from "@theme/useTheme"
import {
  ACCENT_COLORS,
  SURFACE_COLORS,
  BACKGROUND_INTENSITIES,
  GRADIENT_PATTERNS,
  DENSITIES,
  ELEVATIONS,
  RADII,
} from "@theme/types"
import type {
  Mode,
  AccentColor,
  SurfaceColor,
  BackgroundStyle,
  GradientPattern,
} from "@theme/types"
import {
  presets,
  PRESET_NAMES,
  type PresetName,
  type ThemePreset,
} from "@theme/presets"
import { accentColors } from "@theme/palettes/accentColors"
import "./theme-switcher.css"

const modeOptions: { value: Mode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
]

/** Render an ordinal 4-value axis as a stepped slider (cleaner than a
 *  4-cell toggle group at the popover's compact width). Lower-arity or
 *  categorical axes fall back to the original toggle group. The current
 *  value name is shown to the right of the slider thumb so the discrete
 *  position has a readable label. */
function AxisControl<V extends string>({
  values,
  value,
  onChange,
}: {
  values: readonly V[]
  value: V
  onChange: (v: V) => void
}) {
  if (values.length === 4) {
    const index = Math.max(0, values.indexOf(value))
    return (
      <div className="dr-theme-switcher-slider-control">
        <Slider
          value={[index]}
          min={0}
          max={values.length - 1}
          step={1}
          showSteps
          onValueChange={([i]) => {
            if (typeof i === "number" && values[i]) onChange(values[i])
          }}
        />
        <span className="dr-theme-switcher-slider-value">{value}</span>
      </div>
    )
  }
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as V)
      }}
      variant="outline"
      size="sm"
      className="dr-theme-switcher-toggle-group"
      data-cols={values.length}
    >
      {values.map((v) => (
        <ToggleGroupItem key={v} value={v} className="capitalize">
          {v}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function ThemeSwitcher() {
  const {
    accentColor,
    surfaceColor,
    preset,
    backgroundStyle,
    backgroundIntensity,
    gradientPattern,
    mode,
    density,
    elevation,
    buttonElevation,
    radius,
    config,
    activePreset,
    presetAxisValues,
    setAccentColor,
    setSurfaceColor,
    setPreset,
    setBackgroundStyle,
    setBackgroundIntensity,
    setGradientPattern,
    setMode,
    setDensity,
    setElevation,
    setButtonElevation,
    setRadius,
    setPresetAxis,
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

  // When the active preset declares a single supported mode (e.g. neon =
  // dark-only), the Mode section is hidden entirely — there's no useful
  // choice for the user to make, and the ThemeProvider has already
  // auto-switched to the supported mode. Presets that allow multiple
  // modes still render the section normally.
  const supportedModes = activePreset.supportedModes
  const modeLocked = !!supportedModes && supportedModes.length === 1

  // Presets can declare `hiddenCommonAxes` to hide common-axis pickers
  // they conceptually take over with their own preset-specific axes
  // (e.g. neon hides Elevation + Button Elevation because its `glow`
  // axis drives the same tokens with a different recipe shape).
  const hiddenCommonAxes = activePreset.hiddenCommonAxes ?? []
  const isCommonAxisHidden = (name: string): boolean =>
    (hiddenCommonAxes as readonly string[]).includes(name)

  const visibleSections = [
    axes.mode && !modeLocked && (
      <div key="mode" className="dr-theme-switcher-row">
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
    axes.preset && (
      <div key="preset" className="dr-theme-switcher-row">
        <Label className="dr-theme-switcher-section-label">Preset</Label>
        <ToggleGroup
          type="single"
          value={preset}
          onValueChange={(value) => {
            if (value) setPreset(value as PresetName)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          /* Cap at 3 cols so 6+ presets wrap to multiple rows instead
             of cramming into a single horizontal strip too narrow to
             show labels like "Brutalist" or "Playful". Each cell ends
             up ~92px wide which fits the longest current label. */
          data-cols={Math.min(PRESET_NAMES.length, 3)}
        >
          {PRESET_NAMES.map((name) => (
            <ToggleGroupItem key={name} value={name}>
              {presets[name].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.presetAxes && Object.keys(activePreset.axes).length > 0 && (
      <div key="preset-axes" className="dr-theme-switcher-preset-axes-group">
        {Object.entries(
          (activePreset as ThemePreset<Record<string, readonly string[]>>).axes,
        )
          .sort(([, a], [, b]) => (a.order ?? 99) - (b.order ?? 99))
          .map(([axisName, axisDef]) => (
            <div
              key={`preset-axis-${axisName}`}
              className="dr-theme-switcher-preset-axis"
            >
              <Label className="dr-theme-switcher-section-label">
                {axisDef.label}
              </Label>
              <AxisControl
                values={axisDef.values}
                value={presetAxisValues[preset]?.[axisName] ?? axisDef.default}
                onChange={(v) => setPresetAxis(axisName, v)}
              />
            </div>
          ))}
      </div>
    ),
    axes.backgroundStyle && (
      <div key="backgroundStyle" className="dr-theme-switcher-row">
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
    axes.backgroundIntensity && backgroundStyle === "gradient" && (
      <div key="backgroundIntensity" className="dr-theme-switcher-row">
        <Label className="dr-theme-switcher-section-label">
          Background Intensity
        </Label>
        <AxisControl
          values={BACKGROUND_INTENSITIES}
          value={backgroundIntensity}
          onChange={setBackgroundIntensity}
        />
      </div>
    ),
    axes.gradientPattern && backgroundStyle === "gradient" && (
      <div key="gradientPattern" className="dr-theme-switcher-row">
        <Label className="dr-theme-switcher-section-label">
          Gradient Pattern
        </Label>
        <ToggleGroup
          type="single"
          value={gradientPattern}
          onValueChange={(value) => {
            if (value) setGradientPattern(value as GradientPattern)
          }}
          variant="outline"
          size="sm"
          className="dr-theme-switcher-toggle-group"
          data-cols={GRADIENT_PATTERNS.length}
        >
          {GRADIENT_PATTERNS.map((value) => (
            <ToggleGroupItem key={value} value={value} className="capitalize">
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    ),
    axes.accentColor && (
      <div key="accentColor" className="dr-theme-switcher-row">
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
      <div key="surfaceColor" className="dr-theme-switcher-row">
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
    axes.density && !isCommonAxisHidden("density") && (
      <div key="density" className="dr-theme-switcher-row">
        <Label className="dr-theme-switcher-section-label">Density</Label>
        <AxisControl values={DENSITIES} value={density} onChange={setDensity} />
      </div>
    ),
    axes.elevation && !isCommonAxisHidden("elevation") && (
      <div key="elevation" className="dr-theme-switcher-row">
        <Label className="dr-theme-switcher-section-label">Elevation</Label>
        <AxisControl
          values={ELEVATIONS}
          value={elevation}
          onChange={setElevation}
        />
      </div>
    ),
    axes.buttonElevation && !isCommonAxisHidden("buttonElevation") && (
      <div key="buttonElevation" className="dr-theme-switcher-row">
        <Label className="dr-theme-switcher-section-label">
          Button Elevation
        </Label>
        <AxisControl
          values={ELEVATIONS}
          value={buttonElevation}
          onChange={setButtonElevation}
        />
      </div>
    ),
    axes.radius && !isCommonAxisHidden("radius") && (
      <div key="radius" className="dr-theme-switcher-row">
        <Label className="dr-theme-switcher-section-label">Radius</Label>
        <AxisControl values={RADII} value={radius} onChange={setRadius} />
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
      <PopoverContent className="w-[28rem]" align="end">
        <div className="space-y-2">
          {visibleSections.map((section, i) => (
            <div key={i}>
              {section}
              {i < visibleSections.length - 1 && <Separator className="mt-2" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
