import { Blend, Monitor, Moon, Square, Sun } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { useUiLabels } from "@labels"
import type { AxisKey, AxisValue } from "@theme/axes/registry"
import type { ThemeRegistry } from "@theme/config/registry"
import type { StyleName } from "@theme/styles"
import type { SidebarSelectionSetting } from "@theme/types"
import { useTheme } from "@theme/useTheme"
import type { UiMessages } from "../../../i18n/types"

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
  // "pill" is also a radius value, so the shared option map would label it
  // as a shape; the looks carry their own group.
  sidebarSelection: (value, labels) =>
    labels.theme.sidebarSelections[value as SidebarSelectionSetting],
}

export function ChoiceControl({ axis }: { axis: AxisKey }) {
  const labels = useUiLabels()
  const theme = useTheme()
  const values = theme.registry.values(axis)
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
      data-cols={values.length}
    >
      {values.map((value) => {
        const Icon = icons?.[value]
        // A config style's label is the app's own text; keep its casing.
        const ownLabel =
          axis === "style" && theme.registry.styles[value]?.builtIn === false
        return (
          <ToggleGroupItem
            key={value}
            value={value}
            className={ownLabel ? undefined : "capitalize"}
          >
            {Icon && <Icon className="dr-theme-switcher-row-icon" />}
            {optionLabel(value, labels, theme.registry)}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
