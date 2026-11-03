import { useContext } from "react"
import { ThemeContext } from "@theme/themeContext"
import { AXES } from "@theme/axes/registry"
import type { SidebarSelection } from "@theme/types"
import { resolveSidebarSelection } from "@layout/sidebar/sidebar-selection"

/**
 * The look a nav draws: the caller's override, else the theme's setting with
 * Auto resolved against the preset and the style.
 *
 * Reads the context directly rather than through `useTheme`, which throws
 * without a provider: a sidebar must still mount outside one.
 */
export function useSidebarSelection(
  override?: SidebarSelection,
): SidebarSelection {
  const theme = useContext(ThemeContext)
  if (override) return override
  return resolveSidebarSelection(
    theme?.sidebarSelection ?? AXES.sidebarSelection.default,
    theme?.style ?? AXES.style.default,
    theme?.preset ?? AXES.preset.default,
    theme?.registry,
  )
}

/**
 * `"kit"` when the nav draws a look other than the one the style or preset
 * picks. A style's selection tokens are drawn for its own look, so a nav
 * stamps this as `data-sidebar-paint` and the picked look paints its own
 * surface instead.
 */
export function useSidebarPaint(look: SidebarSelection): "kit" | undefined {
  const theme = useContext(ThemeContext)
  const own = resolveSidebarSelection(
    "auto",
    theme?.style ?? AXES.style.default,
    theme?.preset ?? AXES.preset.default,
    theme?.registry,
  )
  return look === own ? undefined : "kit"
}

/**
 * `"none"` under Flat and every style that extends it, which draw no shadows
 * whichever look is picked. A nav stamps it as `data-sidebar-shadow`, because
 * only theme/styles may name a style in CSS.
 */
export function useSidebarShadow(): "none" | undefined {
  const theme = useContext(ThemeContext)
  const style = theme?.style ?? AXES.style.default
  const lineage = theme?.registry.styles[style]?.lineage ?? [style]
  return lineage.includes("flat") ? "none" : undefined
}
