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
  const rgb = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(value)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  // Chromium serialises a color-mix() in srgb as color(srgb r g b), channels 0 to 1.
  const srgb =
    /^color\(srgb ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)(?: \/ [\d.]+)?\)$/.exec(
      value,
    )
  const channels = srgb?.slice(1, 4).map(Number)
  if (!channels || channels.some((c) => !(c >= 0 && c <= 1))) {
    throw new Error(`expected an rgb() or color(srgb) colour, got "${value}"`)
  }
  return channels.map((c) => Math.round(c * 255)) as Rgb
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

/** A rectangle in viewport CSS pixels, as `boundingBox()` reports one. */
export interface Region {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Sample positions along one axis of a region: its centre when the region
 * is 4px or thinner (a hairline, a tick, a 2px bar), else the quarter, half
 * and three-quarter points, which stay inside a round mark's circle and
 * clear of its anti-aliased rim.
 */
function samplePoints(start: number, size: number): number[] {
  const fractions = size <= 4 ? [0.5] : [0.25, 0.5, 0.75]
  return fractions.map((fraction) => Math.floor(start + size * fraction))
}

/**
 * The lowest contrast between a non-text mark's painted pixels and the
 * colour beside it (WCAG 1.4.11 asks 3:1): a thumb against its track, a tick
 * against the ground, a pseudo-element bar against the list, a lamp against
 * its slot. `mark` and `beside` are each a locator, read through its
 * bounding box, or a region the caller computed, which is how a mark drawn
 * by a pseudo-element or a part of a box is named. Both are sampled on a
 * grid (see `samplePoints`) from one screenshot, and every mark sample is
 * compared with every beside sample, so a gradient or a sheen across either
 * is judged at its weakest point. Both locators are scrolled into view before
 * either box is read; the caller scrolls a region into view. A sample the
 * screenshot cannot hold throws.
 */
export async function markContrast(
  page: Page,
  mark: Locator | Region,
  beside: Locator | Region,
): Promise<number> {
  // Scrolling to the second target can move the first, so no box is read
  // until both are in view.
  for (const target of [mark, beside]) {
    if ("boundingBox" in target) await target.scrollIntoViewIfNeeded()
  }
  const regionOf = async (target: Locator | Region): Promise<Region> => {
    if (!("boundingBox" in target)) return target
    const box = await target.boundingBox()
    if (!box) throw new Error("markContrast: the element has no box")
    return box
  }
  const markRegion = await regionOf(mark)
  const besideRegion = await regionOf(beside)
  const points = (region: Region) =>
    samplePoints(region.y, region.height).flatMap((y) =>
      samplePoints(region.x, region.width).map((x) => ({ x, y })),
    )
  const markPoints = points(markRegion)
  const besidePoints = points(besideRegion)
  const all = [...markPoints, ...besidePoints]
  const left = Math.min(...all.map((point) => point.x))
  const top = Math.min(...all.map((point) => point.y))
  if (left < 0 || top < 0) {
    throw new Error(
      `markContrast: a sample at (${left}, ${top}) is outside the screenshot`,
    )
  }
  const clip = {
    x: left,
    y: top,
    width: Math.max(...all.map((point) => point.x)) - left + 1,
    height: Math.max(...all.map((point) => point.y)) - top + 1,
  }
  const png = await page.screenshot({ clip, scale: "css" })
  const colours = await page.evaluate(
    async ({ b64, width, height, offsets }) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d")
      if (!context) throw new Error("no 2d context")
      context.drawImage(img, 0, 0)
      const { data } = context.getImageData(0, 0, width, height)
      return offsets.map(({ x, y }) => {
        // A clip past the viewport comes back trimmed; reading past the
        // image would report black.
        if (x >= img.width || y >= img.height) {
          throw new Error(
            `markContrast: a sample at (${x}, ${y}) is outside the ${img.width}x${img.height} screenshot`,
          )
        }
        const i = (y * width + x) * 4
        return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0] as Rgb
      })
    },
    {
      b64: png.toString("base64"),
      width: clip.width,
      height: clip.height,
      offsets: all.map(({ x, y }) => ({ x: x - left, y: y - top })),
    },
  )
  const markColours = colours.slice(0, markPoints.length)
  const besideColours = colours.slice(markPoints.length)
  return Math.min(
    ...markColours.flatMap((ink) =>
      besideColours.map((ground) => contrast(ink, ground)),
    ),
  )
}

export function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate(
    (el, name) => getComputedStyle(el).getPropertyValue(name),
    property,
  )
}

/**
 * The lowest contrast between a control's label colour and every pixel of
 * the face behind its line of text, read with the glyphs hidden. Where a
 * background image paints the face, textContrast samples the whole box,
 * whose rounded corners show the page and whose top row carries the look's
 * edge highlight; the label sits on neither. The line box spans the
 * label's full ascent, so a sheen that crosses any glyph is in it. Hiding
 * the glyphs through their fill keeps a hover wash painted in currentColor,
 * which hiding them through the colour would clear.
 */
export async function labelContrast(
  page: Page,
  face: Locator,
): Promise<number> {
  await face.scrollIntoViewIfNeeded()
  const { band, colour, saved } = await face.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const rect = range.getBoundingClientRect()
    const colour = getComputedStyle(el).color
    const keep = (style: CSSStyleDeclaration, name: string) => ({
      value: style.getPropertyValue(name),
      priority: style.getPropertyPriority(name),
    })
    const icons = [...el.querySelectorAll<SVGElement>("svg")]
    const saved = {
      transition: keep(el.style, "transition"),
      fill: keep(el.style, "-webkit-text-fill-color"),
      icons: icons.map((icon) => keep(icon.style, "visibility")),
    }
    // The glyphs go, not the colour: washes painted in currentColor stay.
    el.style.setProperty("transition", "none", "important")
    el.style.setProperty("-webkit-text-fill-color", "transparent", "important")
    // An icon in the label's line is drawn in the label colour: it is ink,
    // not ground.
    for (const icon of icons) {
      icon.style.setProperty("visibility", "hidden", "important")
    }
    return {
      band: {
        x: Math.ceil(rect.x),
        y: Math.ceil(rect.y),
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      },
      colour,
      saved,
    }
  })
  try {
    const png = await page.screenshot({ clip: band, scale: "css" })
    const ground = await page.evaluate(
      async ({ b64, width, height }) => {
        const img = new Image()
        img.src = `data:image/png;base64,${b64}`
        await img.decode()
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext("2d")
        if (!context) throw new Error("no 2d context")
        context.drawImage(img, 0, 0)
        const { data } = context.getImageData(0, 0, width, height)
        const out: [number, number, number][] = []
        for (let i = 0; i < data.length; i += 4) {
          out.push([data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0])
        }
        return out
      },
      { b64: png.toString("base64"), width: band.width, height: band.height },
    )
    const ink = rgbOf(colour)
    return Math.min(...ground.map((pixel) => contrast(ink, pixel as Rgb)))
  } finally {
    await face.evaluate((el, kept) => {
      const put = (
        style: CSSStyleDeclaration,
        name: string,
        { value, priority }: { value: string; priority: string },
      ) => {
        if (value) style.setProperty(name, value, priority)
        else style.removeProperty(name)
      }
      put(el.style, "-webkit-text-fill-color", kept.fill)
      el.querySelectorAll<SVGElement>("svg").forEach((icon, i) => {
        const was = kept.icons[i]
        if (was) put(icon.style, "visibility", was)
      })
      el.getBoundingClientRect()
      put(el.style, "transition", kept.transition)
    }, saved)
  }
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
 *
 * The walk cannot see a fill a pseudo-element paints, which is how the layout
 * header paints its bar. `ground: "painted"` skips the walk and always reads
 * the ground from the screenshot.
 */
let hiddenTextCalls = 0

export async function textContrast(
  locator: Locator,
  options: { ground?: "painted" } = {},
): Promise<number> {
  const result = await locator.evaluate((el, painted) => {
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
    const chain: Element[] = []
    for (let n: Element | null = el; n; n = parentOf(n)) chain.push(n)
    // Each node is faded by its own opacity times that of every ancestor.
    const opacity = new Map<Element, number>()
    let running = 1
    for (const node of [...chain].reverse()) {
      running *= Number(styleOf(node).opacity)
      opacity.set(node, running)
    }

    const [tr, tg, tb, ta] = rgba(styleOf(el).color)
    const text: [number, number, number, number] = [
      tr,
      tg,
      tb,
      ta * (opacity.get(el) ?? 1),
    ]
    if (painted) return { kind: "pixels" as const, text }
    const layers: [number, number, number, number][] = []
    let ground: [number, number, number] = [255, 255, 255]
    for (const node of chain) {
      const style = styleOf(node)
      if (
        style.backgroundImage !== "none" ||
        (style.backdropFilter !== "" && style.backdropFilter !== "none")
      ) {
        return { kind: "pixels" as const, text }
      }
      const [r, g, b, a] = rgba(style.backgroundColor)
      const alpha = a * (opacity.get(node) ?? 1)
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
  }, options.ground === "painted")
  if (result.kind === "computed") {
    return contrast(result.color, result.background)
  }

  hiddenTextCalls += 1
  const names = {
    attribute: "data-e2e-text-hidden",
    styleId: `data-e2e-text-hidden-${hiddenTextCalls}`,
  }
  await locator.scrollIntoViewIfNeeded()
  // Transitions are held off while the text is hidden and while it comes
  // back, or the restored colour would fade in and the next reading with it.
  await locator.evaluate((el, { attribute, styleId }) => {
    const style = el.ownerDocument.createElement("style")
    style.id = styleId
    style.textContent = `[${attribute}], [${attribute}] * { transition: none !important }
      [${attribute}="hidden"], [${attribute}="hidden"] * {
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
        text-shadow: none !important;
        text-decoration-color: transparent !important;
      }`
    el.ownerDocument.head.append(style)
    el.setAttribute(attribute, "hidden")
  }, names)
  const restore = () =>
    locator.evaluate((el, { attribute, styleId }) => {
      el.setAttribute(attribute, "shown")
      // Layout flushes the restored colour while transitions are still off.
      el.getBoundingClientRect()
      el.removeAttribute(attribute)
      el.ownerDocument.getElementById(styleId)?.remove()
    }, names)
  let lowest: number
  try {
    const box = await locator.boundingBox()
    if (!box) throw new Error("textContrast: the element has no box")
    ;[lowest = 0] = await lowestContrastOver(locator.page(), box, [result.text])
  } catch (error) {
    // The measurement error explains the failure; a restore that fails on
    // the same detached element would only hide it.
    await restore().catch(() => undefined)
    throw error
  }
  await restore()
  return lowest
}
