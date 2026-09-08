import { test, expect } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"

test.beforeEach(async ({ page }) => {
  await seedApp(page)
})

test("layout menu only offers shells the demo renders", async ({ page }) => {
  await gotoApp(page, "/settings")
  await page.getByRole("button", { name: "Switch layout" }).click()
  await expect(page.getByRole("menuitem", { name: "Split Panel" })).toHaveCount(
    0,
  )
  await page.getByRole("menuitem", { name: "Stacked", exact: true }).click()
  await page.reload()
  await page.getByRole("button", { name: "Switch layout" }).click()
  await expect(
    page.getByRole("menuitem", { name: "Stacked", exact: true }),
  ).toHaveAttribute("data-active", "true")
  await expect(page.getByRole("menuitem", { name: "Split Panel" })).toHaveCount(
    0,
  )
})

test("settings submit controls follow validation and submission", async ({
  page,
}) => {
  await gotoApp(page, "/settings")
  const name = page.getByRole("textbox", { name: "Store Name", exact: true })
  const save = page.getByRole("button", { name: "Save Changes", exact: true })
  await name.clear()
  await expect(save).toBeDisabled()
  await name.fill("Updated store")
  await expect(save).toBeEnabled()
  await save.click()
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled()
  await expect(save).toBeEnabled()
})

test("virtual tables retain row geometry and recover after filtering", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("theme-density", "spacious"),
  )
  await page.goto("/e2e/fixtures/virtual-table.html")
  const viewport = page.locator(".dr-data-table-viewport")
  await expect(
    page.getByRole("cell", { name: "Item 0", exact: true }),
  ).toBeVisible()
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "Item 0", exact: true }) })
  await expect
    .poll(() =>
      row.evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(40)
  await viewport.evaluate((element) => {
    element.scrollTop = 40 * 490
  })
  await expect(
    page.getByRole("cell", { name: "Item 490", exact: true }),
  ).toBeVisible()
  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(
    page.getByRole("cell", { name: "Item 499", exact: true }),
  ).toBeInViewport()
  await page.getByRole("textbox").fill("Item 499")
  await expect(
    page.getByRole("cell", { name: "Item 499", exact: true }),
  ).toBeVisible()
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBe(0)
})
