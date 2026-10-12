import { test, expect, type Page } from "@playwright/test"
import { gotoApp, kitLook, seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { computed, settle } from "./helpers/measure"

/**
 * Checkables read the style vocabulary: the checked border, the thumb fill,
 * the checkbox, switch and segment radii, the slider's track well and a view
 * pill face that may be a gradient. The kit defaults draw exactly what the
 * controls drew before.
 */

const MODES = ["light", "dark"] as const

const CHECKED =
  '[data-probe="checkbox-states"] .dr-checkbox[data-state="checked"]'
const SWITCH = '[data-probe="switch"] .dr-switch'
const THUMB = '[data-probe="switch"] .dr-switch-thumb'
const SLIDER_THUMB = '[data-probe="slider-vertical"] .dr-slider-thumb'
const SLIDER_TRACK = '[data-probe="slider-vertical"] .dr-slider-track'
const ANGLE = '[data-probe="angle"] .dr-angle-slider-pointer'
const SEGMENT = '[data-probe="segment"] .dr-segment-group'
const SEGMENT_ITEM = '[data-probe="segment"] .dr-segment-group-item'
const SEGMENT_PILL = '[data-probe="segment"] .dr-segment-group-indicator'

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

async function setTokens(page: Page, tokens: Record<string, string>) {
  await page.evaluate((pairs) => {
    for (const [name, value] of Object.entries(pairs)) {
      document.documentElement.style.setProperty(name, value)
    }
  }, tokens)
  await settle(page)
}

function first(page: Page, selector: string) {
  return page.locator(selector).first()
}

for (const mode of MODES) {
  test.describe(`checkables · ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await openControlFixture(page)
      await kitLook(page)
      await settle(page)
    })

    test("the default tokens draw the checkables as before", async ({
      page,
    }) => {
      const checked = first(page, CHECKED)
      expect(await computed(checked, "border-top-color")).toBe(
        await computed(checked, "background-color"),
      )
      expect(await computed(checked, "border-top-left-radius")).toBe(
        await resolved(
          page,
          "border-top-left-radius",
          "max(calc(var(--radius) - 4px), calc(var(--radius) / 2))",
        ),
      )
      expect(
        await computed(first(page, SWITCH), "border-top-left-radius"),
      ).toBe(
        await resolved(page, "border-top-left-radius", "var(--radius-pill)"),
      )
      expect(await computed(first(page, THUMB), "border-top-left-radius")).toBe(
        await resolved(
          page,
          "border-top-left-radius",
          "max(0px, calc(var(--radius-pill) - 2px))",
        ),
      )
      expect(await computed(first(page, THUMB), "background-color")).toBe(
        await resolved(page, "background-color", "var(--field-edge)"),
      )
      const onAccent = await resolved(
        page,
        "background-color",
        "hsl(var(--primary-foreground))",
      )
      expect(
        await computed(first(page, SLIDER_THUMB), "background-color"),
      ).toBe(onAccent)
      expect(await computed(first(page, ANGLE), "background-color")).toBe(
        onAccent,
      )
      expect(
        await computed(first(page, SEGMENT), "border-top-left-radius"),
      ).toBe(
        await resolved(
          page,
          "border-top-left-radius",
          "calc(var(--radius) - 2px)",
        ),
      )
      const inner = await resolved(
        page,
        "border-top-left-radius",
        "calc(var(--radius) - 4px)",
      )
      for (const selector of [SEGMENT_ITEM, SEGMENT_PILL]) {
        expect(
          await computed(first(page, selector), "border-top-left-radius"),
          selector,
        ).toBe(inner)
      }
      expect(
        await computed(first(page, SEGMENT_PILL), "background-color"),
      ).toBe(
        await resolved(page, "background-color", "var(--selected-view-bg)"),
      )
    })

    test("a style's checkable tokens reach every control", async ({ page }) => {
      await setTokens(page, {
        "--check-checked-border": "rgb(1, 2, 3)",
        "--thumb-fill": "rgb(4, 5, 6)",
        "--check-radius": "0px",
        "--switch-radius": "5px",
        "--segment-radius": "10px",
        "--selected-view-bg": "linear-gradient(rgb(7, 8, 9), rgb(10, 11, 12))",
      })
      expect(await computed(first(page, CHECKED), "border-top-color")).toBe(
        "rgb(1, 2, 3)",
      )
      expect(
        await computed(first(page, CHECKED), "border-top-left-radius"),
      ).toBe("0px")
      for (const selector of [THUMB, SLIDER_THUMB, ANGLE]) {
        expect(
          await computed(first(page, selector), "background-color"),
          selector,
        ).toBe("rgb(4, 5, 6)")
      }
      await first(page, SWITCH).click()
      await settle(page)
      expect(await computed(first(page, THUMB), "background-color")).toBe(
        "rgb(4, 5, 6)",
      )
      expect(
        await computed(first(page, SWITCH), "border-top-left-radius"),
      ).toBe("5px")
      expect(await computed(first(page, THUMB), "border-top-left-radius")).toBe(
        "3px",
      )
      expect(
        await computed(first(page, SEGMENT), "border-top-left-radius"),
      ).toBe("10px")
      for (const selector of [SEGMENT_ITEM, SEGMENT_PILL]) {
        expect(
          await computed(first(page, selector), "border-top-left-radius"),
          selector,
        ).toBe("8px")
      }
      expect(
        await computed(first(page, SEGMENT_PILL), "background-image"),
      ).toBe("linear-gradient(rgb(7, 8, 9), rgb(10, 11, 12))")
    })

    test("the slider track reads the track well", async ({ page }) => {
      await setTokens(page, { "--track-well": "inset 0 1px 2px rgb(1, 2, 3)" })
      expect(await computed(first(page, SLIDER_TRACK), "box-shadow")).toBe(
        "rgb(1, 2, 3) 0px 1px 2px 0px inset",
      )
    })

    test("the tabs view pill takes a gradient face", async ({ page }) => {
      await gotoApp(page, "/components/tabs")
      await kitLook(page)
      const pill = first(page, '.dr-tabs-indicator[data-variant="default"]')
      await pill.waitFor()
      await settle(page)
      const before = await computed(pill, "background-color")
      expect(before).toBe(
        await resolved(page, "background-color", "var(--selected-view-bg)"),
      )
      await setTokens(page, {
        "--selected-view-bg": "linear-gradient(rgb(7, 8, 9), rgb(10, 11, 12))",
      })
      expect(await computed(pill, "background-image")).toBe(
        "linear-gradient(rgb(7, 8, 9), rgb(10, 11, 12))",
      )
    })
  })
}
