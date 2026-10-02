import type { Locator, Page } from "@playwright/test"

export type Rgb = [number, number, number]

/**
 * Wait two frames, then for every finite animation and transition to end.
 * Fixtures paint the light fallback before ThemeProvider applies the seeded
 * theme, and overlays animate in, so a value read before this is a blend of
 * two states.
 */
export async function settle(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect?.getComputedTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    )
  })
}

export function rgbOf(value: string): Rgb {
  const match = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(value)
  if (!match) throw new Error(`expected an rgb() colour, got "${value}"`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The rendered colour of one device pixel. Computed style cannot answer this
 * under glass, where surfaces are translucent over a gradient canvas.
 */
export async function pixel(page: Page, x: number, y: number): Promise<Rgb> {
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } })
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext("2d")
    if (!context) throw new Error("no 2d context")
    context.drawImage(img, 0, 0)
    const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
    return [r, g, b] as Rgb
  }, png.toString("base64"))
}

export function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate(
    (el, name) => getComputedStyle(el).getPropertyValue(name),
    property,
  )
}

/**
 * The lowest contrast each colour reaches against the page painted in `clip`.
 * A 4px blur first averages away the canvas noise layer, and pixels the blur
 * pulled transparent at the edges are skipped; every fourth pixel is read.
 */
export async function minContrastOver(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
  colours: Rgb[],
): Promise<number[]> {
  const png = await page.screenshot({ clip })
  return page.evaluate(
    async ({ b64, colours }) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const context = canvas.getContext("2d")
      if (!context) throw new Error("no 2d context")
      context.filter = "blur(4px)"
      context.drawImage(img, 0, 0)
      const { data } = context.getImageData(0, 0, img.width, img.height)
      const channel = (value: number) => {
        const c = value / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      }
      const luminance = (r: number, g: number, b: number) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      const targets = colours.map(([r, g, b]) => luminance(r, g, b))
      const lowest = targets.map(() => Infinity)
      for (let y = 0; y < img.height; y += 4) {
        for (let x = 0; x < img.width; x += 4) {
          const i = (y * img.width + x) * 4
          if (data[i + 3] !== 255) continue
          const ground = luminance(
            data[i] ?? 0,
            data[i + 1] ?? 0,
            data[i + 2] ?? 0,
          )
          targets.forEach((target, k) => {
            const ratio =
              (Math.max(target, ground) + 0.05) /
              (Math.min(target, ground) + 0.05)
            if (ratio < (lowest[k] ?? Infinity)) lowest[k] = ratio
          })
        }
      }
      return lowest
    },
    { b64: png.toString("base64"), colours },
  )
}
