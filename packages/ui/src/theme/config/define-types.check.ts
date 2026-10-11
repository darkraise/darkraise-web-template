import {
  defineFont,
  definePreset,
  defineStyle,
  defineThemeConfig,
} from "./define"
import type { StyleDefinition } from "./schema"

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T

export const keepsLiterals = defineThemeConfig({
  defaults: { radius: "sharp" },
  switcher: { enabled: true },
})

/** Compile-time only: `pnpm --filter darkraise-ui typecheck` fails if any entry is false. */
export type DefineTypeChecks = [
  Expect<Equal<ReturnType<typeof defineStyle>, StyleDefinition>>,
  Expect<Equal<(typeof keepsLiterals)["defaults"]["radius"], "sharp">>,
]

// Each `@ts-expect-error` below fails the typecheck if its line compiles.
export const rejected = [
  defineStyle({
    label: "Unknown token",
    // @ts-expect-error -- `cardGlow` is not a paint token
    tokens: { shared: { cardGlow: "none" } },
  }),
  defineStyle({
    label: "Var without dashes",
    // @ts-expect-error -- a var name starts with `--`
    vars: { shared: { "paper-grain": "none" } },
  }),
  defineStyle({
    label: "When on mode",
    // @ts-expect-error -- `mode` is selected by the entry's `mode` field
    when: [{ axes: { mode: "dark" }, tokens: { cardEdge: "none" } }],
  }),
  definePreset({
    label: "Bad axis value",
    style: "quiet",
    // @ts-expect-error -- `huge` is not a radius
    axes: { radius: "huge" },
  }),
  defineStyle({
    label: "Unknown signature value",
    // @ts-expect-error -- `perforated` is not a card footer
    signatures: { cardFooter: "perforated" },
  }),
  definePreset({
    label: "Unknown signature",
    style: "quiet",
    // @ts-expect-error -- `cardGlow` is not a signature
    signatures: { cardGlow: "on" },
  }),
  defineStyle({
    label: "Unknown hairlines mode",
    // @ts-expect-error -- hairlines are opaque or alpha
    hairlines: "dashed",
  }),
  defineFont({
    label: "Unknown role",
    family: "monospace",
    // @ts-expect-error -- a font is a sans, serif or display face
    role: "mono",
  }),
  definePreset({
    label: "Style axis",
    style: "quiet",
    // @ts-expect-error -- a preset names its style in `style`, not in `axes`
    axes: { style: "glass" },
  }),
]
