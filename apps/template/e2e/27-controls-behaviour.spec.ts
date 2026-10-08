import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { contrast, pixel, settle } from "./helpers/measure"

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

test.describe("outline variants", () => {
  /** Contrast between a row's 1px inline-start edge and the row's own fill
   *  4px further in, both sampled at mid-height. The fixture lays rows out
   *  on whole pixels. */
  async function edgeAgainstFill(page: Page, row: Locator): Promise<number> {
    await row.scrollIntoViewIfNeeded()
    const box = await boxOf(row)
    const x = Math.floor(box.x)
    const y = Math.floor(box.y + box.height / 2)
    return contrast(await pixel(page, x, y), await pixel(page, x + 4, y))
  }

  for (const mode of MODES) {
    test(`listbox rings its selected row · ${mode}`, async ({ page }) => {
      await openInMode(page, mode)
      const row = probe(
        page,
        "listbox-outline",
        '[role="option"][aria-selected="true"]',
      )
      await expect(row).toHaveText("Cherry")
      expect(await edgeAgainstFill(page, row)).toBeGreaterThanOrEqual(3)
    })

    test(`tree view rings its selected row · ${mode}`, async ({ page }) => {
      await openInMode(page, mode)
      const row = probe(
        page,
        "tree-outline",
        '.dr-tree-view-item[aria-selected="true"]',
      )
      await expect(row).toHaveText("todo.txt")
      expect(await edgeAgainstFill(page, row)).toBeGreaterThanOrEqual(3)
    })

    test(`pagination edges its other links · ${mode}`, async ({ page }) => {
      await openInMode(page, mode)
      const link = probe(
        page,
        "pagination-outline",
        ".dr-pagination-link",
      ).first()
      await expect(link).toHaveText("1")
      const box = await boxOf(link)
      const x = Math.floor(box.x)
      const y = Math.floor(box.y + box.height / 2)
      const edge = await pixel(page, x, y)
      const ground = await pixel(page, x - 3, y)
      expect(contrast(edge, ground)).toBeGreaterThanOrEqual(3)
    })
  }
})

test.describe("button group", () => {
  for (const mode of MODES) {
    for (const variant of ["default", "secondary", "destructive"] as const) {
      test(`draws a seam between ${variant} buttons · ${mode}`, async ({
        page,
      }) => {
        await openInMode(page, mode)
        const second = await boxOf(
          probe(page, "button-group", `.dr-btn[data-variant="${variant}"]`).nth(
            1,
          ),
        )
        const x = Math.round(second.x)
        const y = Math.round(second.y + second.height / 2)
        const seam = await pixel(page, x, y)
        expect(seam, "against the first fill").not.toEqual(
          await pixel(page, x - 3, y),
        )
        expect(seam, "against the second fill").not.toEqual(
          await pixel(page, x + 3, y),
        )
      })
    }
  }
})

test.describe("marquee", () => {
  test("Tab leaves the first copy for the next control", async ({ page }) => {
    await openInMode(page, "light")
    await probe(page, "marquee", ".dr-marquee-group a").first().focus()
    await page.keyboard.press("Tab")
    await expect(
      page.getByRole("button", { name: "After the marquee" }),
    ).toBeFocused()
  })

  test("a click on a link in a copy follows it", async ({ page }) => {
    // Reduced motion stops the loop, so the copy holds still under the pointer.
    await page.emulateMedia({ reducedMotion: "reduce" })
    await openInMode(page, "light")
    const link = probe(page, "marquee", ".dr-marquee-group").nth(1).locator("a")
    const box = await boxOf(link)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(page).toHaveURL(/#news$/)
  })
})

test.describe("resizable", () => {
  test("a handle between full panels keeps its divider", async ({ page }) => {
    await openInMode(page, "light")
    const box = await boxOf(probe(page, "resizable", ".dr-resizable-handle"))
    expect(box.width).toBeGreaterThanOrEqual(1)
    const x = Math.floor(box.x)
    const y = Math.floor(box.y + box.height / 2)
    expect(await pixel(page, x, y)).not.toEqual(await pixel(page, x - 4, y))
  })
})

test.describe("user menu", () => {
  test("the Layout entry and its separator show below 48rem only", async ({
    page,
  }) => {
    await openInMode(page, "light")
    const trigger = probe(page, "user-menu", ".dr-user-menu-trigger")
    const menu = page.locator(".dr-user-menu-content")
    const entry = menu.locator(".dr-user-menu-layout")
    const separator = menu.locator(".dr-user-menu-layout-separator")

    await trigger.click()
    await expect(menu.getByRole("menuitem", { name: "Log out" })).toBeVisible()
    await expect(entry).toHaveCount(1)
    await expect(entry).toBeHidden()
    await expect(separator).toHaveCount(1)
    await expect(separator).toBeHidden()
    await page.keyboard.press("Escape")

    await page.setViewportSize({ width: 390, height: 844 })
    await trigger.click()
    await expect(entry).toBeVisible()
    await expect(separator).toBeVisible()
  })
})
