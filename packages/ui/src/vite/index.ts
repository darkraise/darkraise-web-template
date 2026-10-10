import type { Plugin } from "vite"
import { buildPrerenderScript } from "../theme/axes/prerender"
import { AXIS_KEYS, isAxisValue, type AxisKey } from "../theme/axes/registry"
import type { ThemeConfig } from "../theme/themeConfig"

/**
 * Injects the theme pre-render script into index.html, so the first paint
 * already carries the stored theme. Pass the `defaults` the app gives
 * ThemeProvider, so an axis the user never set paints as the provider will
 * paint it. Node-only: import it from vite.config.
 */
export function darkraisePrerender(
  options: { defaults?: ThemeConfig["defaults"] } = {},
): Plugin {
  const given: Readonly<Record<string, unknown>> = options.defaults ?? {}
  const valid: Record<string, unknown> = {}
  const invalid: string[] = []
  for (const [key, value] of Object.entries(given)) {
    if (
      (AXIS_KEYS as readonly string[]).includes(key) &&
      isAxisValue(key as AxisKey, value)
    ) {
      valid[key] = value
    } else {
      invalid.push(`${key} "${String(value)}"`)
    }
  }
  if (invalid.length > 0) {
    console.warn(
      `[darkraisePrerender] Ignoring theme defaults that are not a value of their axis: ${invalid.join(", ")}.`,
    )
  }
  const script = buildPrerenderScript({
    defaults: valid as ThemeConfig["defaults"],
  })
  return {
    name: "darkraise-prerender",
    transformIndexHtml: {
      order: "pre",
      handler: () => [{ tag: "script", children: script, injectTo: "head" }],
    },
  }
}
