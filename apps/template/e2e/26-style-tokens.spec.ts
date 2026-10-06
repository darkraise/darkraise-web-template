import { test, expect, type Frame, type Page } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"
import {
  contrast,
  luminance,
  pixel,
  rgbOf,
  settle,
  type Rgb,
} from "./helpers/measure"

/**
 * Style and theme tokens. Each block measures one rule through computed
 * style or rendered pixels, so a regression fails here rather than only in
 * a screenshot diff.
 */

type Clip = { x: number; y: number; width: number; height: number }

async function extremes(page: Page, clip: Clip): Promise<[Rgb, Rgb]> {
  const png = await page.screenshot({ clip })
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("no 2d context")
    context.drawImage(img, 0, 0)
    const data = context.getImageData(0, 0, img.width, img.height).data
    let low: [number, number, number] = [255, 255, 255]
    let high: [number, number, number] = [0, 0, 0]
    for (let i = 0; i < data.length; i += 4) {
      const px: [number, number, number] = [
        data[i] ?? 0,
        data[i + 1] ?? 0,
        data[i + 2] ?? 0,
      ]
      const sum = px[0] + px[1] + px[2]
      if (sum < low[0] + low[1] + low[2]) low = px
      if (sum > high[0] + high[1] + high[2]) high = px
    }
    return [low, high] as [Rgb, Rgb]
  }, png.toString("base64"))
}

test.describe("colour scheme", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`<html> declares color-scheme ${mode}`, async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await gotoApp(page, "/components/kitchen-sink")
      expect(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).colorScheme,
        ),
      ).toBe(mode)
    })
  }

  test("a dark date input paints a light calendar indicator", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "dark" })
    await gotoApp(page, "/components/kitchen-sink")
    await page.evaluate(() => {
      const input = document.createElement("input")
      input.type = "date"
      input.className = "dr-input"
      input.id = "probe-date"
      input.style.width = "220px"
      input.style.color = "transparent"
      document.querySelector("#main-content")?.prepend(input)
    })
    const field = page.locator("#probe-date")
    await field.scrollIntoViewIfNeeded()
    await settle(page)
    const box = await field.boundingBox()
    if (!box) throw new Error("no probe box")
    const clip = {
      x: Math.round(box.x + 4),
      y: Math.round(box.y + 4),
      width: Math.round(box.width - 8),
      height: Math.round(box.height - 8),
    }
    const [low, high] = await extremes(page, clip)
    expect(luminance(high)).toBeGreaterThan(0.25)
    expect(contrast(high, low)).toBeGreaterThanOrEqual(3)
  })
})

test.describe("frame", () => {
  test("dark frame text reads against the card behind it", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "dark" })
    await gotoApp(page, "/components/frame")
    const text = page
      .frameLocator(".dr-frame")
      .first()
      .getByText("Hello inside iframe")
    await expect(text).toBeVisible()
    await settle(page)
    const colour = rgbOf(
      await text.evaluate((el) => getComputedStyle(el).color),
    )
    const box = await text.boundingBox()
    if (!box) throw new Error("no text box")
    const behind = await pixel(
      page,
      Math.round(box.x + box.width + 4),
      Math.round(box.y + box.height / 2),
    )
    expect(contrast(colour, behind)).toBeGreaterThanOrEqual(4.5)
    let inner: Frame | undefined
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue
      if ((await frame.getByText("Hello inside iframe").count()) > 0)
        inner = frame
    }
    if (!inner) throw new Error("no frame holds the Basic demo")
    expect(
      await inner.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme,
      ),
    ).toBe("dark")
  })
})
