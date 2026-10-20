import { test, expect } from "@playwright/test"
import {
  boxOf,
  gotoApp,
  seedApp,
  watchConsole,
  type ThemeSeed,
} from "./helpers/app"

/**
 * DataTable layout that jsdom cannot measure: the rows-per-page value stays
 * whole at the largest type and the roomier densities, and the empty-state
 * message of a table wider than a phone sits in the part of the scroll
 * container the user can see, clear of its edge fade.
 */

const ROOMY: [string, ThemeSeed][] = [
  ["extra-large font", { fontSize: "extra-large" }],
  ["comfortable density", { density: "comfortable" }],
  ["spacious density", { density: "spacious" }],
]

test.describe("rows per page", () => {
  for (const [name, theme] of ROOMY) {
    test(`shows its whole value at ${name}`, async ({ page }) => {
      const consoleLog = watchConsole(page)
      await seedApp(page, { style: "quiet", mode: "light", ...theme })
      await gotoApp(page, "/products")
      const trigger = page.getByRole("combobox", { name: "Rows per page" })
      await expect(trigger).toHaveText("10")
      const value = trigger.locator(":scope > span").first()
      const { scrollWidth, clientWidth } = await value.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
      consoleLog.assertClean()
    })
  }
})

test.describe("empty state on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("keeps its message inside the visible table, clear of the fade", async ({
    page,
  }) => {
    const consoleLog = watchConsole(page)
    await seedApp(page, { style: "quiet", mode: "light" })
    await gotoApp(page, "/products")
    await page
      .getByPlaceholder("Search products...")
      .fill("no product has this name")
    const message = page.getByText("No results found")
    await expect(message).toBeVisible()

    const wrapper = page.locator(".dr-data-table-frame .dr-table-wrapper")
    const view = await wrapper.evaluate((el) => {
      const style = getComputedStyle(el)
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      )
      const px = (value: string) =>
        value.trim().endsWith("rem")
          ? parseFloat(value) * rem
          : parseFloat(value) || 0
      return {
        overflows: el.scrollWidth > el.clientWidth,
        scrollLeft: el.scrollLeft,
        fadeStart: px(style.getPropertyValue("--scroll-fade-start")),
        fadeEnd: px(style.getPropertyValue("--scroll-fade-end")),
      }
    })
    expect(view.overflows).toBe(true)
    expect(view.scrollLeft).toBe(0)

    const box = await boxOf(wrapper)
    const text = await boxOf(message)
    expect(text.x).toBeGreaterThanOrEqual(box.x + view.fadeStart)
    expect(text.x + text.width).toBeLessThanOrEqual(
      box.x + box.width - view.fadeEnd,
    )
    expect(text.y).toBeGreaterThanOrEqual(box.y)
    expect(text.y + text.height).toBeLessThanOrEqual(box.y + box.height)
    consoleLog.assertClean()
  })
})
