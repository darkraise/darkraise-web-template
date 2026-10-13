import { test, expect, type Page } from "@playwright/test"
import {
  applyTheme,
  gotoApp,
  openThemeSwitcher,
  readThemeAttrs,
  readToken,
  reloadApp,
  seedApp,
  themeSwitcher,
} from "./helpers/app"

// Set to a `vite preview` origin to run these checks against a production
// build instead of the dev server.
const previewUrl = process.env.E2E_PREVIEW_URL
if (previewUrl) test.use({ baseURL: previewUrl })

// The app's own scripts: the dev server's entry module or a build's chunks.
// With them blocked, only the document's injected stylesheet and pre-render
// script (and, in a build, the kit stylesheet link) can paint.
const APP_SCRIPTS = /\/src\/main\.tsx|\/assets\/[^/]+\.js$/

/**
 * The value `value` computes to as a custom property just below <html>. The
 * browser substitutes var() the same way there as on <html>, so the result
 * compares exactly with a token read from <html>.
 */
async function computedAs(page: Page, value: string) {
  return page.evaluate((declared) => {
    const probe = document.createElement("div")
    probe.style.setProperty("--probe", declared)
    document.documentElement.append(probe)
    const computed = getComputedStyle(probe).getPropertyValue("--probe").trim()
    probe.remove()
    return computed
  }, value)
}

// The kit's fallback rules match either media feature. Playwright's
// emulateMedia has no reduced-transparency option, so that one goes through
// the DevTools protocol, which Chromium supports.
const FALLBACK_MEDIA: ReadonlyArray<{
  name: string
  emulate: (page: Page, on: boolean) => Promise<void>
}> = [
  {
    name: "more contrast",
    emulate: (page, on) =>
      page.emulateMedia({ contrast: on ? "more" : "no-preference" }),
  },
  {
    name: "reduced transparency",
    emulate: async (page, on) => {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [
          {
            name: "prefers-reduced-transparency",
            value: on ? "reduce" : "no-preference",
          },
        ],
      })
    },
  },
]

/** Loads `path` once with the app, so the token cache holds the painted colours, then reloads it without the app. */
async function loadWithoutApp(page: Page, path: string) {
  await gotoApp(page, path)
  await page.route(APP_SCRIPTS, (route) => route.abort())
  await page.reload()
  await expect(page.locator("#root .app-loading")).toHaveCount(1)
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--primary"),
    ),
  ).not.toBe("")
}

test.describe("example consumer style and preset", () => {
  test("paint the example style and what it inherits from Glass before the app runs", async ({
    page,
  }) => {
    await seedApp(page, {
      style: "glass-ink",
      mode: "light",
      glassTransparency: "strong",
    })
    await loadWithoutApp(page, "/")
    const attrs = await readThemeAttrs(page)
    expect(attrs["data-style"]).toBe("glass-ink")
    expect(attrs["data-preset"]).toBe("base")
    expect(attrs["data-glass-transparency"]).toBe("strong")
    expect(attrs["data-background-style"]).toBe("gradient")

    const line = await readToken(page, "--glass-ink-line")
    expect(line).toContain("color-mix")
    expect(await readToken(page, "--chrome-edge")).toBe(line)
    expect(await readToken(page, "--surface-overlay-base")).toBe(
      await computedAs(page, "hsl(var(--popover) / 0.62)"),
    )
  })

  test("paint a stored preset before the app runs, under a user's own value", async ({
    page,
  }) => {
    await seedApp(page, { style: "glass-ink", mode: "dark" })
    await page.addInitScript(() => {
      if (localStorage.getItem("theme-preset") === null) {
        localStorage.setItem("theme-preset", "ink-night")
      }
    })
    await loadWithoutApp(page, "/")
    const attrs = await readThemeAttrs(page)
    expect(attrs["data-style"]).toBe("glass-ink")
    expect(attrs["data-preset"]).toBe("ink-night")
    expect(attrs["data-accent"]).toBe("indigo")
    expect(attrs["data-glass-transparency"]).toBe("strong")
    expect(attrs["data-radius"]).toBe("sharp")
    expect(await readToken(page, "--glass-ink-line")).toBe(
      await computedAs(
        page,
        "color-mix(in oklab, hsl(var(--primary-5)) 70%, transparent)",
      ),
    )
    expect(await readToken(page, "--card-edge")).toBe(
      await computedAs(page, "0 0 0 1px var(--glass-ink-line)"),
    )

    await page.evaluate(() => localStorage.setItem("theme-radius", "pill"))
    await page.reload()
    await expect(page.locator("html")).toHaveAttribute("data-radius", "pill")
    await expect(page.locator("html")).toHaveAttribute(
      "data-preset",
      "ink-night",
    )
  })

  test("switch to the example style and back through the Style control", async ({
    page,
  }) => {
    await seedApp(page, { style: "glass", mode: "light" })
    await gotoApp(page, "/")
    await openThemeSwitcher(page)
    const style = themeSwitcher(page).locator('[aria-label="Style"]')

    await style.getByRole("radio", { name: "Glass ink", exact: true }).click()
    await expect
      .poll(async () => (await readThemeAttrs(page))["data-style"])
      .toBe("glass-ink")
    expect((await readThemeAttrs(page))["data-preset"]).toBe("base")
    expect(await page.evaluate(() => localStorage.getItem("theme-style"))).toBe(
      "glass-ink",
    )
    const line = await readToken(page, "--glass-ink-line")
    expect(line).toContain("color-mix")
    expect(await readToken(page, "--chrome-edge")).toBe(line)

    await style.getByRole("radio", { name: "Glass", exact: true }).click()
    await expect
      .poll(async () => (await readThemeAttrs(page))["data-style"])
      .toBe("glass")
    expect(await readToken(page, "--glass-ink-line")).toBe("")
    expect(await readToken(page, "--chrome-edge")).toBe(
      await computedAs(page, "hsl(var(--sidebar-border))"),
    )
  })

  for (const media of FALLBACK_MEDIA) {
    test(`apply the fallbacks of Glass and of the example style under ${media.name}`, async ({
      page,
    }) => {
      await media.emulate(page, true)
      await seedApp(page, { style: "glass", mode: "light" })
      await gotoApp(page, "/")
      expect(await readToken(page, "--chrome-edge")).toBe(
        await computedAs(page, "hsl(var(--sidebar-border))"),
      )
      expect(await readToken(page, "--chrome-backdrop")).toBe("none")
      expect(await readToken(page, "--surface-overlay-base")).toBe(
        await computedAs(page, "hsl(var(--popover))"),
      )

      await applyTheme(page, { style: "glass-ink" })
      await reloadApp(page)
      expect((await readThemeAttrs(page))["data-style"]).toBe("glass-ink")
      expect(await readToken(page, "--chrome-edge")).toBe(
        await computedAs(page, "hsl(var(--primary-8))"),
      )
      expect(await readToken(page, "--chrome-backdrop")).toBe("none")
      expect(await readToken(page, "--surface-overlay-base")).toBe(
        await computedAs(page, "hsl(var(--popover))"),
      )

      await media.emulate(page, false)
      expect(await readToken(page, "--chrome-edge")).toBe(
        await readToken(page, "--glass-ink-line"),
      )
    })
  }
})
