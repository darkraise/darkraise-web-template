import {
  AXES,
  AXIS_KEYS,
  type AxisKey,
  type AxisValues,
} from "../src/theme/axes/registry"
import { applyAxisChange, effectiveSettings } from "../src/theme/axes/resolve"
import { engineInput } from "../src/theme/config/engineInput"
import { resolveRegistry } from "../src/theme/config/registry"
import {
  STAMPED_SIGNATURES,
  signatureAttribute,
} from "../src/theme/config/signatures"
import { generateTokens } from "../src/theme/engine/generateTokens"
import { defaultLabels } from "../src/labels/defaults"
import { resolveDefaults, themeConfig } from "../src/theme/themeConfig"
import type { AccentColor, ResolvedMode } from "../src/theme/types"

const registry = resolveRegistry()
const defaults = resolveDefaults(themeConfig, registry)

export interface StoryThemeChoice {
  /** Left out, the preset's accent applies, else the style's, else the kit's. */
  accentColor?: AccentColor
  style: string
  /** Left out, the style's base. */
  preset?: string
  mode: ResolvedMode
}

export interface StoryPresetChoice {
  style: string
  preset: string
}

/** What the two toolbars last held, and the pair that was painted for it. */
export interface StoryPresetState {
  picked: StoryPresetChoice
  settled: StoryPresetChoice
}

export interface StoryToolbarItem {
  value: string
  title: string
  right?: string
}

/** `base`, then every preset in registry order, each beside its style's label. */
export function presetToolbarItems(): StoryToolbarItem[] {
  return [
    { value: "base", title: defaultLabels.theme.presets.base },
    ...Object.values(registry.presets).map((preset) => ({
      value: preset.name,
      title: preset.label,
      right: registry.styles[preset.style]?.label,
    })),
  ]
}

const samePair = (a: StoryPresetChoice, b: StoryPresetChoice) =>
  a.style === b.style && a.preset === b.preset

/** The pair the provider would hold once `moved` was picked; with none, as stored. */
function settlePair(
  picked: StoryPresetChoice,
  moved?: "style" | "preset",
): StoryPresetChoice {
  const stored = moved
    ? applyAxisChange(
        picked as Partial<AxisValues>,
        moved,
        picked[moved],
        registry,
      )
    : (picked as Partial<AxisValues>)
  const { style, preset } = effectiveSettings(stored, defaults, registry)
  return { style, preset }
}

/**
 * Settles the Style and Preset toolbars the way the provider settles the two
 * axes: a picked preset brings its style, and picking another style returns
 * the preset to `base`. `last` tells which toolbar moved; with none, a preset
 * brings its style. A pick settles the same way however often it is asked
 * for, and the toolbars catching up with the settled pair is not a pick.
 */
export function settleStoryChoice(
  picked: StoryPresetChoice,
  last?: StoryPresetState,
): StoryPresetState {
  if (last && samePair(picked, last.picked)) return last
  if (last && samePair(picked, last.settled)) {
    return { picked, settled: last.settled }
  }
  const moved = picked.preset === last?.settled.preset ? "style" : "preset"
  return { picked, settled: settlePair(picked, moved) }
}

const STATE_KEY = "darkraise-story-preset"

function readState(): StoryPresetState | undefined {
  try {
    const raw = sessionStorage.getItem(STATE_KEY)
    return raw ? (JSON.parse(raw) as StoryPresetState) : undefined
  } catch {
    return undefined
  }
}

/**
 * The pair to paint for what the two toolbars hold. The last state lives in
 * session storage because a docs page reloads the preview frame on every
 * toolbar change, which would lose it with the module. A story that pins
 * either global is settled on its own, its pin winning, and leaves the stored
 * state alone: its pair is not what the toolbars hold.
 */
export function settleStoryToolbars(
  picked: StoryPresetChoice,
  pinned?: "style" | "preset",
): StoryPresetChoice {
  if (pinned) {
    return settlePair(picked, pinned === "preset" ? "preset" : undefined)
  }
  const state = settleStoryChoice(picked, readState())
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // Storage is blocked, so every run settles as a first load.
  }
  return state.settled
}

let paintedTokens: readonly string[] = []

/**
 * Paints <html> for the toolbars' choices the way ThemeProvider would with
 * only those stored: every other axis takes the preset's value, else the
 * style's default, else the registry's. Storybook skips the provider so the
 * toolbars alone decide.
 */
export function applyStoryTheme(choice: StoryThemeChoice): void {
  const stored: Partial<Record<AxisKey, string>> = {
    style: choice.style,
    preset: choice.preset,
    mode: choice.mode,
  }
  if (choice.accentColor) stored.accentColor = choice.accentColor
  const current = effectiveSettings(
    stored as Partial<AxisValues>,
    defaults,
    registry,
  )

  const root = document.documentElement
  for (const key of AXIS_KEYS) {
    const attribute = AXES[key].attribute
    if (attribute) root.setAttribute(attribute, current[key])
  }
  const signatures = registry.signaturesFor(current.style, current.preset)
  for (const key of STAMPED_SIGNATURES) {
    root.setAttribute(signatureAttribute(key), signatures[key])
  }

  const tokens = generateTokens(engineInput(registry, current, choice.mode))
  // A toned bar has tiers of its own, which the next choice may not have.
  for (const key of paintedTokens) {
    if (!Object.prototype.hasOwnProperty.call(tokens, key)) {
      root.style.removeProperty(key)
    }
  }
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value)
  }
  paintedTokens = Object.keys(tokens)
}
