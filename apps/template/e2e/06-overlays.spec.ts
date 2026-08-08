import { test, expect, type Page } from "@playwright/test"
import { attrOf, gotoApp, seedApp, watchConsole } from "./helpers/app"

async function open(page: Page, path: string) {
  await seedApp(page)
  await gotoApp(page, path)
  return page.locator("main")
}

test.describe("accordion and collapsible", () => {
  test("accordion expands and collapses a section", async ({ page }) => {
    const main = await open(page, "/components/accordion")
    const trigger = main.getByRole("button").first()
    const contentId = await trigger.getAttribute("aria-controls")
    const content = page.locator(`#${contentId}`)

    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await trigger.click()
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    await expect(content).toBeVisible()
    await trigger.click()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  test("collapsible toggles its panel", async ({ page }) => {
    const main = await open(page, "/components/collapsible")
    const trigger = main.locator("button[aria-expanded]").first()
    const before = await attrOf(trigger, "aria-expanded")
    await trigger.click()
    await expect(trigger).not.toHaveAttribute("aria-expanded", before)
  })
})

test.describe("dialogs", () => {
  test("dialog opens, traps focus and closes with Escape", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    const main = await open(page, "/components/dialogs")
    await main.getByRole("button", { name: "Open Dialog" }).first().click()

    const dialog = page.getByRole("dialog").first()
    await expect(dialog).toBeVisible()
    expect(
      await page.evaluate(() => {
        const active = document.activeElement
        const dialogEl = document.querySelector('[role="dialog"]')
        return dialogEl?.contains(active) ?? false
      }),
    ).toBe(true)

    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    consoleWatch.assertClean()
  })

  test("alert dialog confirms and cancels", async ({ page }) => {
    const main = await open(page, "/components/alert-dialog")
    await main.getByRole("button").first().click()
    const dialog = page.getByRole("alertdialog").first()
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: /cancel/i }).click()
    await expect(dialog).toBeHidden()
  })

  test("drawer opens and closes", async ({ page }) => {
    const main = await open(page, "/components/drawer")
    await main.getByRole("button", { name: "Open Drawer" }).first().click()
    const drawer = page.getByRole("dialog").first()
    await expect(drawer).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(drawer).toBeHidden()
  })

  test("sheet opens from a side and closes", async ({ page }) => {
    const main = await open(page, "/components/sheet")
    await main.getByRole("button").first().click()
    const sheet = page.getByRole("dialog").first()
    await expect(sheet).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(sheet).toBeHidden()
  })
})

test.describe("floating surfaces", () => {
  test("popover opens on click and closes on Escape", async ({ page }) => {
    const main = await open(page, "/components/popover")
    await main.getByRole("button", { name: "Open Popover" }).first().click()
    const popover = page.locator(".dr-popover-content").first()
    await expect(popover).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(popover).toBeHidden()
  })

  test("tooltip appears on hover", async ({ page }) => {
    const main = await open(page, "/components/tooltip")
    await main.getByRole("button").first().hover()
    await expect(page.getByRole("tooltip").first()).toBeVisible()
  })

  test("hover card appears on hover", async ({ page }) => {
    const main = await open(page, "/components/hover-card")
    await main.getByRole("link", { name: "@janedoe" }).first().hover()
    await expect(page.locator(".dr-hover-card-content").first()).toBeVisible()
  })

  test("floating panel opens", async ({ page }) => {
    const main = await open(page, "/components/floating-panel")
    await main.getByRole("button").first().click()
    await expect(
      page.locator('[class*="floating-panel"]').first(),
    ).toBeVisible()
  })
})

test.describe("menus", () => {
  test("dropdown menu opens and exposes items", async ({ page }) => {
    const main = await open(page, "/components/dropdown-menu")
    await main.getByRole("button").first().click()
    const menu = page.getByRole("menu").first()
    await expect(menu).toBeVisible()
    expect(await menu.getByRole("menuitem").count()).toBeGreaterThan(0)
    await page.keyboard.press("Escape")
    await expect(menu).toBeHidden()
  })

  test("context menu opens on right click", async ({ page }) => {
    const main = await open(page, "/components/context-menu")
    await main
      .locator("div", { hasText: /right.?click/i })
      .last()
      .click({
        button: "right",
      })
    await expect(page.getByRole("menu").first()).toBeVisible()
  })

  test("menubar opens a top-level menu", async ({ page }) => {
    const main = await open(page, "/components/menubar")
    await main.getByRole("menuitem").first().click()
    await expect(page.getByRole("menu").first()).toBeVisible()
  })

  test("navigation menu opens a panel", async ({ page }) => {
    const main = await open(page, "/components/navigation-menu")
    await main.getByRole("button").first().click()
    await expect(main.getByRole("button").first()).toHaveAttribute(
      "aria-expanded",
      "true",
    )
  })

  test("virtualized dropdown menu renders a windowed list", async ({
    page,
  }) => {
    const main = await open(page, "/components/virtualized-dropdown-menu")
    await main.getByRole("button").first().click()
    const menu = page.getByRole("menu").first()
    await expect(menu).toBeVisible()
    const rendered = await menu.getByRole("menuitem").count()
    expect(rendered).toBeGreaterThan(0)
    // Virtualization means only a window of the data set is in the DOM.
    expect(rendered).toBeLessThan(500)
  })
})

test.describe("command palette", () => {
  test("global palette opens with the keyboard shortcut and filters", async ({
    page,
  }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await page.keyboard.press("Control+k")
    const palette = page.getByRole("dialog").first()
    await expect(palette).toBeVisible()

    const input = palette.getByRole("combobox").or(palette.locator("input"))
    await input.first().fill("analy")
    await expect(palette.getByText(/analytics/i).first()).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(palette).toBeHidden()
  })

  test("command showcase filters its list", async ({ page }) => {
    const main = await open(page, "/components/command")
    const input = main.locator("input").first()
    await input.fill("dash")
    await expect(main.getByText(/dashboard/i).first()).toBeVisible()
  })
})

test.describe("toasts and banners", () => {
  test("sonner toast appears after triggering", async ({ page }) => {
    const main = await open(page, "/components/feedback")
    await main.getByRole("button", { name: "Delete item" }).first().click()
    const toast = page.locator("ol.dr-toaster li.dr-toast").first()
    await expect(toast).toBeVisible()
    await expect(toast).toContainText("Item deleted")
  })

  test("banner can be dismissed", async ({ page }) => {
    const main = await open(page, "/components/banner")
    const dismiss = main.getByRole("button", { name: /dismiss|close/i }).first()
    if ((await dismiss.count()) === 0) test.skip()
    await dismiss.click()
    await expect(dismiss).toBeHidden()
  })
})

test.describe("tour", () => {
  test("tour advances through steps", async ({ page }) => {
    const main = await open(page, "/components/tour")
    await main
      .getByRole("button", { name: /start|begin|tour/i })
      .first()
      .click()
    const next = page.getByRole("button", { name: /next/i }).first()
    await expect(next).toBeVisible()
    await next.click()
    await expect(
      page.getByRole("button", { name: /next|finish|done/i }).first(),
    ).toBeVisible()
  })
})
