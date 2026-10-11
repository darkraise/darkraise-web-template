import { createContext } from "react"
import type { ThemeRegistry } from "@theme/config/registry"
import { SIGNATURES } from "@theme/config/signatures"
import type { SidebarSelection, SidebarSelectionSetting } from "@theme/types"

/**
 * Auto takes the look the active preset names, else the style's own or
 * inherited one, else the kit default (chip).
 */
export function resolveSidebarSelection(
  setting: SidebarSelectionSetting,
  style: string,
  preset: string,
  registry?: ThemeRegistry,
): SidebarSelection {
  if (setting !== "auto") return setting
  return registry
    ? registry.signaturesFor(style, preset).navSelection
    : SIGNATURES.navSelection.default
}

/** The look of the nav a row belongs to, for content portaled out of it. */
export const SidebarSelectionContext = createContext<
  SidebarSelection | undefined
>(undefined)
