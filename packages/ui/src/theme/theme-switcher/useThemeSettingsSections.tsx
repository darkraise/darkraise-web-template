import type * as React from "react"
import { Fragment } from "react"
import { Label } from "@components/label"
import { useUiLabels } from "@labels"
import {
  AXES,
  AXIS_KEYS,
  type AxisControlKind,
  type AxisKey,
} from "@theme/axes/registry"
import { useTheme } from "@theme/useTheme"
import { ChoiceControl } from "./controls/ChoiceControl"
import { OrdinalControl } from "./controls/OrdinalControl"
import { SwatchControl } from "./controls/SwatchControl"
import { SwitchControl } from "./controls/SwitchControl"
import { presetOptions } from "./presetOptions"
import { ResetToPreset } from "./ResetToPreset"

export type ThemeSettingsGroup = "brand" | "advanced"

export interface ThemeSettingsSection {
  /** Stable identity: the axis key. */
  key: string
  /** Which part of the switcher this section belongs to. */
  group: ThemeSettingsGroup
  node: React.ReactNode
}

const CONTROLS: Record<
  AxisControlKind,
  React.ComponentType<{ axis: AxisKey }>
> = {
  swatch: SwatchControl,
  choice: ChoiceControl,
  ordinal: OrdinalControl,
  switch: SwitchControl,
}

/**
 * Builds the visible theme axis controls, in registry order.
 *
 * Shared by ThemeSettingsPanel, which renders the sections, and ThemeSwitcher,
 * which needs to know whether ANY are visible so it can hide its trigger
 * entirely rather than offering a button that opens an empty panel.
 */
export function useThemeSettingsSections(): ThemeSettingsSection[] {
  const labels = useUiLabels()
  const theme = useTheme()
  const { config } = theme

  const showAdvanced = config.switcher.advanced !== false
  const settings = Object.fromEntries(AXIS_KEYS.map((key) => [key, theme[key]]))
  const styleLineage = theme.registry.styles[theme.style]?.lineage ?? [
    theme.style,
  ]

  const sections: ThemeSettingsSection[] = []
  for (const key of AXIS_KEYS) {
    const spec = AXES[key]
    const group: ThemeSettingsGroup =
      spec.layer === "advanced" ? "advanced" : "brand"
    if (group === "advanced" && !showAdvanced) continue
    if (config.switcher.axes?.[key] === false) continue
    if (spec.visibleWhen && !spec.visibleWhen(settings, styleLineage)) continue
    // `base` alone is no choice.
    if (
      key === "preset" &&
      presetOptions(
        theme.registry,
        theme.style,
        theme.preset,
        config.switcher.presets,
      ).length < 2
    ) {
      continue
    }

    const Control = CONTROLS[spec.control]
    sections.push({
      key,
      group,
      node: (
        <Fragment key={key}>
          <div className="dr-theme-switcher-row">
            <Label className="dr-theme-switcher-section-label">
              {labels.theme.axisLabels[key]}
            </Label>
            <Control axis={key} />
          </div>
          {key === "preset" && <ResetToPreset />}
        </Fragment>
      ),
    })
  }
  return sections
}
