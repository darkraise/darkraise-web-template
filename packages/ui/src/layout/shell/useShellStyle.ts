import { useContext, useMemo, useSyncExternalStore } from "react"
import { useLayoutStore } from "@layout/layoutStore"
import { effectiveSettings } from "@theme/axes/resolve"
import { ThemeContext } from "@theme/themeContext"
import { resolveDefaults } from "@theme/themeConfig"
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
  // server render cannot; hydrating with the preset a render without storage
  // resolves keeps the markup equal.
  const config = theme?.config
  const registry = theme?.registry
  const unstoredPreset = useMemo(
    () =>
      config && registry
        ? effectiveSettings({}, resolveDefaults(config, registry), registry)
            .preset
        : "base",
    [config, registry],
  )
  const preset = useSyncExternalStore(
    subscribeNever,
    () => theme?.preset ?? "base",
    () => unstoredPreset,
  )
  const presetShellStyle = registry?.presets[preset]?.shellStyle
  return (
    override ?? stored ?? presetShellStyle ?? defaultShellStyle ?? "classic"
  )
}
