import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { settle } from "./helpers/measure"

/**
 * Component behaviour on the controls-behaviour fixture: row geometry and
 * the outline variants' selection marks, read from layout and rendered
 * pixels.
 */

const FIXTURE = "/e2e/fixtures/controls-behaviour.html"
const MODES = ["light", "dark"] as const

async function openInMode(
  page: Page,
  mode: (typeof MODES)[number],
): Promise<void> {
  await seedApp(page, { style: "quiet", mode })
  await page.goto(FIXTURE)
  await page.getByTestId("controls-behaviour").waitFor()
  await expect(page.locator("html")).toHaveAttribute("data-style", "quiet")
  await page.mouse.move(0, 0)
  await settle(page)
}

function probe(page: Page, name: string, selector: string): Locator {
  return page.locator(`[data-probe="${name}"] ${selector}`)
}

/** Left edge of an element's text, measured on the text itself. */
function textStart(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return range.getBoundingClientRect().left
  })
}

test.describe("fixture", () => {
  for (const mode of MODES) {
    test(`opens in the seeded mode · ${mode}`, async ({ page }) => {
      await openInMode(page, mode)
      await expect(page.locator("html")).toHaveAttribute("data-mode", mode)
    })
  }
})

test.describe("tree view rows", () => {
  test("a leaf's text lines up with a sibling branch's text", async ({
    page,
  }) => {
    await openInMode(page, "light")
    const branchText = probe(
      page,
      "tree",
      '[aria-level="1"] > .dr-tree-view-branch-text',
    )
    const leaf = probe(page, "tree", 'li.dr-tree-view-item[aria-level="1"]')
    const nested = probe(page, "tree", 'li.dr-tree-view-item[aria-level="2"]')
    await expect(leaf).toHaveText("todo.txt")
    const branchX = await textStart(branchText)
    const leafX = await textStart(leaf)
    expect(Math.abs(leafX - branchX)).toBeLessThanOrEqual(1)
    expect((await textStart(nested)) - leafX).toBeCloseTo(16, 0)
  })

  test("depth-0 rows keep an inline-start inset", async ({ page }) => {
    await openInMode(page, "light")
    const row = probe(
      page,
      "tree",
      '.dr-tree-view-branch-control[aria-level="1"]',
    )
    const indicator = row.locator(".dr-tree-view-branch-indicator")
    expect(
      (await boxOf(indicator)).x - (await boxOf(row)).x,
    ).toBeGreaterThanOrEqual(7.5)
  })
})

test.describe("vertical toolbar", () => {
  test("is as wide as its widest item, not its container", async ({ page }) => {
    await openInMode(page, "light")
    const bar = probe(page, "toolbar-vertical", ".dr-toolbar")
    // Each item's own width: a stretched item is as wide as the bar, so the
    // item is measured with align-self: flex-start for one read.
    const { widest, chrome } = await bar.evaluate((el) => {
      const items = Array.from(
        el.querySelectorAll<HTMLElement>(":scope > .dr-toggle"),
      )
      const widths = items.map((item) => {
        const previous = item.style.alignSelf
        item.style.alignSelf = "flex-start"
        const width = item.getBoundingClientRect().width
        item.style.alignSelf = previous
        return width
      })
      const style = getComputedStyle(el)
      return {
        widest: Math.max(...widths),
        chrome:
          parseFloat(style.paddingLeft) +
          parseFloat(style.paddingRight) +
          parseFloat(style.borderLeftWidth) +
          parseFloat(style.borderRightWidth),
      }
    })
    expect(widest).toBeGreaterThan(0)
    expect((await boxOf(bar)).width).toBeLessThanOrEqual(widest + chrome + 0.5)
  })
})
