import type { DeepPartialLabels, UiLabels } from "./types"

export function mergeLabels(
  base: UiLabels,
  override: DeepPartialLabels<UiLabels>,
): UiLabels {
  return {
    dataTable: { ...base.dataTable, ...override.dataTable },
    layout: { ...base.layout, ...override.layout },
    userMenu: { ...base.userMenu, ...override.userMenu },
    theme: {
      ...base.theme,
      ...override.theme,
      groupLabels: {
        ...base.theme.groupLabels,
        ...override.theme?.groupLabels,
      },
      axisLabels: { ...base.theme.axisLabels, ...override.theme?.axisLabels },
      modes: { ...base.theme.modes, ...override.theme?.modes },
    },
    errors: { ...base.errors, ...override.errors },
  }
}
