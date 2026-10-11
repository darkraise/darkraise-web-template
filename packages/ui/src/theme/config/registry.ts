import { AXES, isAxisValue, type AxisKey } from "../axes/registry"
import { generateTokens } from "../engine/generateTokens"
import { BUILTIN_STYLES } from "../styles/builtin"
import { SHELL_STYLES, type ShellStyle } from "../types"
import { definitionsHash } from "./hash"
import type {
  DefinableAxes,
  ModeTokens,
  ModeVars,
  PresetDefinition,
  StyleDefinition,
  ThemeDefinitions,
  TokenMap,
  WhenEntry,
} from "./schema"
import {
  SIGNATURE_KEYS,
  SIGNATURES,
  type SignatureKey,
  type SignatureMap,
  type SignatureValues,
} from "./signatures"
import { PAINT_TOKENS } from "./tokens"

export interface ResolvedStyle {
  name: string
  label: string
  builtIn: boolean
  /** The style itself first, then each ancestor in its `extends` chain. */
  lineage: readonly string[]
  frosted: boolean
  defaults: DefinableAxes
  vars: Required<ModeVars>
  tokens: Required<ModeTokens>
  when: readonly WhenEntry[]
  forcedFallback: TokenMap
  /** Per key, the style's own value over each ancestor's. */
  signatures: SignatureMap
  hairlines: "opaque" | "alpha"
}

export interface ResolvedPreset {
  name: string
  label: string
  builtIn: boolean
  style: string
  axes: DefinableAxes
  tokens: Required<ModeTokens>
  signatures: SignatureMap
  shellStyle?: ShellStyle
}

export interface DefinitionIssue {
  level: "error" | "warning"
  path: string
  message: string
}

export interface ThemeRegistry {
  /** Built-ins in the order given, then consumer styles in config order. */
  styles: Readonly<Record<string, ResolvedStyle>>
  presets: Readonly<Record<string, ResolvedPreset>>
  issues: readonly DefinitionIssue[]
  /** `definitionsHash` of the consumer definitions. */
  hash: string
  values<K extends AxisKey>(key: K): readonly string[]
  isValue(key: AxisKey, value: unknown): value is string
  /** `preset` when it names a preset of `style`, else `"base"`. */
  presetFor(style: string, preset: string | null | undefined): string
  /**
   * Every signature: the preset's value when `preset` belongs to `style`,
   * else the style's, else the kit default.
   */
  signaturesFor(style: string, preset: string): SignatureValues
}

const MODE_KEYS = ["shared", "light", "dark"] as const
type ModeKey = (typeof MODE_KEYS)[number]

export const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
// `base` is the preset value for "no preset"; the others are 6.x stored
// style values that the legacy migration still recognises.
export const RESERVED_NAMES = new Set([
  "base",
  "default",
  "glassmorphism",
  "scifi",
])
export const NOT_DEFINABLE = new Set(["mode", "style", "preset"])
export const NOT_TESTABLE = new Set([
  "mode",
  "style",
  "preset",
  "sidebarSelection",
])

const TRIPLET = /^-?[\d.]+ [\d.]+% [\d.]+%( \/ [\d.]+)?$/
// Compiled values land inside a rule inside a <style> element.
const ESCAPES_RULE = /[{}]|<\/style/i
export const CUSTOM_PROPERTY = /^--[\w-]+$/

let tripletTokens: ReadonlySet<string> | undefined

/**
 * Engine colour tokens written as bare HSL channel triplets (`--primary-8`
 * is `221 83% 53%`), which only work wrapped in `hsl()`. Read from the
 * engine's own output, in both modes, the first time a value needs it.
 */
function colourTripletTokens(): ReadonlySet<string> {
  if (!tripletTokens) {
    const names = new Set<string>()
    for (const mode of ["light", "dark"] as const) {
      const tokens = generateTokens({
        accentColor: AXES.accentColor.default,
        surfaceColor: AXES.surfaceColor.default,
        frosted: false,
        backgroundStyle: AXES.backgroundStyle.default,
        mode,
        contrast: AXES.contrast.default,
        darkAccentChroma: AXES.darkAccentChroma.default,
        tintWithAccent: false,
      })
      for (const [name, value] of Object.entries(tokens)) {
        if (TRIPLET.test(value)) names.add(name)
      }
    }
    tripletTokens = names
  }
  return tripletTokens
}

/** Each triplet token `value` reads through `var()` other than as a direct argument of `hsl()` or `hsla()`. */
function bareTriplets(value: string): string[] {
  if (!value.includes("var(")) return []
  const found: string[] = []
  const stack: string[] = []
  const pattern = /([a-zA-Z_-][\w-]*)?\(|\)/g
  for (let match = pattern.exec(value); match; match = pattern.exec(value)) {
    if (match[0] === ")") {
      stack.pop()
      continue
    }
    const fn = (match[1] ?? "").toLowerCase()
    if (fn === "var") {
      const name = /^\s*(--[\w-]+)/.exec(value.slice(pattern.lastIndex))?.[1]
      const parent = stack[stack.length - 1]
      if (
        name &&
        parent !== "hsl" &&
        parent !== "hsla" &&
        colourTripletTokens().has(name)
      ) {
        found.push(name)
      }
    }
    stack.push(fn)
  }
  return found
}

function has(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const varPath = (path: string, name: string) =>
  `${path}[${JSON.stringify(name)}]`

class Issues {
  readonly list: DefinitionIssue[] = []
  private readonly failed = new Set<string>()

  error(owner: string, path: string, message: string): void {
    this.list.push({ level: "error", path, message })
    this.failed.add(owner)
  }

  warning(path: string, message: string): void {
    this.list.push({ level: "warning", path, message })
  }

  has(owner: string): boolean {
    return this.failed.has(owner)
  }
}

interface Checker {
  issues: Issues
  owner: string
}

/**
 * Reads a value the way the CSS tokenizer does: a backslash escapes the next
 * character, a line break ends a string, and comments are skipped.
 */
function scanValue(value: string): "semicolon" | "open" | "escape" | null {
  let quote = ""
  const closers: string[] = []
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char === "\\") {
      i++
      // The compiler appends ";" after the value, which a final backslash escapes.
      if (i >= value.length) return "escape"
    } else if (quote) {
      if (char === quote || char === "\n" || char === "\r" || char === "\f") {
        quote = ""
      }
    } else if (char === "/" && value[i + 1] === "*") {
      const end = value.indexOf("*/", i + 2)
      if (end === -1) return "open"
      i = end + 1
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === "(") {
      closers.push(")")
    } else if (char === "[") {
      closers.push("]")
    } else if (char === closers[closers.length - 1]) {
      closers.pop()
    } else if (char === ";" && closers.length === 0) {
      return "semicolon"
    }
  }
  return quote || closers.length > 0 ? "open" : null
}

const VALUE_PROBLEMS = {
  semicolon: 'a value cannot contain ";" outside brackets or quotes',
  open: "a value cannot leave a bracket, quote or comment open",
  escape: "a value cannot end with a backslash",
}

function checkValue(c: Checker, path: string, value: unknown): void {
  if (typeof value !== "string") {
    c.issues.error(c.owner, path, "the value must be a string")
    return
  }
  if (ESCAPES_RULE.test(value)) {
    c.issues.error(
      c.owner,
      path,
      'a value cannot contain "{", "}" or "</style"',
    )
    return
  }
  const problem = scanValue(value)
  if (problem) {
    c.issues.error(c.owner, path, VALUE_PROBLEMS[problem])
    return
  }
  for (const name of bareTriplets(value)) {
    c.issues.warning(
      path,
      `var(${name}) is an HSL channel triplet; write hsl(var(${name}))`,
    )
  }
}

function checkTokens(c: Checker, path: string, tokens: unknown): void {
  if (!isRecord(tokens)) return
  for (const [token, value] of Object.entries(tokens)) {
    if (!has(PAINT_TOKENS, token)) {
      c.issues.error(
        c.owner,
        `${path}.${token}`,
        `"${token}" is not a paint token`,
      )
      continue
    }
    checkValue(c, `${path}.${token}`, value)
  }
}

function checkVars(
  c: Checker,
  path: string,
  vars: unknown,
  prefixes: readonly string[],
): void {
  if (!isRecord(vars)) return
  for (const [name, value] of Object.entries(vars)) {
    const at = varPath(path, name)
    if (!CUSTOM_PROPERTY.test(name)) {
      c.issues.error(c.owner, at, `"${name}" is not a custom property name`)
      continue
    }
    if (!prefixes.some((prefix) => name.startsWith(prefix))) {
      c.issues.error(
        c.owner,
        at,
        `"${name}" must start with ${prefixes.join(" or ")}`,
      )
      continue
    }
    checkValue(c, at, value)
  }
}

function checkModes(
  c: Checker,
  path: string,
  record: unknown,
  each: (path: string, value: unknown) => void,
): void {
  if (!isRecord(record)) return
  for (const [key, value] of Object.entries(record)) {
    if (!(MODE_KEYS as readonly string[]).includes(key)) {
      c.issues.error(
        c.owner,
        `${path}.${key}`,
        `"${key}" is not a mode key (expected shared, light or dark)`,
      )
      continue
    }
    each(`${path}.${key}`, value)
  }
}

function checkAxes(c: Checker, path: string, axes: unknown): void {
  if (!isRecord(axes)) return
  for (const [key, value] of Object.entries(axes)) {
    if (NOT_DEFINABLE.has(key) || !has(AXES, key)) {
      c.issues.error(
        c.owner,
        `${path}.${key}`,
        `"${key}" is not an axis a definition can set`,
      )
    } else if (!isAxisValue(key as AxisKey, value)) {
      c.issues.error(
        c.owner,
        `${path}.${key}`,
        `"${String(value)}" is not a valid ${key}`,
      )
    }
  }
}

function checkWhen(
  c: Checker,
  path: string,
  when: unknown,
  prefixes: readonly string[],
): void {
  if (!Array.isArray(when)) return
  when.forEach((entry: unknown, i) => {
    if (!isRecord(entry)) return
    const at = `${path}[${i}]`
    if (isRecord(entry.axes)) {
      for (const [key, value] of Object.entries(entry.axes)) {
        if (NOT_TESTABLE.has(key)) {
          c.issues.error(
            c.owner,
            `${at}.axes.${key}`,
            `a when entry cannot test "${key}"`,
          )
        } else if (!has(AXES, key)) {
          c.issues.error(
            c.owner,
            `${at}.axes.${key}`,
            `"${key}" is not an axis`,
          )
        } else if (!isAxisValue(key as AxisKey, value)) {
          c.issues.error(
            c.owner,
            `${at}.axes.${key}`,
            `"${String(value)}" is not a valid ${key}`,
          )
        }
      }
    }
    if (
      entry.mode !== undefined &&
      entry.mode !== "light" &&
      entry.mode !== "dark"
    ) {
      c.issues.error(
        c.owner,
        `${at}.mode`,
        `"${String(entry.mode)}" is not a when mode (expected light or dark)`,
      )
    }
    checkTokens(c, `${at}.tokens`, entry.tokens)
    checkVars(c, `${at}.vars`, entry.vars, prefixes)
  })
}

function checkSignatures(c: Checker, path: string, signatures: unknown): void {
  if (!isRecord(signatures)) return
  for (const [key, value] of Object.entries(signatures)) {
    if (!has(SIGNATURES, key)) {
      c.issues.error(c.owner, `${path}.${key}`, `"${key}" is not a signature`)
    } else if (
      !(SIGNATURES[key as SignatureKey].values as readonly unknown[]).includes(
        value,
      )
    ) {
      c.issues.error(
        c.owner,
        `${path}.${key}`,
        `"${String(value)}" is not a valid ${key}`,
      )
    }
  }
}

function nameError(
  name: string,
  builtins: Readonly<Record<string, unknown>>,
): string | null {
  if (!KEBAB.test(name)) return `"${name}" is not a kebab-case name`
  if (RESERVED_NAMES.has(name)) return `"${name}" is a reserved name`
  if (has(builtins, name)) return `"${name}" is a built-in style name`
  return null
}

/**
 * Merges one mode-keyed record over another. A `shared` entry applies in
 * every mode, so it also drops what the base set for that name under
 * `light` and `dark`.
 */
function mergeModes<T extends string>(
  base: Required<Record<ModeKey, Readonly<Partial<Record<T, string>>>>>,
  own:
    | Partial<Record<ModeKey, Readonly<Partial<Record<T, string>>>>>
    | undefined,
): Required<Record<ModeKey, Partial<Record<T, string>>>> {
  const shared = { ...base.shared, ...own?.shared }
  const sharedNames = Object.keys(own?.shared ?? {})
  const without = (record: Readonly<Partial<Record<T, string>>>) =>
    Object.fromEntries(
      Object.entries(record).filter(([name]) => !sharedNames.includes(name)),
    ) as Partial<Record<T, string>>
  return {
    shared,
    light: { ...without(base.light), ...own?.light },
    dark: { ...without(base.dark), ...own?.dark },
  }
}

const EMPTY_MODES = { shared: {}, light: {}, dark: {} } as const

export function buildRegistry(
  builtins: Readonly<Record<string, StyleDefinition>>,
  definitions?: ThemeDefinitions,
): ThemeRegistry {
  const issues = new Issues()
  const consumerStyles = definitions?.styles ?? {}
  const consumerPresets = definitions?.presets ?? {}

  const raw = new Map<
    string,
    { definition: StyleDefinition; builtIn: boolean }
  >()
  for (const [name, definition] of Object.entries(builtins)) {
    raw.set(name, { definition, builtIn: true })
  }
  const order = [...raw.keys()]
  for (const [name, definition] of Object.entries(consumerStyles)) {
    const owner = `styles.${name}`
    const problem = nameError(name, builtins)
    if (problem) {
      issues.error(owner, owner, problem)
      continue
    }
    raw.set(name, { definition, builtIn: false })
    order.push(name)
  }

  const lineages = new Map<string, string[]>()
  for (const name of order) {
    const owner = `styles.${name}`
    const lineage = [name]
    let current = raw.get(name)
    while (current?.definition.extends !== undefined) {
      const parent = current.definition.extends
      if (lineage.includes(parent)) {
        // A style that only leads into a cycle is reported as depending on
        // a style with errors.
        if (parent === name) {
          issues.error(
            owner,
            `${owner}.extends`,
            `extends cycle: ${[...lineage, parent].join(" -> ")}`,
          )
        }
        break
      }
      const next = raw.get(parent)
      if (!next) {
        // Only the first link is this style's own mistake; a missing
        // ancestor further up is reported on the style that names it.
        if (lineage.length === 1) {
          issues.error(owner, `${owner}.extends`, `"${parent}" is not a style`)
        }
        break
      }
      if (current.builtIn && !next.builtIn) {
        if (lineage.length === 1) {
          issues.error(
            owner,
            `${owner}.extends`,
            `a built-in style cannot extend the consumer style "${parent}"`,
          )
        }
        break
      }
      lineage.push(parent)
      current = next
    }
    lineages.set(name, lineage)
  }

  for (const name of order) {
    const owner = `styles.${name}`
    const { definition } = raw.get(name) as { definition: StyleDefinition }
    const c: Checker = { issues, owner }
    const prefixes = (lineages.get(name) ?? [name]).map((n) => `--${n}-`)
    checkAxes(c, `${owner}.defaults`, definition.defaults)
    checkModes(c, `${owner}.vars`, definition.vars, (path, vars) =>
      checkVars(c, path, vars, prefixes),
    )
    checkModes(c, `${owner}.tokens`, definition.tokens, (path, tokens) =>
      checkTokens(c, path, tokens),
    )
    checkWhen(c, `${owner}.when`, definition.when, prefixes)
    checkTokens(
      c,
      `${owner}.forcedFallback.tokens`,
      definition.forcedFallback?.tokens,
    )
    checkSignatures(c, `${owner}.signatures`, definition.signatures)
    if (
      definition.hairlines !== undefined &&
      definition.hairlines !== "opaque" &&
      definition.hairlines !== "alpha"
    ) {
      issues.error(
        owner,
        `${owner}.hairlines`,
        `"${String(definition.hairlines)}" is not a hairlines mode (expected opaque or alpha)`,
      )
    }
  }

  const styles: Record<string, ResolvedStyle> = {}
  const resolve = (name: string): ResolvedStyle | undefined => {
    if (has(styles, name)) return styles[name]
    const owner = `styles.${name}`
    const entry = raw.get(name)
    if (!entry || issues.has(owner)) return undefined
    const { definition, builtIn } = entry
    let parent: ResolvedStyle | undefined
    if (definition.extends !== undefined) {
      parent = resolve(definition.extends)
      if (!parent) {
        issues.error(
          owner,
          `${owner}.extends`,
          `"${definition.extends}" has errors`,
        )
        return undefined
      }
    }
    const resolved: ResolvedStyle = {
      name,
      label: definition.label,
      builtIn,
      lineage: [name, ...(parent?.lineage ?? [])],
      frosted: definition.frosted ?? parent?.frosted ?? false,
      defaults: { ...parent?.defaults, ...definition.defaults },
      vars: mergeModes(
        parent?.vars ?? EMPTY_MODES,
        definition.vars,
      ) as Required<ModeVars>,
      tokens: mergeModes(parent?.tokens ?? EMPTY_MODES, definition.tokens),
      when: [...(parent?.when ?? []), ...(definition.when ?? [])],
      forcedFallback: {
        ...parent?.forcedFallback,
        ...definition.forcedFallback?.tokens,
      },
      signatures: { ...parent?.signatures, ...definition.signatures },
      hairlines: definition.hairlines ?? parent?.hairlines ?? "opaque",
    }
    styles[name] = resolved
    return resolved
  }
  // Resolve every style first, then rebuild the record in registry order:
  // a child named before its parent resolves the parent early.
  for (const name of order) resolve(name)
  const orderedStyles: Record<string, ResolvedStyle> = {}
  for (const name of order) {
    const style = styles[name]
    if (style) orderedStyles[name] = style
  }

  const presets: Record<string, ResolvedPreset> = {}
  for (const [name, definition] of Object.entries(consumerPresets)) {
    const owner = `presets.${name}`
    const c: Checker = { issues, owner }
    const problem = nameError(name, builtins)
    if (problem) issues.error(owner, owner, problem)
    const style = has(orderedStyles, definition.style)
      ? orderedStyles[definition.style]
      : undefined
    if (!style) {
      issues.error(
        owner,
        `${owner}.style`,
        raw.has(definition.style)
          ? `"${definition.style}" has errors`
          : `"${definition.style}" is not a style`,
      )
    }
    checkAxes(c, `${owner}.axes`, definition.axes)
    checkSignatures(c, `${owner}.signatures`, definition.signatures)
    if (
      definition.shellStyle !== undefined &&
      !(SHELL_STYLES as readonly unknown[]).includes(definition.shellStyle)
    ) {
      issues.error(
        owner,
        `${owner}.shellStyle`,
        `"${String(definition.shellStyle)}" is not a shell style`,
      )
    }
    checkModes(c, `${owner}.tokens`, definition.tokens, (path, tokens) => {
      checkTokens(c, path, tokens)
      if (!style || !isRecord(tokens)) return
      for (const token of Object.keys(tokens)) {
        if (
          style.when.some((entry) => entry.tokens && has(entry.tokens, token))
        ) {
          issues.error(
            owner,
            `${path}.${token}`,
            `style "${style.name}" sets "${token}" in a when entry, which a preset may not override`,
          )
        }
      }
    })
    if (issues.has(owner) || !style) continue
    presets[name] = resolvePreset(name, definition)
  }

  const styleNames = Object.keys(orderedStyles)
  const presetValues = ["base", ...Object.keys(presets)]
  const values = <K extends AxisKey>(key: K): readonly string[] => {
    if (key === "style") return styleNames
    if ((key as string) === "preset") return presetValues
    return AXES[key].values
  }

  const presetFor = (style: string, preset: string | null | undefined) =>
    preset && has(presets, preset) && presets[preset]?.style === style
      ? preset
      : "base"

  return {
    styles: orderedStyles,
    presets,
    issues: issues.list,
    hash: definitionsHash(definitions),
    values,
    isValue: (key: AxisKey, value: unknown): value is string =>
      typeof value === "string" && values(key).includes(value),
    presetFor,
    signaturesFor: (style, preset) => {
      const own = has(orderedStyles, style)
        ? orderedStyles[style]?.signatures
        : undefined
      const chosen = presetFor(style, preset)
      const fromPreset =
        chosen === "base" ? undefined : presets[chosen]?.signatures
      const out: Partial<Record<SignatureKey, string>> = {}
      for (const key of SIGNATURE_KEYS) {
        out[key] = fromPreset?.[key] ?? own?.[key] ?? SIGNATURES[key].default
      }
      return out as SignatureValues
    },
  }
}

function resolvePreset(
  name: string,
  definition: PresetDefinition,
): ResolvedPreset {
  const resolved: ResolvedPreset = {
    name,
    label: definition.label,
    builtIn: false,
    style: definition.style,
    axes: { ...definition.axes },
    tokens: {
      shared: { ...definition.tokens?.shared },
      light: { ...definition.tokens?.light },
      dark: { ...definition.tokens?.dark },
    },
    signatures: { ...definition.signatures },
  }
  if (definition.shellStyle !== undefined)
    resolved.shellStyle = definition.shellStyle
  return resolved
}

/** The registry of the built-in styles plus `definitions`. */
export function resolveRegistry(definitions?: ThemeDefinitions): ThemeRegistry {
  return buildRegistry(BUILTIN_STYLES, definitions)
}
