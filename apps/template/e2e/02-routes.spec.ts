import { test, expect } from "@playwright/test"
import { APP_ROUTES } from "./fixtures/app-routes"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import {
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
  gotoApp,
  seedApp,
  watchConsole,
} from "./helpers/app"

/** The heading each app route renders; the inbox has none until a message opens. */
const HEADINGS: Record<string, RegExp | null> = {
  "/": /Dashboard/,
  "/analytics": /Analytics/,
  "/products": /Products/,
  "/products/new": /Product/,
  "/products/prod-1/edit": /Edit iPhone 15 Pro/,
  "/categories": /Categories/,
  "/orders": /Orders/,
  "/orders/ord-1": /ORD-2025-001/,
  "/customers": /Customers/,
  "/customers/cust-1": /Emma Thompson/,
  "/settings": /Settings/,
  "/inbox": null,
  "/components": /Component Library/,
}

/** The error-pages showcase renders error-boundary copy on purpose. */
const ERROR_COPY_BY_DESIGN = new Set(["/components/error-pages"])

test.describe("application routes render", () => {
  for (const path of APP_ROUTES) {
    test(`app route ${path}`, async ({ page }) => {
      const heading = HEADINGS[path]
      if (heading === undefined)
        throw new Error(`no heading listed for ${path}`)
      const consoleWatch = watchConsole(page)
      await seedApp(page)
      await gotoApp(page, path)
      if (heading) {
        await expect(page.locator("main h1").first()).toHaveText(heading)
      }
      await expectNoErrorBoundary(page)
      await expectNoHorizontalOverflow(page)
      consoleWatch.assertClean()
    })
  }
})

test.describe("component showcase routes render", () => {
  for (const route of COMPONENT_ROUTES) {
    test(`component route ${route.path}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page)
      await gotoApp(page, route.path)
      await expect(page.locator("main h1").first()).toHaveText(route.title)
      if (!ERROR_COPY_BY_DESIGN.has(route.path)) {
        await expectNoErrorBoundary(page)
      }
      await expectNoHorizontalOverflow(page)
      consoleWatch.assertClean()
    })
  }
})

/**
 * The kitchen sink is the style screenshots' ground truth, so every control
 * family has to sit inside one 1440×900 capture, with the text field it
 * focuses on load still focused.
 */
const KITCHEN_SINK_FAMILIES = [
  "buttons",
  "fields",
  "choices",
  "slider-toggle",
  "tabs-segments",
  "badges-pagination",
  "cards",
]

test.describe("kitchen sink", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test("shows every control family in one 1440×900 viewport", async ({
    page,
  }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page)
    await gotoApp(page, "/components/kitchen-sink")
    await expect(page.locator("main h1").first()).toHaveText("Kitchen Sink")
    await expect(page.getByLabel("Focused field")).toBeFocused()

    const overflow = await page
      .locator("#main-content")
      .evaluate((main) => main.scrollHeight - main.clientHeight)
    expect(overflow, "main region overflow in px").toBeLessThanOrEqual(0)
    for (const family of KITCHEN_SINK_FAMILIES) {
      await expect(
        page.locator(`[data-family="${family}"]`),
        family,
      ).toBeInViewport({ ratio: 1 })
    }
    consoleWatch.assertClean()
  })
})

test.describe("split-panel routes render", () => {
  test("inbox lists messages and opens one", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page)
    await gotoApp(page, "/inbox")
    await expect(page.getByText("Select a message to read it")).toBeVisible()
    const first = page.locator("button", { hasText: /@|Re:|:/ }).first()
    await first.click()
    await expect(page.locator("h1").first()).toBeVisible()
    await expectNoErrorBoundary(page)
    consoleWatch.assertClean()
  })
})

test.describe("detail routes reachable from list pages", () => {
  for (const [list, action, urlPattern] of [
    ["/products", "Edit", /\/products\/[^/]+\/edit$/],
    ["/orders", "View details", /\/orders\/[^/]+$/],
    ["/customers", "View profile", /\/customers\/[^/]+$/],
  ] as const) {
    test(`${list} row action "${action}" opens the detail route`, async ({
      page,
    }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page)
      await gotoApp(page, list)
      await page
        .getByRole("button", { name: /open menu|actions/i })
        .first()
        .click()
      await page.getByRole("menuitem", { name: action }).click()
      await expect(page).toHaveURL(urlPattern)
      await expect(page.locator("main h1").first()).toBeVisible()
      await expectNoErrorBoundary(page)
      consoleWatch.assertClean()
    })
  }
})

test.describe("sidebar navigation", () => {
  test("every sidebar link has a matching route", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    const hrefs = await page
      .locator('aside a[href^="/"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""))
    expect(hrefs.length).toBeGreaterThan(100)

    const known = new Set([
      ...COMPONENT_ROUTES.map((r) => r.path),
      ...APP_ROUTES,
    ])
    const unknown = hrefs.filter((h) => !known.has(h))
    expect(unknown, `sidebar links without a fixture route`).toEqual([])
  })

  test("clicking a sidebar link navigates without a reload", async ({
    page,
  }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await page.evaluate(() => {
      ;(window as unknown as { __spa: boolean }).__spa = true
    })
    await page.locator('aside a[href="/components/buttons"]').click()
    await expect(page).toHaveURL(/\/components\/buttons$/)
    await expect(page.locator("main h1").first()).toHaveText("Buttons")
    expect(
      await page.evaluate(
        () => (window as unknown as { __spa?: boolean }).__spa === true,
      ),
    ).toBe(true)
  })
})
