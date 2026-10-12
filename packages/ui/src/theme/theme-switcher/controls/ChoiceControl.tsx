import { Blend, Monitor, Moon, Square, Sun } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { useUiLabels } from "@labels"
import type { AxisKey, AxisValue } from "@theme/axes/registry"
import type { ThemeRegistry } from "@theme/config/registry"
import type { StyleName } from "@theme/styles"
import type { PresetName } from "@theme/styles/builtin/presets"
import type { SidebarSelectionSetting } from "@theme/types"
import { useTheme } from "@theme/useTheme"
import type { UiMessages } from "../../../i18n/types"
import { presetOptions } from "../presetOptions"

type OptionLabel = (
  value: string,
  labels: UiMessages,
  registry: ThemeRegistry,
) => string

const ICONS: Partial<Record<AxisKey, Readonly<Record<string, typeof Sun>>>> = {
  mode: { light: Sun, dark: Moon, system: Monitor },
  backgroundStyle: { solid: Square, gradient: Blend },
}

const themeOption: OptionLabel = (value, labels) =>
  labels.themeOptions[value as keyof UiMessages["themeOptions"]] ?? value

// A built-in face's name is translated; a config font brings its own label.
const fontOption: OptionLabel = (value, labels, registry) => {
  const font = registry.fonts[value]
  return font && !font.builtIn
    ? font.label
    : themeOption(value, labels, registry)
}

// Face names are long ("IBM Plex Sans"), so the font axes wrap after three
// cells instead of squeezing four into a row.
const FACE_AXES: ReadonlySet<AxisKey> = new Set(["font", "headingFont"])

/** The most cells an axis puts in one row. */
function columns(axis: AxisKey) {
  // Preset names are longer still ("Smoked Obsidian").
  if (axis === "preset") return 2
  return FACE_AXES.has(axis) ? 3 : 5
}

/** Whether a value's label is written text, whose casing must stay. */
function ownLabel(axis: AxisKey, value: string, registry: ThemeRegistry) {
  // A preset's label is a name in every locale, never a lower-case value.
  if (axis === "preset") return true
  if (axis === "style") return registry.styles[value]?.builtIn === false
  if (FACE_AXES.has(axis)) return registry.fonts[value]?.builtIn === false
  return false
}

// `themeOptions` is one map keyed by value, so an axis whose values are
// labelled elsewhere, or whose value means something else on another axis,
// overrides it here.
const OPTION_LABELS: Partial<Record<AxisKey, OptionLabel>> = {
  mode: (value, labels) =>
    labels.theme.modes[value as keyof UiMessages["theme"]["modes"]],
  // A built-in's label is translated; a config style brings its own.
  style: (value, labels, registry) => {
    const style = registry.styles[value]
    return style && !style.builtIn
      ? style.label
      : labels.theme.styles[value as StyleName]
  },
  // The same split: `base` and the built-ins are translated.
  preset: (value, labels, registry) => {
    const preset = registry.presets[value]
    return preset && !preset.builtIn
      ? preset.label
      : labels.theme.presets[value as "base" | PresetName]
  },
  // "pill" is also a radius value, so the shared option map would label it
  // as a shape; the looks carry their own group.
  sidebarSelection: (value, labels) =>
    labels.theme.sidebarSelections[value as SidebarSelectionSetting],
  font: fontOption,
  headingFont: fontOption,
}

export function ChoiceControl({ axis }: { axis: AxisKey }) {
  const labels = useUiLabels()
  const theme = useTheme()
  const values =
    axis === "preset"
      ? presetOptions(
          theme.registry,
          theme.style,
          theme.preset,
          theme.config.switcher.presets,
        )
      : theme.registry.values(axis)
  const icons = ICONS[axis]
  const optionLabel = OPTION_LABELS[axis] ?? themeOption

  return (
    <ToggleGroup
      type="single"
      value={theme[axis]}
      onValueChange={(value) => {
        // A single-selection group emits "" on deselect; that must not reach
        // state or the control ends up with no active item.
        if (value) theme.setAxis(axis, value as AxisValue<AxisKey>)
      }}
      variant="outline"
      size="sm"
      aria-label={labels.theme.axisLabels[axis]}
      className="dr-theme-switcher-toggle-group"
      data-cols={Math.min(values.length, columns(axis))}
    >
      {values.map((value) => {
        const Icon = icons?.[value]
        return (
          <ToggleGroupItem
            key={value}
            value={value}
            className={
              ownLabel(axis, value, theme.registry) ? undefined : "capitalize"
            }
          >
            {Icon && <Icon className="dr-theme-switcher-row-icon" />}
            {optionLabel(value, labels, theme.registry)}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
