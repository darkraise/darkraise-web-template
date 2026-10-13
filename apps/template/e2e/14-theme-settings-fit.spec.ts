import { test, expect, type Page } from "@playwright/test"
import {
  boxOf,
  gotoApp,
  openAdvanced,
  openThemeSwitcher,
  seedApp,
  themeSwitcher,
} from "./helpers/app"
import { settle } from "./helpers/measure"

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

    for (const group of panel.querySelectorAll<HTMLElement>(
      ".dr-theme-switcher-toggle-group",
    )) {
      if (group.scrollWidth > group.clientWidth + 1)
        found.push({
          where: "toggle group",
          text: group.getAttribute("aria-label") ?? "",
          box: group.clientWidth,
          content: group.scrollWidth,
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

/** Toggle labels inset less than 6px from either inline edge of their cell. */
async function crampedLabels(page: Page, root: string): Promise<string[]> {
  return page.evaluate((selector) => {
    const panel = document.querySelector(selector)
    if (!panel) throw new Error(`no element matched ${selector}`)
    const found: string[] = []
    for (const item of panel.querySelectorAll<HTMLElement>(
      ".dr-theme-switcher-toggle-group > .dr-toggle",
    )) {
      const range = document.createRange()
      range.selectNodeContents(item)
      const content = range.getBoundingClientRect()
      const box = item.getBoundingClientRect()
      const inset = Math.min(content.left - box.left, box.right - content.right)
      if (inset < 6)
        found.push(`"${item.textContent?.trim()}": ${inset.toFixed(1)}px`)
    }
    return found
  }, root)
}

// Vietnamese labels are the longest; spacious density pads every cell most.
const PAGE_CASES = [
  { width: 1024, language: "en" },
  { width: 1280, language: "en" },
  { width: 1600, language: "en" },
  { width: 1024, language: "vi" },
  { width: 1280, language: "vi" },
  { width: 1024, language: "en", density: "spacious" },
  { width: 1024, language: "vi", density: "spacious" },
  // Each other style's Preset row: preset names are the longest toggle labels.
  { width: 1024, language: "en", density: "spacious", style: "flat" },
  { width: 1024, language: "en", density: "spacious", style: "tactile" },
  { width: 1024, language: "en", density: "spacious", style: "glass" },
] as const

const GRADIENT_PATTERN = { en: "Gradient Pattern", vi: "Kiểu chuyển màu" }
const PRESET = { en: "Preset", vi: "Cài đặt sẵn" }

for (const entry of PAGE_CASES) {
  const density = "density" in entry ? entry.density : undefined
  const style = "style" in entry ? entry.style : "quiet"
  const suffix = [
    entry.language === "en" ? "" : ` in ${entry.language}`,
    density ? ` at ${density} density` : "",
    style === "quiet" ? "" : ` under ${style}`,
  ].join("")
  test(`settings appearance panel fits its columns at ${entry.width}px${suffix}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: entry.width, height: 900 })
    // Gradient background so the Gradient Pattern row is rendered.
    await seedApp(page, {
      style,
      mode: "dark",
      backgroundStyle: "gradient",
      ...(density ? { density } : {}),
    })
    if (entry.language !== "en") {
      await page.addInitScript(
        (language) => localStorage.setItem("darkraise-demo.language", language),
        entry.language,
      )
    }
    await gotoApp(page, "/settings")

    const panel = page.locator(".dr-theme-settings-page")
    await expect(panel).toBeVisible()
    await expect(
      panel.locator(".dr-theme-switcher-row", {
        hasText: GRADIENT_PATTERN[entry.language],
      }),
    ).toBeVisible()
    await expect(
      panel.getByRole("radiogroup", { name: PRESET[entry.language] }),
    ).toBeVisible()

    const found = await overflowingControls(page, ".dr-theme-settings-page")
    expect(found, describeOverflow(found)).toEqual([])
    const cramped = await crampedLabels(page, ".dr-theme-settings-page")
    expect(cramped, cramped.join("\n")).toEqual([])
  })
}

test("theme switcher popover controls fit", async ({ page }) => {
  await seedApp(page, {
    style: "quiet",
    mode: "dark",
    backgroundStyle: "gradient",
  })
  await gotoApp(page, "/settings")
  await openThemeSwitcher(page)
  // Open Advanced too, so every row is measured.
  await openAdvanced(page)
  await expect(
    themeSwitcher(page).locator(".dr-theme-switcher-row", {
      hasText: "Gradient Pattern",
    }),
  ).toBeVisible()

  const found = await overflowingControls(page, '[aria-label="Theme settings"]')
  expect(found, describeOverflow(found)).toEqual([])
})

test("with Advanced open the switcher popover fits the viewport and scrolls to its last row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await seedApp(page, { style: "glass", mode: "light" })
  await gotoApp(page, "/")
  const panel = await openThemeSwitcher(page)
  await openAdvanced(page)
  await settle(page)

  const box = await boxOf(panel)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(800)
  expect(await panel.evaluate((el) => getComputedStyle(el).overflowY)).toBe(
    "auto",
  )
  expect(await panel.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  )

  await panel.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await expect(
    panel.locator(".dr-theme-switcher-section-label", {
      hasText: "Sidebar Selection",
    }),
  ).toBeInViewport()
})
