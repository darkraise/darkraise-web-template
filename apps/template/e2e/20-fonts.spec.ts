import { test, expect, type Page } from "@playwright/test"
import type { Font } from "./fixtures/theme"
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

/** Every request the page makes outside the app's own origin. */
function foreignRequests(page: Page, origin: string): string[] {
  const foreign: string[] = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.protocol === "data:" || url.protocol === "blob:") return
    if (url.origin !== origin) foreign.push(url.href)
  })
  return foreign
}

const bodyFont = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).fontFamily)

// check() also answers true when no face of that name is declared at all, so
// a declared face of the family has to have finished loading.
const faceLoaded = (page: Page, family: string) =>
  page.evaluate(
    (name) =>
      [...document.fonts].some(
        (face) =>
          face.family.replace(/"/g, "") === name && face.status === "loaded",
      ),
    family,
  )

const SEEDED_FONTS: { font: Font; family: string; file: RegExp }[] = [
  { font: "geist", family: "Geist Variable", file: /\/geist-[\w-]+\.woff2$/ },
  {
    font: "ibm-plex-sans",
    family: "IBM Plex Sans Variable",
    file: /\/ibm-plex-sans-[\w-]+\.woff2$/,
  },
]

test.describe("kit fonts", () => {
  test("Geist loads from the app's own origin", async ({ page, baseURL }) => {
    const origin = new URL(baseURL ?? "http://localhost:5176").origin
    const foreign = foreignRequests(page, origin)

    await seedApp(page, { style: "quiet", mode: "light" })
    await gotoApp(page, PROBE)

    expect(await bodyFont(page)).toMatch(/^"Inter Variable"/)

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
    await expect.poll(() => bodyFont(page)).toMatch(/^"Geist Variable"/)
    expect(
      await page.evaluate(async () => {
        await document.fonts.ready
        return document.fonts.check('1em "Geist Variable"')
      }),
    ).toBe(true)
    expect(await faceLoaded(page, "Geist Variable")).toBe(true)

    expect(foreign).toEqual([])
  })

  for (const { font, family, file } of SEEDED_FONTS) {
    test(`a stored ${font} font renders ${family} from the app's own origin`, async ({
      page,
      baseURL,
    }) => {
      const origin = new URL(baseURL ?? "http://localhost:5176").origin
      const foreign = foreignRequests(page, origin)
      const fontFile = page.waitForResponse((response) => {
        const url = new URL(response.url())
        return url.origin === origin && file.test(url.pathname)
      })

      await seedApp(page, { style: "quiet", mode: "light", font })
      await gotoApp(page, PROBE)

      await expect(page.locator("html")).toHaveAttribute("data-font", font)
      await expect
        .poll(() => bodyFont(page))
        .toMatch(new RegExp(`^"${family}"`))
      expect((await fontFile).status()).toBe(200)
      await expect.poll(() => faceLoaded(page, family)).toBe(true)
      expect(foreign).toEqual([])
    })
  }
})
