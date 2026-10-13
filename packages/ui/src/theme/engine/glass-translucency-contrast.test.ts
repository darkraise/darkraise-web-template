import { describe, expect, it } from "vitest"
import { AXES, AXIS_KEYS, type AxisValues } from "@theme/axes/registry"
import { effectiveSettings } from "@theme/axes/resolve"
import { engineInput } from "@theme/config/engineInput"
import { resolveRegistry } from "@theme/config/registry"
import {
  OVERLAY_ALPHA_FLOOR,
  SURFACE_ALPHA_FLOOR,
  TRANSPARENCY_SCALE,
  effectiveAlpha,
} from "@theme/config/transparency"
import {
  canvasHueScale,
  gradientCanvasPeak,
} from "@theme/engine/generateTokens"
import { composite, contrastRatio } from "@theme/engine/oklch"
import { finalTokens } from "@test/contrast-matrix"
import { resolvedTokens } from "@test/preset-tokens"

const TEXT = 4.5

/** An engine colour a ground layer names, with the alpha it paints at. */
const LAYER = /hsl\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)/g

interface Look {
  name: string
  preset: string
}

const registry = resolveRegistry()

// Soft Glass's ground is computed in CSS from the accent;
// soft-glass-contrast.test.ts covers it across every accent.
const LOOKS: Look[] = [
  { name: "glass", preset: "base" },
  ...Object.values(registry.presets)
    .filter(
      (preset) =>
        preset.builtIn &&
        preset.name !== "soft-glass" &&
        registry.styles[preset.style]?.lineage.includes("glass"),
    )
    .map((preset) => ({ name: preset.name, preset: preset.name })),
]

const DEFAULTS = Object.fromEntries(
  AXIS_KEYS.map((key) => [key, AXES[key].default]),
) as AxisValues

/**
 * Text on a card and on a popover or dialog, at every transparency step, for
 * a user who chose the look and nothing else. A translucent fill is
 * composited over each colour the look can put beneath it; a mix of two of
 * them lies between the two, so the extremes bound it. The blur spreads thin
 * marks beneath, so text and icons below are not modelled.
 */
function failures(look: Look, mode: "light" | "dark"): string[] {
  const axes = effectiveSettings(
    { style: "glass", preset: look.preset },
    DEFAULTS,
    registry,
  )
  const combo = engineInput(registry, axes, mode)
  const tokens = finalTokens(combo)
  const at = (key: string): string => {
    const value = tokens[key]
    if (value === undefined) throw new Error(`no ${key} for ${look.name}`)
    return value
  }
  const preset = registry.presets[look.preset]
  const paint = resolvedTokens(
    registry.styles.glass?.tokens,
    preset?.tokens,
    mode,
  )

  // The page under the content: the page and muted planes, every engine
  // colour the look's ground art paints (each over the page at its alpha),
  // and the gradient canvas at its most saturated.
  const page: [string, string][] = [
    ["--background", at("--background")],
    ["--muted", at("--muted")],
  ]
  const art = Object.entries(paint)
    .filter(([token]) => token.startsWith("shellGround"))
    .map(([, value]) => value)
    .join(", ")
  for (const [, name, alpha] of art.matchAll(LAYER)) {
    const colour = at(name as string)
    page.push([
      alpha ? `${name} at ${alpha}` : (name as string),
      alpha ? composite(at("--background"), colour, Number(alpha)) : colour,
    ])
  }
  if (combo.backgroundStyle === "gradient") {
    page.push([
      "the canvas peak",
      gradientCanvasPeak(
        at("--background"),
        canvasHueScale(combo.accentColor, combo.surfaceColor, true)[500],
        mode,
        combo.backgroundIntensity,
      ),
    ])
  }
  // A popover or dialog can also open over a card, the rail or the bar.
  const overlayGrounds: [string, string][] = [
    ...page,
    ["--card", at("--card")],
    ["--surface-sidebar", at("--surface-sidebar")],
    ["--surface-header", at("--surface-header")],
  ]

  const out: string[] = []
  const hold = (
    surface: string,
    fill: string,
    declared: number,
    floor: number,
    grounds: [string, string][],
    texts: string[],
  ) => {
    for (const [step, scale] of Object.entries(TRANSPARENCY_SCALE)) {
      const alpha = effectiveAlpha(declared, scale, floor)
      for (const [ground, colour] of grounds) {
        const face = composite(colour, at(fill), alpha)
        for (const text of texts) {
          const ratio = contrastRatio(at(text), face)
          if (ratio < TEXT) {
            out.push(
              `${text} on a ${surface} at ${alpha.toFixed(2)} (${step}) over ${ground}: ${ratio.toFixed(2)}`,
            )
          }
        }
      }
    }
  }
  hold(
    "card",
    "--card",
    Number(paint.surfaceFillAlpha ?? "1"),
    SURFACE_ALPHA_FLOOR,
    page,
    ["--foreground", "--muted-foreground"],
  )
  // A flat rail derives its glass from the card alpha (Milk Glass, Aurora
  // Night, Dusk Haze), so it thins with Transparency too.
  const rail = /calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)/.exec(
    paint.chromeFlatFill ?? "",
  )
  if (rail) {
    const [, k, c] = rail
    const declared = Number(paint.surfaceFillAlpha ?? "1")
    for (const [step, scale] of Object.entries(TRANSPARENCY_SCALE)) {
      const card = effectiveAlpha(declared, scale, SURFACE_ALPHA_FLOOR)
      const alpha = Math.min(1, Math.max(0, card * Number(k) - Number(c)))
      for (const [ground, colour] of page) {
        const face = composite(colour, at("--card"), alpha)
        for (const text of [
          "--sidebar-foreground",
          "--sidebar-foreground-muted",
        ]) {
          const ratio = contrastRatio(at(text), face)
          if (ratio < TEXT) {
            out.push(
              `${text} on the flat rail at ${alpha.toFixed(2)} (${step}) over ${ground}: ${ratio.toFixed(2)}`,
            )
          }
        }
      }
    }
  }
  // An inset shell's content pane derives its glass from the card alpha
  // (Mica Desk, Coral Space), and page text that sits outside a card stands
  // on it.
  const paneFill = paint.shellContentFill ?? ""
  if (paneFill.includes("--surface-alpha")) {
    const pane =
      /^hsl\(var\((--[\w-]+)\) \/ calc\(var\(--surface-alpha\) \* ([\d.]+) - ([\d.]+)\)\)$/.exec(
        paneFill,
      )
    if (!pane) {
      out.push(`an unmodelled content pane fill: ${paneFill}`)
    } else {
      const [, fill, k, c] = pane
      const declared = Number(paint.surfaceFillAlpha ?? "1")
      for (const [step, scale] of Object.entries(TRANSPARENCY_SCALE)) {
        const card = effectiveAlpha(declared, scale, SURFACE_ALPHA_FLOOR)
        const alpha = Math.min(1, Math.max(0, card * Number(k) - Number(c)))
        for (const [ground, colour] of page) {
          const face = composite(colour, at(fill as string), alpha)
          for (const text of ["--foreground", "--muted-foreground"]) {
            const ratio = contrastRatio(at(text), face)
            if (ratio < TEXT) {
              out.push(
                `${text} on the content pane at ${alpha.toFixed(2)} (${step}) over ${ground}: ${ratio.toFixed(2)}`,
              )
            }
          }
        }
      }
    }
  }
  hold(
    "popover or dialog",
    "--popover",
    Number(paint.overlayFillAlpha ?? "1"),
    OVERLAY_ALPHA_FLOOR,
    overlayGrounds,
    ["--popover-foreground", "--muted-foreground"],
  )
  return out
}

describe("glass translucency contrast", () => {
  it("covers base Glass and every built-in Glass preset but Soft Glass", () => {
    expect(LOOKS.map((look) => look.name)).toEqual([
      "glass",
      "mica-desk",
      "smoked-obsidian",
      "milk-glass",
      "aurora-night",
      "coral-space",
      "dusk-haze",
    ])
  })

  it("declares a card and an overlay alpha in every look", () => {
    for (const look of LOOKS) {
      for (const mode of ["light", "dark"] as const) {
        const paint = resolvedTokens(
          registry.styles.glass?.tokens,
          registry.presets[look.preset]?.tokens,
          mode,
        )
        expect(
          Number(paint.surfaceFillAlpha),
          `${look.name} ${mode}`,
        ).toBeLessThan(1)
        expect(
          Number(paint.overlayFillAlpha),
          `${look.name} ${mode}`,
        ).toBeLessThan(1)
      }
    }
  })

  // Transparency reaches popups and dialogs only through --overlay-alpha, so
  // a fill with an alpha of its own would ignore the setting.
  it("paints popups and dialogs at the overlay alpha in every look", () => {
    const looks = [...LOOKS, { name: "soft-glass", preset: "soft-glass" }]
    for (const look of looks) {
      for (const mode of ["light", "dark"] as const) {
        const paint = resolvedTokens(
          registry.styles.glass?.tokens,
          registry.presets[look.preset]?.tokens,
          mode,
        )
        for (const token of ["dialogFill", "overlayFillBase"] as const) {
          expect(paint[token], `${look.name} ${mode} ${token}`).toMatch(
            /^hsl\(var\(--[\w-]+\) \/ var\(--overlay-alpha\)\)$/,
          )
        }
      }
    }
  })

  it.each(
    LOOKS.flatMap((look) =>
      (["light", "dark"] as const).map(
        (mode) => [`${look.name} ${mode}`, look, mode] as const,
      ),
    ),
  )("holds text at 4.5:1 on %s at every step", (_name, look, mode) => {
    expect(failures(look, mode)).toEqual([])
  })
})
