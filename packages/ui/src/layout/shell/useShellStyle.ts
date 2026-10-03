import { useLayoutStore } from "@layout/layoutStore"
import type { ShellStyle } from "@theme"

/**
 * Resolves the chrome treatment a shell paints with: the pinned `override`,
 * else the user's stored pick, else the app's `defaultShellStyle`, else
 * `classic`.
 *
 * Layouts stamp the result on their own root rather than letting CSS read
 * the document attribute directly: a pinned `shellStyle` prop then wins
 * without every selector needing a `:not()` guard against the global value.
 */
export function useShellStyle(
  override?: ShellStyle,
  defaultShellStyle?: ShellStyle,
): ShellStyle {
  const stored = useLayoutStore((state) => state.shellStyle)
  return override ?? stored ?? defaultShellStyle ?? "classic"
}
