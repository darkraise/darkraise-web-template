import { test, expect, type Page } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"

/**
 * Demo app consistency. Each block checks one page-level rule through
 * geometry or computed style, so a regression fails here rather than only
 * in a screenshot diff.
 */

/**
 * For the column whose header contains `name`, the distance from each cell's
 * end edge to the end of its content: the header first, then every body row.
 * An end-aligned column shows the cell padding; a start-aligned one shows
 * the free space after short content.
 */
async function endGaps(page: Page, name: string): Promise<number[]> {
  return page.evaluate((header) => {
    const table = document.querySelector("#main-content table")
    if (!table) throw new Error("no table in the main region")
    const heads = [...table.querySelectorAll("thead th")]
    const index = heads.findIndex((th) => th.textContent?.includes(header))
    const head = heads[index]
    if (!head) throw new Error(`no "${header}" column`)
    const gap = (cell: Element) => {
      const range = document.createRange()
      range.selectNodeContents(cell)
      return (
        cell.getBoundingClientRect().right - range.getBoundingClientRect().right
      )
    }
    const cells = [...table.querySelectorAll("tbody tr")].map((row) => {
      const cell = row.children[index]
      if (!cell) throw new Error(`a row has no "${header}" cell`)
      return cell
    })
    return [head, ...cells].map(gap)
  }, name)
}

test.describe("customers table", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
  })

  test("the Orders column aligns like Total Spent", async ({ page }) => {
    await gotoApp(page, "/customers")
    await expect(page.locator("#main-content tbody tr").first()).toBeVisible()
    const orders = await endGaps(page, "Orders")
    const spent = await endGaps(page, "Total Spent")
    expect(orders.length).toBeGreaterThan(1)
    expect(orders.length).toBe(spent.length)
    orders.forEach((gap, row) => {
      expect(
        Math.abs(gap - (spent[row] ?? NaN)),
        `row ${row}`,
      ).toBeLessThanOrEqual(1)
    })
  })
})

const STATUS_VARIANT: Record<string, string> = {
  active: "success-subtle",
  delivered: "success-subtle",
  shipped: "info-subtle",
  processing: "warning-subtle",
  cancelled: "destructive-subtle",
  pending: "secondary",
  draft: "secondary",
  inactive: "secondary",
  archived: "outline",
}

test.describe("status badges", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
  })

  for (const path of [
    "/orders",
    "/orders/ord-3",
    "/products",
    "/categories",
    "/customers/cust-1",
  ]) {
    test(`${path} uses the shared status map`, async ({ page }) => {
      await gotoApp(page, path)
      const badges = page.locator("#main-content .dr-badge[data-status]")
      await expect(badges.first()).toBeVisible()
      const pairs = await badges.evaluateAll((elements) =>
        elements.map((element) => [
          element.getAttribute("data-status") ?? "",
          element.getAttribute("data-variant") ?? "",
        ]),
      )
      for (const [status, variant] of pairs) {
        expect(variant, status).toBe(STATUS_VARIANT[status ?? ""])
      }
    })
  }
})
