/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import { globSync, readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, relative, resolve } from "node:path"

const thisDir = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(thisDir, "..")
const themeCss = readFileSync(resolve(thisDir, "theme.css"), "utf8")

const TEXT_TOKENS = [
  "2xs",
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
] as const

const BODY_TOKENS: readonly string[] = ["2xs", "xs", "sm", "base", "lg", "xl"]

/** Tailwind 4.2's default type scale in px at a 16px root. This is the
 *  `medium` column: medium declares no block, so the baseline is a
 *  literal here rather than parsed out of node_modules. `2xs` is not a
 *  Tailwind token — it is this library's own sub-`xs` step, declared on
 *  :root for the `medium` baseline. */
const MEDIUM_PX: Record<string, number> = {
  "2xs": 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
}

const MULTIPLIERS = {
  small: { body: 0.875, display: 0.9375 },
  large: { body: 1.125, display: 1.0625 },
  "extra-large": { body: 1.25, display: 1.125 },
} as const

type Step = keyof typeof MULTIPLIERS
const STEPS = Object.keys(MULTIPLIERS) as Step[]

function blockBody(step: string): string {
  const match = themeCss.match(
    new RegExp(`\\[data-font-size="${step}"\\]\\s*\\{([^}]*)\\}`),
  )
  if (!match?.[1]) {
    throw new Error(`No [data-font-size="${step}"] block found in theme.css`)
  }
  return match[1]
}

function declaredPx(step: string): Record<string, number> {
  const body = blockBody(step)
  const result: Record<string, number> = {}
  for (const token of TEXT_TOKENS) {
    const match = body.match(new RegExp(`--text-${token}:\\s*([0-9.]+)rem`))
    if (!match?.[1]) {
      throw new Error(`--text-${token} missing from [data-font-size="${step}"]`)
    }
    result[token] = parseFloat(match[1]) * 16
  }
  return result
}

describe("font-size axis", () => {
  it.each(STEPS)("%s declares all 13 text tokens", (step) => {
    expect(Object.keys(declaredPx(step))).toHaveLength(TEXT_TOKENS.length)
  })

  it.each(STEPS)(
    "%s sizes are within 0.5px of the exact multiplier",
    (step) => {
      const declared = declaredPx(step)
      const { body, display } = MULTIPLIERS[step]
      for (const token of TEXT_TOKENS) {
        const factor = BODY_TOKENS.includes(token) ? body : display
        const exact = MEDIUM_PX[token]! * factor
        expect(Math.abs(declared[token]! - exact)).toBeLessThanOrEqual(0.5)
      }
    },
  )

  it.each(STEPS)("%s sizes increase across the scale", (step) => {
    const declared = declaredPx(step)
    for (let i = 1; i < TEXT_TOKENS.length; i++) {
      expect(declared[TEXT_TOKENS[i]!]!).toBeGreaterThan(
        declared[TEXT_TOKENS[i - 1]!]!,
      )
    }
  })

  it("each token grows monotonically from small to extra-large", () => {
    const small = declaredPx("small")
    const large = declaredPx("large")
    const extraLarge = declaredPx("extra-large")
    for (const token of TEXT_TOKENS) {
      expect(small[token]!).toBeLessThan(MEDIUM_PX[token]!)
      expect(MEDIUM_PX[token]!).toBeLessThan(large[token]!)
      expect(large[token]!).toBeLessThan(extraLarge[token]!)
    }
  })

  it("no block overrides a line height", () => {
    for (const step of STEPS) {
      expect(blockBody(step)).not.toMatch(/--text-[a-z0-9]+--line-height/)
    }
  })

  it("every block declares --icon-scale and --control-scale", () => {
    for (const step of STEPS) {
      expect(blockBody(step)).toMatch(/--icon-scale:/)
      expect(blockBody(step)).toMatch(/--control-scale:/)
    }
  })

  it("declares the medium --text-2xs baseline on :root", () => {
    expect(themeCss).toMatch(/--text-2xs:\s*0\.625rem;/)
  })
})

/** `medium` declares no block — its value is the one on :root. */
function rootScale(name: string): number {
  const match = themeCss.match(new RegExp(`--${name}:\\s*([0-9.]+);`))
  if (!match?.[1]) throw new Error(`--${name} not declared on :root`)
  return parseFloat(match[1])
}

function stepScale(step: string, name: string): number {
  if (step === "medium") return rootScale(name)
  const match = blockBody(step).match(new RegExp(`--${name}:\\s*([0-9.]+)`))
  if (!match?.[1]) throw new Error(`--${name} missing from ${step}`)
  return parseFloat(match[1])
}

const ALL_STEPS = ["small", "medium", "large", "extra-large"] as const

describe("icon and control scales", () => {
  /** The base literal in `--icon-size: calc(<base> * var(--icon-scale))`. */
  it("derives --icon-size from a 1rem base and --icon-scale", () => {
    expect(themeCss).toMatch(
      /--icon-size:\s*calc\(1rem\s*\*\s*var\(--icon-scale\)\)/,
    )
  })

  /** Pinned so the ladder cannot drift silently: a scale change that looks
   *  harmless in isolation is the whole reason icons fell out of step
   *  with the axis before. */
  it("resolves --icon-size to the 16/18/20/22 ladder", () => {
    const expected = { small: 16, medium: 18, large: 20, "extra-large": 22 }
    for (const step of ALL_STEPS) {
      expect(stepScale(step, "icon-scale") * 16).toBeCloseTo(expected[step], 5)
    }
  })

  it.each(["icon-scale", "control-scale"])(
    "--%s never decreases across the axis",
    (name) => {
      const values = ALL_STEPS.map((step) => stepScale(step, name))
      for (let i = 1; i < values.length; i++) {
        expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!)
      }
    },
  )

  it("--icon-scale strictly increases across the axis", () => {
    const values = ALL_STEPS.map((step) => stepScale(step, "icon-scale"))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!)
    }
  })
})

/** Every `.css` under `src/`, as [repo-relative path, contents]. */
function allCssFiles(): [string, string][] {
  const out: [string, string][] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith(".css"))
        out.push([
          relative(srcDir, full).replace(/\\/g, "/"),
          readFileSync(full, "utf8"),
        ])
    }
  }
  walk(srcDir)
  return out
}

const CSS_FILES = allCssFiles()

describe("font sizes derive from the axis", () => {
  /** `theme.css` is where the scale itself is declared, so its literals
   *  are the definition rather than a bypass of it. */
  const CONSUMERS = CSS_FILES.filter(([path]) => path !== "styles/theme.css")

  it.each(CONSUMERS)("%s uses no arbitrary text-[Npx]", (_path, css) => {
    expect(css.match(/text-\[[0-9.]+(px|rem|em)\]/g) ?? []).toEqual([])
  })

  it.each(CONSUMERS)("%s uses no literal font-size", (_path, css) => {
    const literals = (css.match(/font-size:\s*[^;]+;/g) ?? []).filter(
      (decl) => !decl.includes("var(") && !decl.includes("inherit"),
    )
    expect(literals).toEqual([])
  })
})

describe("icon glyphs derive from the axis", () => {
  it("sidebar nav icons size through --icon-size", () => {
    const css = readFileSync(
      resolve(srcDir, "layout/sidebar/sidebar-nav.css"),
      "utf8",
    )
    for (const cls of ["dr-sidebar-nav-icon", "dr-sidebar-nav-icon-svg"]) {
      const rule = css.match(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`))
      expect(rule?.[1], `.${cls} rule not found`).toBeDefined()
      expect(rule![1]).toContain("var(--icon-size)")
      expect(rule![1]).not.toMatch(/\b[hw]-4\b/)
    }
  })
})

describe("density and font-size composition", () => {
  function densityBlockBody(step: string): string {
    const match = themeCss.match(
      new RegExp(`\\[data-density="${step}"\\]\\s*\\{([^}]*)\\}`),
    )
    if (!match?.[1]) {
      throw new Error(`No [data-density="${step}"] block found in theme.css`)
    }
    return match[1]
  }

  it.each([
    ["xs", "1.5rem"],
    ["sm", "1.75rem"],
    ["md", "2rem"],
    ["lg", "2.25rem"],
    ["xl", "2.5rem"],
  ])("scales --control-height-%s (%s) by --control-scale", (step, rem) => {
    expect(themeCss).toMatch(
      new RegExp(
        `--control-height-${step}:\\s*calc\\(\\s*${rem.replace(".", "\\.")}\\s*\\*\\s*var\\(--control-scale\\)\\s*\\)`,
      ),
    )
  })

  it("declares a neutral --control-scale default on :root", () => {
    expect(themeCss).toMatch(/--control-scale:\s*1;/)
  })

  it("floors the cozy default at --control-height-min", () => {
    expect(themeCss).toMatch(
      /--control-height-default:\s*var\(--control-height-md\);/,
    )
    expect(themeCss).toMatch(/--control-height-min:\s*0px;/)
    expect(themeCss).toMatch(
      /--control-height:\s*max\(\s*var\(--control-height-default\),\s*var\(--control-height-min\)\s*\)/,
    )
  })

  it("raises the floor on coarse pointers, after :root inside @layer base", () => {
    const css = themeCss.replace(/\/\*[\s\S]*?\*\//g, "")
    const closing = (text: string, open: number): number => {
      let depth = 0
      for (let i = open; i < text.length; i++) {
        if (text[i] === "{") depth++
        if (text[i] === "}" && --depth === 0) return i
      }
      throw new Error("unbalanced braces in theme.css")
    }
    const start = css.indexOf("@layer base {")
    const layer = css.slice(start, closing(css, css.indexOf("{", start)) + 1)
    const rootEnd = closing(layer, layer.indexOf("{", layer.indexOf(":root")))
    const media = layer.indexOf("@media (pointer: coarse)")
    expect(media).toBeGreaterThan(rootEnd)
    expect(layer.slice(media).replace(/\s+/g, " ")).toMatch(
      /^@media \(pointer: coarse\) \{ :root \{ --control-height-min: var\(--control-height-xl\); \} \}/,
    )
  })

  it.each([
    ["compact", "sm"],
    ["comfortable", "lg"],
    ["spacious", "xl"],
  ])("%s picks the %s step and nothing derived from it", (density, step) => {
    const body = densityBlockBody(density)
    expect(body).toMatch(
      new RegExp(
        `--control-height-default:\\s*var\\(--control-height-${step}\\);`,
      ),
    )
    expect(body).not.toMatch(/--control-height(?:-min)?:/)
  })

  it("leaves no reader of --density-cell or --density-cell-base", () => {
    const files = globSync("src/**/*.{css,ts,tsx}")
      .map((file) => file.replace(/\\/g, "/"))
      .filter((file) => !/\.test\.tsx?$/.test(file))
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter((file) =>
      /--density-cell(?:-base)?(?![\w-])/.test(readFileSync(file, "utf8")),
    )
    expect(offenders).toEqual([])
  })
})
