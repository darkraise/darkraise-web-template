import { AXES, AXIS_KEYS } from "../axes/registry"
import { STYLE_NAMES } from "../styles"
import { FONTS, SHELL_STYLES } from "../types"
import {
  CUSTOM_PROPERTY,
  KEBAB,
  NOT_DEFINABLE,
  NOT_TESTABLE,
  RESERVED_NAMES,
} from "./registry"
import { SIGNATURE_KEYS, SIGNATURES } from "./signatures"
import { PAINT_TOKENS } from "./tokens"

type Schema = Record<string, unknown>

const ref = (name: string): Schema => ({ $ref: `#/definitions/${name}` })

const closed = (properties: Record<string, Schema>, required?: string[]) => ({
  type: "object",
  properties,
  ...(required ? { required } : {}),
  additionalProperties: false,
})

const each = (keys: readonly string[], schema: (key: string) => Schema) =>
  Object.fromEntries(keys.map((key) => [key, schema(key)]))

// A config may register fonts, so the font axis takes any name; the registry
// checks it.
const axisValues = (key: string): Schema =>
  key === "font"
    ? { type: "string" }
    : { enum: [...AXES[key as keyof typeof AXES].values] }

const modes = (inner: Schema) =>
  closed({ shared: inner, light: inner, dark: inner })

/**
 * JSON Schema (draft-07) for a theme config, published as
 * `darkraise-ui/theme.schema.json`. It checks shapes, names and values; the
 * rules that span definitions (an `extends` target exists and has no cycle,
 * var prefixes, a preset's style) are checked by the registry.
 */
export function buildThemeJsonSchema(): Record<string, unknown> {
  const definable = AXIS_KEYS.filter((key) => !NOT_DEFINABLE.has(key))
  const testable = AXIS_KEYS.filter((key) => !NOT_TESTABLE.has(key))
  const named = (key: string): Schema =>
    key === "style" || key === "preset" ? { type: "string" } : axisValues(key)

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "darkraise-ui theme config",
    ...closed(
      {
        $schema: { type: "string" },
        defaults: closed(each(AXIS_KEYS, named)),
        switcher: closed(
          {
            enabled: { type: "boolean" },
            axes: closed(each(AXIS_KEYS, () => ({ type: "boolean" }))),
            advanced: { type: "boolean" },
          },
          ["enabled"],
        ),
        styles: {
          type: "object",
          propertyNames: ref("name"),
          additionalProperties: ref("style"),
        },
        presets: {
          type: "object",
          propertyNames: ref("name"),
          additionalProperties: ref("preset"),
        },
        fonts: {
          type: "object",
          propertyNames: ref("fontName"),
          additionalProperties: ref("font"),
        },
      },
      ["defaults", "switcher"],
    ),
    definitions: {
      name: {
        type: "string",
        pattern: KEBAB.source,
        not: { enum: [...RESERVED_NAMES, ...STYLE_NAMES] },
      },
      fontName: {
        type: "string",
        pattern: KEBAB.source,
        not: { enum: [...RESERVED_NAMES, "body", ...FONTS] },
      },
      font: closed(
        {
          label: { type: "string" },
          family: ref("value"),
          role: { enum: ["sans", "serif", "display"] },
        },
        ["label", "family", "role"],
      ),
      value: {
        type: "string",
        not: { pattern: "[{}]|<\\/[Ss][Tt][Yy][Ll][Ee]" },
      },
      tokens: closed(each(Object.keys(PAINT_TOKENS), () => ref("value"))),
      vars: {
        type: "object",
        propertyNames: { pattern: CUSTOM_PROPERTY.source },
        additionalProperties: ref("value"),
      },
      axes: closed(each(definable, axisValues)),
      signatures: closed(
        each(SIGNATURE_KEYS, (key) => ({
          enum: [...SIGNATURES[key as keyof typeof SIGNATURES].values],
        })),
      ),
      when: closed(
        {
          axes: closed(each(testable, axisValues)),
          mode: { enum: ["light", "dark"] },
          tokens: ref("tokens"),
          vars: ref("vars"),
        },
        ["axes"],
      ),
      style: closed(
        {
          label: { type: "string" },
          extends: { type: "string" },
          frosted: { type: "boolean" },
          defaults: ref("axes"),
          vars: modes(ref("vars")),
          tokens: modes(ref("tokens")),
          when: { type: "array", items: ref("when") },
          forcedFallback: closed({ tokens: ref("tokens") }, ["tokens"]),
          signatures: ref("signatures"),
          hairlines: { enum: ["opaque", "alpha"] },
        },
        ["label"],
      ),
      preset: closed(
        {
          label: { type: "string" },
          style: { type: "string" },
          axes: ref("axes"),
          tokens: modes(ref("tokens")),
          signatures: ref("signatures"),
          shellStyle: { enum: [...SHELL_STYLES] },
        },
        ["label", "style"],
      ),
    },
  }
}
