import { describe, it, expect } from "vitest"
import { presets, PRESET_NAMES } from "./index"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { resolveSurfaceScale } from "@theme/engine/generateTokens"
import type { ColorScale, ResolvedMode, BackgroundStyle } from "@theme/types"

// Engine-wide invariant: every key a preset's generateTokens writes as an
// inline documentElement style MUST be declared in that preset's
// ownedTokenKeys, so the provider removeProperty's it when switching away.
// A missing entry leaks the inline value onto every subsequent preset (the
// Sci-fi --surface-opacity bug). This derives the write-set from a real run
// across the axis × mode × backgroundStyle matrix instead of trusting a
// hand-maintained literal array, so the whole class of bug fails loudly.

type LoosePreset = {
  axes: Record<string, { values: readonly string[]; default: string }>
  ownedTokenKeys?: readonly string[]
  generateTokens?: (
    common: {
      accentColor: "blue"
      surfaceColor: "slate"
      backgroundStyle: BackgroundStyle
      mode: ResolvedMode
      accent: ColorScale
      surface: ColorScale
      neutral: ColorScale
    },
    axes: Record<string, string>,
  ) => Record<string, string>
}

function axisCombos(
  axes: Record<string, { values: readonly string[]; default: string }>,
): Record<string, string>[] {
  const names = Object.keys(axes)
  const base: Record<string, string> = {}
  for (const n of names) base[n] = axes[n].default
  // All-defaults, plus each axis swept across all its values (others default).
  const combos: Record<string, string>[] = [{ ...base }]
  for (const n of names) {
    for (const v of axes[n].values) combos.push({ ...base, [n]: v })
  }
  return combos
}

describe("preset ownedTokenKeys invariant", () => {
  const modes: ResolvedMode[] = ["light", "dark"]
  const bgs: BackgroundStyle[] = ["solid", "gradient"]
  const accent = accentColors.blue
  const neutral = surfaceColors.slate as ColorScale

  for (const name of PRESET_NAMES) {
    const preset = presets[name] as unknown as LoosePreset
    const generate = preset.generateTokens
    if (!generate) continue

    it(`${name}: generateTokens writes only keys declared in ownedTokenKeys`, () => {
      const owned = new Set(preset.ownedTokenKeys ?? [])
      const written = new Set<string>()
      for (const mode of modes) {
        const surface = resolveSurfaceScale("slate", mode)
        for (const backgroundStyle of bgs) {
          for (const axes of axisCombos(preset.axes)) {
            const tokens = generate(
              {
                accentColor: "blue",
                surfaceColor: "slate",
                backgroundStyle,
                mode,
                accent,
                surface,
                neutral,
              },
              axes,
            )
            for (const key of Object.keys(tokens)) written.add(key)
          }
        }
      }
      const leaked = [...written].filter((k) => !owned.has(k)).sort()
      expect(leaked).toEqual([])
    })
  }
})
