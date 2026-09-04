import { test, expect, type Page } from "@playwright/test"
import {
  gotoApp,
  openThemeSwitcher,
  readThemeAttrs,
  seedApp,
  themeSwitcher,
} from "./helpers/app"

const SHELL_STYLES = [
  "classic",
  "inset",
  "island",
  "floating",
  "framed",
  "flat",
] as const

const shell = (page: Page) => page.locator(".dr-shell").first()

async function pickShellStyle(page: Page, style: string) {
  await openThemeSwitcher(page)
  await themeSwitcher(page)
    .locator('[aria-label="Shell Style"]')
    .getByRole("radio", { name: style, exact: true })
    .click()
  await expect
    .poll(async () => (await readThemeAttrs(page))["data-shell-style"])
    .toBe(style)
}

test.describe("shell style axis", () => {
  test("defaults to classic, with no gutter and no radius", async ({
    page,
  }) => {
    await seedApp(page)
    await gotoApp(page, "/")

    await expect(shell(page)).toHaveAttribute("data-shell-style", "classic")
    await expect(shell(page)).toHaveCSS("gap", "0px")
    await expect(shell(page)).toHaveCSS("padding", "0px")
  })

  test("island gutters the shell and rounds every region", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await pickShellStyle(page, "island")

    await expect(shell(page)).toHaveAttribute("data-shell-style", "island")
    await expect(shell(page)).not.toHaveCSS("gap", "0px")
    await expect(shell(page)).not.toHaveCSS("padding", "0px")

    const nav = shell(page).locator('[data-region="nav"]')
    await expect(nav).not.toHaveCSS("border-radius", "0px")
  })

  test("a mounted shell follows the axis, not a raw document attribute", async ({
    page,
  }) => {
    // Layouts resolve prop ?? theme value and stamp their own root, so poking
    // the document element must not move a shell that is already mounted.
    await seedApp(page)
    await gotoApp(page, "/")
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-shell-style", "island"),
    )
    await expect(shell(page)).toHaveAttribute("data-shell-style", "classic")
  })

  test("the choice survives a reload", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await pickShellStyle(page, "framed")

    await page.reload()
    await expect(shell(page)).toHaveAttribute("data-shell-style", "framed")
  })

  for (const style of SHELL_STYLES) {
    test(`the dashboard shell renders under ${style}`, async ({ page }) => {
      await seedApp(page, { shellStyle: style })
      await gotoApp(page, "/")

      await expect(shell(page)).toHaveAttribute("data-shell-style", style)
      await expect(page.locator("main#main-content")).toBeVisible()
      // The content region must still own its own scroll, whatever the style.
      await expect(page.locator('[data-region="content"]')).toHaveCSS(
        "overflow-y",
        "auto",
      )
    })
  }

  test("the content gradient clips to the rounded corner", async ({ page }) => {
    // main[data-content]::before is a 300px absolutely-positioned gradient
    // anchored to main's edges; once the region rounds it has to clip.
    await seedApp(page, { shellStyle: "island" })
    await gotoApp(page, "/")

    const content = page.locator('[data-region="content"]')
    await expect(content).not.toHaveCSS("border-radius", "0px")
    await expect(content).not.toHaveCSS("overflow-x", "visible")
  })

  test("every structure keeps its regions under island", async ({ page }) => {
    await seedApp(page, { shellStyle: "island" })
    await gotoApp(page, "/components/shell-styles")

    for (const structure of ["sidebar", "top-nav", "stacked", "split-panel"]) {
      await expect(
        page.locator(`.dr-shell[data-structure="${structure}"]`).first(),
      ).toBeVisible()
    }
  })
})
