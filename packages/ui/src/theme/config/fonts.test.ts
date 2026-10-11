import { describe, expect, it } from "vitest"
import { FONTS } from "../types"
import { compileThemeCss, LAYER_STATEMENT } from "./compile"
import { defineFont } from "./define"
import { canonicalJson, definitionsHash, fnv1a36 } from "./hash"
import { resolveRegistry } from "./registry"
import type { FontDefinition, ThemeDefinitions } from "./schema"

const newsreader = defineFont({
  label: "Newsreader",
  family: "'Newsreader', serif",
  role: "serif",
})

const DEFINITIONS: ThemeDefinitions = {
  fonts: { newsreader },
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
}

function messages(definitions: ThemeDefinitions) {
  return resolveRegistry(definitions).issues.map((issue) => [
    issue.level,
    issue.path,
    issue.message,
  ])
}

describe("font registry", () => {
  it("lists the built-in fonts first, then the config's", () => {
    const registry = resolveRegistry(DEFINITIONS)
    expect(Object.keys(registry.fonts)).toEqual([...FONTS, "newsreader"])
    expect(registry.fonts.newsreader).toEqual({
      name: "newsreader",
      label: "Newsreader",
      builtIn: false,
      family: "'Newsreader', serif",
      role: "serif",
    })
    expect(registry.fonts.inter?.builtIn).toBe(true)
  })

  it("serves the font names as font values and body plus them as heading values", () => {
    const registry = resolveRegistry(DEFINITIONS)
    expect(registry.values("font")).toEqual([...FONTS, "newsreader"])
    expect(registry.values("headingFont")).toEqual([
      "body",
      ...FONTS,
      "newsreader",
    ])
    expect(resolveRegistry().values("headingFont")).toEqual(["body", ...FONTS])
    expect(registry.isValue("headingFont", "body")).toBe(true)
    expect(registry.isValue("font", "body")).toBe(false)
  })

  it("lets a style and a preset name a config font", () => {
    const registry = resolveRegistry(DEFINITIONS)
    expect(registry.issues).toEqual([])
    expect(registry.styles.paper?.defaults).toEqual({
      headingFont: "newsreader",
    })
    expect(registry.presets.ink?.axes).toEqual({ font: "newsreader" })
  })

  it("rejects a font the registry does not know", () => {
    expect(
      messages({
        presets: {
          ink: { label: "Ink", style: "quiet", axes: { font: "newsreader" } },
        },
      }),
    ).toContainEqual([
      "error",
      "presets.ink.axes.font",
      '"newsreader" is not a valid font',
    ])
  })

  it.each<[string, ThemeDefinitions, string, string]>([
    [
      "a font named after a built-in font",
      { fonts: { inter: newsreader } },
      "fonts.inter",
      '"inter" is a built-in font name',
    ],
    [
      "a reserved font name",
      { fonts: { body: newsreader } },
      "fonts.body",
      '"body" is a reserved name',
    ],
    [
      "a font name that is not kebab-case",
      { fonts: { Newsreader: newsreader } },
      "fonts.Newsreader",
      '"Newsreader" is not a kebab-case name',
    ],
    [
      "an unknown font role",
      {
        fonts: {
          newsreader: { ...newsreader, role: "mono" as FontDefinition["role"] },
        },
      },
      "fonts.newsreader.role",
      '"mono" is not a font role (expected sans, serif or display)',
    ],
    [
      "a family that would leave its rule",
      { fonts: { newsreader: { ...newsreader, family: "serif; color: red" } } },
      "fonts.newsreader.family",
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
    expect(definitionsHash({ fonts: { newsreader } })).not.toBe("")
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
    const registry = resolveRegistry({ fonts: { newsreader } })
    expect(compileThemeCss(registry, { include: "consumer" })).toBe(
      `${LAYER_STATEMENT}

@layer style.base {
  [data-font="newsreader"] {
    --font-family-sans: 'Newsreader', serif;
  }
  [data-heading-font="newsreader"] {
    --font-family-heading: 'Newsreader', serif;
  }
}
`,
    )
    expect(compileThemeCss(registry, { include: "builtin" })).not.toContain(
      "newsreader",
    )
  })
})
