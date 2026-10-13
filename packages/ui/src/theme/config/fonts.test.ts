import { describe, expect, it } from "vitest"
import { FONTS } from "../types"
import { compileThemeCss, LAYER_STATEMENT } from "./compile"
import { defineFont } from "./define"
import { BUILTIN_FONTS } from "./fonts"
import { canonicalJson, definitionsHash, fnv1a36 } from "./hash"
import { resolveRegistry } from "./registry"
import type { FontDefinition, ThemeDefinitions } from "./schema"

const fraunces = defineFont({
  label: "Fraunces",
  family: "'Fraunces', serif",
  role: "serif",
})

const DEFINITIONS: ThemeDefinitions = {
  fonts: { fraunces },
  styles: {
    paper: {
      label: "Paper",
      extends: "quiet",
      defaults: { headingFont: "fraunces" },
    },
  },
  presets: {
    ink: { label: "Ink", style: "paper", axes: { font: "fraunces" } },
  },
}

function messages(definitions: ThemeDefinitions) {
  return resolveRegistry(definitions).issues.map((issue) => [
    issue.level,
    issue.path,
    issue.message,
  ])
}

describe("built-in fonts", () => {
  it("ships four sans faces and one serif, in FONTS order", () => {
    expect(Object.keys(BUILTIN_FONTS)).toEqual([...FONTS])
    expect(
      Object.entries(BUILTIN_FONTS).map(([name, font]) => [name, font.role]),
    ).toEqual([
      ["inter", "sans"],
      ["geist", "sans"],
      ["ibm-plex-sans", "sans"],
      ["hanken-grotesk", "sans"],
      ["newsreader", "serif"],
    ])
  })

  it("names Newsreader with a serif fallback", () => {
    expect(BUILTIN_FONTS.newsreader).toEqual({
      label: "Newsreader",
      family:
        '"Newsreader Variable", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      role: "serif",
    })
  })

  it("lets a style and a preset set Newsreader with no config font", () => {
    const registry = resolveRegistry({
      styles: {
        paper: {
          label: "Paper",
          extends: "quiet",
          defaults: { headingFont: "newsreader" },
        },
      },
      presets: {
        ink: { label: "Ink", style: "paper", axes: { font: "newsreader" } },
      },
    })
    expect(registry.issues).toEqual([])
    expect(registry.fonts.newsreader).toMatchObject({
      builtIn: true,
      role: "serif",
    })
    expect(registry.isValue("font", "newsreader")).toBe(true)
    expect(registry.isValue("headingFont", "newsreader")).toBe(true)
  })
})

describe("font registry", () => {
  it("lists the built-in fonts first, then the config's", () => {
    const registry = resolveRegistry(DEFINITIONS)
    expect(Object.keys(registry.fonts)).toEqual([...FONTS, "fraunces"])
    expect(registry.fonts.fraunces).toEqual({
      name: "fraunces",
      label: "Fraunces",
      builtIn: false,
      family: "'Fraunces', serif",
      role: "serif",
    })
    expect(registry.fonts.inter?.builtIn).toBe(true)
  })

  it("serves the font names as font values and body plus them as heading values", () => {
    const registry = resolveRegistry(DEFINITIONS)
    expect(registry.values("font")).toEqual([...FONTS, "fraunces"])
    expect(registry.values("headingFont")).toEqual([
      "body",
      ...FONTS,
      "fraunces",
    ])
    expect(resolveRegistry().values("headingFont")).toEqual(["body", ...FONTS])
    expect(registry.isValue("headingFont", "body")).toBe(true)
    expect(registry.isValue("font", "body")).toBe(false)
  })

  it("lets a style and a preset name a config font", () => {
    const registry = resolveRegistry(DEFINITIONS)
    expect(registry.issues).toEqual([])
    expect(registry.styles.paper?.defaults).toEqual({
      headingFont: "fraunces",
    })
    expect(registry.presets.ink?.axes).toEqual({ font: "fraunces" })
  })

  it("rejects a font the registry does not know", () => {
    expect(
      messages({
        presets: {
          ink: { label: "Ink", style: "quiet", axes: { font: "fraunces" } },
        },
      }),
    ).toContainEqual([
      "error",
      "presets.ink.axes.font",
      '"fraunces" is not a valid font',
    ])
  })

  it.each<[string, ThemeDefinitions, string, string]>([
    [
      "a font named after a built-in font",
      { fonts: { inter: fraunces } },
      "fonts.inter",
      '"inter" is a built-in font name',
    ],
    [
      "a font named after the built-in serif",
      { fonts: { newsreader: fraunces } },
      "fonts.newsreader",
      '"newsreader" is a built-in font name',
    ],
    [
      "a reserved font name",
      { fonts: { body: fraunces } },
      "fonts.body",
      '"body" is a reserved name',
    ],
    [
      "a font name that is not kebab-case",
      { fonts: { Fraunces: fraunces } },
      "fonts.Fraunces",
      '"Fraunces" is not a kebab-case name',
    ],
    [
      "an unknown font role",
      {
        fonts: {
          fraunces: { ...fraunces, role: "mono" as FontDefinition["role"] },
        },
      },
      "fonts.fraunces.role",
      '"mono" is not a font role (expected sans, serif or display)',
    ],
    [
      "a family that would leave its rule",
      { fonts: { fraunces: { ...fraunces, family: "serif; color: red" } } },
      "fonts.fraunces.family",
      'a value cannot contain ";" outside brackets or quotes',
    ],
  ])("reports %s", (_, definitions, path, message) => {
    expect(messages(definitions)).toContainEqual(["error", path, message])
    expect(Object.keys(resolveRegistry(definitions).fonts)).toEqual([...FONTS])
  })
})

describe("font hash", () => {
  it("covers fonts and keeps the hash of a config without them", () => {
    const styles = DEFINITIONS.styles
    expect(definitionsHash({ fonts: { fraunces } })).not.toBe("")
    expect(definitionsHash(DEFINITIONS)).not.toBe(
      definitionsHash({ ...DEFINITIONS, fonts: {} }),
    )
    expect(definitionsHash({ styles })).toBe(
      fnv1a36(canonicalJson({ styles, presets: undefined })),
    )
  })
})

describe("font stylesheet", () => {
  it("emits the config's fonts in the consumer sheet only", () => {
    const registry = resolveRegistry({ fonts: { fraunces } })
    expect(compileThemeCss(registry, { include: "consumer" })).toBe(
      `${LAYER_STATEMENT}

@layer style.base {
  [data-font="fraunces"] {
    --font-family-sans: 'Fraunces', serif;
  }
  [data-heading-font="fraunces"] {
    --font-family-heading: 'Fraunces', serif;
  }
}
`,
    )
    expect(compileThemeCss(registry, { include: "builtin" })).not.toContain(
      "fraunces",
    )
  })

  // theme.css declares the built-in faces' rules; a compiled sheet repeats none.
  it("emits no rule for a built-in face", () => {
    const registry = resolveRegistry({ fonts: { fraunces } })
    for (const include of ["consumer", "builtin"] as const) {
      expect(compileThemeCss(registry, { include })).not.toContain("newsreader")
    }
  })
})
