import Ajv from "ajv"
import { describe, expect, it, vi } from "vitest"
import type { PresetDefinition, ThemeDefinitions } from "./schema"
import { buildThemeJsonSchema } from "./jsonSchema"
import { resolveRegistry } from "./registry"

// The kit's own preset record, replaced for this file so the schema is built
// with built-in presets in place.
const PRESETS = vi.hoisted(
  (): Record<string, PresetDefinition> => ({
    dusk: { label: "Dusk", style: "glass" },
    "dawn-mist": { label: "Dawn mist", style: "quiet" },
  }),
)

vi.mock("../styles/builtin/presets", () => ({ BUILTIN_PRESETS: PRESETS }))

const validate = new Ajv({ allErrors: true }).compile(buildThemeJsonSchema())

const DEFINITIONS = {
  styles: { label: "X" },
  presets: { label: "X", style: "quiet" },
  fonts: { label: "X", family: "serif", role: "serif" },
} as const

type Group = keyof typeof DEFINITIONS

function definitions(group: Group, name: string): ThemeDefinitions {
  return { [group]: { [name]: DEFINITIONS[group] } } as ThemeDefinitions
}

function config(group: Group, name: string) {
  return {
    defaults: {},
    switcher: { enabled: true },
    ...definitions(group, name),
  }
}

describe("theme config JSON Schema with built-in presets", () => {
  it.each<[Group, string]>([
    ["styles", "dusk"],
    ["presets", "dusk"],
    ["fonts", "dusk"],
    ["styles", "dawn-mist"],
    ["presets", "dawn-mist"],
    ["fonts", "dawn-mist"],
  ])("rejects the %s name %j, as the registry does", (group, name) => {
    expect(validate(config(group, name))).toBe(false)
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        keyword: "propertyNames",
        dataPath: `.${group}`,
        params: { propertyName: name },
      }),
    )
    expect(validate.errors).toContainEqual(
      expect.objectContaining({ keyword: "not" }),
    )
    expect(resolveRegistry(config(group, name)).issues).toEqual([
      {
        level: "error",
        path: `${group}.${name}`,
        message: `"${name}" is a built-in preset name`,
      },
    ])
  })

  it.each<Group>(["styles", "presets", "fonts"])(
    "accepts a %s name no built-in preset holds",
    (group) => {
      expect(
        validate(config(group, "dusk-two")),
        JSON.stringify(validate.errors),
      ).toBe(true)
      expect(resolveRegistry(config(group, "dusk-two")).issues).toEqual([])
    },
  )
})
