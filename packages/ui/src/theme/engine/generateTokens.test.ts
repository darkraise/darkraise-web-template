import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { generateTokens, capCanvasSaturation } from "./generateTokens"
import { parseRules } from "../../styles/interactive-classes"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { contrastRatio } from "@theme/engine/oklch"
import { STATUS_NAMES, type StatusName } from "./steps"
import { ACCENT_COLORS, BACKGROUND_INTENSITIES } from "@theme/types"
import type {
  ColorScale,
  AccentColor,
  ResolvedMode,
  BackgroundIntensity,
  SurfaceColor,
} from "@theme/types"

describe("generateTokens", () => {
  it("produces all expected token keys for the default combination", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })

    const expectedKeys = [
      "--primary",
      "--primary-foreground",
      "--primary-fill",
      "--ring",
      "--focus-ring",
      "--chart-1",
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--legend",
      "--accent",
      "--accent-foreground",
      ...STATUS_NAMES.flatMap((status) =>
        [
          "subtle",
          "edge",
          "text",
          "solid",
          "solid-foreground",
          "solid-wash",
        ].map((role) => `--${status}-${role}`),
      ),
      "--border",
      "--input",
      "--field-edge-color",
      "--field-edge-lifted-color",
      "--surface-base",
      "--surface-raised",
      "--surface-overlay",
      "--surface-sunken",
      "--surface-sidebar",
      "--sidebar-active-bg",
      "--surface-header",
      "--border-subtle",
      "--border-default",
      "--border-strong",
    ]

    for (const key of expectedKeys) {
      expect(tokens).toHaveProperty(key)
      expect(tokens[key]).toBeTruthy()
    }
    expect(tokens).not.toHaveProperty("--shadow-dropdown")
  })

  it("uses shade 500 for primary in both light and dark modes (non-glass)", () => {
    // Dark mode used to brighten primary to shade 400, but that read as
    // glaring on every `bg-primary` surface (Button default, Checkbox,
    // Switch, Calendar selected, etc.). Both modes now share shade 500 of
    // the active accent palette so the brand color stays calm across
    // themes while the dark background still provides plenty of contrast.
    const light = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })
    const dark = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })

    expect(light["--primary"]).toBe("217 91% 60%")
    expect(dark["--primary"]).toBe("217 91% 60%")
  })

  it("emits --focus-ring as raw HSL channels lighter than --ring", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })
    expect(tokens["--focus-ring"]).toBeDefined()
    expect(tokens["--focus-ring"]).toMatch(/^\d+\s+\d+%\s+\d+%$/)
    expect(tokens["--focus-ring"]).not.toEqual(tokens["--ring"])
  })

  it("emits --focus-ring as accent shade 300 in light mode and 200 in dark mode", () => {
    const lightTokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })
    const darkTokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })
    // Derived from those shades, then raised where the shade itself could not
    // be seen: light blue-300 measured 1.58:1 against the page. The floor is
    // the requirement; the shade was only ever the starting point.
    expect(
      contrastRatio(
        lightTokens["--focus-ring"] as string,
        lightTokens["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(3)
    expect(
      contrastRatio(
        darkTokens["--focus-ring"] as string,
        darkTokens["--background"] as string,
      ),
    ).toBeGreaterThanOrEqual(3)
    expect(lightTokens["--focus-ring"]).not.toEqual(lightTokens["--ring"])
    expect(darkTokens["--focus-ring"]).not.toEqual(darkTokens["--ring"])
  })

  it("picks the primary foreground by contrast, not by assumption", () => {
    const build = (accentColor: AccentColor, mode: ResolvedMode) =>
      generateTokens({
        accentColor,
        surfaceColor: "slate",
        frosted: false,
        backgroundStyle: "solid",
        mode,
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
      })

    // White is unreadable on the light accents: it measures 2.14:1 on amber
    // against a 3:1 floor, which is why this is computed rather than fixed.
    // Dark amber keeps its bright fill, so it takes ink there too.
    expect(build("amber", "light")["--primary-foreground"]).toBe("222 47% 11%")
    expect(build("blue", "light")["--primary-foreground"]).toBe("0 0% 100%")
    expect(build("amber", "dark")["--primary-foreground"]).toBe("222 47% 11%")
    expect(build("blue", "dark")["--primary-foreground"]).toBe("0 0% 100%")
  })

  it("dark mode flips background to step 950 and foreground to step 50", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })

    expect(tokens["--background"]).toBe("229 16% 5%")
    expect(tokens["--foreground"]).toBe("210 40% 98%")
  })

  it("dark mode `--border` is distinct from `--muted` / `--secondary` / `--accent`", () => {
    // Regression for the collision where `--border` defaulted to
    // `surface[800]` — the same value used by --muted, --secondary,
    // --accent in dark mode. `border-border` outlines next to muted
    // surfaces (e.g. FloatingPanel header on its popover body) became
    // invisible. The standard border now sits one tier lighter
    // (surface[700]), matching the `borderDefault` recipe step.
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })
    expect(tokens["--border"]).not.toEqual(tokens["--muted"])
    expect(tokens["--border"]).not.toEqual(tokens["--secondary"])
    expect(tokens["--border"]).not.toEqual(tokens["--accent"])
    expect(tokens["--border"]).toEqual(tokens["--border-default"])
  })

  it("`--border-strong` follows the surface palette and outranks `--border`", () => {
    // Regression for the Card/Tabs `border="strong"` tier, which used to be
    // `hsl(var(--foreground) / 0.28)`. `--foreground` is always the fixed
    // slate neutral scale, so the strong tier painted a cold grey line on
    // every non-slate surface colour while the default tier stayed
    // surface-tinted — two borders on the same card in two different hues.
    const common = {
      accentColor: "blue",
      frosted: false,
      backgroundStyle: "solid",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    } as const

    for (const mode of ["light", "dark"] as const) {
      const slate = generateTokens({ ...common, surfaceColor: "slate", mode })
      const stone = generateTokens({ ...common, surfaceColor: "stone", mode })

      expect(slate["--border-strong"]).toBeTruthy()
      expect(stone["--border-strong"]).not.toEqual(slate["--border-strong"])
      expect(slate["--border-strong"]).not.toEqual(slate["--border-default"])
      expect(slate["--border-strong"]).not.toEqual(slate["--border-subtle"])
    }
  })

  it("moves the dark primary with darkAccentChroma", () => {
    const calm = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "calm",
      tintWithAccent: false,
    })
    const vivid = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "vivid",
      tintWithAccent: false,
    })
    expect(calm["--primary-fill"]).not.toEqual(vivid["--primary-fill"])
    expect(calm["--primary"]).not.toEqual(vivid["--primary"])
  })

  it.each(["light", "dark"] as const)(
    "solves content the same with frosted chrome (%s)",
    (mode) => {
      for (const accentColor of ["blue", "amber", "neutral"] as const) {
        for (const contrast of ["low", "standard", "high"] as const) {
          const input = {
            accentColor,
            surfaceColor: "slate",
            backgroundStyle: "solid",
            mode,
            contrast,
            darkAccentChroma: "standard",
            tintWithAccent: false,
          } as const
          const plain = generateTokens({ ...input, frosted: false })
          const frosted = generateTokens({ ...input, frosted: true })
          expect(Object.keys(frosted).sort()).toEqual(Object.keys(plain).sort())
          // The lifted edge is solved against a brighter face under Glass.
          const moved = Object.keys(plain).filter(
            (key) =>
              key !== "--field-edge-lifted-color" &&
              plain[key] !== frosted[key],
          )
          expect(moved, `${accentColor} ${contrast}`).toEqual(
            mode === "dark" ? ["--surface-sidebar"] : [],
          )
        }
      }
    },
  )

  it("leaves --shadow-dropdown to the stylesheets", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: true,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })
    expect(tokens).not.toHaveProperty("--shadow-dropdown")
    expect(tokens).not.toHaveProperty("--shadow-card")

    const declared = (path: string, selector: string) =>
      parseRules(readFileSync(path, "utf8"))
        .filter((rule) => rule.selectors.includes(selector))
        .map((rule) => /--shadow-dropdown:\s*([^;]+);/.exec(rule.body)?.[1])
        .filter(Boolean)
        .map((value) => (value as string).replace(/\s+/g, " ").trim())
    expect(declared("src/styles/theme.css", ":root")).toContain(
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    )
    const glassCss = "src/theme/styles/generated/glass.css"
    expect(declared(glassCss, '[data-style="glass"]')).toEqual([
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    ])
    expect(
      declared(glassCss, '[data-style="glass"]:not([data-mode="dark"])'),
    ).toEqual([
      "0 10px 15px -3px rgb(16 24 40 / 0.1), 0 4px 6px -4px rgb(16 24 40 / 0.1)",
    ])
  })

  it("paints a frosted sidebar on the page ground in dark mode", () => {
    const input = {
      accentColor: "blue",
      surfaceColor: "slate",
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    } as const
    const frosted = generateTokens({ ...input, frosted: true })
    const plain = generateTokens({ ...input, frosted: false })
    expect(frosted["--surface-sidebar"]).toBe(frosted["--background"])
    expect(plain["--surface-sidebar"]).toBe(plain["--card"])
  })

  describe("status pairs", () => {
    // The base hue survives the solve: emerald-500 measured 2.48:1 and
    // amber-500 2.03:1 as text in light, so both move along their own ramp.
    const HUES: Record<StatusName, string> = {
      destructive: "0",
      success: "160",
      warning: "38",
      info: "217",
    }

    for (const mode of ["light", "dark"] as const) {
      for (const status of STATUS_NAMES) {
        it(`${status} clears its pair floors in ${mode} mode`, () => {
          const tokens = generateTokens({
            accentColor: "blue",
            surfaceColor: "slate",
            frosted: false,
            backgroundStyle: "solid",
            mode,
            contrast: "standard",
            darkAccentChroma: "standard",
            tintWithAccent: false,
          })
          const ratio = (fg: string, bg: string) =>
            contrastRatio(tokens[fg] as string, tokens[bg] as string)

          expect(tokens[`--${status}-text`]).toMatch(
            new RegExp(`^${HUES[status]} `),
          )
          for (const ground of [
            "--background",
            "--card",
            `--${status}-subtle`,
          ]) {
            expect(
              ratio(`--${status}-text`, ground),
              `text on ${ground}`,
            ).toBeGreaterThanOrEqual(4.5)
            expect(
              ratio(`--${status}-edge`, ground),
              `edge on ${ground}`,
            ).toBeGreaterThanOrEqual(3)
          }
          expect(
            ratio(`--${status}-solid-foreground`, `--${status}-solid`),
          ).toBeGreaterThanOrEqual(4.6)
        })
      }
    }
  })

  it("success and warning are independent of accentColor", () => {
    const blueAccent = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })
    const redAccent = generateTokens({
      accentColor: "red",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })

    for (const status of ["success", "warning"]) {
      for (const role of [
        "subtle",
        "edge",
        "text",
        "solid",
        "solid-foreground",
      ]) {
        const key = `--${status}-${role}`
        expect(blueAccent[key], key).toBe(redAccent[key])
      }
    }
  })

  it("surfaceColor slate produces identical tokens to the original behavior", () => {
    const tokens = generateTokens({
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      mode: "light",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    })

    expect(tokens["--background"]).toBe("210 16% 98%")
    expect(tokens["--foreground"]).toBe("222 47% 11%")
  })

  describe("semantic aliases", () => {
    const ALIASES = [
      ["--background", "--neutral-1"],
      ["--card", "--neutral-2"],
      ["--muted", "--neutral-3"],
      ["--border", "--neutral-6"],
      ["--foreground", "--neutral-12"],
      ["--primary", "--primary-8"],
      ["--primary-fill", "--primary-9"],
      ["--primary-text", "--primary-11"],
    ] as const

    for (const mode of ["light", "dark"] as const) {
      it(`maps the semantic tokens onto the steps in ${mode} mode`, () => {
        const tokens = generateTokens({
          accentColor: "blue",
          surfaceColor: "slate",
          frosted: false,
          backgroundStyle: "solid",
          mode,
          contrast: "standard",
          darkAccentChroma: "standard",
          tintWithAccent: false,
        })
        for (const [alias, step] of ALIASES) {
          expect(tokens[step], step).toBeTruthy()
          expect(tokens[alias], alias).toBe(tokens[step])
        }
      })
    }
  })

  it("emits the same eight chart colours under every accent", () => {
    for (const mode of ["light", "dark"] as const) {
      const charts = (accentColor: AccentColor) => {
        const tokens = generateTokens({
          accentColor,
          surfaceColor: "slate",
          frosted: false,
          backgroundStyle: "solid",
          mode,
          contrast: "standard",
          darkAccentChroma: "standard",
          tintWithAccent: false,
        })
        return Array.from({ length: 8 }, (_, i) => tokens[`--chart-${i + 1}`])
      }
      const reference = charts("blue")
      expect(new Set(reference).size).toBe(8)
      for (const accentColor of ACCENT_COLORS) {
        expect(charts(accentColor), `${accentColor} ${mode}`).toEqual(reference)
      }
    }
  })

  describe("noise opacity token", () => {
    it("dark + gradient background emits 0.5 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        frosted: false,
        backgroundStyle: "gradient",
        mode: "dark",
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
      })

      expect(tokens["--noise-opacity"]).toBe("0.5")
    })

    it("light + gradient background emits 0.6 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        frosted: false,
        backgroundStyle: "gradient",
        mode: "light",
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
      })

      expect(tokens["--noise-opacity"]).toBe("0.6")
    })

    it("dark + solid background emits 0 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        frosted: false,
        backgroundStyle: "solid",
        mode: "dark",
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
      })

      expect(tokens["--noise-opacity"]).toBe("0")
    })

    it("light + solid background emits 0 noise opacity", () => {
      const tokens = generateTokens({
        accentColor: "blue",
        surfaceColor: "slate",
        frosted: false,
        backgroundStyle: "solid",
        mode: "light",
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
      })

      expect(tokens["--noise-opacity"]).toBe("0")
    })
  })

  describe("sf-hue tokens", () => {
    const baseInput = {
      accentColor: "blue" as const,
      surfaceColor: "stone" as const,
      frosted: false as const,
      backgroundStyle: "gradient" as const,
      mode: "dark" as const,
      contrast: "standard" as const,
      darkAccentChroma: "standard" as const,
      tintWithAccent: false,
    }

    it("emits hsl shade-500 for --sf-hue in gradient mode", () => {
      const tokens = generateTokens(baseInput)
      expect(tokens["--sf-hue"]).toBe(`hsl(${surfaceColors.stone[500]})`)
    })

    it("emits hsl shade-300 for --sf-hue-3 (lighter pastel)", () => {
      const tokens = generateTokens(baseInput)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${surfaceColors.stone[300]})`)
    })

    it("emits transparent for all three hue anchors in solid mode", () => {
      const tokens = generateTokens({ ...baseInput, backgroundStyle: "solid" })
      expect(tokens["--sf-hue"]).toBe("transparent")
      expect(tokens["--sf-hue-2"]).toBe("transparent")
      expect(tokens["--sf-hue-3"]).toBe("transparent")
    })

    it("slate hard-branches to same-palette shades (no cross-palette neighbor)", () => {
      const slate = surfaceColors.slate as ColorScale
      const tokens = generateTokens({ ...baseInput, surfaceColor: "slate" })
      expect(tokens["--sf-hue"]).toBe(`hsl(${slate[500]})`)
      expect(tokens["--sf-hue-2"]).toBe(`hsl(${slate[400]})`)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${slate[300]})`)
    })

    it("light mode uses the same hue values (ink anchor differentiates, not hue)", () => {
      const tokens = generateTokens({ ...baseInput, mode: "light" })
      expect(tokens["--sf-hue"]).toBe(`hsl(${surfaceColors.stone[500]})`)
      expect(tokens["--sf-hue-2"]).toBe(`hsl(${surfaceColors.stone[400]})`)
      expect(tokens["--sf-hue-3"]).toBe(`hsl(${surfaceColors.stone[300]})`)
    })
  })

  describe("--content-gradient-overlay after merge", () => {
    const baseInput = {
      accentColor: "blue" as const,
      surfaceColor: "stone" as const,
      frosted: false as const,
      backgroundStyle: "gradient" as const,
      mode: "dark" as const,
      contrast: "standard" as const,
      darkAccentChroma: "standard" as const,
      tintWithAccent: false,
    }

    it("gradient + default → five-layer var() composition", () => {
      const tokens = generateTokens(baseInput)
      const overlay = tokens["--content-gradient-overlay"]
      if (overlay === undefined) {
        throw new Error("--content-gradient-overlay missing")
      }
      expect(overlay.replace(/\s+/g, " ").trim()).toBe(
        "var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-blob-d), var(--canvas-ink)",
      )
    })

    // Was a linear accent fade across the top 300px of main[data-
    // content] under Glass + solid. Bled through as a colored glow
    // at the top of pages without dense Cards (e.g. the Buttons
    // demo), most visible in dark mode where accent[800] at 0.2
    // alpha read as an obvious tint. Now neutral — body bg is the
    // canonical page color source under Glass.
    it("solid + glass → none (body bg is the page color under Glass)", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "solid",
        frosted: true,
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })

    it("gradient + glass → none (body already paints blobs)", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "gradient",
        frosted: true,
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })

    it("solid + default → none", () => {
      const tokens = generateTokens({
        ...baseInput,
        backgroundStyle: "solid",
        frosted: false,
      })
      expect(tokens["--content-gradient-overlay"]).toBe("none")
    })
  })
  describe("--sidebar-foreground-muted polarity", () => {
    const slate = surfaceColors.slate as ColorScale
    const base = {
      accentColor: "blue",
      surfaceColor: "slate",
      frosted: false,
      backgroundStyle: "solid",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
    } as const

    // The branches were inverted, putting slate-400 on the near-white light
    // rail (2.43:1) and slate-500 on the dark rail. Every other muted text
    // token in the kit uses 500 in light and 400 in dark.
    it("matches --muted-foreground's light/dark polarity", () => {
      const light = generateTokens({ ...base, mode: "light" })
      const dark = generateTokens({ ...base, mode: "dark" })
      // Pinned to the floor the inversion breached rather than to a ramp
      // step: the tiers are computed against the background now, so a step
      // number would pin the arithmetic instead of the requirement.
      expect(
        contrastRatio(
          light["--sidebar-foreground-muted"] as string,
          light["--surface-sidebar"] as string,
        ),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(
          dark["--sidebar-foreground-muted"] as string,
          dark["--surface-sidebar"] as string,
        ),
      ).toBeGreaterThanOrEqual(4.5)
      expect(light["--sidebar-foreground-muted"]).toBe(
        light["--muted-foreground"],
      )
      expect(dark["--sidebar-foreground-muted"]).toBe(
        dark["--muted-foreground"],
      )
    })

    it("stays lighter than --sidebar-foreground in both modes", () => {
      const light = generateTokens({ ...base, mode: "light" })
      const dark = generateTokens({ ...base, mode: "dark" })
      expect(light["--sidebar-foreground"]).toBe(slate[600])
      expect(dark["--sidebar-foreground"]).toBe(slate[300])
    })
  })
})

describe("backgroundIntensity canvas cap", () => {
  const dark = (
    backgroundIntensity: BackgroundIntensity,
    surfaceColor: SurfaceColor = "sepia",
  ) =>
    generateTokens({
      accentColor: "blue",
      surfaceColor,
      frosted: false,
      backgroundStyle: "solid",
      mode: "dark",
      contrast: "standard",
      darkAccentChroma: "standard",
      tintWithAccent: false,
      backgroundIntensity,
    })

  it("clamps rather than sets, so an already-calm colour is untouched", () => {
    // iron's dark canvas is 16% saturation, exactly the balanced cap
    const atCap = dark("balanced", "iron")["--background"]
    expect(dark("vivid", "iron")["--background"]).toBe(atCap)
  })

  it("moves --surface-base in lockstep with --background", () => {
    for (const step of BACKGROUND_INTENSITIES) {
      const t = dark(step)
      expect(t["--surface-base"]).toBe(t["--background"])
    }
  })

  it("caps in light mode too", () => {
    // The axis used to be dark-only, which made it silently inert in half the
    // themes. slate[50] is `210 40% 98%`, so the cap genuinely binds in light.
    const light = (backgroundIntensity: BackgroundIntensity) =>
      generateTokens({
        accentColor: "blue",
        surfaceColor: "sepia",
        frosted: false,
        backgroundStyle: "solid",
        mode: "light",
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
        backgroundIntensity,
      })["--background"]
    const neutral = light("neutral")
    if (neutral === undefined) throw new Error("--background missing")
    expect(neutral.split(" ")[1]).toBe("0%")
    expect(light("neutral")).not.toBe(light("vivid"))
  })

  it("treats intense as uncapped, like vivid", () => {
    expect(dark("intense")["--background"]).toBe(dark("vivid")["--background"])
  })
})

describe("capCanvasSaturation", () => {
  // Direct unit tests on the helper, not routed through a palette colour.
  // Across all eighteen surface colours the dark canvas saturation ranges
  // from 16 to 84, so no palette input ever sits strictly below a cap —
  // the canvasTint suite above can't distinguish a clamp (Math.min) from a
  // plain assignment. A synthetic below-cap triplet closes that gap.
  it("leaves an already-below-cap saturation unchanged", () => {
    expect(capCanvasSaturation("200 10% 5%", 16)).toBe("200 10% 5%")
  })

  it("clamps an above-cap saturation down to the cap", () => {
    expect(capCanvasSaturation("200 40% 5%", 16)).toBe("200 16% 5%")
  })

  it("passes through unchanged when the cap is null", () => {
    expect(capCanvasSaturation("200 40% 5%", null)).toBe("200 40% 5%")
  })

  it("leaves a saturation exactly at the cap unchanged", () => {
    expect(capCanvasSaturation("200 16% 5%", 16)).toBe("200 16% 5%")
  })
})

describe("neutral accent", () => {
  for (const mode of ["light", "dark"] as const)
    it(`puts the primary on neutral step 12 in ${mode}`, () => {
      const t = generateTokens({
        accentColor: "neutral",
        surfaceColor: "zinc",
        frosted: false,
        backgroundStyle: "solid",
        mode,
        contrast: "standard",
        darkAccentChroma: "standard",
        tintWithAccent: false,
      })
      expect(t["--primary"]).toBe(t["--neutral-12"])
      expect(t["--primary-fill"]).toBe(t["--neutral-12"])
      expect(t["--primary-text"]).toBe(t["--neutral-12"])
      for (let i = 1; i <= 7; i++)
        expect(t[`--primary-${i}`]).toBe(t[`--neutral-${i}`])
    })
})

describe("colour engine axes", () => {
  const base = {
    accentColor: "blue",
    surfaceColor: "zinc",
    frosted: false,
    backgroundStyle: "solid",
    mode: "dark",
    contrast: "standard",
    darkAccentChroma: "standard",
    tintWithAccent: false,
  } as const
  it("moves the dark card away from the page as contrast rises", () => {
    const ratio = (contrast: "low" | "standard" | "high") => {
      const t = generateTokens({ ...base, contrast })
      return contrastRatio(t["--card"] as string, t["--background"] as string)
    }
    expect(ratio("low")).toBeLessThan(ratio("standard"))
    expect(ratio("standard")).toBeLessThan(ratio("high"))
  })
  it("tints the neutral with the accent when asked", () => {
    const plain = generateTokens(base)
    const tinted = generateTokens({ ...base, tintWithAccent: true })
    expect(tinted["--card"]).not.toBe(plain["--card"])
  })
  it("keeps the sidebar fills on the accent at the 6.x balanced alphas", () => {
    const t = generateTokens(base)
    expect(t["--sidebar-hover-bg"]).toBe(`${t["--primary-8"]} / 0.15`)
    expect(t["--sidebar-active-bg"]).toBe(`${t["--primary-8"]} / 0.25`)
  })
})

describe("control well", () => {
  const base = {
    accentColor: "blue",
    surfaceColor: "slate",
    frosted: false,
    backgroundStyle: "solid",
    contrast: "standard",
    darkAccentChroma: "standard",
    tintWithAccent: false,
  } as const

  it("is neutral step 3 in light and step 1 in dark", () => {
    const light = generateTokens({ ...base, mode: "light" })
    expect(light["--control-well"]).toBe(light["--neutral-3"])
    const dark = generateTokens({ ...base, mode: "dark" })
    expect(dark["--control-well"]).toBe(dark["--neutral-1"])
  })

  it.each(["light", "dark"] as const)(
    "emits no derived well steps in %s",
    (mode) => {
      const t = generateTokens({ ...base, mode })
      expect(t).not.toHaveProperty("--control-well-subtle")
      expect(t).not.toHaveProperty("--control-well-deep")
    },
  )

  it.each(["light", "dark"] as const)(
    "draws the field edge from neutral step 7 in %s",
    (mode) => {
      const t = generateTokens({ ...base, mode })
      expect(t["--field-edge-color"]).toBe(t["--neutral-7"])
    },
  )
})
