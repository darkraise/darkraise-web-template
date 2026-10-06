import { test, expect, type Frame, type Page } from "@playwright/test"
import { boxOf, gotoApp, seedApp } from "./helpers/app"
import {
  computed,
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

async function cardFill(page: Page, level: string): Promise<Rgb> {
  const box = await boxOf(
    page.locator(`[data-card-elevation="${level}"]`).first(),
  )
  return pixel(
    page,
    // The next sibling card's outer shadow paints over this card's right
    // edge; earlier siblings' shadows sit beneath it, so sample the left.
    Math.round(box.x + 20),
    Math.round(box.y + box.height - 6),
  )
}

test.describe("dark elevation", () => {
  for (const style of ["quiet", "tactile"] as const) {
    test(`${style} dark cards step lighter with each level`, async ({
      page,
    }) => {
      await seedApp(page, { style, mode: "dark" })
      await gotoApp(page, "/components/kitchen-sink")
      const first = page.locator('[data-card-elevation="auto"]').first()
      await first.scrollIntoViewIfNeeded()
      await settle(page)
      const firstBox = await boxOf(first)
      const pageFill = await pixel(
        page,
        Math.round(firstBox.x - 8),
        Math.round(firstBox.y + firstBox.height / 2),
      )
      const fills = []
      for (const level of ["flat", "low", "medium", "high"]) {
        fills.push(await cardFill(page, level))
      }
      for (let i = 1; i < fills.length; i++) {
        const [a, b] = [fills[i - 1] as Rgb, fills[i] as Rgb]
        expect(luminance(b)).toBeGreaterThan(luminance(a))
        expect(contrast(a, b)).toBeGreaterThanOrEqual(1.04)
      }
      expect(contrast(fills[3] as Rgb, pageFill)).toBeGreaterThanOrEqual(1.3)
    })
  }

  test("light cards keep one fill at every level", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await gotoApp(page, "/components/kitchen-sink")
    await page
      .locator('[data-card-elevation="auto"]')
      .first()
      .scrollIntoViewIfNeeded()
    await settle(page)
    const fills = []
    for (const level of ["flat", "low", "medium", "high"]) {
      fills.push((await cardFill(page, level)).join(","))
    }
    expect(new Set(fills).size).toBe(1)
  })

  test("a dark popover is lighter than its own fill", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "dark" })
    await gotoApp(page, "/components/popover")
    await page.getByRole("button", { name: "Open Popover" }).first().click()
    const content = page.locator(".dr-popover-content").first()
    await expect(content).toBeVisible()
    await settle(page)
    const fill = rgbOf(
      await content.evaluate((el) => getComputedStyle(el).backgroundColor),
    )
    const box = await boxOf(content)
    const painted = await pixel(
      page,
      Math.round(box.x + box.width - 6),
      Math.round(box.y + box.height - 6),
    )
    expect(luminance(painted)).toBeGreaterThan(luminance(fill))
  })
})

function isAllTransparent(shadow: string): boolean {
  return shadow
    .split(/,(?![^(]*\))/)
    .every((layer) =>
      /rgba\(0, 0, 0, 0\)|transparent|^none$/.test(layer.trim()),
    )
}

test.describe("tactile surfaces", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`tactile ${mode} raises cards and recesses tab tracks`, async ({
      page,
    }) => {
      await seedApp(page, { style: "tactile", mode })
      await gotoApp(page, "/components/kitchen-sink")
      const card = page.locator(".dr-card:not([data-card-elevation])").first()
      const track = page
        .locator('.dr-tabs-list[data-variant="default"]')
        .first()
      expect(isAllTransparent(await computed(card, "box-shadow"))).toBe(false)
      expect(await computed(track, "box-shadow")).toContain("inset")
    })

    test(`quiet ${mode} keeps flat cards and tracks`, async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await gotoApp(page, "/components/kitchen-sink")
      const card = page.locator(".dr-card:not([data-card-elevation])").first()
      const track = page
        .locator('.dr-tabs-list[data-variant="default"]')
        .first()
      expect(isAllTransparent(await computed(card, "box-shadow"))).toBe(true)
      expect(isAllTransparent(await computed(track, "box-shadow"))).toBe(true)
    })
  }

  test("muted text on the brightest tactile dark card stays at 4.5:1", async ({
    page,
  }) => {
    await seedApp(page, { style: "tactile", mode: "dark" })
    await gotoApp(page, "/components/kitchen-sink")
    const text = page
      .locator('[data-card-elevation="high"] .text-muted-foreground')
      .first()
    await text.scrollIntoViewIfNeeded()
    await settle(page)
    const colour = rgbOf(await computed(text, "color"))
    const box = await boxOf(text)
    const behind = await pixel(
      page,
      Math.round(box.x + box.width + 4),
      Math.round(box.y + box.height / 2),
    )
    expect(contrast(colour, behind)).toBeGreaterThanOrEqual(4.5)
  })
})

test.describe("glass light chrome", () => {
  test("the canvas shows through the rail and bar", async ({ page }) => {
    await seedApp(page, { style: "glass", mode: "light", accent: "blue" })
    await gotoApp(page, "/")
    await settle(page)
    const rail = await boxOf(page.locator(".dr-sidebar-layout-aside").first())
    const bar = await boxOf(page.locator("header").first())
    const samples: Rgb[] = []
    for (const x of [rail.x + 5, rail.x + rail.width - 6]) {
      for (
        let y = bar.y + bar.height + 4;
        y < rail.y + rail.height - 4;
        y += 8
      ) {
        samples.push(await pixel(page, Math.round(x), Math.round(y)))
      }
    }
    for (let x = rail.x + rail.width + 4; x < bar.x + bar.width - 4; x += 20) {
      samples.push(await pixel(page, Math.round(x), Math.round(bar.y + 3)))
    }
    const lums = samples.map(luminance)
    const range = (Math.max(...lums) + 0.05) / (Math.min(...lums) + 0.05)
    expect(range).toBeGreaterThanOrEqual(1.18)
  })

  for (const accent of ["blue", "violet", "green", "neutral"] as const) {
    test(`sidebar labels read on the ${accent} canvas`, async ({ page }) => {
      await seedApp(page, { style: "glass", mode: "light", accent })
      await gotoApp(page, "/")
      await settle(page)
      for (const label of await page.locator(".dr-sidebar-nav-label").all()) {
        if (!(await label.isVisible())) continue
        const colour = rgbOf(await computed(label, "color"))
        // The nav scrolls inside its aside and pixel() can only read inside
        // the viewport; the accent blobs are fixed, so this is what a user sees.
        await label.scrollIntoViewIfNeeded()
        const box = await boxOf(label)
        const behind = await pixel(
          page,
          Math.round(box.x + box.width + 3),
          Math.round(box.y + box.height / 2),
        )
        expect(contrast(colour, behind)).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  test("high contrast keeps the chrome solid", async ({ page }) => {
    await page.emulateMedia({ contrast: "more" })
    await seedApp(page, { style: "glass", mode: "light", accent: "blue" })
    await gotoApp(page, "/")
    const canvas = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--chrome-canvas")
        .trim(),
    )
    expect(canvas).toBe("none")
  })
})
