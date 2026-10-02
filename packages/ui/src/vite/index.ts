import type { Plugin } from "vite"
import { buildPrerenderScript } from "../theme/axes/prerender"

/**
 * Injects the theme pre-render script into index.html, so the first paint
 * already carries the stored theme. Node-only: import it from vite.config.
 */
export function darkraisePrerender(): Plugin {
  const script = buildPrerenderScript()
  return {
    name: "darkraise-prerender",
    transformIndexHtml: {
      order: "pre",
      handler: () => [{ tag: "script", children: script, injectTo: "head" }],
    },
  }
}
