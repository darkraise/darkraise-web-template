import { test, expect, type Page } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"

/**
 * The shell clips its own overflow and the content region scrolls inside it,
 * so a document-level check passes while cards run off-screen. This measures
 * the content region and every card as well.
 */
async function expectFits(page: Page): Promise<void> {
  const problems = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth
    const found: string[] = []
    const documentOverflow = document.documentElement.scrollWidth - viewport
    if (documentOverflow > 1) {
      found.push(`page scrolls sideways by ${documentOverflow}px`)
    }
    const region = document.querySelector<HTMLElement>(
      '[data-region="content"]',
    )
    if (region && region.scrollWidth - region.clientWidth > 1) {
      found.push(
        `content region scrolls sideways by ${region.scrollWidth - region.clientWidth}px`,
      )
    }
    for (const card of document.querySelectorAll<HTMLElement>(".dr-card")) {
      const box = card.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) continue
      if (box.left < -1 || box.right > viewport + 1) {
        const chart = card.querySelector(".dr-chart")
        const chartWidth = chart
          ? ` (chart ${Math.round(chart.getBoundingClientRect().width)}px)`
          : ""
        const label = (card.textContent ?? "").trim().slice(0, 30)
        found.push(
          `card "${label}" spans ${Math.round(box.left)}..${Math.round(box.right)}${chartWidth}`,
        )
      }
    }
    return found
  })
  expect(problems).toEqual([])
}

test.describe("dashboard", () => {
  test("chart cards fit the viewport", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await expect(page.locator(".dr-chart").first()).toBeVisible()
    await expectFits(page)
  })
})
