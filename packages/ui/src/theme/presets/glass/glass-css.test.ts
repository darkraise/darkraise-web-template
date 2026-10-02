import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { glass } from "./glass"
import { accentColors } from "@theme/palettes/accentColors"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { ColorScale } from "@theme/types"

// The Glass material's CSS-only tokens (opacity/blur scalar maps, the
// main[data-content] reset, the reduced-transparency
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

describe("glass.css state suppression", () => {
  it("carries no dead halo attribute or card tokens", () => {
    // The halo axis moved to the global glow axes and its storage key is
    // migrated away, so nothing sets data-glass-halo any more.
    expect(glassCss).not.toContain("data-glass-halo")
    expect(themeCss).not.toMatch(/--(card-border|glow-surface|shadow-card)\s*:/)
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
  // Anchored to a line start: `:root[data-mode="dark"] {` inside
  // `@layer base` also contains the bare selector.
  const darkBaseBlock = themeCss
    .split(/^\[data-mode="dark"\] \{/m)[1]
    .split("}")[0]

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

describe("glass.css overlay surfaces carry a real colour layer", () => {
  // The fog gradient is a background-IMAGE pair, so it leaves
  // background-color transparent. Without a colour in the final layer an
  // overlay is only as opaque as the fog tiers (0.14/0.07 in dark), and page
  // text composites straight into the dialog whenever the backdrop blur is
  // unavailable.
  it("maps opacity -> --glass-overlay-base-alpha", () => {
    expect(glassCss).toMatch(/--glass-overlay-base-alpha:\s*0\.88/)
    expect(glassCss).toMatch(/--glass-overlay-base-alpha:\s*0\.76/)
    expect(glassCss).toMatch(/--glass-overlay-base-alpha:\s*0\.62/)
  })

  it("reduced transparency forces the base fully opaque", () => {
    const block = glassCss.slice(
      glassCss.indexOf("prefers-reduced-transparency"),
    )
    expect(block).toMatch(/--glass-overlay-base-alpha:\s*1\b/)
  })

  // --surface-overlay-bg composes from these two static pieces in
  // theme.css now (base/layers split — see overlay-bg-axis.test.ts), so
  // the axis reaches the overlay tier even when the attribute lands on a
  // component element rather than <html>. Glass declares neither the mix
  // nor --surface-overlay-bg itself; it only supplies the popover-coloured
  // base and its own decorative layers.
  it("declares a popover-coloured overlay base with the alpha axis", () => {
    const decls = glassCss.match(/--surface-overlay-base:[^;]+;/g) ?? []
    expect(decls.length).toBe(2)
    for (const decl of decls) {
      expect(norm(decl)).toBe(
        "--surface-overlay-base: hsl( var(--popover) / var(--glass-overlay-base-alpha, 0.76) );",
      )
    }
  })

  it("keeps the noise + fog-gradient decorative layers, per mode", () => {
    const decls = glassCss.match(/--surface-overlay-layers:[^;]+;/g) ?? []
    expect(decls.length).toBe(2)
    const normalized = decls.map(norm)
    expect(normalized).toContain(
      "--surface-overlay-layers: var(--glass-noise), linear-gradient(135deg, var(--fog-20), var(--fog-10));",
    )
    expect(normalized).toContain(
      "--surface-overlay-layers: var(--glass-noise), linear-gradient(135deg, var(--fog-15), var(--fog-05));",
    )
  })

  it("never declares --surface-overlay-bg itself", () => {
    expect(glassCss).not.toContain("--surface-overlay-bg:")
  })
})

// Glass rebinds some tokens to `<colour> / <alpha>`. Adding a second alpha
// in `hsl(var(--x) / a)` makes the declaration invalid, and the property
// silently falls back to transparent under Glass only.
describe("stylesheets vs Glass alpha-bound tokens", () => {
  const generateTokens = glass.generateTokens as NonNullable<
    typeof glass.generateTokens
  >
  const slate = surfaceColors.slate as ColorScale

  const alphaBound = new Set(
    (["light", "dark"] as const).flatMap((mode) =>
      (["solid", "gradient"] as const).flatMap((backgroundStyle) =>
        Object.entries(
          generateTokens(
            {
              accentColor: "blue",
              surfaceColor: "slate",
              backgroundStyle,
              mode,
              accent: accentColors.blue,
              surface: slate,
              neutral: slate,
            },
            { opacity: "medium", blur: "medium" },
          ),
        )
          .filter(
            ([name, value]) => name.startsWith("--") && / \/ /.test(value),
          )
          .map(([name]) => name),
      ),
    ),
  )

  function stylesheets(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return stylesheets(path)
      return entry.name.endsWith(".css") ? [path] : []
    })
  }

  it("finds the tokens Glass binds to an alpha expression", () => {
    expect([...alphaBound]).toEqual(
      expect.arrayContaining([
        "--muted",
        "--accent",
        "--secondary",
        "--border",
      ]),
    )
  })

  it("never applies a second alpha to one of them", () => {
    const offenders = stylesheets(resolve(root, "src")).flatMap((file) => {
      const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      return [...css.matchAll(/hsl\(\s*var\((--[\w-]+)\)\s*\//g)]
        .filter((m) => alphaBound.has(m[1]))
        .map((m) => `${file}: ${m[0]}`)
    })
    expect(offenders).toEqual([])
  })
})
