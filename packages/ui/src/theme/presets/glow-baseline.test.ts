import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { glass } from "./glass/glass"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

// Characterisation test, captured from a real browser before the glow axes
// refactor (accent blue, surface slate, preset defaults). Glass's halo and
// Sci-fi's glow are being re-expressed as tuning of the shared outerGlow /
// innerGlow axes; at their default step each must reproduce these values
// exactly. A diff here is visual drift in a preset that has already been
// through design review — it is the whole safety net for that refactor, so
// update these strings only alongside a deliberate, stated design change.
const slate = surfaceColors.slate as ColorScale
const blue = accentColors.blue

function common(mode: "light" | "dark") {
  return {
    accentColor: "blue" as const,
    surfaceColor: "slate" as const,
    backgroundStyle: "solid" as const,
    mode,
    accent: blue,
    surface: slate,
    neutral: slate,
  }
}

const GLASS_HALO_BASELINE = {
  light: {
    "--glass-halo-raised":
      "0 0 0 1px hsl(var(--primary) / 0.06), 0 4px 12px -2px hsl(var(--primary) / 0.12), 0 12px 32px -8px hsl(var(--primary) / 0.06)",
    "--glass-halo-overlay":
      "0 0 0 1px hsl(var(--primary) / 0.08), 0 4px 16px -2px hsl(var(--primary) / 0.16), 0 16px 40px -8px hsl(var(--primary) / 0.08)",
    "--glass-halo-modal":
      "0 0 0 1px hsl(var(--primary) / 0.1), 0 8px 24px -2px hsl(var(--primary) / 0.2), 0 24px 60px -8px hsl(var(--primary) / 0.1)",
  },
  dark: {
    "--glass-halo-raised":
      "0 0 0 1px hsl(var(--primary) / 0.1), 0 4px 12px -2px hsl(var(--primary) / 0.2), 0 12px 32px -8px hsl(var(--primary) / 0.1)",
    "--glass-halo-overlay":
      "0 0 0 1px hsl(var(--primary) / 0.14), 0 4px 16px -2px hsl(var(--primary) / 0.28), 0 16px 40px -8px hsl(var(--primary) / 0.14)",
    "--glass-halo-modal":
      "0 0 0 1px hsl(var(--primary) / 0.18), 0 8px 24px -2px hsl(var(--primary) / 0.36), 0 24px 60px -8px hsl(var(--primary) / 0.18)",
  },
} as const

describe("glow baseline — Glass halo at its default step", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`reproduces the ${mode} halo ramp`, () => {
      // Reads the shared axis at the step Glass asks for via
      // commonAxisDefaults, which must reproduce its old `soft` halo exactly.
      const tokens = glass.generateTokens?.(
        { ...common(mode), outerGlow: "balanced" },
        { opacity: "medium", blur: "medium" },
      )
      expect(tokens).toBeDefined()
      for (const [key, value] of Object.entries(GLASS_HALO_BASELINE[mode])) {
        expect(tokens?.[key], key).toBe(value)
      }
    })
  }
})

// Sci-fi's ramp lives in CSS rather than the token engine. It is now one set
// of tokens carrying the old `normal` step's alphas, each multiplied by a
// per-axis scale factor that is 1 at `balanced` — so both axes at balanced
// reproduce what the preset shipped. Four of these fuse an inset layer with an
// outer one, which is why innerGlow drives Sci-fi too, not just outerGlow.
//
// This asserts the base alphas and the scale wiring; the exact computed
// equality with the captured baseline is proven in a browser, because calc()
// inside hsl() is not resolvable from source text.
describe("glow baseline — Sci-fi glow ramp", () => {
  const css = readFileSync("src/theme/presets/scifi/scifi.css", "utf8").replace(
    /\s+/g,
    " ",
  )

  it("puts both axes at scale 1 for their balanced step", () => {
    expect(css).toMatch(
      /\[data-outer-glow="balanced"\] \{ --scifi-outer-scale: 1; \}/,
    )
    expect(css).toMatch(
      /\[data-inner-glow="balanced"\] \{ --scifi-inner-scale: 1; \}/,
    )
    expect(css).toMatch(
      /\[data-outer-glow="none"\] \{ --scifi-outer-scale: 0; \}/,
    )
    expect(css).toMatch(
      /\[data-inner-glow="none"\] \{ --scifi-inner-scale: 0; \}/,
    )
  })

  it("keeps the rest glow's inset on the inner axis and its outer on the outer", () => {
    expect(css).toMatch(
      /--scifi-rest-glow: inset 0 0 8px hsl\(var\(--primary\) \/ calc\(0\.14 \* var\(--scifi-inner-scale\)\)\), 0 0 6px hsl\(var\(--primary\) \/ calc\(0\.2 \* var\(--scifi-outer-scale\)\)\)/,
    )
  })

  it("splits the active glow across both axes", () => {
    expect(css).toMatch(
      /--scifi-active-glow: inset 0 0 10px hsl\(var\(--primary\) \/ calc\(0\.32 \* var\(--scifi-inner-scale\)\)\)/,
    )
    expect(css).toMatch(
      /0 0 18px hsl\(var\(--primary\) \/ calc\(0\.4 \* var\(--scifi-outer-scale\)\)\)/,
    )
  })

  it("keeps the edge and text glows entirely on the outer axis", () => {
    expect(css).toMatch(
      /--scifi-edge-glow: 0 0 0 1px hsl\(var\(--primary\) \/ calc\(0\.7 \* var\(--scifi-outer-scale\)\)\)/,
    )
    expect(css).toMatch(
      /--scifi-text-glow: 0 0 4px hsl\(var\(--primary\) \/ calc\(0\.65 \* var\(--scifi-outer-scale\)\)\)/,
    )
    expect(css).not.toMatch(/--scifi-text-glow:[^;]*inner-scale/)
  })

  it("no longer carries the retired intensity blocks", () => {
    expect(css).not.toMatch(/data-scifi-intensity/)
  })
})
