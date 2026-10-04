import { Blend, Monitor, Moon, Square, Sun } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { useUiLabels } from "@labels"
import { AXES, type AxisKey, type AxisValue } from "@theme/axes/registry"
import type { StyleName } from "@theme/styles"
import type { SidebarSelectionSetting } from "@theme/types"
import { useTheme } from "@theme/useTheme"
import type { UiMessages } from "../../../i18n/types"

type OptionLabel = (value: string, labels: UiMessages) => string

const ICONS: Partial<Record<AxisKey, Readonly<Record<string, typeof Sun>>>> =
  {
    mode: { light: Sun, dark: Moon, system: Monitor },
    backgroundStyle: { solid: Square, gradient: Blend },
  }

const themeOption: OptionLabel = (value, labels) =>
  labels.themeOptions[value as keyof UiMessages["themeOptions"]] ?? value

/* "Auto" rather than "Default": a bare "Default" reads as the kit's default
   style, and the collision is real enough that queries for one find the
   other. */
const SIDEBAR_ACTIVE_BAR_LABELS: Readonly<Record<string, string>> = {
  default: "Auto",
  bar: "Bar",
  ring: "Ring",
  both: "Both",
}

// `themeOptions` is one map keyed by value, so an axis whose values are
// labelled elsewhere, or whose value means something else on another axis,
// overrides it here.
const OPTION_LABELS: Partial<Record<AxisKey, OptionLabel>> = {
  mode: (value, labels) =>
    labels.theme.modes[value as keyof UiMessages["theme"]["modes"]],
  style: (value, labels) => labels.theme.styles[value as StyleName],
  // "pill" is also a radius value, so the shared option map would label it
  // as a shape; the looks carry their own group.
  sidebarSelection: (value, labels) =>
    labels.theme.sidebarSelections[value as SidebarSelectionSetting],
  // An untranslated value (the English map holds the bare value) gets the
  // switcher's own English word; a translation is used as given.
  sidebarActiveBar: (value, labels) => {
    const label = themeOption(value, labels)
    return label === value ? (SIDEBAR_ACTIVE_BAR_LABELS[value] ?? value) : label
  },
}

export function ChoiceControl({ axis }: { axis: AxisKey }) {
  const labels = useUiLabels()
  const theme = useTheme()
  const values = AXES[axis].values as readonly string[]
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
        return (
          <ToggleGroupItem key={value} value={value} className="capitalize">
            {Icon && <Icon className="dr-theme-switcher-row-icon" />}
            {optionLabel(value, labels)}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
