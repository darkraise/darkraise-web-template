import { test, expect } from "@playwright/test"
import { PRESETS } from "./fixtures/theme"
import {
  boxOf,
  expectNoHorizontalOverflow,
  gotoApp,
  seedApp,
  watchConsole,
} from "./helpers/app"

const LAYOUTS = [
  { label: "Sidebar", value: "sidebar" },
  { label: "Top Navigation", value: "top-nav" },
  { label: "Stacked", value: "stacked" },
] as const

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1920, height: 1080 },
] as const

test.describe("layout variants", () => {
  for (const layout of LAYOUTS) {
    test(`switching to "${layout.label}" re-renders the shell`, async ({
      page,
    }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page)
      await gotoApp(page, "/components/buttons")

      await page.getByRole("button", { name: "Switch layout" }).click()
      await page.getByRole("menuitem", { name: layout.label }).click()

      await expect
        .poll(async () =>
          page.evaluate(() => localStorage.getItem("layout-variant")),
        )
        .toBe(layout.value)
      await expect(page.locator("main h1").first()).toBeVisible()
      await expectNoHorizontalOverflow(page)
      consoleWatch.assertClean()
    })

    test(`"${layout.label}" survives a reload and still navigates`, async ({
      page,
    }) => {
      await seedApp(page)
      await page.addInitScript((value: string) => {
        localStorage.setItem("layout-variant", value)
      }, layout.value)
      await gotoApp(page, "/")

      // The stacked layout reaches component pages through its icon rail:
      // pick the /components group first, then the sub-nav link.
      const target = page.locator('a[href="/components/buttons"]:visible')
      if ((await target.count()) === 0) {
        await page.locator('a[href="/components"]:visible').first().click()
        await expect(page).toHaveURL(/\/components$/)
      }
      await target.first().click()
      await expect(page).toHaveURL(/\/components\/buttons$/)
      await expect(page.locator("main h1").first()).toHaveText("Buttons")
    })
  }
})

test.describe("responsive viewports", () => {
  for (const viewport of VIEWPORTS) {
    test(`dashboard at ${viewport.name} (${viewport.width}px)`, async ({
      page,
    }) => {
      const consoleWatch = watchConsole(page)
      await page.setViewportSize(viewport)
      await seedApp(page)
      await gotoApp(page, "/")
      await expect(
        page.getByRole("heading", { name: "Dashboard" }),
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)
      consoleWatch.assertClean()
    })

    test(`component page at ${viewport.name} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await seedApp(page)
      await gotoApp(page, "/components/form-fields")
      await expect(page.locator("main h1").first()).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })
  }

  test("mobile hides the desktop sidebar behind a drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedApp(page)
    await gotoApp(page, "/")

    const sidebar = page.locator("aside")
    await expect(sidebar).toBeHidden()

    await page.getByRole("button", { name: "Open menu" }).first().click()
    await expect(
      page.locator('a[href="/components/buttons"]:visible').first(),
    ).toBeVisible()
  })

  test("theme switcher popover stays inside the viewport on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedApp(page)
    await gotoApp(page, "/")
    await page.getByRole("button", { name: "Customize theme" }).click()
    const panel = page.locator('[aria-label="Theme settings"]')
    await expect(panel).toBeVisible()
    const box = await boxOf(panel)
    expect(box.x).toBeGreaterThanOrEqual(-1)
    expect(box.x + box.width).toBeLessThanOrEqual(391)
  })
})

test.describe("sidebar behaviour", () => {
  test("sidebar collapses and expands", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    const collapse = page.getByRole("button", { name: /collapse sidebar/i })
    const sidebar = page.locator("aside").first()
    const before = (await boxOf(sidebar)).width
    await collapse.click()
    await expect
      .poll(async () => (await boxOf(sidebar)).width)
      .toBeLessThan(before)
  })

  test("sidebar marks the active route", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/buttons")
    const link = page.locator('aside a[href="/components/buttons"]')
    await expect(link).toHaveAttribute("aria-current", "page")
    await expect(link).toHaveAttribute("data-status", "active")
  })

  test("sidebar search opens the command palette", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await page
      .getByRole("button", { name: /search/i })
      .first()
      .click()
    await expect(page.getByRole("dialog").first()).toBeVisible()
  })
})

test.describe("layout under every preset", () => {
  for (const preset of PRESETS) {
    test(`dashboard shell renders under ${preset}`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, { preset, mode: "dark" })
      await gotoApp(page, "/")
      await expect(page.locator("aside")).toBeVisible()
      await expect(
        page.locator("header, [role='banner']").first(),
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)
      consoleWatch.assertClean()
    })
  }
})
