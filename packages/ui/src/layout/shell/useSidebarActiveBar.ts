import { useContext } from "react"
import { ThemeContext } from "@theme/themeContext"
import { themeConfig } from "@theme/themeConfig"
import type { SidebarActiveBarSetting } from "@theme"

/**
 * The theme axis value for the sidebar's active-item indicator.
 *
 * Reads the context directly rather than through `useTheme`, which throws
 * without a provider: a sidebar must still mount outside one.
 */
export function useSidebarActiveBarSetting(): SidebarActiveBarSetting {
  const theme = useContext(ThemeContext)
  return theme?.sidebarActiveBar ?? themeConfig.defaults.sidebarActiveBar
}
