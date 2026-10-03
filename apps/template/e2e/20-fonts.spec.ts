import { test, expect } from "@playwright/test"
import {
  gotoApp,
  openThemeSwitcher,
  readThemeAttrs,
  seedApp,
  themeSwitcher,
} from "./helpers/app"

// The products and hover-card routes load third-party demo images; this one
// loads none, so any foreign request is the kit's or the shell's.
const PROBE = "/components/buttons"

test.describe("kit fonts", () => {
  test("Geist loads from the app's own origin", async ({ page, baseURL }) => {
    const origin = new URL(baseURL ?? "http://localhost:5176").origin
    const foreign: string[] = []
    page.on("request", (request) => {
      const url = new URL(request.url())
      if (url.protocol === "data:" || url.protocol === "blob:") return
      if (url.origin !== origin) foreign.push(url.href)
    })

    await seedApp(page, { preset: "default", mode: "light" })
    await gotoApp(page, PROBE)

    const bodyFont = () =>
      page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(await bodyFont()).toMatch(/^"Inter Variable"/)

    const geistFile = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.origin === origin && /\/geist-[\w-]+\.woff2$/.test(url.pathname)
      )
    })
    await openThemeSwitcher(page)
    await themeSwitcher(page)
      .getByRole("radiogroup", { name: "Font", exact: true })
      .getByRole("radio", { name: "Geist", exact: true })
      .click()
    await expect
      .poll(async () => (await readThemeAttrs(page))["data-font"])
      .toBe("geist")

    expect((await geistFile).status()).toBe(200)
    await expect.poll(bodyFont).toMatch(/^"Geist Variable"/)
    expect(
      await page.evaluate(async () => {
        await document.fonts.ready
        return document.fonts.check('1em "Geist Variable"')
      }),
    ).toBe(true)
    // check() also answers true when no face of that name is declared at all,
    // so confirm a declared Geist face actually finished loading.
    expect(
      await page.evaluate(() =>
        [...document.fonts].some(
          (face) =>
            face.family.replace(/"/g, "") === "Geist Variable" &&
            face.status === "loaded",
        ),
      ),
    ).toBe(true)

    expect(foreign).toEqual([])
  })
})
