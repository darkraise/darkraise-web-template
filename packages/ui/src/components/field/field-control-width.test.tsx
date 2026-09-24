import { describe, it, expect, beforeAll } from "vitest"
import { render } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { compile } from "tailwindcss"
import { transform } from "lightningcss"
import type { ReactNode } from "react"
import { Field, FieldLabel, type FieldOrientation } from "@components/field"
import { Switch } from "@components/switch"
import { Checkbox } from "@components/checkbox"
import { RadioGroup, RadioGroupItem } from "@components/radio-group"
import { Input } from "@components/input"

// A Field stretches (or, in a wide responsive group, un-stretches) its direct
// children. Written as `.dr-field[data-orientation=…] > *` that selector sits
// at (0,2,0) and outranks the size a fixed-size control declares for itself —
// `.dr-switch`'s w-9 collapsed to a 20x20 dot and a Checkbox stretched across
// the row. jsdom computes no layout and parses no `@apply`, so the stylesheet
// is compiled by Tailwind, flattened, and every Field rule that sets a width
// is matched against the rendered controls.

type Rule = { selector: string; declarations: string }

async function compiledRules(): Promise<Rule[]> {
  const themePath = resolve("src/styles/theme.css")
  const compiler = await compile(readFileSync(themePath, "utf8"), {
    base: dirname(themePath),
    loadStylesheet: async (id, base) => {
      let path: string
      if (id.startsWith(".")) {
        path = resolve(base, id)
      } else {
        const dir = resolve("node_modules", id)
        const pkg = JSON.parse(
          readFileSync(resolve(dir, "package.json"), "utf8"),
        )
        path = resolve(dir, pkg.exports["."].style)
      }
      return { path, base: dirname(path), content: readFileSync(path, "utf8") }
    },
  })
  const { code } = transform({
    filename: "theme.css",
    code: Buffer.from(compiler.build([])),
    targets: { chrome: 100 << 16 },
  })
  return [...code.toString().matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    ([, selector = "", declarations = ""]) => ({
      selector: selector.trim(),
      declarations,
    }),
  )
}

const ORIENTATIONS: FieldOrientation[] = [
  "vertical",
  "horizontal",
  "responsive",
]

const CONTROLS: Array<[string, (orientation: FieldOrientation) => ReactNode]> =
  [
    [
      "switch",
      (orientation) => (
        <Field orientation={orientation}>
          <Switch data-testid="control" />
          <FieldLabel>Label</FieldLabel>
        </Field>
      ),
    ],
    [
      "checkbox",
      (orientation) => (
        <Field orientation={orientation}>
          <Checkbox data-testid="control" />
          <FieldLabel>Label</FieldLabel>
        </Field>
      ),
    ],
    [
      "radio",
      (orientation) => (
        <RadioGroup>
          <Field orientation={orientation}>
            <RadioGroupItem value="a" data-testid="control" />
            <FieldLabel>Label</FieldLabel>
          </Field>
        </RadioGroup>
      ),
    ],
  ]

describe("Field child width", () => {
  let fieldWidthRules: Rule[]

  beforeAll(async () => {
    fieldWidthRules = (await compiledRules()).filter(
      (rule) =>
        rule.selector.includes(".dr-field[") &&
        /(^|[;\s])width:/.test(rule.declarations),
    )
  })

  it("compiles Field rules that set a child's width", () => {
    expect(fieldWidthRules.length).toBeGreaterThan(0)
  })

  for (const [name, renderControl] of CONTROLS) {
    for (const orientation of ORIENTATIONS) {
      it(`leaves a ${name}'s own size alone in a ${orientation} field`, () => {
        const { getByTestId } = render(renderControl(orientation))
        const control = getByTestId("control")
        const overriding = fieldWidthRules
          .filter((rule) => control.matches(rule.selector))
          .map((rule) => rule.selector)
        expect(overriding).toEqual([])
      })
    }
  }

  it("still stretches a text input in a vertical field", () => {
    const { getByTestId } = render(
      <Field orientation="vertical">
        <FieldLabel>Label</FieldLabel>
        <Input data-testid="control" />
      </Field>,
    )
    const control = getByTestId("control")
    expect(
      fieldWidthRules.some(
        (rule) =>
          control.matches(rule.selector) &&
          /width:\s*100%/.test(rule.declarations),
      ),
    ).toBe(true)
  })
})
