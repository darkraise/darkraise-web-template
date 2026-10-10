import type { AxisKey, AxisValues } from "../axes/registry"
import type { ShellStyle } from "../types"
import type { PaintToken } from "./tokens"

/** Paint token values; free CSS strings, `""` included. */
export type TokenMap = Partial<Record<PaintToken, string>>

/** Private custom properties, each named `--<style>-…` after the style or an ancestor. */
export type VarMap = Readonly<Record<`--${string}`, string>>

/**
 * `shared` applies in every mode and with no `data-mode` at all; `light`
 * applies whenever the mode is not dark; `dark` only in dark mode.
 */
export interface ModeTokens {
  shared?: TokenMap
  light?: TokenMap
  dark?: TokenMap
}

export interface ModeVars {
  shared?: VarMap
  light?: VarMap
  dark?: VarMap
}

/** Axes a style may default or a preset may set. */
export type DefinableAxes = Partial<
  Omit<AxisValues, "mode" | "style" | "preset">
>

/** Attribute axes a `when` entry may test. */
export type WhenAxisKey = Exclude<
  AxisKey,
  "mode" | "style" | "preset" | "sidebarSelection"
>

/** Tokens and vars that apply while every listed axis holds its value. */
export interface WhenEntry {
  axes: Partial<Record<WhenAxisKey, string>>
  mode?: "light" | "dark"
  tokens?: TokenMap
  vars?: VarMap
}

export interface StyleDefinition {
  label: string
  /** A built-in or consumer style whose whole definition this one starts from. */
  extends?: string
  /** Frosted chrome over the canvas: no content strip, chrome painted on the page ground. */
  frosted?: boolean
  /** Values for axes the user never set; they beat the app's config defaults. */
  defaults?: DefinableAxes
  vars?: ModeVars
  tokens?: ModeTokens
  /** Applied in array order; a longer selector still wins over a shorter one. */
  when?: readonly WhenEntry[]
  /** Applied under `prefers-reduced-transparency: reduce` or `prefers-contrast: more`. */
  forcedFallback?: { tokens: TokenMap }
}

export interface PresetDefinition {
  label: string
  style: string
  axes?: DefinableAxes
  tokens?: ModeTokens
  shellStyle?: ShellStyle
}

export interface ThemeDefinitions {
  styles?: Readonly<Record<string, StyleDefinition>>
  presets?: Readonly<Record<string, PresetDefinition>>
}
