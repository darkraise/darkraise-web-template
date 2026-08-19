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
      const tokens = glass.generateTokens?.(common(mode), {
        opacity: "medium",
        blur: "medium",
        halo: "soft",
      })
      expect(tokens).toBeDefined()
      for (const [key, value] of Object.entries(GLASS_HALO_BASELINE[mode])) {
        expect(tokens?.[key], key).toBe(value)
      }
    })
  }
})

// Sci-fi's ramp lives in CSS attribute blocks rather than the token engine, so
// the baseline is the source text of its default step. Every one of these is
// primary-driven, and four of them fuse an inset layer with an outer layer in
// a single value — which is why innerGlow has to drive Sci-fi too, not just
// outerGlow.
describe("glow baseline — Sci-fi glow at its default step", () => {
  const css = readFileSync("src/theme/presets/scifi/scifi.css", "utf8").replace(
    /\s+/g,
    " ",
  )

  const normalBlock = (): string => {
    const start = css.indexOf('[data-scifi-intensity="normal"] {')
    expect(start, "the normal intensity block must exist").toBeGreaterThan(-1)
    return css.slice(start, css.indexOf("}", start))
  }

  it("keeps the rest glow fusing an inset and an outer layer", () => {
    expect(normalBlock()).toMatch(
      /--scifi-rest-glow: inset 0 0 8px hsl\(var\(--primary\) \/ 0\.14\), 0 0 6px hsl\(var\(--primary\) \/ 0\.2\)/,
    )
  })

  it("keeps the active glow fusing an inset and two outer layers", () => {
    expect(normalBlock()).toMatch(
      /--scifi-active-glow: inset 0 0 10px hsl\(var\(--primary\) \/ 0\.32\), 0 0 6px hsl\(var\(--primary\) \/ 0\.65\), 0 0 18px hsl\(var\(--primary\) \/ 0\.4\)/,
    )
  })

  it("keeps the edge and text glows outer-only", () => {
    const block = normalBlock()
    expect(block).toMatch(
      /--scifi-edge-glow: 0 0 0 1px hsl\(var\(--primary\) \/ 0\.7\)/,
    )
    expect(block).toMatch(
      /--scifi-text-glow: 0 0 4px hsl\(var\(--primary\) \/ 0\.65\), 0 0 12px hsl\(var\(--primary\) \/ 0\.32\)/,
    )
  })
})
