import { buildPrerenderScript } from "../axes/prerender"
import type { ThemeConfig } from "../themeConfig"
import { compileThemeCss } from "./compile"
import { resolveRegistry } from "./registry"
import type { ThemeDefinitions } from "./schema"

export type {
  DefinableAxes,
  FontDefinition,
  ModeTokens,
  ModeVars,
  PresetDefinition,
  StyleDefinition,
  ThemeDefinitions,
  TokenMap,
  VarMap,
  WhenAxisKey,
  WhenEntry,
} from "./schema"
export { KIT_FALLBACK, PAINT_TOKENS, type PaintToken } from "./tokens"
export {
  SIGNATURES,
  signatureAttribute,
  type SignatureKey,
  type SignatureMap,
  type SignatureValues,
  type StampedSignature,
} from "./signatures"
export {
  defineFont,
  definePreset,
  defineStyle,
  defineThemeConfig,
} from "./define"
export { canonicalJson, definitionsHash, fnv1a36 } from "./hash"
export {
  buildRegistry,
  resolveRegistry,
  type DefinitionIssue,
  type ResolvedFont,
  type ResolvedPreset,
  type ResolvedStyle,
  type ThemeRegistry,
} from "./registry"
export { LAYER_STATEMENT, compileThemeCss } from "./compile"
export { buildThemeJsonSchema } from "./jsonSchema"
export type { ThemeConfig } from "../themeConfig"

/**
 * The stylesheet `darkraisePrerender` injects for `config`'s own styles and
 * presets, for apps that render the document themselves. Give the element
 * `data-darkraise-theme` set to `resolveRegistry(config).hash` so
 * ThemeProvider finds it and adds no second copy. A definition with an error
 * is left out; `resolveRegistry(config).issues` lists why.
 */
export function themeStyleText(config: ThemeDefinitions): string {
  return compileThemeCss(resolveRegistry(config), { include: "consumer" })
}

/** The pre-render script `darkraisePrerender` injects, for apps that render the document themselves. */
export function themePrerenderScript(
  config?: Pick<ThemeConfig, "defaults" | "styles" | "presets" | "fonts">,
): string {
  return buildPrerenderScript(config)
}
