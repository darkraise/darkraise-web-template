import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

// The Glass material's CSS-only tokens (opacity/blur scalar maps, the
// halo=none and main[data-content] resets, the reduced-transparency
// accommodation, and the cross-file card-elevation duplication) are set by
// attribute selectors in glass.css / theme.css, not by JS, so the unit tests
// in glass.test.ts can't reach them. These text assertions lock the magic
// numbers and structural rules against silent drift — the exact surfaces the
// recent halo/boundary commits churned.

// Resolved from the vitest project root (packages/ui), which is process.cwd()
// when the suite runs. Avoids import.meta.url, which is not a file:// URL in
// this vitest setup.
const root = process.cwd()
const glassCss = readFileSync(
  resolve(root, "src/theme/presets/glass/glass.css"),
  "utf8",
)
const themeCss = readFileSync(resolve(root, "src/styles/theme.css"), "utf8")

const norm = (s: string) => s.replace(/\s+/g, " ").trim()

describe("glass.css scalar axis tokens", () => {
  it("maps opacity → --surface-opacity (subtle/medium/strong)", () => {
    expect(glassCss).toContain('[data-glass-opacity="subtle"]')
    expect(glassCss).toMatch(/--surface-opacity:\s*0\.78/)
    expect(glassCss).toMatch(/--surface-opacity:\s*0\.5\b/)
    expect(glassCss).toMatch(/--surface-opacity:\s*0\.3\b/)
  })

  it("maps blur → --backdrop-filter (none/low/medium/high)", () => {
    expect(glassCss).toMatch(
      /\[data-glass-blur="none"\][\s\S]*?--backdrop-filter:\s*none/,
    )
    expect(glassCss).toContain("--backdrop-filter: blur(6px) saturate(140%)")
    expect(glassCss).toContain("--backdrop-filter: blur(12px) saturate(140%)")
    expect(glassCss).toContain("--backdrop-filter: blur(24px) saturate(140%)")
  })
})

describe("glass.css accessibility accommodation", () => {
  it("forces opaque, unblurred surfaces under reduced transparency / more contrast", () => {
    expect(glassCss).toMatch(
      /@media\s*\(prefers-reduced-transparency:\s*reduce\),\s*\(prefers-contrast:\s*more\)/,
    )
    const block = glassCss.slice(
      glassCss.indexOf("prefers-reduced-transparency"),
    )
    expect(block).toMatch(/--surface-opacity:\s*1\b/)
    expect(block).toMatch(/--backdrop-filter:\s*none/)
  })
})

describe("glass.css halo + state suppression", () => {
  it("halo=none zeros the glow state tokens but KEEPS the selected-fill", () => {
    const block = glassCss
      .slice(glassCss.indexOf('[data-glass-halo="none"]'))
      .slice(
        0,
        glassCss
          .slice(glassCss.indexOf('[data-glass-halo="none"]'))
          .indexOf("}"),
      )
    expect(block).toContain("--glass-state-hover-glow: 0 0 transparent")
    expect(block).toContain("--glass-state-active-inset: 0 0 transparent")
    // selected-fill is the primary selection affordance — must NOT be zeroed
    // here, or fill-only consumers lose their selected state at halo=none.
    expect(block).not.toContain("--glass-state-selected-fill")
  })

  it("main[data-content] suppresses halo tiers + glow tokens but KEEPS selected-fill", () => {
    const start = glassCss.indexOf('[data-preset="glass"] main[data-content]')
    const block = glassCss.slice(
      start,
      start + glassCss.slice(start).indexOf("}"),
    )
    for (const token of [
      "--glass-halo-raised",
      "--glass-halo-overlay",
      "--glass-halo-modal",
      "--glass-state-hover-glow",
      "--glass-state-active-inset",
    ]) {
      expect(block).toContain(token)
    }
    expect(block).not.toContain("--glass-state-selected-fill")
  })
})

describe("theme.css glass utilities honor the blur axis", () => {
  it("route backdrop-filter through var(--backdrop-filter), not a hardcoded blur()", () => {
    // Regression guard: a literal blur(Npx) ignores the blur axis AND
    // establishes a containing block off-glass. The five glass utilities
    // must consume the self-cleaning var instead.
    expect(themeCss).not.toContain("blur(12px) saturate(140%)")
    expect(themeCss).not.toContain("blur(20px) saturate(140%)")
    expect(themeCss).not.toContain("blur(32px) saturate(140%)")
    const matches = themeCss.match(
      /backdrop-filter:\s*var\(--backdrop-filter\)/g,
    )
    expect(matches?.length ?? 0).toBeGreaterThanOrEqual(5)
  })
})

describe("glass dark --card-elevation-* stays in sync with the base ramp", () => {
  // glass.css duplicates the theme.css [data-mode="dark"] card-elevation ramp
  // (unlayered constraint) and only appends ", var(--glass-halo-raised)".
  // This converts the "update both if the base ramp changes" comment into an
  // enforced invariant.
  const darkBaseBlock = themeCss.split('[data-mode="dark"] {')[1].split("}")[0]

  for (const tier of ["low", "medium", "high"] as const) {
    it(`dark ${tier} = base ramp + halo`, () => {
      const base = darkBaseBlock.match(
        new RegExp(`--card-elevation-${tier}:\\s*([^;]+);`),
      )?.[1]
      const glass = glassCss.match(
        new RegExp(`--card-elevation-${tier}:\\s*([^;]+);`),
      )?.[1]
      expect(base, `base dark --card-elevation-${tier}`).toBeTruthy()
      expect(glass, `glass dark --card-elevation-${tier}`).toBeTruthy()
      expect(norm(glass as string)).toBe(
        `${norm(base as string)}, var(--glass-halo-raised)`,
      )
    })
  }
})
