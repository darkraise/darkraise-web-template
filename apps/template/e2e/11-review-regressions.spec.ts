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
  const name = page.getByRole("textbox", { name: "Store name", exact: true })
  const save = page.getByRole("button", { name: "Save changes", exact: true })
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

test("virtual table cells follow meta.align", async ({ page }) => {
  await page.goto("/e2e/fixtures/virtual-table.html")
  const header = page.getByRole("columnheader", { name: "Total" })
  const cell = page.getByRole("cell", { name: "3", exact: true })
  await expect(cell).toBeVisible()
  const textRight = (locator: typeof cell) =>
    locator.evaluate((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue
        const range = document.createRange()
        range.selectNodeContents(node)
        return range.getBoundingClientRect().right
      }
      throw new Error("no text in element")
    })
  const [headRight, cellRight] = [
    await textRight(header),
    await textRight(cell),
  ]
  expect(Math.abs(headRight - cellRight)).toBeLessThanOrEqual(1)
})
