import { describe, expect, it } from "vitest"
import { AXES, type AxisKey } from "../axes/registry"
import { definitionsHash } from "./hash"
import { buildRegistry } from "./registry"
import type {
  PresetDefinition,
  StyleDefinition,
  ThemeDefinitions,
} from "./schema"

// Small stand-ins for the built-in styles: the registry treats whatever it
// is given as built in.
const BUILTINS: Record<string, StyleDefinition> = {
  plain: { label: "Plain" },
  frost: {
    label: "Frost",
    frosted: true,
    defaults: { backgroundStyle: "gradient", radius: "subtle" },
    vars: {
      shared: { "--frost-fog": "white", "--frost-edge": "black" },
      dark: { "--frost-fog": "black" },
    },
    tokens: {
      shared: { cardEdge: "var(--frost-edge)", chromeEdge: "red" },
      light: { overlayBorder: "blue" },
      dark: { chromeEdge: "green", overlayBorder: "navy" },
    },
    when: [
      { axes: { glassOpacity: "subtle" }, tokens: { overlayFillBase: "a" } },
    ],
    forcedFallback: { tokens: { chromeEdge: "gray", chromeBackdrop: "none" } },
  },
}

function build(definitions?: ThemeDefinitions) {
  return buildRegistry(BUILTINS, definitions)
}

function messages(definitions: ThemeDefinitions) {
  return build(definitions).issues.map((issue) => [
    issue.level,
    issue.path,
    issue.message,
  ])
}

describe("built-in styles", () => {
  it("resolves a built-in with every field filled in", () => {
    expect(build().styles.plain).toEqual({
      name: "plain",
      label: "Plain",
      builtIn: true,
      lineage: ["plain"],
      frosted: false,
      defaults: {},
      vars: { shared: {}, light: {}, dark: {} },
      tokens: { shared: {}, light: {}, dark: {} },
      when: [],
      forcedFallback: {},
    })
  })

  it("lists built-ins in the order given, before consumer styles in config order", () => {
    const registry = build({
      styles: { zeta: { label: "Zeta" }, alpha: { label: "Alpha" } },
    })
    expect(Object.keys(registry.styles)).toEqual([
      "plain",
      "frost",
      "zeta",
      "alpha",
    ])
    expect(registry.styles.zeta?.builtIn).toBe(false)
  })

  it("reports no issues and an empty hash without definitions", () => {
    const registry = build()
    expect(registry.issues).toEqual([])
    expect(registry.hash).toBe("")
  })
})

describe("extends", () => {
  it("copies every field of the parent when the child sets nothing", () => {
    const child = build({
      styles: { "frost-ink": { label: "Ink", extends: "frost" } },
    }).styles["frost-ink"]
    const parent = build().styles.frost
    expect(child).toEqual({
      ...parent,
      name: "frost-ink",
      label: "Ink",
      builtIn: false,
      lineage: ["frost-ink", "frost"],
    })
  })

  it("overrides per axis, per token and per var for each mode key", () => {
    const child = build({
      styles: {
        "frost-ink": {
          label: "Ink",
          extends: "frost",
          frosted: false,
          defaults: { radius: "pill", elevation: "high" },
          vars: {
            shared: { "--frost-edge": "gray" },
            light: { "--frost-ink-glow": "pink" },
          },
          tokens: {
            light: { overlayBorder: "teal" },
            dark: { cardEdge: "none" },
          },
          forcedFallback: { tokens: { chromeEdge: "silver" } },
        },
      },
    }).styles["frost-ink"]
    expect(child?.frosted).toBe(false)
    expect(child?.defaults).toEqual({
      backgroundStyle: "gradient",
      radius: "pill",
      elevation: "high",
    })
    expect(child?.vars).toEqual({
      shared: { "--frost-fog": "white", "--frost-edge": "gray" },
      light: { "--frost-ink-glow": "pink" },
      dark: { "--frost-fog": "black" },
    })
    expect(child?.tokens).toEqual({
      shared: { cardEdge: "var(--frost-edge)", chromeEdge: "red" },
      light: { overlayBorder: "teal" },
      dark: { chromeEdge: "green", overlayBorder: "navy", cardEdge: "none" },
    })
    expect(child?.forcedFallback).toEqual({
      chromeEdge: "silver",
      chromeBackdrop: "none",
    })
  })

  // A child's shared value applies in every mode, so it replaces what the
  // parent set for that name under any mode key.
  it("lets a child's shared value beat the parent's light and dark values", () => {
    const child = build({
      styles: {
        "frost-ink": {
          label: "Ink",
          extends: "frost",
          vars: { shared: { "--frost-fog": "gray" } },
          tokens: { shared: { chromeEdge: "pink", overlayBorder: "pink" } },
        },
      },
    }).styles["frost-ink"]
    expect(child?.tokens).toEqual({
      shared: {
        cardEdge: "var(--frost-edge)",
        chromeEdge: "pink",
        overlayBorder: "pink",
      },
      light: {},
      dark: {},
    })
    expect(child?.vars).toEqual({
      shared: { "--frost-fog": "gray", "--frost-edge": "black" },
      light: {},
      dark: {},
    })
  })

  it("appends the child's when entries after the parent's", () => {
    const own = {
      axes: { glassBlur: "high" },
      mode: "dark",
      tokens: { chromeBackdrop: "blur(4px)" },
    } as const
    const child = build({
      styles: { "frost-ink": { label: "Ink", extends: "frost", when: [own] } },
    }).styles["frost-ink"]
    expect(child?.when).toEqual([...(BUILTINS.frost?.when ?? []), own])
  })

  it("flattens a chain of several levels", () => {
    const registry = build({
      styles: {
        third: {
          label: "Third",
          extends: "second",
          tokens: { dark: { cardSheen: "c" } },
        },
        second: {
          label: "Second",
          extends: "frost",
          defaults: { radius: "sharp" },
          when: [{ axes: { contrast: "high" }, tokens: { cardEdge: "b" } }],
        },
      },
    })
    const third = registry.styles.third
    expect(third?.lineage).toEqual(["third", "second", "frost"])
    expect(third?.defaults).toEqual({
      backgroundStyle: "gradient",
      radius: "sharp",
    })
    expect(third?.when).toHaveLength(2)
    expect(third?.tokens.dark).toEqual({
      chromeEdge: "green",
      overlayBorder: "navy",
      cardSheen: "c",
    })
    expect(third?.frosted).toBe(true)
  })
})

describe("presets", () => {
  const ink: PresetDefinition = {
    label: "Ink",
    style: "frost",
    axes: { accentColor: "violet" },
    tokens: { dark: { cardSheen: "none" } },
    shellStyle: "inset",
  }

  it("resolves a preset with every field filled in", () => {
    expect(build({ presets: { ink } }).presets.ink).toEqual({
      name: "ink",
      label: "Ink",
      builtIn: false,
      style: "frost",
      axes: { accentColor: "violet" },
      tokens: { shared: {}, light: {}, dark: { cardSheen: "none" } },
      shellStyle: "inset",
    })
  })

  it("leaves shellStyle out when the preset sets none", () => {
    const registry = build({
      presets: { calm: { label: "Calm", style: "plain" } },
    })
    expect(registry.presets.calm).not.toHaveProperty("shellStyle")
  })

  it("picks a preset only for its own style", () => {
    const registry = build({ presets: { ink } })
    expect(registry.presetFor("frost", "ink")).toBe("ink")
    expect(registry.presetFor("plain", "ink")).toBe("base")
    expect(registry.presetFor("frost", "missing")).toBe("base")
    expect(registry.presetFor("frost", null)).toBe("base")
    expect(registry.presetFor("frost", undefined)).toBe("base")
  })
})

describe("values", () => {
  // `preset` becomes an AxisKey when the preset axis is added; until then
  // the cast reaches the branch that serves it.
  const PRESET = "preset" as AxisKey

  const registry = build({
    styles: { "frost-ink": { label: "Ink", extends: "frost" } },
    presets: { ink: { label: "Ink", style: "frost-ink" } },
  })

  it("lists every style and every preset after base", () => {
    expect(registry.values("style")).toEqual(["plain", "frost", "frost-ink"])
    expect(registry.values(PRESET)).toEqual(["base", "ink"])
  })

  it("serves every other axis from the axis registry", () => {
    expect(registry.values("radius")).toEqual(AXES.radius.values)
    expect(registry.values("mode")).toEqual(AXES.mode.values)
  })

  it("accepts only listed strings", () => {
    expect(registry.isValue("style", "frost-ink")).toBe(true)
    expect(registry.isValue("style", "glass")).toBe(false)
    expect(registry.isValue(PRESET, "base")).toBe(true)
    expect(registry.isValue(PRESET, "ink")).toBe(true)
    expect(registry.isValue(PRESET, "frost")).toBe(false)
    expect(registry.isValue("radius", "pill")).toBe(true)
    expect(registry.isValue("radius", 3)).toBe(false)
    expect(registry.isValue("radius", undefined)).toBe(false)
  })
})

describe("hash", () => {
  it("is the definitions hash of the consumer definitions", () => {
    const definitions: ThemeDefinitions = {
      styles: { "frost-ink": { label: "Ink", extends: "frost" } },
    }
    expect(build(definitions).hash).toBe(definitionsHash(definitions))
    expect(build(definitions).hash).not.toBe("")
  })
})

describe("errors", () => {
  const style = (definition: Partial<StyleDefinition>): ThemeDefinitions => ({
    styles: { bad: { label: "Bad", ...definition } as StyleDefinition },
  })
  const preset = (definition: Partial<PresetDefinition>): ThemeDefinitions => ({
    presets: {
      bad: { label: "Bad", style: "plain", ...definition } as PresetDefinition,
    },
  })
  const loose = <T>(value: unknown) => value as T

  it.each<[string, ThemeDefinitions, string, string]>([
    [
      "an unknown token",
      style({ tokens: loose({ shared: { cardGlow: "1" } }) }),
      "styles.bad.tokens.shared.cardGlow",
      '"cardGlow" is not a paint token',
    ],
    [
      "an unknown mode key",
      style({ tokens: loose({ dusk: { cardEdge: "1" } }) }),
      "styles.bad.tokens.dusk",
      '"dusk" is not a mode key (expected shared, light or dark)',
    ],
    [
      "an unknown token in a when entry",
      style({ when: loose([{ axes: {}, tokens: { cardGlow: "1" } }]) }),
      "styles.bad.when[0].tokens.cardGlow",
      '"cardGlow" is not a paint token',
    ],
    [
      "an unknown fallback token",
      style({ forcedFallback: loose({ tokens: { cardGlow: "1" } }) }),
      "styles.bad.forcedFallback.tokens.cardGlow",
      '"cardGlow" is not a paint token',
    ],
    [
      "an unknown preset token",
      preset({ tokens: loose({ light: { cardGlow: "1" } }) }),
      "presets.bad.tokens.light.cardGlow",
      '"cardGlow" is not a paint token',
    ],
    [
      "a value that is not a string",
      style({ tokens: loose({ shared: { cardEdge: 0 } }) }),
      "styles.bad.tokens.shared.cardEdge",
      "the value must be a string",
    ],
    [
      "a var name that is not a custom property",
      style({ vars: loose({ shared: { "bad-glow": "1" } }) }),
      'styles.bad.vars.shared["bad-glow"]',
      '"bad-glow" is not a custom property name',
    ],
    [
      "a var name outside the style's prefix",
      style({ vars: { shared: { "--glow": "1" } } }),
      'styles.bad.vars.shared["--glow"]',
      '"--glow" must start with --bad-',
    ],
    [
      "a when var name outside the style's prefix",
      style({ when: [{ axes: {}, vars: { "--frost-glow": "1" } }] }),
      'styles.bad.when[0].vars["--frost-glow"]',
      '"--frost-glow" must start with --bad-',
    ],
    [
      "an unknown axis in defaults",
      style({ defaults: loose({ glow: "high" }) }),
      "styles.bad.defaults.glow",
      '"glow" is not an axis a definition can set',
    ],
    [
      "the style axis in defaults",
      style({ defaults: loose({ style: "frost" }) }),
      "styles.bad.defaults.style",
      '"style" is not an axis a definition can set',
    ],
    [
      "an unknown axis value in defaults",
      style({ defaults: loose({ radius: "huge" }) }),
      "styles.bad.defaults.radius",
      '"huge" is not a valid radius',
    ],
    [
      "an unknown axis value in preset axes",
      preset({ axes: loose({ font: "comic" }) }),
      "presets.bad.axes.font",
      '"comic" is not a valid font',
    ],
    [
      "an unknown axis in a when entry",
      style({ when: loose([{ axes: { glow: "high" } }]) }),
      "styles.bad.when[0].axes.glow",
      '"glow" is not an axis',
    ],
    [
      "an unknown axis value in a when entry",
      style({ when: loose([{ axes: { glassBlur: "huge" } }]) }),
      "styles.bad.when[0].axes.glassBlur",
      '"huge" is not a valid glassBlur',
    ],
    [
      "an unknown mode in a when entry",
      style({ when: loose([{ axes: {}, mode: "system" }]) }),
      "styles.bad.when[0].mode",
      '"system" is not a when mode (expected light or dark)',
    ],
    ...(["mode", "style", "preset", "sidebarSelection"] as const).map(
      (key): [string, ThemeDefinitions, string, string] => [
        `a when entry on ${key}`,
        style({ when: loose([{ axes: { [key]: "x" } }]) }),
        `styles.bad.when[0].axes.${key}`,
        `a when entry cannot test "${key}"`,
      ],
    ),
    [
      "an unknown parent",
      style({ extends: "missing" }),
      "styles.bad.extends",
      '"missing" is not a style',
    ],
    [
      "a preset naming an unknown style",
      preset({ style: "missing" }),
      "presets.bad.style",
      '"missing" is not a style',
    ],
    [
      "a preset token its style's when entries set",
      preset({ style: "frost", tokens: { dark: { overlayFillBase: "x" } } }),
      "presets.bad.tokens.dark.overlayFillBase",
      'style "frost" sets "overlayFillBase" in a when entry, which a preset may not override',
    ],
    ...(
      [
        "Bad",
        "bad_name",
        "-bad",
        "bad-",
        "1bad",
        "base",
        "default",
        "glassmorphism",
        "scifi",
      ] as const
    ).map((name): [string, ThemeDefinitions, string, string] => [
      `the style name "${name}"`,
      { styles: { [name]: { label: "X" } } },
      `styles.${name}`,
      ["base", "default", "glassmorphism", "scifi"].includes(name)
        ? `"${name}" is a reserved name`
        : `"${name}" is not a kebab-case name`,
    ]),
    [
      "a style named after a built-in",
      { styles: { frost: { label: "X" } } },
      "styles.frost",
      '"frost" is a built-in style name',
    ],
    [
      "a preset named after a built-in style",
      { presets: { plain: { label: "X", style: "plain" } } },
      "presets.plain",
      '"plain" is a built-in style name',
    ],
    [
      "a reserved preset name",
      { presets: { base: { label: "X", style: "plain" } } },
      "presets.base",
      '"base" is a reserved name',
    ],
  ])("reports %s", (_, definitions, path, message) => {
    expect(messages(definitions)).toContainEqual(["error", path, message])
  })

  it("reports every style of an extends cycle", () => {
    expect(
      messages({
        styles: {
          one: { label: "One", extends: "two" },
          two: { label: "Two", extends: "one" },
          own: { label: "Own", extends: "own" },
        },
      }),
    ).toEqual([
      ["error", "styles.one.extends", "extends cycle: one -> two -> one"],
      ["error", "styles.two.extends", "extends cycle: two -> one -> two"],
      ["error", "styles.own.extends", "extends cycle: own -> own"],
    ])
  })

  it("reports a style that leads into a cycle as depending on errors", () => {
    expect(
      messages({
        styles: {
          lead: { label: "Lead", extends: "one" },
          one: { label: "One", extends: "two" },
          two: { label: "Two", extends: "one" },
        },
      }),
    ).toEqual([
      ["error", "styles.one.extends", "extends cycle: one -> two -> one"],
      ["error", "styles.two.extends", "extends cycle: two -> one -> two"],
      ["error", "styles.lead.extends", '"one" has errors'],
    ])
  })

  it("never mistakes an Object.prototype member for a definition", () => {
    const registry = build({
      styles: { constructor: { label: "Constructor" } },
      presets: { "to-string": { label: "To string", style: "toString" } },
    })
    const name: string = "constructor"
    expect(registry.styles[name]?.label).toBe("Constructor")
    expect(registry.issues).toContainEqual({
      level: "error",
      path: "presets.to-string.style",
      message: '"toString" is not a style',
    })
    expect(registry.presetFor("plain", "hasOwnProperty")).toBe("base")
  })

  it("rejects a built-in that extends a consumer style", () => {
    const registry = buildRegistry(
      { plain: { label: "Plain", extends: "mine" } },
      { styles: { mine: { label: "Mine" } } },
    )
    expect(registry.issues).toContainEqual({
      level: "error",
      path: "styles.plain.extends",
      message: 'a built-in style cannot extend the consumer style "mine"',
    })
    expect(registry.styles).not.toHaveProperty("plain")
  })

  it("accepts a var named after an ancestor", () => {
    const registry = build({
      styles: {
        "frost-ink": {
          label: "Ink",
          extends: "frost",
          vars: { dark: { "--frost-fog": "gray", "--frost-ink-glow": "x" } },
        },
      },
    })
    expect(registry.issues).toEqual([])
  })

  it("leaves a definition with an error out, and whatever depends on it", () => {
    const registry = build({
      styles: {
        bad: { label: "Bad", defaults: loose({ radius: "huge" }) },
        "bad-child": { label: "Child", extends: "bad" },
        good: { label: "Good" },
      },
      presets: {
        broken: { label: "Broken", style: "bad" },
        fine: { label: "Fine", style: "good" },
      },
    })
    expect(Object.keys(registry.styles)).toEqual(["plain", "frost", "good"])
    expect(Object.keys(registry.presets)).toEqual(["fine"])
    expect(registry.values("style")).not.toContain("bad")
    expect(registry.values("preset" as AxisKey)).toEqual(["base", "fine"])
    expect(registry.issues.map((issue) => [issue.path, issue.message])).toEqual(
      [
        ["styles.bad.defaults.radius", '"huge" is not a valid radius'],
        ["styles.bad-child.extends", '"bad" has errors'],
        ["presets.broken.style", '"bad" has errors'],
      ],
    )
  })

  it.each([
    "red; } body { color: red",
    "{ color: red",
    "url(x)}",
    "red</style><script>alert(1)</script>",
    "red</STYLE>",
    "red</Style >",
  ])(
    "rejects the value %j, which would leave its rule or style element",
    (value) => {
      const registry = build({
        styles: {
          mine: { label: "Mine", tokens: { shared: { cardEdge: value } } },
        },
      })
      expect(registry.issues).toEqual([
        {
          level: "error",
          path: "styles.mine.tokens.shared.cardEdge",
          message: 'a value cannot contain "{", "}" or "</style"',
        },
      ])
      expect(registry.styles).not.toHaveProperty("mine")
    },
  )

  it("checks vars, when entries, fallbacks and preset tokens for such values", () => {
    const registry = build({
      styles: {
        mine: {
          label: "Mine",
          vars: { light: { "--mine-a": "}" } },
          when: [
            { axes: {}, tokens: { cardSheen: "{" }, vars: { "--mine-b": "}" } },
          ],
          forcedFallback: { tokens: { chromeEdge: "</style" } },
        },
      },
      presets: {
        ink: {
          label: "Ink",
          style: "plain",
          tokens: { dark: { cardEdge: "a { b }" } },
        },
      },
    })
    expect(registry.issues.map((issue) => [issue.level, issue.path])).toEqual([
      ["error", 'styles.mine.vars.light["--mine-a"]'],
      ["error", "styles.mine.when[0].tokens.cardSheen"],
      ["error", 'styles.mine.when[0].vars["--mine-b"]'],
      ["error", "styles.mine.forcedFallback.tokens.chromeEdge"],
      ["error", "presets.ink.tokens.dark.cardEdge"],
    ])
  })

  it("rejects a var name that is not a plain custom property name", () => {
    expect(
      messages({
        styles: {
          mine: {
            label: "Mine",
            vars: { shared: { "--mine-a: red; } body { --x": "1" } },
          },
        },
      }),
    ).toEqual([
      [
        "error",
        'styles.mine.vars.shared["--mine-a: red; } body { --x"]',
        '"--mine-a: red; } body { --x" is not a custom property name',
      ],
    ])
  })

  it("rejects a value with a semicolon outside brackets or quotes", () => {
    const registry = build({
      styles: {
        mine: {
          label: "Mine",
          tokens: { shared: { cardEdge: "red; color: blue" } },
        },
      },
    })
    expect(registry.issues).toEqual([
      {
        level: "error",
        path: "styles.mine.tokens.shared.cardEdge",
        message: 'a value cannot contain ";" outside brackets or quotes',
      },
    ])
    expect(registry.styles).not.toHaveProperty("mine")
  })

  it("accepts a data URI with semicolons and markup", () => {
    expect(
      messages({
        styles: {
          mine: {
            label: "Mine",
            vars: {
              shared: {
                "--mine-noise":
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect/></svg>\")",
              },
            },
          },
        },
      }),
    ).toEqual([])
  })
})

describe("bare colour triplet warning", () => {
  const warnings = (value: string) =>
    build({
      styles: {
        mine: { label: "Mine", tokens: { shared: { cardEdge: value } } },
      },
    }).issues

  it.each([
    "var(--primary-8)",
    "0 1px var(--neutral-6)",
    "color-mix(in oklab, var(--primary-8) 20%, white)",
    "var(--frost-edge, var(--destructive-text))",
    "var(--sidebar-border)",
  ])("warns about %s", (value) => {
    const name =
      /var\((--(?:primary-8|neutral-6|destructive-text|sidebar-border))/.exec(
        value,
      )?.[1]
    expect(warnings(value)).toEqual([
      {
        level: "warning",
        path: "styles.mine.tokens.shared.cardEdge",
        message: `var(${name}) is an HSL channel triplet; write hsl(var(${name}))`,
      },
    ])
  })

  it.each([
    "hsl(var(--primary-8))",
    "hsla(var(--primary-8) / 0.5)",
    "HSL(var(--primary-8) / 0.5)",
    "color-mix(in oklab, hsl(var(--primary-8)) 20%, white)",
    "var(--chart-1)",
    "var(--elevation-medium)",
    "var(--noise-opacity)",
  ])("accepts %s", (value) => {
    expect(warnings(value)).toEqual([])
  })

  it("checks vars, when entries, fallbacks and presets, and keeps the definition", () => {
    const registry = build({
      styles: {
        mine: {
          label: "Mine",
          vars: { dark: { "--mine-a": "var(--primary-1)" } },
          when: [{ axes: {}, vars: { "--mine-b": "var(--primary-2)" } }],
          forcedFallback: { tokens: { chromeEdge: "var(--primary-3)" } },
        },
      },
      presets: {
        ink: {
          label: "Ink",
          style: "mine",
          tokens: { light: { cardSheen: "var(--primary-4)" } },
        },
      },
    })
    expect(registry.issues.map((issue) => [issue.level, issue.path])).toEqual([
      ["warning", 'styles.mine.vars.dark["--mine-a"]'],
      ["warning", 'styles.mine.when[0].vars["--mine-b"]'],
      ["warning", "styles.mine.forcedFallback.tokens.chromeEdge"],
      ["warning", "presets.ink.tokens.light.cardSheen"],
    ])
    expect(registry.styles).toHaveProperty("mine")
    expect(registry.presets).toHaveProperty("ink")
  })
})
