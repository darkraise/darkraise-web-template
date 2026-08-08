import { test, expect } from "@playwright/test"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import {
  expectNoErrorBoundary,
  expectNoHorizontalOverflow,
  gotoApp,
  seedApp,
  watchConsole,
} from "./helpers/app"

const APP_ROUTES: { path: string; heading: RegExp }[] = [
  { path: "/", heading: /Dashboard/ },
  { path: "/analytics", heading: /Analytics/ },
  { path: "/products", heading: /Products/ },
  { path: "/products/new", heading: /Product/ },
  { path: "/categories", heading: /Categories/ },
  { path: "/orders", heading: /Orders/ },
  { path: "/customers", heading: /Customers/ },
  { path: "/settings", heading: /Settings/ },
  { path: "/components", heading: /Component Library/ },
]

/** The error-pages showcase renders error-boundary copy on purpose. */
const ERROR_COPY_BY_DESIGN = new Set(["/components/error-pages"])

test.describe("application routes render", () => {
  for (const route of APP_ROUTES) {
    test(`app route ${route.path}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page)
      await gotoApp(page, route.path)
      await expect(page.locator("main h1").first()).toHaveText(route.heading)
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

test.describe("routes without a showcase header", () => {
  test("image editor playground renders", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page)
    await gotoApp(page, "/components/image-editor-playground")
    await expect(page.locator("main")).toBeVisible()
    await expectNoErrorBoundary(page)
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
    ["/orders", "View Details", /\/orders\/[^/]+$/],
    ["/customers", "View Profile", /\/customers\/[^/]+$/],
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
      ...APP_ROUTES.map((r) => r.path),
      "/components/image-editor-playground",
      "/inbox",
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
