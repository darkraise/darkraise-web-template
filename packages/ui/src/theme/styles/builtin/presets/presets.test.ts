import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { defaultLabels } from "@labels"
import {
  AXES,
  AXIS_KEYS,
  type AxisKey,
  type AxisValues,
} from "@theme/axes/registry"
import { effectiveSettings } from "@theme/axes/resolve"
import { resolveRegistry } from "@theme/config/registry"
import { finalTokens, presetCombos } from "@test/contrast-matrix"
import { resolvedTokens } from "@test/preset-tokens"
import { stripCssComments } from "@test/strip-css-comments"
import { vi as viLocale } from "../../../../locales/vi"
import { BUILTIN_PRESETS, PRESET_NAMES } from "."

const PRESETS_DIR = join("src", "theme", "styles", "builtin", "presets")

/**
 * Name, style, label, shell style (`null` leaves the shell to the layout),
 * then the palette's four ramp choices and the body and heading faces.
 */
const CATALOGUE = [
  [
    "paper-ink",
    "quiet",
    "Paper & Ink",
    "flat",
    ["blue", "sand", "off", "none", "geist", "newsreader"],
  ],
  [
    "linen-teal",
    "quiet",
    "Linen & Teal",
    "flat",
    ["cyan", "neutral", "off", "none", "geist", "body"],
  ],
  [
    "red-graphite",
    "quiet",
    "Red Graphite",
    null,
    ["red", "zinc", "off", "none", "geist", "body"],
  ],
  [
    "studio-green",
    "quiet",
    "Studio Green",
    null,
    ["emerald", "neutral", "off", "none", "inter", "geist"],
  ],
  [
    "pastel-soft",
    "flat",
    "Pastel Soft-Flat",
    "flat",
    ["indigo", "sand", "off", "none", "geist", "body"],
  ],
  [
    "forest-lime",
    "flat",
    "Forest & Lime",
    "framed",
    ["lime", "olive", "off", "none", "inter", "body"],
  ],
  [
    "braun-panel",
    "tactile",
    "Braun Panel",
    "framed",
    ["neutral", "sand", "off", "yellow", "geist", "body"],
  ],
  [
    "dark-instrument",
    "tactile",
    "Dark Instrument",
    null,
    ["coral", "graphite", "off", "none", "ibm-plex-sans", "body"],
  ],
  [
    "card-stock",
    "tactile",
    "Card Stock",
    "inset",
    ["blue", "sand", "off", "none", "geist", "newsreader"],
  ],
  [
    "mica-desk",
    "glass",
    "Mica Desk",
    "inset",
    ["blue", "zinc", "off", "none", "inter", "body"],
  ],
  [
    "smoked-obsidian",
    "glass",
    "Smoked Obsidian",
    null,
    ["amber", "neutral", "off", "none", "geist", "body"],
  ],
  [
    "milk-glass",
    "glass",
    "Milk Glass",
    "flat",
    ["coral", "cool", "off", "none", "geist", "body"],
  ],
  [
    "aurora-night",
    "glass",
    "Aurora Night",
    "flat",
    ["teal", "gray", "off", "none", "geist", "body"],
  ],
  [
    "coral-space",
    "glass",
    "Coral Space",
    "inset",
    ["rose", "olive", "on", "none", "inter", "body"],
  ],
  [
    "dusk-haze",
    "glass",
    "Dusk Haze",
    "flat",
    ["indigo", "sand", "on", "none", "geist", "body"],
  ],
] as const

/**
 * The axes that are what a preset is: its palette's ramp choices and its two
 * faces. A preset writes them whatever their value, so an app's config
 * default never repaints it in another accent, neutral or typeface.
 */
const IDENTITY_AXES = [
  "accentColor",
  "surfaceColor",
  "tintWithAccent",
  "signalColor",
  "font",
  "headingFont",
] as const satisfies readonly AxisKey[]

// CSS Color 4's named colours, without the two a token value may use.
const NAMED_COLOURS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque blanchedalmond
  blue blueviolet brown burlywood cadetblue chartreuse chocolate coral
  cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
  darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
  darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
  darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
  firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod
  gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon
  lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue
  lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
  mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru
  pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown
  salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray
  slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet
  wheat whitesmoke yellow yellowgreen`.split(/\s+/),
)

/**
 * Why a token value breaks the colour rule, or nothing when it holds: the
 * only literal colours are black and white, as keywords or as `rgb()` with
 * an optional alpha, and `transparent`; every other colour is an engine
 * token wrapped in `hsl(var(--token))`.
 */
function colourProblems(value: string): string[] {
  // Custom property names and URLs hold words that are not colours.
  const text = value
    .replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g, "")
    .replace(/--[\w-]+/g, "")
  const problems: string[] = []
  if (/#[0-9a-f]{3,8}\b/i.test(text)) problems.push("a hex colour")
  const rgb = text.match(/\brgba?\(/gi) ?? []
  const blackOrWhite =
    text.match(/\brgb\((?:0 0 0|255 255 255)(?:\s*\/\s*(?:\d*\.)?\d+%?)?\)/g) ??
    []
  if (rgb.length !== blackOrWhite.length) {
    problems.push("an rgb() colour other than black or white")
  }
  if (/\bhsla?\((?!var\(\))/i.test(text)) {
    problems.push("an hsl() colour that is not an engine token")
  }
  if (/\b(?:oklch|oklab|lab|lch|hwb|color)\(/i.test(text)) {
    problems.push("a literal colour function")
  }
  // Whole identifiers only: `linear-gradient` and `tan(…)` name no colour.
  for (const [word] of text.matchAll(
    /(?<![\w-])[a-z][a-z0-9]*(?![\w-]|\s*\()/gi,
  )) {
    if (NAMED_COLOURS.has(word.toLowerCase())) {
      problems.push(`the named colour ${word}`)
    }
  }
  return problems
}

/** Every token value a preset writes, with where it is written. */
function tokenValues(): [string, string, string][] {
  return Object.values(resolveRegistry().presets).flatMap((preset) =>
    Object.entries(preset.tokens).flatMap(([mode, tokens]) =>
      Object.entries(tokens).map(([token, value]): [string, string, string] => [
        `${preset.name}.${mode}.${token}`,
        token,
        value,
      ]),
    ),
  )
}

/**
 * Every custom property a preset value can read: those the kit's stylesheets
 * declare, generated style sheets included, and the engine's tokens for
 * every preset in both modes.
 */
function knownVariables(): Set<string> {
  const names = new Set<string>()
  const css = readdirSync("src", { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".css"))
    .map((file) => stripCssComments(readFileSync(join("src", file), "utf8")))
  for (const sheet of css) {
    for (const [, name] of sheet.matchAll(/(--[\w-]+)\s*:/g)) {
      names.add(name as string)
    }
  }
  for (const combo of presetCombos()) {
    for (const name of Object.keys(finalTokens(combo))) names.add(name)
  }
  return names
}

describe("built-in presets", () => {
  it("ships the fifteen presets, grouped by style, in catalogue order", () => {
    const names = CATALOGUE.map(([name]) => name)
    expect(PRESET_NAMES).toEqual(names)
    expect(Object.keys(BUILTIN_PRESETS)).toEqual(names)
    const registry = resolveRegistry()
    expect(registry.issues).toEqual([])
    expect(Object.keys(registry.presets)).toEqual(names)
    expect(registry.values("preset")).toEqual(["base", ...names])
  })

  it.each(CATALOGUE)(
    "%s is the %s preset %s",
    (name, style, label, shell, identity) => {
      const { presets, styles } = resolveRegistry()
      const preset = presets[name]
      expect(preset).toMatchObject({ name, style, label, builtIn: true })
      expect(styles[style]?.builtIn).toBe(true)
      expect(preset?.shellStyle).toBe(shell ?? undefined)
      expect(IDENTITY_AXES.map((key) => preset?.axes[key])).toEqual(identity)
    },
  )

  it("keeps each preset in a file named after it", () => {
    const files = readdirSync(PRESETS_DIR).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    )
    expect(files.sort()).toEqual(
      ["index.ts", ...PRESET_NAMES.map((name) => `${name}.ts`)].sort(),
    )
  })

  it("labels base and every preset, keeping the names in Vietnamese", () => {
    const names = Object.fromEntries(
      CATALOGUE.map(([name, , label]) => [name, label]),
    )
    expect(defaultLabels.theme.presets).toEqual({ base: "Base", ...names })
    expect(viLocale.messages.theme.presets).toEqual({
      base: "Cơ bản",
      ...names,
    })
  })

  // Everything else falls through to the style, the app's config and the
  // registry, so an axis written at the value it would get anyway only stops
  // the app's own default from applying.
  it("writes its identity axes always, and no other axis at the value it would get anyway", () => {
    const { presets, styles } = resolveRegistry()
    for (const preset of Object.values(presets)) {
      const inherited: Partial<Record<AxisKey, string>> =
        styles[preset.style]?.defaults ?? {}
      for (const key of IDENTITY_AXES) {
        expect(preset.axes[key], `${preset.name}.${key}`).toBeDefined()
      }
      for (const [key, value] of Object.entries(preset.axes)) {
        if ((IDENTITY_AXES as readonly string[]).includes(key)) continue
        expect(value, `${preset.name}.${key}`).not.toBe(
          inherited[key as AxisKey] ?? AXES[key as AxisKey].default,
        )
      }
    }
  })

  it("keeps its palette and faces over an app's config defaults, and takes the app's scale defaults", () => {
    const registry = resolveRegistry()
    const appDefaults: AxisValues = {
      ...(Object.fromEntries(
        AXIS_KEYS.map((key) => [key, AXES[key].default]),
      ) as AxisValues),
      accentColor: "green",
      surfaceColor: "slate",
      tintWithAccent: "on",
      signalColor: "pink",
      font: "ibm-plex-sans",
      headingFont: "inter",
      density: "compact",
      fontSize: "large",
    }
    for (const [name, style, , , identity] of CATALOGUE) {
      const settings = effectiveSettings(
        { style, preset: name },
        appDefaults,
        registry,
      )
      expect(
        IDENTITY_AXES.map((key) => settings[key]),
        name,
      ).toEqual(identity)
      for (const key of ["density", "fontSize"] as const) {
        expect(settings[key], `${name}.${key}`).toBe(
          registry.presets[name]?.axes[key] ?? appDefaults[key],
        )
      }
    }
  })

  it.each([
    "none",
    "transparent",
    "0 0 transparent",
    "white",
    "linear-gradient(180deg, transparent 75%, rgb(255 255 255 / 0.15))",
    "inset 0 -1px 0 1px rgb(0 0 0 / 0.45), 0 1px 0 rgb(0 0 0)",
    "0 6px 16px hsl(var(--foreground) / 0.08)",
    "hsl(var(--signal-fill))",
    "color-mix(in oklab, hsl(var(--border)) 72%, hsl(var(--border-strong)))",
    "0 0 0 1px var(--tactile-red)",
    "blur(12px) grayscale(0.2)",
    "calc(tan(45deg) * var(--radius))",
  ])("accepts the token value %s", (value) => {
    expect(colourProblems(value)).toEqual([])
  })

  it.each([
    ["#fff", "a hex colour"],
    ["0 1px 0 #30261408", "a hex colour"],
    [
      "0 1px 0 rgb(48 38 20 / 0.04)",
      "an rgb() colour other than black or white",
    ],
    ["rgba(0, 0, 0, 0.1)", "an rgb() colour other than black or white"],
    ["rgb(var(--x))", "an rgb() colour other than black or white"],
    ["hsl(220 13% 91%)", "an hsl() colour that is not an engine token"],
    ["hsl(from var(--x) h s l)", "an hsl() colour that is not an engine token"],
    ["oklch(0.7 0.1 200)", "a literal colour function"],
    ["color(display-p3 1 0 0)", "a literal colour function"],
    ["0 0 0 1px red", "the named colour red"],
    ["linear-gradient(tan, transparent)", "the named colour tan"],
    ["1px solid Gray", "the named colour Gray"],
  ])("rejects the token value %s (%s)", (value, problem) => {
    expect(colourProblems(value)).toEqual([problem])
  })

  it("writes no hue: token colours are black, white, transparent or engine tokens", () => {
    for (const [where, , value] of tokenValues()) {
      expect(colourProblems(value), `${where}: ${value}`).toEqual([])
    }
  })

  it("reads only custom properties the kit or the engine defines", () => {
    const known = knownVariables()
    for (const [where, , value] of tokenValues()) {
      for (const [, name] of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
        expect(known.has(name as string), `${where}: ${name}`).toBe(true)
      }
    }
  })

  it("keeps a focused field's border visible in both modes", () => {
    const registry = resolveRegistry()
    const kitDefault = /--field-focus-border:\s*([^;]+);/.exec(
      readFileSync(join("src", "styles", "theme.css"), "utf8"),
    )?.[1]
    expect(kitDefault).toBe("hsl(var(--primary))")
    for (const preset of Object.values(registry.presets)) {
      const style = registry.styles[preset.style]
      for (const mode of ["light", "dark"] as const) {
        const border =
          resolvedTokens(style?.tokens, preset.tokens, mode).fieldFocusBorder ??
          kitDefault
        expect(border, `${preset.name}.${mode}`).not.toMatch(
          /^transparent$|\/\s*0\)$/,
        )
      }
    }
  })

  // A pane the look draws without a border has no edge to hold it apart in
  // dark mode, so it shows the backdrop rather than a fill of its own.
  it("lets a borderless content pane show the backdrop in dark mode", () => {
    const registry = resolveRegistry()
    const looks = [
      ...Object.entries(registry.styles).map(([name, style]) => ({
        name,
        style: style.tokens,
        preset: undefined,
      })),
      ...Object.values(registry.presets).map((preset) => ({
        name: preset.name,
        style: registry.styles[preset.style]?.tokens,
        preset: preset.tokens,
      })),
    ]
    const borderless: string[] = []
    for (const look of looks) {
      const dark = resolvedTokens(look.style, look.preset, "dark")
      if (dark.shellContentEdge !== "transparent") continue
      borderless.push(look.name)
      expect(dark.shellContentFill, look.name).toBe("transparent")
    }
    expect(borderless).toContain("card-stock")
  })

  // Solid paints the shell ground and Gradient paints the art, so a glass
  // preset's art lives in the gradient token alone.
  it("keeps every glass preset's ground art out of the Solid ground", () => {
    const registry = resolveRegistry()
    const glass = Object.values(registry.presets).filter(
      (preset) => preset.style === "glass",
    )
    expect(glass.length).toBeGreaterThan(0)
    for (const preset of glass) {
      for (const mode of ["shared", "light", "dark"] as const) {
        expect(
          preset.tokens[mode]?.shellGroundFill,
          `${preset.name}.${mode}`,
        ).toBeUndefined()
      }
      expect(
        ["light", "dark"].some(
          (mode) =>
            resolvedTokens(undefined, preset.tokens, mode as "light" | "dark")
              .shellGroundGradient !== undefined,
        ),
        preset.name,
      ).toBe(true)
    }
  })

  it("sizes every radius token from the radius axis", () => {
    for (const [where, token, value] of tokenValues()) {
      if (!token.endsWith("Radius")) continue
      expect(value, where).toMatch(/var\(--radius(-control)?\)/)
    }
  })
})
