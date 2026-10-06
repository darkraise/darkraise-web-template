import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { pixel, settle, type Rgb } from "./helpers/measure"

/**
 * Kit states and marks under forced colours (Windows High Contrast), read
 * from rendered pixels. Chromium's emulation repaints with the system
 * palette, so a pixel is compared with reference probes painted with the
 * system colours themselves rather than with fixed values.
 */

const FIXTURE = "/e2e/fixtures/forced-colors.html"
const SCHEMES = ["light", "dark"] as const
type Scheme = (typeof SCHEMES)[number]

/** Per-channel tolerance for anti-aliasing and colour conversion. */
const TOLERANCE = 8

async function openForced(page: Page, scheme: Scheme): Promise<void> {
  await seedApp(page, { style: "quiet", mode: scheme })
  await page.emulateMedia({
    forcedColors: "active",
    colorScheme: scheme,
    reducedMotion: "reduce",
  })
  await page.goto(FIXTURE)
  await page.getByTestId("forced-colors").waitFor()
  await expect(page.locator("html")).toHaveAttribute("data-style", "quiet")
  await page.mouse.move(0, 0)
  await settle(page)
}

/** The rendered pixel at (dx, dy) from the element's top-left corner. */
async function pixelIn(
  page: Page,
  locator: Locator,
  dx: number,
  dy: number,
): Promise<Rgb> {
  await locator.scrollIntoViewIfNeeded()
  const box = await boxOf(locator)
  return pixel(page, Math.floor(box.x + dx), Math.floor(box.y + dy))
}

/** The rendered pixel at the centre of the element's box. */
async function centrePixel(page: Page, locator: Locator): Promise<Rgb> {
  const box = await boxOf(locator)
  return pixelIn(page, locator, box.width / 2, box.height / 2)
}

/** A system colour as painted, read from its reference probe. */
function refColour(page: Page, name: "highlight" | "canvas"): Promise<Rgb> {
  return centrePixel(page, page.locator(`[data-probe="ref-${name}"]`))
}

function near(actual: Rgb, expected: Rgb): boolean {
  return actual.every(
    (channel, i) => Math.abs(channel - (expected[i] ?? 0)) <= TOLERANCE,
  )
}

test.describe("fixture", () => {
  for (const scheme of SCHEMES) {
    test(`paints distinct reference colours · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      expect(
        await page.evaluate(
          () => matchMedia("(forced-colors: active)").matches,
        ),
      ).toBe(true)
      const highlight = await refColour(page, "highlight")
      const canvas = await refColour(page, "canvas")
      expect(near(highlight, canvas), `${highlight} vs ${canvas}`).toBe(false)
    })
  }
})
