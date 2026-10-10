import { createContext } from "react"
import type { ThemeRegistry } from "@theme/config/registry"
import type { StyleName } from "@theme/styles"
import type { SidebarSelection, SidebarSelectionSetting } from "@theme/types"

/** The look each built-in style draws while the setting is left on Auto. */
export const AUTO_SIDEBAR_SELECTION: Readonly<
  Record<StyleName, SidebarSelection>
> = {
  quiet: "chip",
  flat: "pill",
  tactile: "tile",
  glass: "frosted",
}

/**
 * Auto takes the look of the first built-in style in the style's lineage: the
 * style itself, then each style it extends. A style that reaches no built-in
 * draws chips.
 */
export function resolveSidebarSelection(
  setting: SidebarSelectionSetting,
  style: string,
  registry?: ThemeRegistry,
): SidebarSelection {
  if (setting !== "auto") return setting
  const lineage = registry?.styles[style]?.lineage ?? [style]
  for (const name of lineage) {
    if (Object.prototype.hasOwnProperty.call(AUTO_SIDEBAR_SELECTION, name)) {
      return AUTO_SIDEBAR_SELECTION[name as StyleName]
    }
  }
  return "chip"
}

/** The look of the nav a row belongs to, for content portaled out of it. */
export const SidebarSelectionContext = createContext<
  SidebarSelection | undefined
>(undefined)
