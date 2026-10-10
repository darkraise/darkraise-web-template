import { AXES } from "../axes/registry"
import type { ThemeRegistry } from "./registry"
import type { TokenMap, VarMap, WhenAxisKey, WhenEntry } from "./schema"
import { PAINT_TOKENS, type PaintToken } from "./tokens"

/**
 * Layer order is fixed by each name's first appearance, so this statement
 * must be the first one the browser sees: it leads theme.css and every
 * compiled sheet.
 */
export const LAYER_STATEMENT =
  "@layer theme, base, style.base, style.mode, style.when, style.preset, style.fallback, components, utilities, overrides;"

const FORCED_MEDIA =
  "@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)"
const DARK = '[data-mode="dark"]'
const NOT_DARK = ':not([data-mode="dark"])'

/** Vars first: they are the intermediates the tokens read. */
function declarations(
  vars: VarMap | undefined,
  tokens: TokenMap | undefined,
): string[] {
  const entries: [string, string][] = [
    ...Object.entries(vars ?? {}),
    ...Object.entries(tokens ?? {}).map(([token, value]): [string, string] => [
      PAINT_TOKENS[token as PaintToken],
      value as string,
    ]),
  ]
  return entries.map(([name, value]) => `${name}: ${value};`)
}

/** The lines of `prelude { body }`, or none when the body is empty. */
function block(prelude: string, body: readonly string[]): string[] {
  if (body.length === 0) return []
  return [`${prelude} {`, ...body.map((line) => `  ${line}`), "}"]
}

function whenSelector(self: string, entry: WhenEntry): string {
  let selector = self
  if (entry.mode === "dark") selector = `${DARK}${selector}`
  if (entry.mode === "light") selector = `${selector}${NOT_DARK}`
  for (const [key, value] of Object.entries(entry.axes)) {
    const attribute = AXES[key as WhenAxisKey].attribute as string
    selector += `[${attribute}="${value}"]`
  }
  return selector
}

export function compileThemeCss(
  registry: ThemeRegistry,
  options: { include: "builtin" | "consumer" },
): string {
  const builtIn = options.include === "builtin"
  const blocks: string[][] = []

  for (const style of Object.values(registry.styles)) {
    if (style.builtIn !== builtIn) continue
    const self = `[data-style="${style.name}"]`
    const { vars, tokens } = style
    blocks.push(
      block("@layer style.base", [
        ...block(self, declarations(vars.shared, tokens.shared)),
        ...block(`${self}${NOT_DARK}`, declarations(vars.light, tokens.light)),
      ]),
      block(
        "@layer style.mode",
        block(`${DARK}${self}`, declarations(vars.dark, tokens.dark)),
      ),
      block(
        "@layer style.when",
        style.when.flatMap((entry) =>
          block(
            whenSelector(self, entry),
            declarations(entry.vars, entry.tokens),
          ),
        ),
      ),
      block(
        "@layer style.fallback",
        block(
          FORCED_MEDIA,
          block(self, declarations(undefined, style.forcedFallback)),
        ),
      ),
    )
  }

  for (const preset of Object.values(registry.presets)) {
    if (preset.builtIn !== builtIn) continue
    const self = `[data-preset="${preset.name}"]`
    const { tokens } = preset
    blocks.push(
      block("@layer style.preset", [
        ...block(self, declarations(undefined, tokens.shared)),
        ...block(`${self}${NOT_DARK}`, declarations(undefined, tokens.light)),
        ...block(`${DARK}${self}`, declarations(undefined, tokens.dark)),
      ]),
    )
  }

  return (
    [
      LAYER_STATEMENT,
      ...blocks
        .filter((lines) => lines.length > 0)
        .map((lines) => lines.join("\n")),
    ].join("\n\n") + "\n"
  )
}
