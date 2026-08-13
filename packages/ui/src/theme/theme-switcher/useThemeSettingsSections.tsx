import type * as React from "react"
import { Moon, Sun, Monitor, Square, Blend } from "lucide-react"
import { Label } from "@components/label"
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
  FONT_SIZES,
  ACCENT_VIBRANCIES,
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
import { useUiLabels } from "@labels"
import { AxisControl } from "./AxisControl"

export type ThemeSettingsGroup =
  | "theme"
  | "color"
  | "background"
  | "layout"
  | "depth"

export interface ThemeSettingsSection {
  /** Stable identity, matching the axis name. */
  key: string
  /** Which page-layout group this section belongs to. */
  group: ThemeSettingsGroup
  node: React.ReactNode
}

/**
 * Builds the visible theme axis controls.
 *
 * Shared by ThemeSettings, which renders the sections, and ThemeSwitcher,
 * which needs to know whether ANY are visible so it can hide its trigger
 * entirely rather than offering a button that opens an empty panel.
 */
export function useThemeSettingsSections(): ThemeSettingsSection[] {
  const labels = useUiLabels()
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
    fontSize,
    accentVibrancy,
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
    setFontSize,
    setAccentVibrancy,
    setPresetAxis,
  } = useTheme()

  const modeOptions: { value: Mode; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: labels.theme.modes.light },
    { value: "dark", icon: Moon, label: labels.theme.modes.dark },
    { value: "system", icon: Monitor, label: labels.theme.modes.system },
  ]

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

  return [
    axes.mode &&
      !modeLocked && {
        key: "mode",
        group: "theme" as const,
        node: (
          <div key="mode" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.mode}
            </Label>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(value) => {
                if (value) setMode(value as Mode)
              }}
              variant="outline"
              size="sm"
              aria-label={labels.theme.axisLabels.mode}
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
      },
    axes.preset && {
      key: "preset",
      group: "theme" as const,
      node: (
        <div key="preset" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.preset}
          </Label>
          <ToggleGroup
            type="single"
            value={preset}
            onValueChange={(value) => {
              if (value) setPreset(value as PresetName)
            }}
            variant="outline"
            size="sm"
            aria-label={labels.theme.axisLabels.preset}
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
    },
    axes.presetAxes &&
      Object.keys(activePreset.axes).length > 0 && {
        key: "preset-axes",
        group: "theme" as const,
        node: (
          <div
            key="preset-axes"
            className="dr-theme-switcher-preset-axes-group"
          >
            {Object.entries(
              (activePreset as ThemePreset<Record<string, readonly string[]>>)
                .axes,
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
                    value={
                      presetAxisValues[preset]?.[axisName] ?? axisDef.default
                    }
                    onChange={(v) => setPresetAxis(axisName, v)}
                    label={axisDef.label}
                  />
                </div>
              ))}
          </div>
        ),
      },
    axes.backgroundStyle && {
      key: "backgroundStyle",
      group: "background" as const,
      node: (
        <div key="backgroundStyle" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.backgroundStyle}
          </Label>
          <ToggleGroup
            type="single"
            value={backgroundStyle}
            onValueChange={(value) => {
              if (value) setBackgroundStyle(value as BackgroundStyle)
            }}
            variant="outline"
            size="sm"
            aria-label={labels.theme.axisLabels.backgroundStyle}
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
    },
    axes.backgroundIntensity &&
      backgroundStyle === "gradient" && {
        key: "backgroundIntensity",
        group: "background" as const,
        node: (
          <div key="backgroundIntensity" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.backgroundIntensity}
            </Label>
            <AxisControl
              values={BACKGROUND_INTENSITIES}
              value={backgroundIntensity}
              onChange={setBackgroundIntensity}
              label={labels.theme.axisLabels.backgroundIntensity}
            />
          </div>
        ),
      },
    axes.gradientPattern &&
      backgroundStyle === "gradient" && {
        key: "gradientPattern",
        group: "background" as const,
        node: (
          <div key="gradientPattern" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.gradientPattern}
            </Label>
            <ToggleGroup
              type="single"
              value={gradientPattern}
              onValueChange={(value) => {
                if (value) setGradientPattern(value as GradientPattern)
              }}
              variant="outline"
              size="sm"
              aria-label={labels.theme.axisLabels.gradientPattern}
              className="dr-theme-switcher-toggle-group"
              data-cols={GRADIENT_PATTERNS.length}
            >
              {GRADIENT_PATTERNS.map((value) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className="capitalize"
                >
                  {value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ),
      },
    axes.accentColor && {
      key: "accentColor",
      group: "color" as const,
      node: (
        <div key="accentColor" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.accentColor}
          </Label>
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
    },
    axes.surfaceColor && {
      key: "surfaceColor",
      group: "color" as const,
      node: (
        <div key="surfaceColor" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.surfaceColor}
          </Label>
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
    },
    axes.density &&
      !isCommonAxisHidden("density") && {
        key: "density",
        group: "layout" as const,
        node: (
          <div key="density" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.density}
            </Label>
            <AxisControl
              values={DENSITIES}
              value={density}
              onChange={setDensity}
              label={labels.theme.axisLabels.density}
            />
          </div>
        ),
      },
    axes.fontSize &&
      !isCommonAxisHidden("fontSize") && {
        key: "fontSize",
        group: "layout" as const,
        node: (
          <div key="fontSize" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.fontSize}
            </Label>
            <AxisControl
              values={FONT_SIZES}
              value={fontSize}
              onChange={setFontSize}
              label={labels.theme.axisLabels.fontSize}
            />
          </div>
        ),
      },
    axes.accentVibrancy &&
      !isCommonAxisHidden("accentVibrancy") && {
        key: "accentVibrancy",
        group: "color" as const,
        node: (
          <div key="accentVibrancy" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.accentVibrancy}
            </Label>
            <AxisControl
              values={ACCENT_VIBRANCIES}
              value={accentVibrancy}
              onChange={setAccentVibrancy}
              label={labels.theme.axisLabels.accentVibrancy}
            />
          </div>
        ),
      },
    axes.elevation &&
      !isCommonAxisHidden("elevation") && {
        key: "elevation",
        group: "depth" as const,
        node: (
          <div key="elevation" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.elevation}
            </Label>
            <AxisControl
              values={ELEVATIONS}
              value={elevation}
              onChange={setElevation}
              label={labels.theme.axisLabels.elevation}
            />
          </div>
        ),
      },
    axes.buttonElevation &&
      !isCommonAxisHidden("buttonElevation") && {
        key: "buttonElevation",
        group: "depth" as const,
        node: (
          <div key="buttonElevation" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.buttonElevation}
            </Label>
            <AxisControl
              values={ELEVATIONS}
              value={buttonElevation}
              onChange={setButtonElevation}
              label={labels.theme.axisLabels.buttonElevation}
            />
          </div>
        ),
      },
    axes.radius &&
      !isCommonAxisHidden("radius") && {
        key: "radius",
        group: "layout" as const,
        node: (
          <div key="radius" className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels.radius}
            </Label>
            <AxisControl
              values={RADII}
              value={radius}
              onChange={setRadius}
              label={labels.theme.axisLabels.radius}
            />
          </div>
        ),
      },
  ].filter(Boolean) as ThemeSettingsSection[]
}
