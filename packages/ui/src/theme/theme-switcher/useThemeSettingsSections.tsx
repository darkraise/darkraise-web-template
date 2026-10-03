import { useUiText } from "../../i18n/useUiText"
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
  SIDEBAR_ACTIVE_BARS,
  FONT_SIZES,
  GLOW_LEVELS,
  CONTRASTS,
  DARK_ACCENT_CHROMAS,
  TINT_WITH_ACCENT,
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
import { resolveAccentScale } from "@theme/engine/generateTokens"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { AXES } from "@theme/axes/registry"
import { useUiLabels } from "@labels"
import { AxisControl } from "./AxisControl"
import { isAxisVisible, type AxisVisibilityInput } from "./axisVisibility"

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
/* "Auto" rather than "Default" or "Preset": both of those already name other
   things in this panel — the Default preset and the Preset section — and the
   collision is real enough that queries for one find the other. */
const SIDEBAR_ACTIVE_BAR_LABELS: Record<
  (typeof SIDEBAR_ACTIVE_BARS)[number],
  string
> = {
  default: "Auto",
  bar: "Bar",
  ring: "Ring",
  both: "Both",
}

export function useThemeSettingsSections(): ThemeSettingsSection[] {
  const labels = useUiLabels()
  const uiText = useUiText()
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
    sidebarActiveBar,
    fontSize,
    outerGlow,
    innerGlow,
    contrast,
    darkAccentChroma,
    tintWithAccent,
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
    setSidebarActiveBar,
    setFontSize,
    setOuterGlow,
    setInnerGlow,
    setContrast,
    setDarkAccentChroma,
    setTintWithAccent,
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
    { value: "solid", icon: Square, label: labels.themeOptions.solid },
    { value: "gradient", icon: Blend, label: labels.themeOptions.gradient },
  ]

  const { axes } = config.switcher

  // Presets can declare `hiddenCommonAxes` to hide common-axis pickers
  // they conceptually take over with their own preset-specific axes.
  const hiddenCommonAxes = activePreset.hiddenCommonAxes ?? []
  const isCommonAxisHidden = (name: string): boolean =>
    (hiddenCommonAxes as readonly string[]).includes(name)

  const visibility: AxisVisibilityInput = {
    axes,
    backgroundStyle,
    accentColor,
    isHiddenByPreset: isCommonAxisHidden,
    presetAxisCount: Object.keys(activePreset.axes).length,
  }
  const show = (axis: Parameters<typeof isAxisVisible>[0]): boolean =>
    isAxisVisible(axis, visibility)

  return [
    show("mode") && {
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
    show("preset") && {
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
               show the preset labels. Each cell ends
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
    show("presetAxes") && {
      key: "preset-axes",
      group: "theme" as const,
      node: (
        <div key="preset-axes" className="dr-theme-switcher-preset-axes-group">
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
                  {uiText(axisDef.label)}
                </Label>
                <AxisControl
                  values={axisDef.values}
                  value={
                    presetAxisValues[preset]?.[axisName] ?? axisDef.default
                  }
                  onChange={(v) => setPresetAxis(axisName, v)}
                  label={uiText(axisDef.label)}
                />
              </div>
            ))}
        </div>
      ),
    },
    show("backgroundStyle") && {
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
    // No gradient gate: the axis absorbed canvasTint, so under `solid` it still
    // drives the canvas saturation cap. Only the blob-scale half is
    // gradient-specific, and that half is inert rather than hidden.
    show("backgroundIntensity") && {
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
    show("gradientPattern") && {
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
              <ToggleGroupItem key={value} value={value} className="capitalize">
                {labels.themeOptions[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ),
    },
    show("accentColor") && {
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
                title={
                  color === "neutral"
                    ? labels.themeOptions.neutralAccent
                    : labels.themeOptions[color]
                }
                className="dr-theme-switcher-swatch"
                data-value={color}
                data-active={accentColor === color ? "true" : undefined}
                style={{
                  backgroundColor: `hsl(${resolveAccentScale(color, surfaceColor)[color === "neutral" ? 900 : 500]})`,
                }}
                onClick={() => setAccentColor(color)}
              />
            ))}
          </div>
        </div>
      ),
    },
    show("surfaceColor") && {
      key: "surfaceColor",
      group: "color" as const,
      node: (
        <div key="surfaceColor" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.surfaceColor}
          </Label>
          <div className="dr-theme-switcher-swatch-grid">
            {SURFACE_COLORS.map((color: SurfaceColor) => {
              const previewHsl = surfaceColors[color][500]
              return (
                <button
                  key={color}
                  type="button"
                  title={labels.themeOptions[color]}
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
    show("tintWithAccent") && {
      key: "tintWithAccent",
      group: "color" as const,
      node: (
        <div key="tintWithAccent" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.tintWithAccent}
          </Label>
          <AxisControl
            values={TINT_WITH_ACCENT}
            value={tintWithAccent}
            onChange={setTintWithAccent}
            label={labels.theme.axisLabels.tintWithAccent}
          />
        </div>
      ),
    },
    show("density") && {
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
    show("fontSize") && {
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
    show("darkAccentChroma") && {
      key: "darkAccentChroma",
      group: "color" as const,
      node: (
        <div key="darkAccentChroma" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.darkAccentChroma}
          </Label>
          <AxisControl
            values={DARK_ACCENT_CHROMAS}
            value={darkAccentChroma}
            onChange={setDarkAccentChroma}
            label={labels.theme.axisLabels.darkAccentChroma}
          />
        </div>
      ),
    },
    show("elevation") && {
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
    show("buttonElevation") && {
      key: "buttonElevation",
      group: "depth" as const,
      node: (
        <div key="buttonElevation" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.buttonElevation}
          </Label>
          <AxisControl
            values={AXES.buttonElevation.values}
            value={buttonElevation}
            onChange={setButtonElevation}
            label={labels.theme.axisLabels.buttonElevation}
          />
        </div>
      ),
    },
    show("contrast") && {
      key: "contrast",
      group: "depth" as const,
      node: (
        <div key="contrast" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.contrast}
          </Label>
          <AxisControl
            values={CONTRASTS}
            value={contrast}
            onChange={setContrast}
            label={labels.theme.axisLabels.contrast}
          />
        </div>
      ),
    },
    show("outerGlow") && {
      key: "outerGlow",
      group: "depth" as const,
      node: (
        <div key="outerGlow" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.outerGlow}
          </Label>
          <AxisControl
            values={GLOW_LEVELS}
            value={outerGlow}
            onChange={setOuterGlow}
            label={labels.theme.axisLabels.outerGlow}
          />
        </div>
      ),
    },
    show("innerGlow") && {
      key: "innerGlow",
      group: "depth" as const,
      node: (
        <div key="innerGlow" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.innerGlow}
          </Label>
          <AxisControl
            values={GLOW_LEVELS}
            value={innerGlow}
            onChange={setInnerGlow}
            label={labels.theme.axisLabels.innerGlow}
          />
        </div>
      ),
    },
    show("sidebarActiveBar") && {
      key: "sidebarActiveBar",
      group: "layout" as const,
      node: (
        <div key="sidebarActiveBar" className="dr-theme-switcher-row">
          <Label className="dr-theme-switcher-section-label">
            {labels.theme.axisLabels.sidebarActiveBar}
          </Label>
          {/* Not AxisControl: it renders any four-value axis as a stepped
              slider, which is right for ordinal axes only. These four are
              categorical — there is no "more" direction. */}
          <ToggleGroup
            type="single"
            value={sidebarActiveBar}
            onValueChange={(value) => {
              // A single-selection group emits "" on deselect; that must not
              // reach state or the control ends up with no active item.
              if (!value) return
              setSidebarActiveBar(value as (typeof SIDEBAR_ACTIVE_BARS)[number])
            }}
            variant="outline"
            size="sm"
            aria-label={labels.theme.axisLabels.sidebarActiveBar}
            className="dr-theme-switcher-toggle-group"
            data-cols={SIDEBAR_ACTIVE_BARS.length}
          >
            {SIDEBAR_ACTIVE_BARS.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {labels.themeOptions[value] === value
                  ? SIDEBAR_ACTIVE_BAR_LABELS[value]
                  : labels.themeOptions[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ),
    },
    show("radius") && {
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
