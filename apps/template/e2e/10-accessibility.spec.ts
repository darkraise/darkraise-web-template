import { test, expect, type Locator, type Page } from "@playwright/test"
import { MATRIX_STYLES } from "./fixtures/theme"
import { gotoApp, readToken, seedApp, watchConsole } from "./helpers/app"
import { settle, textContrast } from "./helpers/measure"

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
  const [r = 0, g = 0, b = 0] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: number, b: number) {
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

async function tabUntilFocused(page: Page, target: Locator, limit = 150) {
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab")
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error(`Tab did not reach the target in ${limit} presses`)
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
    await expect(page.locator("#main-content")).toBeFocused()
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
    await page
      .locator("main [data-showcase-example]")
      .filter({
        has: page.getByText("Basic menu with sections", { exact: true }),
      })
      .getByRole("button")
      .first()
      .click()
    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    const items = menu.getByRole("menuitem")

    await page.keyboard.press("ArrowDown")
    await expect(items.nth(0)).toBeFocused()
    await expect(items.nth(0)).toHaveText("Profile")
    await page.keyboard.press("ArrowDown")
    await expect(items.nth(1)).toBeFocused()
    await expect(items.nth(1)).toHaveText("Billing")
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
    await seedApp(page, { style: "quiet", mode: "light" })
    await gotoApp(page, "/")
    const trigger = page.getByRole("button", { name: "Customize theme" })
    await tabUntilFocused(page, trigger)
    await page.keyboard.press("Enter")
    const panel = page.locator('[aria-label="Theme settings"]')
    await expect(panel).toBeVisible()

    const mode = panel.locator('[aria-label="Mode"]')
    const light = mode.getByRole("radio", { name: "Light" })
    const dark = mode.getByRole("radio", { name: "Dark" })
    await tabUntilFocused(page, light)
    await page.keyboard.press("ArrowRight")
    await expect(dark).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(dark).toHaveAttribute("aria-checked", "true")
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
    // Hidden buttons, such as the phone drawer trigger at this width, are out
    // of the accessibility tree and have no name to check.
    const buttons = page.locator("header button:visible")
    await expect.poll(() => buttons.count()).toBeGreaterThanOrEqual(5)
    for (const button of await buttons.all()) {
      await expect(button).toHaveAccessibleName(/\S/)
    }
  })

  test("form inputs on the fields showcase are labelled", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/components/form-fields")
    // Component-internal proxy inputs are aria-hidden, and an editable in
    // preview hides its input; neither is in the accessibility tree, so
    // neither needs a label of its own.
    const inputs = page.locator(
      'main input:not([type=hidden]):not([aria-hidden="true"]):visible',
    )
    await expect.poll(() => inputs.count()).toBeGreaterThanOrEqual(2)
    for (const input of await inputs.all()) {
      await expect(input).toHaveAccessibleName(/\S/)
      // A placeholder is only the accessible name of last resort, not a label.
      const placeholder = await input.getAttribute("placeholder")
      if (placeholder) await expect(input).not.toHaveAccessibleName(placeholder)
    }
  })
})

test.describe("colour contrast of core tokens", () => {
  for (const style of MATRIX_STYLES) {
    const modes = ["light", "dark"] as const

    for (const mode of modes) {
      test(`${style} · ${mode}: body text meets WCAG AA`, async ({ page }) => {
        await seedApp(page, { style, mode })
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
          `${style}/${mode} body contrast ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})

test.describe("colour contrast of template text", () => {
  const AUTH_LINKS = [
    ["/login", "Sign up"],
    ["/register", "Sign in"],
    ["/forgot-password", "Back to sign in"],
  ] as const

  for (const mode of ["light", "dark"] as const) {
    for (const [path, name] of AUTH_LINKS) {
      test(`${mode}: the "${name}" link on ${path} meets 4.5:1`, async ({
        page,
      }) => {
        await seedApp(page, { mode }, { authenticated: false })
        await gotoApp(page, path)
        const ratio = await textContrast(page.getByRole("link", { name }))
        expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      })
    }

    test(`${mode}: the destructive alert-dialog action paints like a destructive button`, async ({
      page,
    }) => {
      await seedApp(page, { mode })
      await gotoApp(page, "/components/alert-dialog")
      const paint = (el: Element) => {
        const style = getComputedStyle(el)
        return [style.color, style.backgroundColor]
      }
      const trigger = page
        .getByRole("button", { name: "Delete Account" })
        .first()
      const expected = await trigger.evaluate(paint)
      await trigger.click()
      const action = page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Delete Account" })
      expect(await action.evaluate(paint)).toEqual(expected)
      // The dialog fades in, and textContrast composites its opacity.
      await settle(page)
      expect(await textContrast(action)).toBeGreaterThanOrEqual(4.5)
    })
  }
})

test.describe("reduced motion", () => {
  test("app renders with prefers-reduced-motion", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedApp(page)
    await gotoApp(page, "/components/animation")
    await expect(page.locator("main h1").first()).toBeVisible()
    // Computed durations, not getAnimations(): the reduced-motion rule
    // finishes every animation within a frame, so an empty animation list
    // would pass whether or not the rule applied.
    const animated = await page.locator("main *").evaluateAll((elements) =>
      elements
        .map((el) => getComputedStyle(el))
        .filter((style) => style.animationName !== "none")
        .map((style) => ({
          name: style.animationName,
          durations: [
            ...style.animationDuration.split(","),
            ...style.transitionDuration.split(","),
          ].map(
            (value) =>
              parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000),
          ),
        })),
    )
    expect(animated.length).toBeGreaterThanOrEqual(17)
    const slow = animated.filter(({ durations }) =>
      durations.some((ms) => ms > 0.01),
    )
    expect(slow).toEqual([])
    consoleWatch.assertClean()
  })
})
