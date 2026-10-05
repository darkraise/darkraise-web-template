import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { computed } from "./helpers/measure"

// Tall enough that every probe renders on screen: pixel() clips its
// screenshot to the viewport.
test.use({ viewport: { width: 1440, height: 2400 } })

/**
 * Control states on the control-contract fixture: each control's boundary,
 * indicator and state, read from computed style, geometry or rendered pixels
 * in both modes.
 */

const MODES = ["light", "dark"] as const

async function openInMode(
  page: Page,
  mode: (typeof MODES)[number],
): Promise<void> {
  await seedApp(page, { style: "quiet", mode })
  await openControlFixture(page)
  await page.mouse.move(0, 0)
}

function probe(page: Page, name: string, selector: string): Locator {
  return page.locator(`[data-probe="${name}"] ${selector}`)
}

test.describe("select trigger", () => {
  for (const mode of MODES) {
    test(`a long value ends in an ellipsis clear of the chevron · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const trigger = probe(page, "select-long", ".dr-select-trigger")
      const value = trigger.locator(":scope > span")
      const chevron = trigger.locator(":scope > svg")
      await expect(value).toHaveText("Supercalifragilisticexpialidocious")
      expect(await computed(value, "text-overflow")).toBe("ellipsis")
      expect(
        await value.evaluate((el) => el.scrollWidth > el.clientWidth),
        "the value overflows its box",
      ).toBe(true)
      const valueBox = await boxOf(value)
      const chevronBox = await boxOf(chevron)
      expect(
        chevronBox.x - (valueBox.x + valueBox.width),
      ).toBeGreaterThanOrEqual(4)
    })
  }
})

/** What a field trigger paints, compared against the Select trigger's. */
const TRIGGER_PAINT = [
  "background-color",
  "border-top-color",
  "border-bottom-color",
  "border-top-left-radius",
  "color",
  "height",
] as const

test.describe("cascade trigger", () => {
  for (const mode of MODES) {
    test(`paints like the Select trigger · ${mode}`, async ({ page }) => {
      await openInMode(page, mode)
      const select = probe(page, "select", ".dr-select-trigger")
      const cascade = probe(page, "cascade", ".dr-cascade-trigger")
      await expect(cascade).toHaveAttribute("data-placeholder", "")
      for (const property of TRIGGER_PAINT) {
        expect(await computed(cascade, property), property).toBe(
          await computed(select, property),
        )
      }
    })
  }
})

test.describe("time picker trigger", () => {
  for (const mode of MODES) {
    test(`paints like the Select trigger and marks an empty value · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const select = probe(page, "select", ".dr-select-trigger")
      const filled = probe(page, "time-picker", ".dr-time-picker-trigger")
      const empty = probe(page, "time-picker-empty", ".dr-time-picker-trigger")
      await expect(filled.locator(":scope > span")).toHaveText(/12:00/)
      await expect(filled).not.toHaveAttribute("data-placeholder")
      await expect(empty).toHaveAttribute("data-placeholder", "")
      for (const property of TRIGGER_PAINT) {
        expect(await computed(empty, property), property).toBe(
          await computed(select, property),
        )
      }
    })
  }
})
