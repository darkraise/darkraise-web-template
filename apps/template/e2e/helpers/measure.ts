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
 * A 4px blur first averages away the canvas noise layer. The image is padded
 * with its own edge pixels so the blur does not fade the outermost rows, which
 * are the strip's loudest, toward transparent; every fourth pixel is read.
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
      const { width, height } = img
      const pad = 16
      const padded = document.createElement("canvas")
      padded.width = width + 2 * pad
      padded.height = height + 2 * pad
      const source = padded.getContext("2d")
      if (!source) throw new Error("no 2d context")
      source.drawImage(img, pad, pad)
      source.drawImage(img, 0, 0, width, 1, pad, 0, width, pad)
      source.drawImage(
        img,
        0,
        height - 1,
        width,
        1,
        pad,
        height + pad,
        width,
        pad,
      )
      source.drawImage(img, 0, 0, 1, height, 0, pad, pad, height)
      source.drawImage(
        img,
        width - 1,
        0,
        1,
        height,
        width + pad,
        pad,
        pad,
        height,
      )
      source.drawImage(img, 0, 0, 1, 1, 0, 0, pad, pad)
      source.drawImage(img, width - 1, 0, 1, 1, width + pad, 0, pad, pad)
      source.drawImage(img, 0, height - 1, 1, 1, 0, height + pad, pad, pad)
      source.drawImage(
        img,
        width - 1,
        height - 1,
        1,
        1,
        width + pad,
        height + pad,
        pad,
        pad,
      )
      const canvas = document.createElement("canvas")
      canvas.width = padded.width
      canvas.height = padded.height
      const context = canvas.getContext("2d")
      if (!context) throw new Error("no 2d context")
      context.filter = "blur(4px)"
      context.drawImage(padded, 0, 0)
      const { data } = context.getImageData(pad, pad, width, height)
      const channel = (value: number) => {
        const c = value / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      }
      const luminance = (r: number, g: number, b: number) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      const targets = colours.map(([r, g, b]) => luminance(r, g, b))
      const lowest = targets.map(() => Infinity)
      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const i = (y * width + x) * 4
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
