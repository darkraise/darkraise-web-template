import { test, expect, type Page } from "@playwright/test"
import { kitLook, seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { markContrast, settle, type Region } from "./helpers/measure"

/**
 * sliderStyle bar, knob and ruled restyle every slider (both orientations,
 * two thumbs, inverted, with step marks, disabled) and every progress bar,
 * indeterminate included. A slider keeps its box and its thumbs and range
 * stay where they were; a progress bar keeps its box except under knob,
 * which makes it 2px taller than the track. Sizes that follow the track
 * read --track-height, so the boxes hold at every density. The parts that
 * show the value keep 3:1 against what is beside them, and a thumb keeps
 * its 24px hit area.
 */

const MODES = ["light", "dark"] as const
const VALUES = ["bar", "knob", "ruled"] as const
type Value = (typeof VALUES)[number]

const SLIDERS = '[data-probe="anatomy-sliders"]'
const PROGRESS = '[data-probe="anatomy-progress"]'
const CASES = [
  "single",
  "range",
  "inverted",
  "steps",
  "disabled",
  "vertical",
  "vertical-range",
] as const
type Case = (typeof CASES)[number]
const VERTICAL: readonly Case[] = ["vertical", "vertical-range"]
const BARS = ["determinate", "indeterminate"] as const
const CLEAR = "rgba(0, 0, 0, 0)"

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

type Side = "top" | "right" | "bottom" | "left"

interface Pseudo extends Rect {
  edges: Record<Side, { width: number; color: string }>
  backgroundImage: string
}

interface Thumb extends Rect {
  background: string
  backgroundImage: string
  borderWidth: number
  borderColor: string
  hit: { width: number; height: number }
  after: Pseudo | null
}

interface SliderReading {
  root: Rect
  ticks: Pseudo | null
  track: Rect & {
    background: string
    overflow: string
    boxShadow: string
    radius: string
  }
  range: Rect & { background: string; boxShadow: string }
  steps: (Rect & { background: string })[]
  thumbs: Thumb[]
}

interface ProgressReading {
  box: Rect & { radius: string; boxShadow: string; background: string }
  content: Rect
  indicator: Rect & { boxShadow: string }
}

interface Reading {
  sliders: Record<Case, SliderReading>
  bars: Record<(typeof BARS)[number], ProgressReading>
}

/** Every slider and progress probe's parts, in viewport pixels. */
async function read(page: Page): Promise<Reading> {
  await page.locator(SLIDERS).scrollIntoViewIfNeeded()
  return page.evaluate(
    ({ sliders, progress, cases, bars }) => {
      const px = (value: string) => parseFloat(value) || 0
      const rectOf = (el: Element) => {
        const { x, y, width, height } = el.getBoundingClientRect()
        return { x, y, width, height }
      }
      const pseudo = (el: Element, which: "::before" | "::after") => {
        const style = getComputedStyle(el, which)
        if (style.content === "none" || style.display === "none") return null
        const host = el.getBoundingClientRect()
        const own = getComputedStyle(el)
        return {
          x:
            host.x +
            px(own.borderLeftWidth) +
            px(style.left) +
            px(style.marginLeft),
          y:
            host.y +
            px(own.borderTopWidth) +
            px(style.top) +
            px(style.marginTop),
          width: px(style.width),
          height: px(style.height),
          edges: Object.fromEntries(
            (["top", "right", "bottom", "left"] as const).map((side) => [
              side,
              {
                width: px(style.getPropertyValue(`border-${side}-width`)),
                color: style.getPropertyValue(`border-${side}-color`),
              },
            ]),
          ) as Record<
            "top" | "right" | "bottom" | "left",
            { width: number; color: string }
          >,
          backgroundImage: style.backgroundImage,
        }
      }
      const one = (scope: ParentNode, selector: string) => {
        const el = scope.querySelector(selector)
        if (!el) throw new Error(`no ${selector}`)
        return el
      }
      const slider = (name: string) => {
        const root = one(
          document,
          `${sliders} [data-case="${name}"] .dr-slider`,
        )
        const track = one(root, ".dr-slider-track")
        const trackStyle = getComputedStyle(track)
        const range = one(root, ".dr-slider-range")
        return {
          root: rectOf(root),
          ticks: pseudo(root, "::before"),
          track: {
            ...rectOf(track),
            background: trackStyle.backgroundColor,
            overflow: trackStyle.overflow,
            boxShadow: trackStyle.boxShadow,
            radius: trackStyle.borderTopLeftRadius,
          },
          range: {
            ...rectOf(range),
            background: getComputedStyle(range).backgroundColor,
            boxShadow: getComputedStyle(range).boxShadow,
          },
          steps: [...root.querySelectorAll(".dr-slider-step")].map((step) => ({
            ...rectOf(step),
            background: getComputedStyle(step).backgroundColor,
          })),
          thumbs: [...root.querySelectorAll(".dr-slider-thumb")].map(
            (thumb) => {
              const style = getComputedStyle(thumb)
              const hit = getComputedStyle(thumb, "::before")
              return {
                ...rectOf(thumb),
                background: style.backgroundColor,
                backgroundImage: style.backgroundImage,
                borderWidth: px(style.borderTopWidth),
                borderColor: style.borderTopColor,
                hit: { width: px(hit.width), height: px(hit.height) },
                after: pseudo(thumb, "::after"),
              }
            },
          ),
        }
      }
      const bar = (name: string) => {
        const box = one(document, `${progress} [data-case="${name}"]`)
        const style = getComputedStyle(box)
        const outer = rectOf(box)
        const indicator = one(box, ".dr-progress-indicator")
        return {
          box: {
            ...outer,
            radius: style.borderTopLeftRadius,
            boxShadow: style.boxShadow,
            background: style.backgroundColor,
          },
          content: {
            x: outer.x + px(style.paddingLeft),
            y: outer.y + px(style.paddingTop),
            width: outer.width - px(style.paddingLeft) - px(style.paddingRight),
            height:
              outer.height - px(style.paddingTop) - px(style.paddingBottom),
          },
          indicator: {
            ...rectOf(indicator),
            boxShadow: getComputedStyle(indicator).boxShadow,
          },
        }
      }
      return {
        sliders: Object.fromEntries(cases.map((name) => [name, slider(name)])),
        bars: Object.fromEntries(bars.map((name) => [name, bar(name)])),
      }
    },
    { sliders: SLIDERS, progress: PROGRESS, cases: CASES, bars: BARS },
  ) as Promise<Reading>
}

/** A CSS colour as the page computes it, e.g. `hsl(var(--primary))`. */
async function colour(page: Page, value: string): Promise<string> {
  return page.evaluate((raw) => {
    const probe = document.createElement("div")
    probe.style.color = raw
    document.body.append(probe)
    const out = getComputedStyle(probe).color
    probe.remove()
    return out
  }, value)
}

async function stamp(page: Page, value?: Value) {
  await kitLook(page, value ? { sliderStyle: value } : {})
  await settle(page)
}

function centre(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

function region(x: number, y: number, width: number, height: number): Region {
  return { x, y, width, height }
}

function slider(reading: Reading, name: Case): SliderReading {
  return reading.sliders[name]
}

function note(description: string) {
  test.info().annotations.push({ type: "contrast", description })
}

/** The kit's --track-height in pixels: the knob and ruled boxes follow it. */
async function trackHeight(page: Page): Promise<number> {
  return page.evaluate(() => {
    const probe = document.createElement("div")
    probe.style.height = "var(--track-height)"
    document.body.append(probe)
    const out = probe.getBoundingClientRect().height
    probe.remove()
    return out
  })
}

async function keepsBoxes(page: Page, value: Value) {
  await stamp(page)
  const before = await read(page)
  await stamp(page, value)
  const after = await read(page)
  for (const name of CASES) {
    const was = slider(before, name)
    const now = slider(after, name)
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(now.root[key], `${name} root ${key}`).toBeCloseTo(was.root[key], 1)
    }
    expect(now.thumbs).toHaveLength(was.thumbs.length)
    now.thumbs.forEach((thumb, i) => {
      const old = was.thumbs[i] as Thumb
      expect(centre(thumb).x, `${name} thumb ${i} x`).toBeCloseTo(
        centre(old).x,
        1,
      )
      expect(centre(thumb).y, `${name} thumb ${i} y`).toBeCloseTo(
        centre(old).y,
        1,
      )
    })
    const [start, size] = VERTICAL.includes(name)
      ? (["y", "height"] as const)
      : (["x", "width"] as const)
    expect(now.range[start], `${name} range start`).toBeCloseTo(
      was.range[start],
      1,
    )
    expect(now.range[size], `${name} range size`).toBeCloseTo(
      was.range[size],
      1,
    )
  }
  for (const name of BARS) {
    const was = before.bars[name].box
    const now = after.bars[name].box
    expect(now.width, `${name} width`).toBeCloseTo(was.width, 1)
    expect(now.height, `${name} height`).toBeCloseTo(
      was.height + (value === "knob" ? 2 : 0),
      1,
    )
  }
}

async function barShape(page: Page) {
  await stamp(page, "bar")
  const reading = await read(page)
  const primary = await colour(page, "hsl(var(--primary))")
  for (const name of CASES) {
    const { track, thumbs } = slider(reading, name)
    expect(track.radius, `${name} track radius`).toBe("0px")
    for (const thumb of thumbs) {
      const [w, h] = VERTICAL.includes(name) ? [18, 6] : [6, 18]
      expect([thumb.width, thumb.height], `${name} thumb`).toEqual([w, h])
      expect(thumb.borderWidth).toBe(3)
      expect(thumb.borderColor).toBe(primary)
      expect(thumb.background).toBe(CLEAR)
      expect(thumb.hit).toEqual({ width: 24, height: 24 })
      expect(thumb.after).toBeNull()
    }
  }
  for (const name of BARS) {
    expect(reading.bars[name].box.radius, name).toBe("0px")
  }
}

async function knobShape(page: Page) {
  await stamp(page, "knob")
  const reading = await read(page)
  const primary = await colour(page, "hsl(var(--primary))")
  const trackPx = await trackHeight(page)
  for (const name of CASES) {
    const { track, thumbs } = slider(reading, name)
    const thickness = VERTICAL.includes(name) ? track.width : track.height
    expect(thickness, `${name} track`).toBe(trackPx)
    expect(track.boxShadow, `${name} recess`).toContain("inset")
    for (const thumb of thumbs) {
      expect([thumb.width, thumb.height], `${name} thumb`).toEqual([22, 22])
      expect(thumb.backgroundImage).toContain("radial-gradient")
      expect(thumb.hit).toEqual({ width: 24, height: 24 })
      const dot = thumb.after
      expect(dot, `${name} dot`).not.toBeNull()
      if (!dot) continue
      expect([dot.width, dot.height]).toEqual([8, 8])
      const ring = { width: 4, color: primary }
      expect(dot.edges).toEqual({
        top: ring,
        right: ring,
        bottom: ring,
        left: ring,
      })
      expect(centre(dot).x).toBeCloseTo(centre(thumb).x, 1)
      expect(centre(dot).y).toBeCloseTo(centre(thumb).y, 1)
    }
  }
  for (const name of BARS) {
    const { box } = reading.bars[name]
    expect(box.height, name).toBe(trackPx + 2)
    expect(box.boxShadow, name).toContain("inset")
  }
}

async function ruledShape(page: Page) {
  await stamp(page, "ruled")
  const reading = await read(page)
  const primary = await colour(page, "hsl(var(--primary))")
  const strong = await colour(page, "hsl(var(--border-strong))")
  const trackPx = await trackHeight(page)
  for (const name of CASES) {
    const { root, ticks, track, range, steps, thumbs } = slider(reading, name)
    const vertical = VERTICAL.includes(name)
    expect(vertical ? track.width : track.height, `${name} track`).toBe(2)
    expect(track.overflow).toBe("visible")
    expect(track.background).toBe(strong)
    expect(range.boxShadow).toBe(`${primary} 0px 0px 0px 1px inset`)
    for (const thumb of thumbs) {
      expect([thumb.width, thumb.height], `${name} needle`).toEqual(
        vertical ? [18, 2] : [2, 18],
      )
      expect(thumb.borderWidth).toBe(1)
      expect(thumb.borderColor).toBe(primary)
      expect(thumb.background).toBe(CLEAR)
      expect(thumb.hit).toEqual({ width: 24, height: 24 })
      const head = thumb.after
      expect(head, `${name} head`).not.toBeNull()
      if (!head) continue
      if (vertical) {
        expect([head.width, head.height]).toEqual([6, 8])
        expect(head.x).toBeCloseTo(thumb.x, 1)
        expect(centre(head).y).toBeCloseTo(centre(thumb).y, 1)
        expect(head.edges).toEqual({
          top: { width: 4, color: CLEAR },
          right: { width: 0, color: CLEAR },
          bottom: { width: 4, color: CLEAR },
          left: { width: 6, color: primary },
        })
      } else {
        expect([head.width, head.height]).toEqual([8, 6])
        expect(head.y).toBeCloseTo(thumb.y, 1)
        expect(centre(head).x).toBeCloseTo(centre(thumb).x, 1)
        expect(head.edges).toEqual({
          top: { width: 6, color: primary },
          right: { width: 4, color: CLEAR },
          bottom: { width: 0, color: CLEAR },
          left: { width: 4, color: CLEAR },
        })
      }
    }
    if (name === "steps") {
      expect(ticks, "step marks replace the root's ticks").toBeNull()
      expect(steps.length).toBeGreaterThan(0)
      for (const step of steps) {
        expect([step.width, step.height]).toEqual([1, 5])
        expect(step.background).toBe(strong)
        expect(step.y).toBeCloseTo(track.y + track.height + 2, 1)
      }
      continue
    }
    expect(ticks, `${name} ticks`).not.toBeNull()
    if (!ticks) continue
    expect(ticks.backgroundImage).toContain("repeating-linear-gradient")
    if (vertical) {
      expect([ticks.y, ticks.height]).toEqual([root.y, root.height])
      expect(ticks.width).toBe(5)
      expect(ticks.x).toBeCloseTo(track.x + track.width + 2, 1)
    } else {
      expect([ticks.x, ticks.width]).toEqual([root.x, root.width])
      expect(ticks.height).toBe(5)
      expect(ticks.y).toBeCloseTo(track.y + track.height + 2, 1)
    }
  }
  for (const name of BARS) {
    const { box, content, indicator } = reading.bars[name]
    expect(box.height, name).toBe(trackPx)
    expect(content.height, name).toBe(2)
    expect(content.y, name).toBeCloseTo(box.y + (trackPx - 2) / 2, 1)
    expect(box.background, name).toBe(strong)
    expect(indicator.boxShadow, name).toBe(`${primary} 0px 0px 0px 1px inset`)
    expect(indicator.height, name).toBe(2)
  }
}

/** The box and shape tests, for the describe that seeds the page. */
function boxAndShapeTests() {
  for (const value of VALUES) {
    test(`${value} keeps every box, thumb centre and range`, async ({ page }) =>
      keepsBoxes(page, value))
  }
  test("bar squares the ends and draws a 6x18 accent bar thumb", async ({
    page,
  }) => barShape(page))
  test("knob recesses the track under a 22px domed knob with an 8px accent dot", async ({
    page,
  }) => knobShape(page))
  test("ruled draws hairlines, a 2x18 needle and ticks below the track", async ({
    page,
  }) => ruledShape(page))
}

for (const mode of MODES) {
  test.describe(`slider anatomy · ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await openControlFixture(page)
    })

    boxAndShapeTests()

    test("ruled mirrors the vertical ticks, needle head and step marks in RTL", async ({
      page,
    }) => {
      await stamp(page, "ruled")
      const primary = await colour(page, "hsl(var(--primary))")
      await page.evaluate((sliders) => {
        const wrapper = document.querySelector(
          `${sliders} [data-case="vertical"]`,
        )
        if (!wrapper) throw new Error("no vertical slider")
        wrapper.setAttribute("dir", "rtl")
        // The fixture shows no vertical step marks; this one is placed as
        // Slider places a mark at its halfway stop.
        const range = wrapper.querySelector(".dr-slider-range")
        const step = document.createElement("span")
        step.className = "dr-slider-step"
        step.dataset.orientation = "vertical"
        step.style.cssText =
          "position:absolute;bottom:50%;left:50%;transform:translate(-50%, 50%)"
        range?.after(step)
      }, SLIDERS)
      const reading = await read(page)
      const { root, ticks, track, steps, thumbs } = slider(reading, "vertical")
      expect(ticks, "a step mark replaces the root's ticks").toBeNull()
      const [step] = steps
      expect(step).toBeDefined()
      if (step) {
        expect([step.width, step.height]).toEqual([5, 1])
        expect(step.x + step.width).toBeCloseTo(track.x - 2, 1)
      }
      const [thumb] = thumbs
      if (!thumb?.after) throw new Error("no needle head")
      expect(thumb.after.x + thumb.after.width).toBeCloseTo(
        thumb.x + thumb.width,
        1,
      )
      expect(thumb.after.edges).toEqual({
        top: { width: 4, color: CLEAR },
        right: { width: 6, color: primary },
        bottom: { width: 4, color: CLEAR },
        left: { width: 0, color: CLEAR },
      })
      await page.evaluate((sliders) => {
        document
          .querySelector(`${sliders} [data-case="vertical"] .dr-slider-step`)
          ?.remove()
      }, SLIDERS)
      const ticked = slider(await read(page), "vertical").ticks
      if (!ticked) throw new Error("no ticks")
      expect(ticked.x + ticked.width).toBeCloseTo(track.x - 2, 1)
      expect([ticked.y, ticked.height]).toEqual([root.y, root.height])
    })

    for (const value of VALUES) {
      test(`${value} keeps the value marks at 3:1`, async ({ page }) => {
        await stamp(page, value)
        const reading = await read(page)
        const single = slider(reading, "single")
        const [thumb] = single.thumbs
        if (!thumb) throw new Error("no thumb")
        const mid = centre(thumb)
        const checks: [string, Region, Region][] = []
        if (value === "bar") {
          // The bar overhangs the 8px track by 5px each side: there the
          // page is beside it.
          checks.push([
            "thumb",
            region(thumb.x, thumb.y, thumb.width, 4),
            region(thumb.x + thumb.width + 3, thumb.y, 4, 4),
          ])
        } else if (value === "knob") {
          const dot = thumb.after
          if (!dot) throw new Error("no dot")
          for (const [label, beside] of [
            ["dot (start side)", region(dot.x - 3, mid.y - 1, 2, 2)],
            ["dot (above)", region(mid.x - 1, dot.y - 3, 2, 2)],
            ["dot (below)", region(mid.x - 1, dot.y + dot.height + 1, 2, 2)],
          ] as const) {
            checks.push([label, region(dot.x, dot.y, 8, 8), beside])
          }
          checks.push([
            "knob edge",
            region(mid.x - 1, thumb.y, 2, 2),
            region(mid.x - 1, thumb.y - 4, 2, 2),
          ])
        } else {
          const head = thumb.after
          if (!head) throw new Error("no head")
          checks.push(
            [
              "needle",
              region(thumb.x, thumb.y + 6, 2, 2),
              region(thumb.x + 5, thumb.y + 6, 2, 2),
            ],
            [
              "needle head",
              region(mid.x - 2, head.y, 4, 2),
              region(mid.x + 7, head.y, 2, 2),
            ],
            [
              "range",
              region(single.range.x + 8, single.range.y, 4, 2),
              region(single.range.x + 8, single.range.y - 3, 4, 2),
            ],
          )
        }
        if (value !== "ruled") {
          // The fill against the unfilled track beside it.
          checks.push([
            "range",
            region(single.range.x + 8, single.track.y + 2, 4, 4),
            region(
              single.track.x + single.track.width - 12,
              single.track.y + 2,
              4,
              4,
            ),
          ])
        }
        const { box, content } = reading.bars.determinate
        if (value === "ruled") {
          checks.push([
            "progress fill",
            region(box.x + 8, content.y, 4, 2),
            region(box.x + 8, box.y, 4, 2),
          ])
        } else {
          checks.push([
            "progress fill",
            region(box.x + 8, box.y + 2, 4, 4),
            region(box.x + box.width - 12, box.y + 2, 4, 4),
          ])
        }
        for (const [label, mark, beside] of checks) {
          const ratio = await markContrast(page, mark, beside)
          note(`${mode} ${value} ${label}: ${ratio.toFixed(2)}`)
          expect(ratio, `${value} ${label}`).toBeGreaterThanOrEqual(3)
        }
      })

      test(`${value} keeps the thumb's focus ring`, async ({ page }) => {
        await stamp(page, value)
        // A key press puts the page in keyboard modality, so a scripted
        // focus matches :focus-visible as a Tab press would.
        await page.keyboard.press("Shift")
        const thumb = page
          .locator(`${SLIDERS} [data-case="single"] .dr-slider-thumb`)
          .first()
        await thumb.focus()
        const ring = await thumb.evaluate((el) => {
          const style = getComputedStyle(el)
          return {
            visible: el.matches(":focus-visible"),
            style: style.outlineStyle,
            width: style.outlineWidth,
          }
        })
        expect(ring).toEqual({ visible: true, style: "solid", width: "2px" })
      })
    }
  })
}

for (const density of ["compact", "spacious"] as const) {
  test.describe(`slider anatomy · ${density}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedApp(page, { style: "quiet", density })
      await openControlFixture(page)
    })

    boxAndShapeTests()
  })
}

/**
 * A press 2px outside the thumb's visible face, and outside the slider's own
 * box, still lands on the thumb's 24px hit area and moves that thumb. Each
 * offset is from the face's centre: beside a bar or needle, or past a round
 * knob's edge on the diagonal.
 */
const OUTSIDE: Record<Value, { dx: number; dy: number }> = {
  bar: { dx: 5, dy: -8 },
  knob: { dx: 9, dy: -9.5 },
  ruled: { dx: 3, dy: 6 },
}

test.describe("slider anatomy · hit area", () => {
  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openControlFixture(page)
  })

  for (const value of VALUES) {
    test(
      `${value}: a press 2px outside the thumb's face grabs it`,
      { tag: "@touch" },
      async ({ page, isMobile }) => {
        await stamp(page, value)
        const root = page.locator(`${SLIDERS} [data-case="single"] .dr-slider`)
        const thumb = root.locator(".dr-slider-thumb")
        await root.scrollIntoViewIfNeeded()
        const face = await thumb.boundingBox()
        const box = await root.boundingBox()
        if (!face || !box) throw new Error("no slider")
        const { dx, dy } = OUTSIDE[value]
        const point = {
          x: face.x + face.width / 2 + dx,
          y: face.y + face.height / 2 + dy,
        }
        expect(
          point.y < box.y || point.y > box.y + box.height,
          "the press is outside the slider's own box",
        ).toBe(true)
        const hit = await page.evaluate(
          ({ x, y }) =>
            document
              .elementFromPoint(x, y)
              ?.classList.contains("dr-slider-thumb"),
          point,
        )
        expect(hit, "the point lands on the thumb's hit area").toBe(true)
        const before = Number(await thumb.getAttribute("aria-valuenow"))
        if (isMobile) await page.touchscreen.tap(point.x, point.y)
        else await page.mouse.click(point.x, point.y)
        const expected = Math.round(((point.x - box.x) / box.width) * 100)
        await expect
          .poll(async () => Number(await thumb.getAttribute("aria-valuenow")))
          .not.toBe(before)
        const after = Number(await thumb.getAttribute("aria-valuenow"))
        expect(Math.abs(after - expected)).toBeLessThanOrEqual(1)
      },
    )
  }
})
