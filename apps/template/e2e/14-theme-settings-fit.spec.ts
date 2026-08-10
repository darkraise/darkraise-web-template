import { test, expect, type Page } from "@playwright/test"
import { gotoApp, openThemeSwitcher, seedApp } from "./helpers/app"

/**
 * The theme panel's axis controls must fit the width they are given. The page
 * layout puts them in a two-column grid inside the settings Card, which is a
 * far narrower box than the popover the same rows were sized for — toggle
 * labels used to spill outside their border box and overlap the neighbouring
 * cell, and the swatch grid used to lose its last column.
 */

interface Overflow {
  where: string
  text: string
  box: number
  content: number
}

async function overflowingControls(
  page: Page,
  root: string,
): Promise<Overflow[]> {
  return page.evaluate((selector) => {
    const panel = document.querySelector(selector)
    if (!panel) throw new Error(`no element matched ${selector}`)
    const found: Overflow[] = []

    for (const item of panel.querySelectorAll<HTMLElement>(
      ".dr-theme-switcher-toggle-group > *",
    )) {
      // Sub-pixel rounding makes an exactly-fitting cell report a 1px
      // difference, so only a real spill counts.
      if (item.scrollWidth > item.clientWidth + 1)
        found.push({
          where: "toggle item",
          text: item.textContent?.trim() ?? "",
          box: item.clientWidth,
          content: item.scrollWidth,
        })
    }

    for (const grid of panel.querySelectorAll<HTMLElement>(
      ".dr-theme-switcher-swatch-grid",
    )) {
      if (grid.scrollWidth > grid.clientWidth + 1)
        found.push({
          where: "swatch grid",
          text:
            grid
              .closest(".dr-theme-switcher-row")
              ?.querySelector(".dr-theme-switcher-section-label")
              ?.textContent?.trim() ?? "",
          box: grid.clientWidth,
          content: grid.scrollWidth,
        })
    }

    return found
  }, root)
}

const describeOverflow = (found: Overflow[]) =>
  found
    .map((f) => `${f.where} "${f.text}": ${f.content}px in ${f.box}px`)
    .join("\n")

for (const width of [1024, 1280, 1600]) {
  test(`settings appearance panel fits its columns at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    // Gradient background so the Gradient Pattern row (the widest toggle
    // group, at four cells) is rendered.
    await seedApp(page, {
      preset: "default",
      mode: "dark",
      backgroundStyle: "gradient",
    })
    await gotoApp(page, "/settings")

    const panel = page.locator(".dr-theme-settings-page")
    await expect(panel).toBeVisible()
    await expect(
      panel.locator(".dr-theme-switcher-row", { hasText: "Gradient Pattern" }),
    ).toBeVisible()

    const found = await overflowingControls(page, ".dr-theme-settings-page")
    expect(found, describeOverflow(found)).toEqual([])
  })
}

test("theme switcher popover controls fit", async ({ page }) => {
  await seedApp(page, {
    preset: "default",
    mode: "dark",
    backgroundStyle: "gradient",
  })
  await gotoApp(page, "/settings")
  await openThemeSwitcher(page)

  const found = await overflowingControls(page, '[aria-label="Theme settings"]')
  expect(found, describeOverflow(found)).toEqual([])
})
