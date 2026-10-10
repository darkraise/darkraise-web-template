import { useContext, useSyncExternalStore } from "react"
import { useLayoutStore } from "@layout/layoutStore"
import { ThemeContext } from "@theme/themeContext"
import type { ShellStyle } from "@theme"

const subscribeNever = () => () => {}

/**
 * Resolves the chrome treatment a shell paints with: the pinned `override`,
 * else the user's stored pick, else the active theme preset's `shellStyle`,
 * else the app's `defaultShellStyle`, else `classic`.
 *
 * Layouts stamp the result on their own root rather than letting CSS read
 * the document attribute directly: a pinned `shellStyle` prop then wins
 * without every selector needing a `:not()` guard against the global value.
 *
 * Reads the theme context directly rather than through `useTheme`, which
 * throws without a provider: a layout must still mount outside one.
 */
export function useShellStyle(
  override?: ShellStyle,
  defaultShellStyle?: ShellStyle,
): ShellStyle {
  const stored = useLayoutStore((state) => state.shellStyle)
  const theme = useContext(ThemeContext)
  // The provider reads the stored preset in its first client render, which a
  // server render cannot; hydrating with "base" first keeps the markup equal.
  const preset = useSyncExternalStore(
    subscribeNever,
    () => theme?.preset ?? "base",
    () => "base",
  )
  const presetShellStyle = theme?.registry.presets[preset]?.shellStyle
  return (
    override ?? stored ?? presetShellStyle ?? defaultShellStyle ?? "classic"
  )
}
