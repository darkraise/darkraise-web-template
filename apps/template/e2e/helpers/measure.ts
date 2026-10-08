import type { Locator, Page } from "@playwright/test"

export type Rgb = [number, number, number]

const SETTLE_TIMEOUT = 5_000

/**
 * Wait until no finite animation or transition has been running for two
 * consecutive frames. Fixtures paint the light fallback before ThemeProvider
 * applies the seeded theme, and overlays animate in, so a value read before
 * this is a blend of two states. The set is read again every frame because a
 * transition retargeted mid-flight is cancelled and replaced by a new one.
 * Paused, finished and infinite animations never end on their own, so they
 * are ignored. So are animations shorter than a millisecond, which is what
 * the reduced-motion rule makes of every transition: one ends in the frame
 * it starts in, and Chromium can leave one pending without a start time
 * indefinitely, which would hold this wait to its deadline.
 */
export async function settle(page: Page) {
  const running = await page.evaluate(async (timeout) => {
    const busy = () =>
      document.getAnimations().filter((animation) => {
        const timing = animation.effect?.getComputedTiming()
        return (
          timing !== undefined &&
          timing.iterations !== Infinity &&
          Number(timing.activeDuration) >= 1 &&
          (animation.playState === "running" || animation.pending)
        )
      })
    const deadline = performance.now() + timeout
    let quiet = 0
    while (quiet < 2) {
      // A page that stops producing frames would otherwise never reach the
      // deadline check below.
      await new Promise((resolve) => {
        requestAnimationFrame(resolve)
        setTimeout(resolve, 100)
      })
      const animations = busy()
      if (animations.length === 0) {
        quiet += 1
      } else if (performance.now() > deadline) {
        return animations.map((animation) =>
          animation instanceof CSSAnimation
            ? animation.animationName
            : animation instanceof CSSTransition
              ? animation.transitionProperty
              : animation.id,
        )
      } else {
        quiet = 0
      }
    }
    return []
  }, SETTLE_TIMEOUT)
  if (running.length > 0) {
    throw new Error(
      `settle: still running after ${SETTLE_TIMEOUT}ms: ${running.join(", ")}`,
    )
  }
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
export function minContrastOver(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
  colours: Rgb[],
): Promise<number[]> {
  return lowestContrastOver(
    page,
    clip,
    colours.map(([r, g, b]) => [r, g, b, 1]),
  )
}

/** `minContrastOver` for colours with an alpha, each blended over the ground. */
async function lowestContrastOver(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
  colours: [number, number, number, number][],
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
      const lowest = colours.map(() => Infinity)
      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const i = (y * width + x) * 4
          const [gr = 0, gg = 0, gb = 0] = [data[i], data[i + 1], data[i + 2]]
          const ground = luminance(gr, gg, gb)
          colours.forEach(([r, g, b, a], k) => {
            const target = luminance(
              r * a + gr * (1 - a),
              g * a + gg * (1 - a),
              b * a + gb * (1 - a),
            )
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

/** Alpha of a computed colour: an `rgba()` fourth value or a `/ a` part. */
export function alphaOf(value: string): number {
  const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(value)
  if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1)
  const rgba = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/.exec(value)
  if (rgba) return Number(rgba[1])
  return 1
}

/**
 * Contrast of the text colour of an element against what is painted behind
 * it, walking `parentElement`. At the root of a same-origin iframe the walk
 * continues from `frameElement` in the host document: Frame mirrors the host
 * colour scheme, so the frame canvas is transparent and the host paints the
 * ground. Translucent backgrounds are composited over the layers beneath them
 * until an opaque one is reached, and each layer and the text are faded by
 * the opacity of their ancestors. A background image or a backdrop filter
 * cannot be resolved from computed style, so when the walk meets one first
 * the ground is read from one screenshot of the element with its text hidden,
 * and the lowest contrast over it is returned. Colours are read back through
 * a canvas, so every computed syntax (`rgb()`, `color(srgb …)` from
 * `color-mix()`, `oklab()`) resolves to sRGB.
 */
export async function textContrast(locator: Locator): Promise<number> {
  const result = await locator.evaluate((el) => {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) throw new Error("no 2d context")
    const rgba = (value: string): [number, number, number, number] => {
      context.clearRect(0, 0, 1, 1)
      // An unparsable value leaves fillStyle unchanged, so a sentinel tells
      // a rejected colour from an accepted one.
      context.fillStyle = "#010203"
      context.fillStyle = value
      if (context.fillStyle === "#010203" && value.trim() !== "#010203") {
        throw new Error(`the canvas could not parse the colour "${value}"`)
      }
      context.fillRect(0, 0, 1, 1)
      const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data
      return [r, g, b, a / 255]
    }
    const styleOf = (node: Element) =>
      (node.ownerDocument.defaultView ?? window).getComputedStyle(node)
    const parentOf = (node: Element) =>
      node.parentElement ?? node.ownerDocument.defaultView?.frameElement ?? null
    const opacityOf = (node: Element) => {
      let opacity = 1
      for (let n: Element | null = node; n; n = parentOf(n)) {
        opacity *= Number(styleOf(n).opacity)
      }
      return opacity
    }

    const [tr, tg, tb, ta] = rgba(styleOf(el).color)
    const text: [number, number, number, number] = [
      tr,
      tg,
      tb,
      ta * opacityOf(el),
    ]
    const layers: [number, number, number, number][] = []
    let ground: [number, number, number] = [255, 255, 255]
    for (let node: Element | null = el; node; node = parentOf(node)) {
      const style = styleOf(node)
      if (
        style.backgroundImage !== "none" ||
        (style.backdropFilter !== "" && style.backdropFilter !== "none")
      ) {
        return { kind: "pixels" as const, text }
      }
      const [r, g, b, a] = rgba(style.backgroundColor)
      const alpha = a * opacityOf(node)
      if (alpha >= 1) {
        ground = [r, g, b]
        break
      }
      if (alpha > 0) layers.push([r, g, b, alpha])
    }
    const over = (
      [r, g, b, a]: [number, number, number, number],
      [br, bg, bb]: [number, number, number],
    ): [number, number, number] => [
      Math.round(r * a + br * (1 - a)),
      Math.round(g * a + bg * (1 - a)),
      Math.round(b * a + bb * (1 - a)),
    ]
    for (const layer of layers.reverse()) ground = over(layer, ground)
    return {
      kind: "computed" as const,
      color: over(text, ground) as Rgb,
      background: ground as Rgb,
    }
  })
  if (result.kind === "computed") {
    return contrast(result.color, result.background)
  }

  const attribute = "data-e2e-text-hidden"
  await locator.scrollIntoViewIfNeeded()
  // Transitions are held off while the text is hidden and while it comes
  // back, or the restored colour would fade in and the next reading with it.
  await locator.evaluate((el, name) => {
    const style = el.ownerDocument.createElement("style")
    style.id = name
    style.textContent = `[${name}], [${name}] * { transition: none !important }
      [${name}="hidden"], [${name}="hidden"] * {
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
        text-shadow: none !important;
        text-decoration-color: transparent !important;
      }`
    el.ownerDocument.head.append(style)
    el.setAttribute(name, "hidden")
  }, attribute)
  try {
    const box = await locator.boundingBox()
    if (!box) throw new Error("textContrast: the element has no box")
    const [lowest = 0] = await lowestContrastOver(locator.page(), box, [
      result.text,
    ])
    return lowest
  } finally {
    await locator.evaluate((el, name) => {
      el.setAttribute(name, "shown")
      // Layout flushes the restored colour while transitions are still off.
      el.getBoundingClientRect()
      el.removeAttribute(name)
      el.ownerDocument.getElementById(name)?.remove()
    }, attribute)
  }
}
