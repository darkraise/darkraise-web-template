import { createContext } from "react"
import type { StyleName } from "@theme/styles"
import type { SidebarSelection, SidebarSelectionSetting } from "@theme/types"

/** The look each style draws while the setting is left on Auto. */
export const AUTO_SIDEBAR_SELECTION: Readonly<
  Record<StyleName, SidebarSelection>
> = {
  quiet: "chip",
  flat: "pill",
  tactile: "tile",
  glass: "frosted",
}

export function resolveSidebarSelection(
  setting: SidebarSelectionSetting,
  style: StyleName,
): SidebarSelection {
  return setting === "auto" ? AUTO_SIDEBAR_SELECTION[style] : setting
}

/** The look of the nav a row belongs to, for content portaled out of it. */
export const SidebarSelectionContext = createContext<
  SidebarSelection | undefined
>(undefined)
