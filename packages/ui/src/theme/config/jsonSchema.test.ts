import Ajv from "ajv"
import { describe, expect, it } from "vitest"
import { AXES, AXIS_KEYS } from "../axes/registry"
import { BUILTIN_STYLES } from "../styles/builtin"
import { buildThemeJsonSchema } from "./jsonSchema"
import { PAINT_TOKENS } from "./tokens"

// The workspace's ajv (6, hoisted from eslint) implements draft-07, the draft
// the schema declares.
const validate = new Ajv({ allErrors: true }).compile(buildThemeJsonSchema())

const VALID = {
  $schema: "./node_modules/darkraise-ui/dist/theme.schema.json",
  defaults: { style: "glass-ink", preset: "ink-night", radius: "subtle" },
  switcher: { enabled: true, axes: { glassBlur: false }, advanced: false },
  styles: {
    "glass-ink": {
      label: "Glass ink",
      extends: "glass",
      frosted: true,
      defaults: { glassOpacity: "subtle" },
      vars: {
        shared: { "--glass-ink-edge": "hsl(var(--primary-8) / 0.4)" },
        dark: { "--glass-ink-edge": "hsl(var(--primary-4) / 0.4)" },
      },
      tokens: {
        shared: { cardEdge: "var(--glass-ink-edge)" },
        light: {},
        dark: { cardSheen: "" },
      },
      when: [
        {
          axes: { glassOpacity: "strong", glassBlur: "none" },
          mode: "dark",
          tokens: { overlayFillBase: "black" },
          vars: { "--glass-ink-edge": "white" },
        },
      ],
      forcedFallback: { tokens: { cardEdge: "hsl(var(--border))" } },
    },
  },
  presets: {
    "ink-night": {
      label: "Ink night",
      style: "glass-ink",
      axes: { accentColor: "indigo" },
      tokens: { dark: { cardEdge: "black" } },
      shellStyle: "inset",
    },
  },
}

type Config = Record<string, unknown>

/** VALID with `path` set to `value`; `path` is a list of keys. */
function withValue(path: readonly string[], value: unknown): Config {
  const copy = structuredClone(VALID) as Config
  let node = copy
  for (const key of path.slice(0, -1)) node = node[key] as Config
  node[path[path.length - 1] as string] = value
  return copy
}

function errorsOf(config: unknown) {
  expect(validate(config)).toBe(false)
  return (validate.errors ?? []).map(({ keyword, dataPath, params }) => ({
    keyword,
    dataPath,
    params,
  }))
}

describe("theme config JSON Schema", () => {
  it("accepts a config using every field", () => {
    expect(validate(VALID)).toBe(true)
  })

  it("accepts each built-in definition as a config style", () => {
    const styles = Object.fromEntries(
      Object.entries(BUILTIN_STYLES).map(([name, definition]) => [
        `my-${name}`,
        definition,
      ]),
    )
    expect(
      validate({ defaults: {}, switcher: { enabled: true }, styles }),
      JSON.stringify(validate.errors),
    ).toBe(true)
  })

  it("lists every paint token and every axis", () => {
    const schema = buildThemeJsonSchema() as {
      definitions: Record<string, { properties: Record<string, unknown> }>
      properties: { defaults: { properties: Record<string, unknown> } }
    }
    expect(Object.keys(schema.definitions.tokens?.properties ?? {})).toEqual(
      Object.keys(PAINT_TOKENS),
    )
    expect(Object.keys(schema.properties.defaults.properties)).toEqual(
      AXIS_KEYS,
    )
    expect(schema.definitions.axes?.properties.radius).toEqual({
      enum: [...AXES.radius.values],
    })
  })

  it.each<[string, readonly string[], unknown, object]>([
    [
      "an unknown token",
      ["styles", "glass-ink", "tokens", "shared"],
      { cardGlow: "red" },
      {
        keyword: "additionalProperties",
        dataPath: ".styles['glass-ink'].tokens.shared",
        params: { additionalProperty: "cardGlow" },
      },
    ],
    [
      "an unknown preset token",
      ["presets", "ink-night", "tokens", "dark"],
      { cardGlow: "red" },
      {
        keyword: "additionalProperties",
        dataPath: ".presets['ink-night'].tokens.dark",
        params: { additionalProperty: "cardGlow" },
      },
    ],
    [
      "an unknown default axis value",
      ["defaults", "radius"],
      "huge",
      {
        keyword: "enum",
        dataPath: ".defaults.radius",
        params: { allowedValues: [...AXES.radius.values] },
      },
    ],
    [
      "an unknown style default value",
      ["styles", "glass-ink", "defaults"],
      { glassOpacity: "murky" },
      {
        keyword: "enum",
        dataPath: ".styles['glass-ink'].defaults.glassOpacity",
        params: { allowedValues: [...AXES.glassOpacity.values] },
      },
    ],
    [
      "a when entry on an axis it cannot test",
      ["styles", "glass-ink", "when"],
      [{ axes: { sidebarSelection: "chip" } }],
      {
        keyword: "additionalProperties",
        dataPath: ".styles['glass-ink'].when[0].axes",
        params: { additionalProperty: "sidebarSelection" },
      },
    ],
    [
      "a removed default",
      ["defaults"],
      { surfaceIntensity: "high" },
      {
        keyword: "additionalProperties",
        dataPath: ".defaults",
        params: { additionalProperty: "surfaceIntensity" },
      },
    ],
    [
      "a value that would leave its rule",
      ["styles", "glass-ink", "tokens", "shared"],
      { cardEdge: "red } body { color: red" },
      {
        keyword: "not",
        dataPath: ".styles['glass-ink'].tokens.shared.cardEdge",
        params: {},
      },
    ],
    [
      "a value that would close its style element",
      ["styles", "glass-ink", "vars", "shared"],
      { "--glass-ink-edge": "red</STYLE>" },
      {
        keyword: "not",
        dataPath: ".styles['glass-ink'].vars.shared['--glass-ink-edge']",
        params: {},
      },
    ],
    [
      "a var name that is not a custom property",
      ["styles", "glass-ink", "vars", "shared"],
      { "glass-ink-edge": "red" },
      {
        keyword: "pattern",
        dataPath: ".styles['glass-ink'].vars.shared",
        params: { pattern: "^--[\\w-]+$" },
      },
    ],
    [
      "a style without a label",
      ["styles", "glass-ink", "label"],
      undefined,
      {
        keyword: "required",
        dataPath: ".styles['glass-ink']",
        params: { missingProperty: "label" },
      },
    ],
  ])("rejects %s", (_, path, value, error) => {
    expect(errorsOf(withValue(path, value))).toContainEqual(error)
  })

  it.each([
    ["styles", "Glass-Ink", "pattern"],
    ["styles", "glass_ink", "pattern"],
    ["styles", "glass", "not"],
    ["styles", "base", "not"],
    ["presets", "default", "not"],
    ["presets", "quiet", "not"],
  ])("rejects the %s name %j", (group, name, keyword) => {
    const definition =
      group === "styles" ? { label: "X" } : VALID.presets["ink-night"]
    const errors = errorsOf({ ...VALID, [group]: { [name]: definition } })
    expect(errors).toContainEqual(
      expect.objectContaining({
        keyword: "propertyNames",
        dataPath: `.${group}`,
        params: { propertyName: name },
      }),
    )
    expect(errors).toContainEqual(expect.objectContaining({ keyword }))
  })
})
