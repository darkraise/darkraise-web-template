import type { HtmlTagDescriptor, Plugin } from "vite"
import { buildPrerenderScript } from "../theme/axes/prerender"
import { AXES, AXIS_KEYS, type AxisKey } from "../theme/axes/registry"
import { compileThemeCss } from "../theme/config/compile"
import { resolveRegistry, type ThemeRegistry } from "../theme/config/registry"
import type { ThemeConfig } from "../theme/themeConfig"

type PrerenderConfig = Pick<ThemeConfig, "defaults" | "styles" | "presets">

/**
 * One line per definition error, plus one when `defaults.preset` names a
 * preset of a style other than the default style, which the provider would
 * silently replace with `base`.
 */
function errorLines(
  config: PrerenderConfig,
  registry: ThemeRegistry,
): string[] {
  const lines = registry.issues
    .filter((issue) => issue.level === "error")
    .map((issue) => `- ${issue.path}: ${issue.message}`)
  const { style, preset } = config.defaults as Record<string, unknown>
  const defaultStyle = registry.isValue("style", style)
    ? style
    : AXES.style.default
  const owner =
    typeof preset === "string" ? registry.presets[preset]?.style : undefined
  if (owner !== undefined && owner !== defaultStyle) {
    lines.push(
      `- defaults.preset: "${String(preset)}" belongs to style "${owner}", not "${defaultStyle}"`,
    )
  }
  return lines
}

/**
 * Injects the theme pre-render script into index.html, so the first paint
 * already carries the stored theme, and before it a `<style>` holding the
 * config's own styles and presets when it has any. Pass the `config` the app
 * gives ThemeProvider, so an axis the user never set paints as the provider
 * will paint it. Throws when the config's definitions have errors. `defaults`
 * is the deprecated form of `config.defaults`, read only without `config`.
 * Node-only: import it from vite.config.
 */
export function darkraisePrerender(
  options: {
    config?: ThemeConfig
    defaults?: ThemeConfig["defaults"]
    nonce?: string
  } = {},
): Plugin {
  const config: PrerenderConfig = options.config ?? {
    defaults: options.defaults ?? {},
  }
  const registry = resolveRegistry(config)
  const errors = errorLines(config, registry)
  if (errors.length > 0) {
    throw new Error(
      `[darkraisePrerender] Invalid theme definitions:\n${errors.join("\n")}`,
    )
  }

  const given: Readonly<Record<string, unknown>> = config.defaults
  const valid: Record<string, unknown> = {}
  const invalid: string[] = []
  for (const [key, value] of Object.entries(given)) {
    if (
      (AXIS_KEYS as readonly string[]).includes(key) &&
      registry.isValue(key as AxisKey, value)
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

  const nonce = options.nonce === undefined ? {} : { nonce: options.nonce }
  const tags: HtmlTagDescriptor[] = []
  if (registry.hash !== "") {
    tags.push({
      tag: "style",
      attrs: { "data-darkraise-theme": registry.hash, ...nonce },
      children: compileThemeCss(registry, { include: "consumer" }),
      injectTo: "head",
    })
  }
  tags.push({
    tag: "script",
    ...(options.nonce === undefined ? {} : { attrs: nonce }),
    children: buildPrerenderScript({
      ...config,
      defaults: valid as ThemeConfig["defaults"],
    }),
    injectTo: "head",
  })
  return {
    name: "darkraise-prerender",
    transformIndexHtml: {
      order: "pre",
      handler: () => tags,
    },
  }
}
