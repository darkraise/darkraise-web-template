import { test, expect, type Locator, type Page } from "@playwright/test"
import { gotoApp, seedApp, wrappedTableText } from "./helpers/app"
import { alphaOf } from "./helpers/measure"

/** Ancestors precede descendants in document order, so the last match is
 *  the example's own wrapper. */
function example(page: Page, title: string): Locator {
  return page
    .locator("div.space-y-3")
    .filter({ has: page.getByText(title, { exact: true }) })
    .last()
}

test.describe("kit table", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/table")
  })

  test("cells keep one line and the wide table scrolls", async ({ page }) => {
    const scope = example(page, "Horizontal scroll with many columns")
    await expect(scope.locator("tbody tr").first()).toBeVisible()
    expect(await wrappedTableText(scope)).toEqual([])
    const overflow = await scope
      .locator(".dr-table-wrapper")
      .evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeGreaterThan(0)
  })

  test("the footer is opaque", async ({ page }) => {
    const footer = example(page, "Basic table with footer").locator("tfoot")
    const background = await footer.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    expect(alphaOf(background)).toBe(1)
  })
})
