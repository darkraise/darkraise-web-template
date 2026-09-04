import { useTheme } from "@theme"
import type { ShellStyle } from "@theme"

/**
 * Resolves the chrome treatment a shell should paint with.
 *
 * Layouts stamp the result on their own root rather than letting CSS read
 * the document attribute directly: a pinned `shellStyle` prop then wins
 * without every selector needing a `:not()` guard against the global value.
 */
export function useShellStyle(override?: ShellStyle): ShellStyle {
  const { shellStyle } = useTheme()
  return override ?? shellStyle
}
