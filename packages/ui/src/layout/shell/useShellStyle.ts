import { useContext } from "react"
import { ThemeContext } from "@theme/themeContext"
import { themeConfig } from "@theme/themeConfig"
import type { ShellStyle } from "@theme"

/**
 * Resolves the chrome treatment a shell should paint with.
 *
 * Layouts stamp the result on their own root rather than letting CSS read
 * the document attribute directly: a pinned `shellStyle` prop then wins
 * without every selector needing a `:not()` guard against the global value.
 *
 * Reads the context directly instead of through `useTheme`, which throws
 * without a provider. A shell must still mount outside one — the axis is
 * cosmetic, and refusing to render over it would be a far worse trade.
 */
export function useShellStyle(override?: ShellStyle): ShellStyle {
  const theme = useContext(ThemeContext)
  return override ?? theme?.shellStyle ?? themeConfig.defaults.shellStyle
}
