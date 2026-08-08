import { test, expect } from "@playwright/test"
import { DARK_ONLY_PRESETS, PRESETS } from "./fixtures/theme"
import {
  gotoApp,
  openThemeSwitcher,
  readToken,
  seedApp,
  watchConsole,
} from "./helpers/app"

/** WCAG relative luminance from an `H S% L%` token value. */
function hslToLuminance(token: string): number | null {
  const match = token.match(/^(-?[\d.]+)\s+(-?[\d.]+)%\s+(-?[\d.]+)%$/)
  if (!match) return null
  const [h, s, l] = [
    Number(match[1]) / 360,
    Number(match[2]) / 100,
    Number(match[3]) / 100,
  ]
  const hue = (p: number, q: number, t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  let rgb: number[]
  if (s === 0) rgb = [l, l, l]
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    rgb = [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)]
  }
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: number, b: number) {
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

test.describe("keyboard navigation", () => {
  test("skip link moves focus to the main region", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await page.keyboard.press("Tab")
    const skip = page.getByRole("link", { name: /skip to content/i })
    await expect(skip).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/#main-content$/)
  })

  test("dialog traps Tab and restores focus on close", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/dialogs")
    const trigger = page
      .locator("main")
      .getByRole("button", { name: "Open Dialog" })
      .first()
    await trigger.click()

    const dialog = page.getByRole("dialog").first()
    await expect(dialog).toBeVisible()

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab")
      const inside = await page.evaluate(() =>
        document
          .querySelector('[role="dialog"]')
          ?.contains(document.activeElement),
      )
      expect(inside, `focus escaped the dialog on Tab #${i + 1}`).toBe(true)
    }

    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("dropdown menu supports arrow-key navigation", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/dropdown-menu")
    await page.locator("main").getByRole("button").first().click()
    const menu = page.getByRole("menu").first()
    await expect(menu).toBeVisible()

    await page.keyboard.press("ArrowDown")
    const focusedInMenu = await page.evaluate(() =>
      document.querySelector('[role="menu"]')?.contains(document.activeElement),
    )
    expect(focusedInMenu).toBe(true)
  })

  test("tabs move with arrow keys", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/tabs")
    const tabs = page.locator("main").getByRole("tab")
    await tabs.first().focus()
    await page.keyboard.press("ArrowRight")
    await expect(tabs.nth(1)).toBeFocused()
  })

  test("toggle group uses roving tabindex", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/toggle-group")
    const group = page.locator('main [role="radiogroup"]').first()
    const items = group.getByRole("radio")
    await items.first().focus()
    await page.keyboard.press("ArrowRight")
    await expect(items.nth(1)).toBeFocused()
  })

  test("theme switcher is reachable and operable by keyboard", async ({
    page,
  }) => {
    await seedApp(page, { preset: "default", mode: "light" })
    await gotoApp(page, "/")
    await openThemeSwitcher(page)
    const dark = page
      .locator('[aria-label="Theme settings"] [aria-label="Mode"]')
      .getByRole("radio", { name: "Dark" })
    await dark.focus()
    await page.keyboard.press("Enter")
    await expect
      .poll(async () =>
        page.evaluate(() => document.documentElement.getAttribute("data-mode")),
      )
      .toBe("dark")
  })
})

test.describe("landmarks and labels", () => {
  test("page exposes the expected landmarks", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await expect(page.getByRole("banner")).toHaveCount(1)
    await expect(page.getByRole("main")).toHaveCount(1)
    await expect(
      page.getByRole("complementary", { name: "Primary" }),
    ).toHaveCount(1)
  })

  test("every icon-only header button has an accessible name", async ({
    page,
  }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    const unnamed = await page.locator("header button").evaluateAll((buttons) =>
      buttons
        .filter((b) => {
          const label =
            b.getAttribute("aria-label") ?? b.textContent?.trim() ?? ""
          return label.length === 0
        })
        .map((b) => b.outerHTML.slice(0, 120)),
    )
    expect(unnamed).toEqual([])
  })

  test("form inputs on the fields showcase are labelled", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/form-fields")
    const unlabelled = await page
      // Component-internal proxy inputs are aria-hidden and out of the
      // accessibility tree, so they need no label of their own.
      .locator('main input:not([type=hidden]):not([aria-hidden="true"])')
      .evaluateAll((inputs) =>
        inputs
          .filter((input) => {
            const id = input.getAttribute("id")
            const labelled =
              input.getAttribute("aria-label") ??
              input.getAttribute("aria-labelledby") ??
              (id ? document.querySelector(`label[for="${id}"]`) : null)
            return !labelled
          })
          .map((i) => i.outerHTML.slice(0, 120)),
      )
    expect(unlabelled).toEqual([])
  })
})

test.describe("colour contrast of core tokens", () => {
  for (const preset of PRESETS) {
    const modes = DARK_ONLY_PRESETS.includes(preset)
      ? (["dark"] as const)
      : (["light", "dark"] as const)

    for (const mode of modes) {
      test(`${preset} · ${mode}: body text meets WCAG AA`, async ({ page }) => {
        await seedApp(page, { preset, mode })
        await gotoApp(page, "/components/buttons")

        const background = await readToken(page, "--background")
        const foreground = await readToken(page, "--foreground")
        const bgLuminance = hslToLuminance(background)
        const fgLuminance = hslToLuminance(foreground)

        if (bgLuminance === null || fgLuminance === null) {
          throw new Error(
            `expected HSL tokens, got --background: "${background}", --foreground: "${foreground}"`,
          )
        }

        const ratio = contrastRatio(bgLuminance, fgLuminance)
        expect(
          ratio,
          `${preset}/${mode} body contrast ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})

test.describe("reduced motion", () => {
  test("app renders with prefers-reduced-motion", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedApp(page)
    await gotoApp(page, "/components/animation")
    await expect(page.locator("main h1").first()).toBeVisible()
    consoleWatch.assertClean()
  })
})
