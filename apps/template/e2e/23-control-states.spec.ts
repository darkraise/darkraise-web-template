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
