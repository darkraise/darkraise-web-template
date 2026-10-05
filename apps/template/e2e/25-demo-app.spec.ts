import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, gotoApp, seedApp } from "./helpers/app"
import { alphaOf, computed } from "./helpers/measure"

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

test.describe("charts", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
  })

  // Recharts replaces its mark nodes while the data settles, and a detached
  // node reports an empty computed style.
  const settledStyle = async (mark: Locator, property: string) => {
    let value = ""
    await expect
      .poll(async () => {
        value = await computed(mark, property)
        return value
      })
      .not.toBe("")
    return value
  }

  const chartCard = (page: Page, title: string) =>
    page.locator(".dr-card", {
      has: page.getByText(title, { exact: true }),
    })

  test("Orders & Visitors has a two-item legend", async ({ page }) => {
    await gotoApp(page, "/analytics")
    const items = chartCard(page, "Orders & Visitors").locator(
      ".dr-chart-legend > div",
    )
    await expect(items).toHaveText(["Orders", "Visitors"])
  })

  test("Revenue Trend is the same area chart on both pages", async ({
    page,
  }) => {
    const revenueStroke = async () => {
      const card = chartCard(page, "Revenue Trend")
      const curve = card.locator(".recharts-area-curve").first()
      await expect(curve).toBeVisible()
      await expect(card.locator(".recharts-line-curve")).toHaveCount(0)
      return settledStyle(curve, "stroke")
    }
    await gotoApp(page, "/")
    const dashboard = await revenueStroke()
    await gotoApp(page, "/analytics")
    expect(await revenueStroke()).toBe(dashboard)
  })

  test("each metric keeps one colour", async ({ page }) => {
    const firstFill = async (title: string, selector: string) => {
      const mark = chartCard(page, title).locator(selector).first()
      await expect(mark).toBeVisible()
      return settledStyle(mark, "fill")
    }
    await gotoApp(page, "/analytics")
    const revenue = await firstFill("Revenue Trend", ".recharts-area-area")
    expect(
      await firstFill(
        "Top Products by Revenue",
        ".recharts-bar-rectangle path",
      ),
    ).toBe(revenue)
    await gotoApp(page, "/")
    expect(
      await firstFill(
        "Top Products by Quantity",
        ".recharts-bar-rectangle path",
      ),
    ).not.toBe(revenue)
  })
})

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
  })

  test("the sales target keeps its height beside Recent Orders", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoApp(page, "/")
    const cards = page.locator("[data-dashboard-kpis] > .dr-card")
    await expect(cards).toHaveCount(3)
    await expect(cards.nth(0)).toContainText("Monthly Sales Target")
    const target = await boxOf(cards.nth(0))
    const average = await boxOf(cards.nth(1))
    const returning = await boxOf(cards.nth(2))
    const feed = await boxOf(
      page.locator(".dr-card", {
        has: page.getByText("Recent Orders", { exact: true }),
      }),
    )
    expect(target.height).toBeLessThan(160)
    expect(average.y).toBeGreaterThanOrEqual(target.y + target.height)
    expect(returning.y).toBeGreaterThanOrEqual(average.y + average.height)
    expect(feed.x).toBeGreaterThan(target.x + target.width)
  })
})

test.describe("KPI sparkline", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
  })

  test("the average order value sparkline has an area and a baseline", async ({
    page,
  }) => {
    await gotoApp(page, "/")
    const spark = page
      .locator(".dr-card", { hasText: "Average Order Value" })
      .locator("[data-sparkline]")
    await expect(spark).toBeVisible()
    expect((await boxOf(spark)).height).toBeGreaterThanOrEqual(40)
    const fill = alphaOf(
      await computed(spark.locator("[data-sparkline-area]"), "fill"),
    )
    expect(fill).toBeGreaterThan(0)
    expect(fill).toBeLessThan(1)
    await expect(spark.locator("line")).toHaveCount(1)
  })
})

test.describe("product thumbnails", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
  })

  test("thumbnails are local and their initials legible", async ({ page }) => {
    const external: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("placehold.co")) external.push(request.url())
    })
    await gotoApp(page, "/products")
    const fallbacks = page.locator(
      "[data-product-thumbnail] .dr-avatar-fallback",
    )
    await expect(fallbacks.first()).toBeVisible()
    for (const fallback of await fallbacks.all()) {
      await expect(fallback).toHaveText(/^[A-Z0-9]{2}$/)
      expect(
        parseFloat(await computed(fallback, "font-size")),
      ).toBeGreaterThanOrEqual(12)
    }
    expect(external).toEqual([])
  })
})
