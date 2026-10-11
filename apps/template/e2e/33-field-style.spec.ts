import { test, expect, type Locator, type Page } from "@playwright/test"
import { seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { computed, settle } from "./helpers/measure"

/**
 * Fields read the style vocabulary: the focus ring, border and fill are
 * tokens a style or preset sets, and the field border, field fill and label
 * case signatures change every field the same way. The kit defaults draw
 * exactly what the fields drew before the tokens existed.
 */

const MODES = ["light", "dark"] as const

/** Each field shape, and the element that takes focus inside it. */
const FIELDS = [
  { name: "input", box: '[data-probe="input"] .dr-input' },
  { name: "textarea", box: '[data-probe="textarea"] .dr-textarea' },
  { name: "select", box: '[data-probe="select"] .dr-select-trigger' },
  {
    name: "number input",
    box: '[data-probe="number-input"] .dr-number-input-control',
    focus: ".dr-number-input-field",
  },
  {
    name: "multi-select",
    box: '[data-probe="chips-card"] .dr-multi-select-control',
    focus: "input",
  },
] as const

type Field = (typeof FIELDS)[number]

async function focusField(page: Page, field: Field): Promise<Locator> {
  const box = page.locator(field.box).first()
  const target = "focus" in field ? box.locator(field.focus).first() : box
  await target.focus()
  await settle(page)
  return box
}

/** A value as the browser computes it on a probe element at the root. */
async function resolved(page: Page, property: string, value: string) {
  return page.evaluate(
    ([name, raw]) => {
      const probe = document.createElement("div")
      probe.style.setProperty(name, raw)
      document.body.append(probe)
      const out = getComputedStyle(probe).getPropertyValue(name)
      probe.remove()
      return out
    },
    [property, value] as const,
  )
}

async function setRoot(page: Page, attributes: Record<string, string>) {
  await page.evaluate((pairs) => {
    for (const [name, value] of Object.entries(pairs)) {
      document.documentElement.setAttribute(name, value)
    }
  }, attributes)
  await settle(page)
}

async function setTokens(page: Page, tokens: Record<string, string>) {
  await page.evaluate((pairs) => {
    for (const [name, value] of Object.entries(pairs)) {
      document.documentElement.style.setProperty(name, value)
    }
  }, tokens)
  await settle(page)
}

for (const mode of MODES) {
  test.describe(`fields · ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await openControlFixture(page)
    })

    test("the default focus tokens draw the ring the fields drew before", async ({
      page,
    }) => {
      const ring = await resolved(
        page,
        "box-shadow",
        "0 0 0 1px hsl(var(--primary)), var(--field-shadow)",
      )
      const border = await resolved(
        page,
        "border-top-color",
        "hsl(var(--primary))",
      )
      for (const field of FIELDS) {
        const box = await focusField(page, field)
        expect(await computed(box, "box-shadow"), field.name).toBe(ring)
        expect(await computed(box, "border-top-color"), field.name).toBe(border)
        // A transparent focus fill paints nothing.
        expect(
          ["none", "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))"],
          field.name,
        ).toContain(await computed(box, "background-image"))
      }
    })

    test("a style's focus tokens reach every field", async ({ page }) => {
      await setTokens(page, {
        "--field-focus-ring": "0 0 0 3px rgb(1, 2, 3)",
        "--field-focus-border": "rgb(4, 5, 6)",
        "--field-focus-fill": "rgb(7, 8, 9)",
      })
      for (const field of FIELDS) {
        const box = await focusField(page, field)
        expect(await computed(box, "box-shadow"), field.name).toContain(
          "rgb(1, 2, 3) 0px 0px 0px 3px",
        )
        expect(await computed(box, "border-top-color"), field.name).toBe(
          "rgb(4, 5, 6)",
        )
        expect(await computed(box, "background-image"), field.name).toBe(
          "linear-gradient(rgb(7, 8, 9), rgb(7, 8, 9))",
        )
      }
      // The inner input of a group leaves the fill to its wrapper. A
      // translucent fill would show a second layer as a darker band.
      await setTokens(page, { "--field-focus-fill": "rgba(7, 8, 9, 0.5)" })
      for (const selector of [
        '[data-probe="number-input"] .dr-number-input-field',
        '[data-probe="chips-card"] .dr-multi-select-input',
      ]) {
        const inner = page.locator(selector).first()
        await inner.focus()
        await settle(page)
        expect(await computed(inner, "background-image"), selector).toBe("none")
      }
    })

    test("field border bottom keeps only the bottom edge, squared", async ({
      page,
    }) => {
      const before = await Promise.all(
        FIELDS.map((field) =>
          computed(page.locator(field.box).first(), "border-bottom-color"),
        ),
      )
      await setRoot(page, { "data-field-border": "bottom" })
      for (const [index, field] of FIELDS.entries()) {
        const box = page.locator(field.box).first()
        for (const side of ["top", "left", "right"]) {
          expect(
            await computed(box, `border-${side}-color`),
            `${field.name} ${side}`,
          ).toBe("rgba(0, 0, 0, 0)")
        }
        expect(await computed(box, "border-bottom-color"), field.name).toBe(
          before[index],
        )
        expect(
          await computed(box, "border-bottom-left-radius"),
          field.name,
        ).toBe("0px")
      }
      // The OTP slots square too: the separate variant sets its own radius.
      for (const selector of [
        '[data-probe="otp"] .dr-input-otp-slot',
        '[data-case="otp"] .dr-input-otp-slot',
      ]) {
        const slots = page.locator(selector)
        for (let index = 0; index < (await slots.count()); index++) {
          for (const corner of [
            "start-start",
            "start-end",
            "end-start",
            "end-end",
          ]) {
            expect(
              await computed(slots.nth(index), `border-${corner}-radius`),
              `${selector} ${index} ${corner}`,
            ).toBe("0px")
          }
        }
      }
      // A focused field draws its whole box in the focus colour.
      const box = await focusField(page, FIELDS[0])
      expect(await computed(box, "border-top-color")).toBe(
        await resolved(page, "border-top-color", "hsl(var(--primary))"),
      )
    })

    test("field border none keeps the bottom edge and the radius", async ({
      page,
    }) => {
      const input = page.locator(FIELDS[0].box).first()
      const radius = await computed(input, "border-bottom-left-radius")
      const edge = await computed(input, "border-bottom-color")
      await setRoot(page, { "data-field-border": "none" })
      expect(await computed(input, "border-top-color")).toBe("rgba(0, 0, 0, 0)")
      expect(await computed(input, "border-left-color")).toBe(
        "rgba(0, 0, 0, 0)",
      )
      expect(await computed(input, "border-bottom-color")).toBe(edge)
      expect(await computed(input, "border-bottom-left-radius")).toBe(radius)
      const slot = page.locator('[data-probe="otp"] .dr-input-otp-slot').nth(1)
      expect(await computed(slot, "border-top-color")).toBe("rgba(0, 0, 0, 0)")
    })

    test("field fill surface paints a card's field in the card", async ({
      page,
    }) => {
      const onCard = page.locator('[data-probe="edge-card"] .dr-input')
      const well = await resolved(
        page,
        "background-color",
        "hsl(var(--control-well))",
      )
      const card = await resolved(page, "background-color", "hsl(var(--card))")
      expect(await computed(onCard, "background-color")).toBe(well)
      await setRoot(page, { "data-field-fill": "surface" })
      expect(await computed(onCard, "background-color")).toBe(card)

      await page.getByRole("button", { name: "Open field dialog" }).click()
      const inDialog = page.locator('[data-probe="edge-dialog"] .dr-input')
      await inDialog.waitFor()
      await settle(page)
      expect(await computed(inDialog, "background-color")).toBe(
        await resolved(page, "background-color", "hsl(var(--popover))"),
      )
    })

    test("field fill translucent lets the ground show through", async ({
      page,
    }) => {
      await setRoot(page, { "data-field-fill": "translucent" })
      const expected = await resolved(
        page,
        "background-color",
        mode === "dark"
          ? "hsl(var(--foreground) / 0.06)"
          : "hsl(var(--card) / 0.6)",
      )
      for (const probe of [
        '[data-probe="input"]',
        '[data-probe="edge-card"]',
      ]) {
        const field = page.locator(`${probe} .dr-input`)
        expect(await computed(field, "background-color"), probe).toBe(expected)
      }
    })

    test("label case upper and lower reach field labels; auto and none leave them", async ({
      page,
    }) => {
      const label = page.locator('[data-case="field"] .dr-label')
      expect(await computed(label, "text-transform")).toBe("none")
      await setRoot(page, { "data-label-case": "upper" })
      expect(await computed(label, "text-transform")).toBe("uppercase")
      await setRoot(page, { "data-label-case": "lower" })
      expect(await computed(label, "text-transform")).toBe("lowercase")
      await setRoot(page, { "data-label-case": "none" })
      expect(await computed(label, "text-transform")).toBe("none")
    })
  })
}
