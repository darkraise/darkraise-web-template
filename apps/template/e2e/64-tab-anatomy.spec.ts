import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  boxOf,
  kitLook,
  seedApp,
  type Box,
  type ThemeSeed,
} from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import {
  contrast,
  markContrast,
  pixel,
  rgbOf,
  settle,
  textContrast,
  type Region,
  type Rgb,
} from "./helpers/measure"

/**
 * tabStyle restyles Tabs lists and SegmentGroups of the default variant, in
 * both orientations and with or without color="accent". `underline` drops
 * the well and draws a 2px --primary bar in the indicator's ::after on the
 * edge facing the panel, over a 1px baseline the list draws there; `pill`
 * drops the well and fills the indicator with --primary-fill under a
 * --primary-foreground label; `outline` rules the strip into cells in a 1px
 * frame and tints the current cell, edged in --primary. Every strip keeps
 * its outer box, the focus ring stays, the app variants outline, underline
 * and enclosed do not change, and checkStyle leaves every SegmentGroup
 * alone under every tabStyle.
 */

const MODES = ["light", "dark"] as const
const STYLES = ["underline", "pill", "outline"] as const
const CHECK_STYLES = ["outline", "round"] as const
type TabStyle = "well" | (typeof STYLES)[number]
type CheckStyle = "box" | (typeof CHECK_STYLES)[number]
type Kind = "tabs" | "segment"

interface Strip {
  name: string
  kind: Kind
  /** The fixture case wrapping the strip. */
  scope: string
}

const TAB_CASES = [
  "default",
  "default-accent",
  "default-vertical",
  "default-vertical-accent",
  "default-rtl",
]
const SEGMENT_CASES = [
  "default",
  "default-accent",
  "default-vertical",
  "default-disabled",
]

/** Every default-variant strip on the fixture, the card's two included. */
const STRIPS: Strip[] = [
  ...TAB_CASES.map(
    (name): Strip => ({
      name: `tabs ${name}`,
      kind: "tabs",
      scope: `[data-probe="anatomy-tabs"] [data-case="${name}"]`,
    }),
  ),
  ...SEGMENT_CASES.map(
    (name): Strip => ({
      name: `segment ${name}`,
      kind: "segment",
      scope: `[data-probe="anatomy-segments"] [data-case="${name}"]`,
    }),
  ),
  {
    name: "card tabs",
    kind: "tabs",
    scope: '[data-probe="anatomy-card"] [data-case="tabs"]',
  },
  {
    name: "card segment",
    kind: "segment",
    scope: '[data-probe="anatomy-card"] [data-case="segment"]',
  },
]

/** Strips whose labels a reader must read: a disabled group is exempt. */
const ENABLED = STRIPS.filter((strip) => !strip.name.endsWith("disabled"))

const PARTS = {
  tabs: {
    root: ".dr-tabs",
    list: ".dr-tabs-list",
    indicator: ".dr-tabs-indicator",
    item: ".dr-tabs-trigger",
    current: '.dr-tabs-trigger[data-state="active"]',
    other: '.dr-tabs-trigger[data-state="inactive"]:not(:disabled)',
    wash: "::before",
  },
  segment: {
    root: ".dr-segment-group",
    list: ".dr-segment-group",
    indicator: ".dr-segment-group-indicator",
    item: ".dr-segment-group-item",
    current: '.dr-segment-group-item[data-state="checked"]',
    other: '.dr-segment-group-item[data-state="unchecked"]',
    wash: "::after",
  },
} as const

const STRIP_ROOTS =
  '[data-probe="anatomy-tabs"] .dr-tabs-list, [data-probe="anatomy-segments"] .dr-segment-group, [data-probe="anatomy-card"] :is(.dr-tabs-list, .dr-segment-group)'
/**
 * The app-variant components themselves, not their fixture cases: the cases
 * share a wrapping row with default-variant strips, which an `outline`
 * strip shortens by its gaps, so a case's place and height may move.
 */
const APP_VARIANTS =
  '[data-probe="anatomy-tabs"] :is([data-case="outline"], [data-case="underline"], [data-case="enclosed"]) > *, [data-probe="anatomy-segments"] [data-case="outline"] > *'
const SEGMENTS =
  '[data-probe="anatomy-segments"], [data-probe="anatomy-card"] [data-case="segment"]'

const part = (page: Page, strip: Strip, name: keyof (typeof PARTS)["tabs"]) =>
  page.locator(`${strip.scope} ${PARTS[strip.kind][name]}`)

async function open(page: Page, seed: ThemeSeed, tabStyle: TabStyle) {
  await seedApp(page, { style: "quiet", mode: "light", ...seed })
  await openControlFixture(page)
  await kitLook(page, { tabStyle })
  await settle(page)
}

async function restamp(
  page: Page,
  tabStyle: TabStyle,
  checkStyle: CheckStyle = "box",
) {
  await kitLook(page, { tabStyle, checkStyle })
  await settle(page)
}

interface Geometry {
  vertical: boolean
  rtl: boolean
  /** The list's border box and padding box. */
  list: Box
  inner: Box
  indicator: Box
  /** The box the indicator's ::after paints, or null when it paints none. */
  bar: Box | null
  /** The box the list's ::before paints, or null when it paints none. */
  frame: Box | null
  current: Box
  items: Box[]
}

function geometry(page: Page, strip: Strip): Promise<Geometry> {
  return page.locator(strip.scope).evaluate((scope, parts) => {
    const rect = (el: Element) => {
      const { x, y, width, height } = el.getBoundingClientRect()
      return { x, y, width, height }
    }
    const list = scope.querySelector(parts.list) as HTMLElement
    const style = getComputedStyle(list)
    const outer = rect(list)
    const [top, right, bottom, left] = [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth,
    ].map(parseFloat) as [number, number, number, number]
    const indicator = list.querySelector(parts.indicator) as HTMLElement
    const at = rect(indicator)
    const after = getComputedStyle(indicator, "::after")
    const before = getComputedStyle(list, "::before")
    return {
      vertical: list.getAttribute("data-orientation") === "vertical",
      rtl: style.direction === "rtl",
      list: outer,
      inner: {
        x: outer.x + left,
        y: outer.y + top,
        width: outer.width - left - right,
        height: outer.height - top - bottom,
      },
      indicator: at,
      bar:
        after.content === "none"
          ? null
          : {
              x: at.x + parseFloat(after.left),
              y: at.y + parseFloat(after.top),
              width: parseFloat(after.width),
              height: parseFloat(after.height),
            },
      // A positioned pseudo-element is placed against the padding box.
      frame:
        before.content === "none"
          ? null
          : {
              x: outer.x + left + parseFloat(before.left),
              y: outer.y + top + parseFloat(before.top),
              width: parseFloat(before.width),
              height: parseFloat(before.height),
            },
      current: rect(list.querySelector(parts.current) as Element),
      items: [...list.querySelectorAll(parts.item)].map(rect),
    }
  }, PARTS[strip.kind])
}

/** Computed style of `element` within the strip, ::after included. */
function stylesOf(
  page: Page,
  strip: Strip,
  name: keyof (typeof PARTS)["tabs"],
  properties: string[],
  pseudo: string | null = null,
): Promise<Record<string, string>[]> {
  return part(page, strip, name).evaluateAll(
    (elements, [names, after]) =>
      elements.map((el) => {
        const style = getComputedStyle(el, after)
        return Object.fromEntries(
          names.map((n) => [n, style.getPropertyValue(n)]),
        )
      }),
    [properties, pseudo] as const,
  )
}

/**
 * What the browser computes for `declarations` inside the strip, where the
 * strip's own custom properties apply (the card's included).
 */
function resolve(
  page: Page,
  strip: Strip,
  declarations: Record<string, string>,
): Promise<Record<string, string>> {
  return page.locator(strip.scope).evaluate((scope, values) => {
    const probe = document.createElement("div")
    probe.style.position = "absolute"
    for (const [name, value] of Object.entries(values)) {
      probe.style.setProperty(name, value)
    }
    scope.append(probe)
    const style = getComputedStyle(probe)
    const result = Object.fromEntries(
      Object.keys(values).map((name) => [name, style.getPropertyValue(name)]),
    )
    probe.remove()
    return result
  }, declarations)
}

/**
 * Every computed property of the matched elements, their descendants and
 * their pseudo-elements, with each box placed relative to its matched root.
 */
function record(locator: Locator) {
  return locator.evaluateAll((roots) =>
    roots.flatMap((root) => {
      const origin = root.getBoundingClientRect()
      return [root, ...root.querySelectorAll("*")].map((el) => {
        const reading: Record<string, string> = {}
        for (const pseudo of [null, "::before", "::after"]) {
          const style = getComputedStyle(el, pseudo)
          for (let i = 0; i < style.length; i++) {
            const name = style.item(i)
            if (name.startsWith("transition")) continue
            reading[`${pseudo ?? ""}${name}`] = style.getPropertyValue(name)
          }
        }
        const { x, y, width, height } = el.getBoundingClientRect()
        reading.box = `${x - origin.x} ${y - origin.y} ${width} ${height}`
        return reading
      })
    }),
  )
}

const near = (actual: number, expected: number, label: string) =>
  expect(
    Math.abs(actual - expected),
    `${label}: ${actual} vs ${expected}`,
  ).toBeLessThan(0.05)

function expectSameBox(actual: Box, expected: Box, label: string) {
  near(actual.x, expected.x, `${label} x`)
  near(actual.y, expected.y, `${label} y`)
  near(actual.width, expected.width, `${label} width`)
  near(actual.height, expected.height, `${label} height`)
}

/** Flip the vertical strips to right-to-left, as an app's `dir` would. */
async function verticalRtl(page: Page) {
  for (const strip of STRIPS.filter((s) => s.name.includes("vertical"))) {
    await page
      .locator(`${strip.scope} ${PARTS[strip.kind].root}`)
      .first()
      .evaluate((el) => el.setAttribute("dir", "rtl"))
  }
  await settle(page)
}

const VERTICAL = STRIPS.filter((s) => s.name.includes("vertical"))

interface StripBoxes {
  /** The app variant; tabStyle restyles only `default`. */
  variant: string | null
  vertical: boolean
  /** The space between consecutive items along the strip's main axis. */
  spacing: number
  box: Box
  items: Box[]
}

/** Every default-variant strip's box, its items' boxes and its gap. */
function stripBoxes(page: Page): Promise<StripBoxes[]> {
  return page.locator(STRIP_ROOTS).evaluateAll((elements) =>
    elements.map((el) => {
      const rect = (node: Element) => {
        const { x, y, width, height } = node.getBoundingClientRect()
        return { x, y, width, height }
      }
      const vertical = el.getAttribute("data-orientation") === "vertical"
      const items = [
        ...el.querySelectorAll(".dr-tabs-trigger, .dr-segment-group-item"),
      ].map(rect)
      const start = (box: Box) => (vertical ? box.y : box.x)
      const end = (box: Box) =>
        vertical ? box.y + box.height : box.x + box.width
      // Sorted along the axis, so right-to-left strips measure the same.
      const along = [...items].sort((a, b) => start(a) - start(b))
      let spacing = 0
      for (let i = 1; i < along.length; i++) {
        spacing += start(along[i] as Box) - end(along[i - 1] as Box)
      }
      return {
        variant: el.getAttribute("data-variant"),
        vertical,
        spacing,
        box: rect(el),
        items,
      }
    }),
  )
}

test.describe("tab anatomy", () => {
  // Every item keeps the box it has under `well` (the control height e2e 16
  // holds at every density), and every strip keeps its box, except that an
  // `outline` strip loses its gaps along its main axis so the cells meet.
  for (const density of ["default", "compact", "spacious"] as const) {
    test(`keeps every item's box and every strip's cross size · ${density}`, async ({
      page,
    }) => {
      await open(page, density === "default" ? {} : { density }, "well")
      const before = await stripBoxes(page)
      expect(before).toHaveLength(15)
      expect(before.filter((strip) => strip.vertical)).toHaveLength(3)
      const lost: string[] = []
      for (const tabStyle of STYLES) {
        await restamp(page, tabStyle)
        const after = await stripBoxes(page)
        after.forEach((strip, i) => {
          const well = before[i] as StripBoxes
          const label = `${tabStyle} strip ${i}`
          expect(strip.items, label).toHaveLength(well.items.length)
          strip.items.forEach((item, j) => {
            const was = well.items[j] as Box
            near(item.width, was.width, `${label} item ${j} width`)
            near(item.height, was.height, `${label} item ${j} height`)
          })
          if (tabStyle !== "outline") {
            expectSameBox(strip.box, well.box, label)
            strip.items.forEach((item, j) =>
              expectSameBox(item, well.items[j] as Box, `${label} item ${j}`),
            )
            return
          }
          // The fixture wraps its strips in rows, so a shorter outline
          // strip moves those after it: only sizes are compared.
          if (well.variant !== "default") {
            near(strip.box.width, well.box.width, `${label} width`)
            near(strip.box.height, well.box.height, `${label} height`)
            return
          }
          const [main, cross] = well.vertical
            ? (["height", "width"] as const)
            : (["width", "height"] as const)
          expect(well.spacing, `${label} gaps`).toBeGreaterThan(0)
          expect(strip.spacing, `${label} cells meet`).toBeCloseTo(0, 1)
          near(strip.box[cross], well.box[cross], `${label} ${cross}`)
          near(
            strip.box[main],
            well.box[main] - well.spacing,
            `${label} ${main}`,
          )
          lost.push(`strip ${i} ${main} -${well.spacing}px`)
        })
      }
      test.info().annotations.push({
        type: "outline main axis",
        description: lost.join("; "),
      })
    })
  }

  test("underline draws a 2px primary bar on the indicator's panel edge", async ({
    page,
  }) => {
    await open(page, {}, "underline")
    const check = async (strip: Strip) => {
      const g = await geometry(page, strip)
      const label = `${strip.name}${g.rtl ? " rtl" : ""}`
      expectSameBox(g.indicator, g.current, `${label} indicator`)
      expect(g.bar, `${label} bar`).not.toBeNull()
      const bar = g.bar as Box
      if (g.vertical) {
        near(bar.width, 2, `${label} bar width`)
        near(bar.height, g.indicator.height, `${label} bar height`)
        near(bar.y, g.indicator.y, `${label} bar top`)
        // The list keeps its padding; the bar crosses it to the baseline.
        const end = (box: Box) => (g.rtl ? -box.x : box.x + box.width)
        near(end(bar), end(g.inner), `${label} bar on the baseline`)
        near(end(g.inner) - end(g.indicator), 4, `${label} list padding`)
      } else {
        near(bar.height, 2, `${label} bar height`)
        near(bar.width, g.indicator.width, `${label} bar width`)
        near(bar.x, g.indicator.x, `${label} bar start`)
        const bottom = (box: Box) => box.y + box.height
        near(bottom(bar), bottom(g.inner), `${label} bar on the baseline`)
        near(bottom(g.inner) - bottom(g.indicator), 4, `${label} list padding`)
      }
      const baseline = g.vertical
        ? g.rtl
          ? "inset 1px 0 0 hsl(var(--border))"
          : "inset -1px 0 0 hsl(var(--border))"
        : "inset 0 -1px 0 hsl(var(--border))"
      const expected = await resolve(page, strip, {
        "box-shadow": baseline,
        "background-image":
          "linear-gradient(hsl(var(--primary)), hsl(var(--primary)))",
        "border-color": "var(--selected-mark-fg)",
      })
      const [list] = await stylesOf(page, strip, "list", [
        "background-color",
        "box-shadow",
      ])
      expect(list, label).toEqual({
        "background-color": "rgba(0, 0, 0, 0)",
        "box-shadow": expected["box-shadow"],
      })
      const [indicator] = await stylesOf(page, strip, "indicator", [
        "background-color",
        "background-image",
        "box-shadow",
      ])
      expect(indicator, label).toEqual({
        "background-color": "rgba(0, 0, 0, 0)",
        "background-image": "none",
        "box-shadow": "none",
      })
      const [after] = await stylesOf(
        page,
        strip,
        "indicator",
        ["background-color", "background-image"],
        "::after",
      )
      expect(after, `${label} bar paint`).toEqual({
        "background-color": "rgba(0, 0, 0, 0)",
        "background-image": expected["background-image"],
      })
      const [current] = await stylesOf(page, strip, "current", ["color"])
      expect(current?.color, `${label} label`).toBe(expected["border-color"])
    }
    for (const strip of STRIPS) await check(strip)
    await verticalRtl(page)
    for (const strip of VERTICAL) await check(strip)
  })

  test("pill fills the current item as an accent pill", async ({ page }) => {
    await open(page, {}, "pill")
    for (const strip of STRIPS) {
      const g = await geometry(page, strip)
      expectSameBox(g.indicator, g.current, `${strip.name} indicator`)
      const expected = await resolve(page, strip, {
        "background-color": "hsl(var(--primary-fill))",
        color: "hsl(var(--primary-foreground))",
        "box-shadow":
          "inset 0 0 0 1px hsl(var(--primary)), var(--affordance-glow)",
      })
      const [list] = await stylesOf(page, strip, "list", [
        "background-color",
        "box-shadow",
      ])
      expect(list, strip.name).toEqual({
        "background-color": "rgba(0, 0, 0, 0)",
        "box-shadow": "none",
      })
      const [indicator] = await stylesOf(page, strip, "indicator", [
        "background-color",
        "box-shadow",
        "border-top-left-radius",
      ])
      expect(indicator?.["background-color"], strip.name).toBe(
        expected["background-color"],
      )
      expect(indicator?.["box-shadow"], `${strip.name} pill edge`).toBe(
        expected["box-shadow"],
      )
      expect(
        parseFloat(indicator?.["border-top-left-radius"] ?? "0"),
        `${strip.name} pill radius`,
      ).toBeGreaterThanOrEqual(g.indicator.height / 2)
      const [current] = await stylesOf(page, strip, "current", ["color"])
      expect(current?.color, `${strip.name} label`).toBe(expected.color)
      const radii = await stylesOf(page, strip, "item", [
        "border-top-left-radius",
      ])
      radii.forEach((radius, i) =>
        expect(
          parseFloat(radius["border-top-left-radius"] ?? "0"),
          `${strip.name} item ${i} radius`,
        ).toBeGreaterThanOrEqual((g.items[i] as Box).height / 2),
      )
    }
  })

  test("outline rules the strip into cells and edges the current one", async ({
    page,
  }) => {
    await open(page, {}, "outline")
    const check = async (strip: Strip) => {
      const g = await geometry(page, strip)
      const label = `${strip.name}${g.rtl ? " rtl" : ""}`
      // A segment item has no border, so its divider and edge are inset
      // shadows; a trigger's reserved 1px border carries them.
      const divider = g.vertical
        ? "inset 0 1px 0 hsl(var(--border-strong))"
        : g.rtl
          ? "inset -1px 0 0 hsl(var(--border-strong))"
          : "inset 1px 0 0 hsl(var(--border-strong))"
      const expected = await resolve(page, strip, {
        "background-color": "hsl(var(--primary-3))",
        color: "hsl(var(--primary-text))",
        "border-color": "hsl(var(--primary))",
        "outline-color": "hsl(var(--border-strong))",
        "box-shadow": divider,
      })
      const edge = await resolve(page, strip, {
        "box-shadow": "inset 0 0 0 1px hsl(var(--primary))",
      })
      const [list] = await stylesOf(page, strip, "list", [
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "background-color",
        "box-shadow",
      ])
      expect(list, label).toEqual({
        "padding-top": "4px",
        "padding-right": "4px",
        "padding-bottom": "4px",
        "padding-left": "4px",
        "background-color": "rgba(0, 0, 0, 0)",
        "box-shadow": "none",
      })

      // The list keeps its padding; its ::before draws the 1px frame
      // inside it, and the cells tile the frame end to end.
      expect(g.frame, `${label} frame`).not.toBeNull()
      const frame = g.frame as Box
      expectSameBox(
        frame,
        {
          x: g.inner.x + 4,
          y: g.inner.y + 4,
          width: g.inner.width - 8,
          height: g.inner.height - 8,
        },
        `${label} frame`,
      )
      const [frameStyle] = await stylesOf(
        page,
        strip,
        "list",
        [
          "border-top-width",
          "border-right-width",
          "border-bottom-width",
          "border-left-width",
          "border-top-color",
          "border-right-color",
          "border-bottom-color",
          "border-left-color",
          "border-top-left-radius",
        ],
        "::before",
      )
      for (const side of ["top", "right", "bottom", "left"]) {
        expect(frameStyle?.[`border-${side}-width`], `${label} ${side}`).toBe(
          "1px",
        )
        expect(frameStyle?.[`border-${side}-color`], `${label} ${side}`).toBe(
          expected["outline-color"],
        )
      }
      const start = (box: Box) =>
        g.vertical ? box.y : g.rtl ? -(box.x + box.width) : box.x
      const end = (box: Box) =>
        g.vertical ? box.y + box.height : g.rtl ? -box.x : box.x + box.width
      near(start(g.items[0] as Box), start(frame), `${label} first cell`)
      g.items.forEach((item, i) => {
        if (i > 0) {
          near(start(item), end(g.items[i - 1] as Box), `${label} cell ${i}`)
        }
        if (g.vertical) {
          near(item.x, frame.x, `${label} cell ${i} side`)
          near(item.width, frame.width, `${label} cell ${i} width`)
        } else {
          near(item.y, frame.y, `${label} cell ${i} top`)
          near(item.height, frame.height, `${label} cell ${i} height`)
        }
      })
      near(
        end(g.items[g.items.length - 1] as Box),
        end(frame),
        `${label} last cell`,
      )
      expectSameBox(g.indicator, g.current, `${label} indicator`)

      // Each cell's leading edge is its divider; the current cell's edge
      // stands in for the divider of the cell after it.
      const leading = g.vertical
        ? "border-top-color"
        : g.rtl
          ? "border-right-color"
          : "border-left-color"
      const cells = await stylesOf(page, strip, "item", [
        leading,
        "border-top-color",
        "border-right-color",
        "border-bottom-color",
        "border-left-color",
        "box-shadow",
        "background-color",
        "color",
      ])
      const states = await part(page, strip, "item").evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-state")),
      )
      const currentIndex = states.findIndex(
        (state) => state === "active" || state === "checked",
      )
      cells.forEach((cell, i) => {
        const plain = i === 0 || i === currentIndex + 1
        if (i === currentIndex) {
          expect(cell, `${label} current cell`).toMatchObject({
            "background-color": expected["background-color"],
            color: expected.color,
          })
          if (strip.kind === "tabs") {
            expect(cell, `${label} current cell edge`).toMatchObject({
              "border-top-color": expected["border-color"],
              "border-right-color": expected["border-color"],
              "border-bottom-color": expected["border-color"],
              "border-left-color": expected["border-color"],
            })
          } else {
            expect(cell["box-shadow"], `${label} current cell edge`).toBe(
              edge["box-shadow"],
            )
          }
        } else if (strip.kind === "tabs") {
          expect(cell[leading], `${label} cell ${i} divider`).toBe(
            plain ? "rgba(0, 0, 0, 0)" : expected["outline-color"],
          )
        } else {
          expect(cell["box-shadow"], `${label} cell ${i} divider`).toBe(
            plain ? "none" : expected["box-shadow"],
          )
        }
      })

      // The end cells round their outer corners as the frame does.
      const radius = parseFloat(frameStyle?.["border-top-left-radius"] ?? "-1")
      const corners = (side: "first" | "last") => {
        const leadingSide = side === "first"
        if (g.vertical) {
          return leadingSide
            ? ["border-top-left-radius", "border-top-right-radius"]
            : ["border-bottom-left-radius", "border-bottom-right-radius"]
        }
        const left = g.rtl !== leadingSide
        return left
          ? ["border-top-left-radius", "border-bottom-left-radius"]
          : ["border-top-right-radius", "border-bottom-right-radius"]
      }
      const radii = await stylesOf(page, strip, "item", [
        "border-top-left-radius",
        "border-top-right-radius",
        "border-bottom-left-radius",
        "border-bottom-right-radius",
      ])
      for (const [side, index] of [
        ["first", 0],
        ["last", radii.length - 1],
      ] as const) {
        for (const corner of corners(side)) {
          expect(
            parseFloat(radii[index]?.[corner] ?? "-1"),
            `${label} ${side} ${corner}`,
          ).toBeCloseTo(radius, 1)
        }
      }
    }
    for (const strip of STRIPS) await check(strip)

    // The current cell moves; the dividers follow it.
    for (const strip of ENABLED) {
      await part(page, strip, "item").nth(1).click()
    }
    await page.mouse.move(0, 0)
    await settle(page)
    for (const strip of ENABLED) await check(strip)

    await verticalRtl(page)
    for (const strip of VERTICAL) await check(strip)
  })

  test("pill and outline follow the sharp radius step", async ({ page }) => {
    await open(page, { radius: "sharp" }, "pill")
    for (const tabStyle of ["pill", "outline"] as const) {
      await restamp(page, tabStyle)
      for (const strip of STRIPS) {
        const radii = [
          ...(await stylesOf(page, strip, "indicator", [
            "border-top-left-radius",
          ])),
          ...(await stylesOf(page, strip, "item", [
            "border-top-left-radius",
            "border-bottom-right-radius",
          ])),
        ]
        for (const radius of radii) {
          for (const value of Object.values(radius)) {
            expect(value, `${tabStyle} ${strip.name}`).toBe("0px")
          }
        }
      }
    }
  })

  test("keeps the keyboard focus ring", async ({ page }) => {
    await open(page, {}, "well")
    const targets = STRIPS.filter((s) => s.name.endsWith(" default")).map(
      (strip) => part(page, strip, "current"),
    )
    // A segment item transitions outline-color, so the ring is read once
    // focus has settled.
    const ring = async (target: Locator) => {
      await target.evaluate((el) => (el as HTMLElement).focus())
      await settle(page)
      return target.evaluate((el) => {
        const style = getComputedStyle(el)
        return {
          visible: el.matches(":focus-visible"),
          outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
          offset: style.outlineOffset,
        }
      })
    }
    const expected = []
    for (const target of targets) expected.push(await ring(target))
    expect(expected).toHaveLength(2)
    for (const reading of expected) {
      expect(reading.visible).toBe(true)
      expect(reading.outline).toMatch(/^solid 2px /)
    }
    for (const tabStyle of STYLES) {
      await restamp(page, tabStyle)
      for (const [i, target] of targets.entries()) {
        expect(await ring(target), `${tabStyle} ${i}`).toEqual(expected[i])
      }
    }
  })

  test("other items wash on hover in their own shape", async ({ page }) => {
    await open(page, {}, "well")
    for (const tabStyle of STYLES) {
      await restamp(page, tabStyle)
      for (const strip of ENABLED.filter((s) => !s.name.startsWith("card"))) {
        const item = part(page, strip, "other").first()
        await item.hover()
        await settle(page)
        const { wash, radius, own } = await item.evaluate((el, pseudo) => {
          const layer = getComputedStyle(el, pseudo)
          return {
            wash: Number(layer.opacity),
            radius: layer.borderTopLeftRadius,
            own: getComputedStyle(el).borderTopLeftRadius,
          }
        }, PARTS[strip.kind].wash)
        expect(wash, `${tabStyle} ${strip.name}`).toBeGreaterThan(0)
        expect(radius, `${tabStyle} ${strip.name} wash radius`).toBe(own)
      }
      await page.mouse.move(0, 0)
    }
  })
})

/**
 * A label's contrast against what it sits on. Every label but the pill's
 * current one sits on itself or an ancestor, which the computed walk reads;
 * the pill is the indicator, a sibling under the label, read directly.
 */
async function labelContrast(
  page: Page,
  strip: Strip,
  name: "current" | "other",
  tabStyle: TabStyle,
): Promise<number> {
  const label = part(page, strip, name).first()
  if (tabStyle !== "pill" || name === "other") return textContrast(label)
  const [fill] = await stylesOf(page, strip, "indicator", ["background-color"])
  const [ink] = await stylesOf(page, strip, "current", ["color"])
  return contrast(
    rgbOf(ink?.color ?? ""),
    rgbOf(fill?.["background-color"] ?? ""),
  )
}

/** A 2px square centred on a point. */
const square = (x: number, y: number): Region => ({
  x: x - 1,
  y: y - 1,
  width: 2,
  height: 2,
})

function expectReadings(
  kind: string,
  floor: number,
  readings: [string, number][],
) {
  test.info().annotations.push({
    type: kind,
    description: readings
      .map(([label, value]) => `${label} ${value.toFixed(2)}`)
      .join("; "),
  })
  for (const [label, value] of readings) {
    expect(value, label).toBeGreaterThanOrEqual(floor)
  }
}

/**
 * The 1px edge blends with what lies beside it on a one-pixel grid, so the
 * strip is drawn 4× while its colours are sampled.
 */
async function magnified<T>(
  page: Page,
  strip: Strip,
  measure: (g: Geometry) => Promise<T>,
): Promise<T> {
  const scope = page.locator(strip.scope)
  await scope.evaluate((el) => {
    ;(el as HTMLElement).style.zoom = "4"
  })
  await settle(page)
  await scope.scrollIntoViewIfNeeded()
  try {
    return await measure(await geometry(page, strip))
  } finally {
    await scope.evaluate((el) => {
      ;(el as HTMLElement).style.zoom = ""
    })
    await settle(page)
  }
}

for (const mode of MODES) {
  test.describe(`tab anatomy · ${mode}`, () => {
    for (const tabStyle of STYLES) {
      test(`labels reach 4.5:1 · ${tabStyle}`, async ({ page }) => {
        await open(page, { mode }, tabStyle)
        const readings: [string, number][] = []
        for (const strip of ENABLED) {
          for (const name of ["current", "other"] as const) {
            readings.push([
              `${strip.name} ${name}`,
              await labelContrast(page, strip, name, tabStyle),
            ])
          }
        }
        expectReadings("label contrast", 4.5, readings)
      })
    }

    test("the underline bar reaches 3:1 against the ground", async ({
      page,
    }) => {
      await open(page, { mode }, "underline")
      const readings: [string, number][] = []
      for (const strip of ENABLED) {
        await part(page, strip, "list").scrollIntoViewIfNeeded()
        const { bar, vertical, rtl } = await geometry(page, strip)
        const b = bar as Box
        const beside = vertical
          ? square(rtl ? b.x + b.width + 4 : b.x - 4, b.y + b.height / 2)
          : square(b.x + b.width / 2, b.y - 4)
        readings.push([strip.name, await markContrast(page, b, beside)])
      }
      expectReadings("mark contrast", 3, readings)
    })

    // The fill alone can sit near the ground (1.88:1 under Forest & Lime's
    // own Flat look in light mode); the pill's 1px --primary edge is the
    // mark. Forest & Lime keeps its look: only tabStyle is stamped.
    for (const look of ["quiet", "forest-lime"] as const) {
      test(`the pill's edge reaches 3:1 against the ground · ${look}`, async ({
        page,
      }) => {
        if (look === "quiet") {
          await open(page, { mode }, "pill")
        } else {
          await seedApp(page, { mode, style: "flat", preset: "forest-lime" })
          await openControlFixture(page)
          await page
            .locator("html")
            .evaluate((el) => el.setAttribute("data-tab-style", "pill"))
          await settle(page)
        }
        const readings: [string, number][] = []
        for (const strip of ENABLED) {
          await magnified(page, strip, async ({ indicator, inner }) => {
            // The pill's top edge at its middle, 4x its 1px, and the
            // list's padding above it.
            const x = indicator.x + indicator.width / 2
            const edge = square(x, indicator.y + 2)
            const ground = square(x, (indicator.y + inner.y) / 2)
            readings.push([strip.name, await markContrast(page, edge, ground)])
          })
        }
        expectReadings("mark contrast", 3, readings)
      })
    }

    test("the outline cell's edge reaches 3:1 inside and out", async ({
      page,
    }) => {
      await open(page, { mode }, "outline")
      const readings: [string, number][] = []
      for (const strip of ENABLED) {
        await magnified(page, strip, async ({ current, list }) => {
          // The current cell is the first; its top edge is 4× its 1px.
          const x = current.x + current.width / 2
          const edge = square(x, current.y + 2)
          const fill = square(x, current.y + 10)
          const outside = square(x, list.y - 6)
          readings.push(
            [
              `${strip.name} edge on the cell`,
              await markContrast(page, edge, fill),
            ],
            [
              `${strip.name} edge on the ground`,
              await markContrast(page, edge, outside),
            ],
          )
        })
      }
      expectReadings("mark contrast", 3, readings)
    })

    test("leaves the app variants as they draw them", async ({ page }) => {
      await open(page, { mode }, "well")
      const variants = page.locator(APP_VARIANTS)
      const before = await record(variants)
      expect(before.length).toBeGreaterThan(20)
      for (const tabStyle of STYLES) {
        await restamp(page, tabStyle)
        expect(await record(variants), tabStyle).toEqual(before)
      }
    })

    test("checkStyle leaves every SegmentGroup alone under every tabStyle", async ({
      page,
    }) => {
      await open(page, { mode }, "well")
      const segments = page.locator(SEGMENTS)
      for (const tabStyle of ["well", ...STYLES] as const) {
        await restamp(page, tabStyle, "box")
        const before = await record(segments)
        expect(before.length).toBeGreaterThan(20)
        for (const checkStyle of CHECK_STYLES) {
          await restamp(page, tabStyle, checkStyle)
          expect(await record(segments), `${tabStyle} × ${checkStyle}`).toEqual(
            before,
          )
        }
      }
    })
  })
}

/** Per-channel tolerance for anti-aliasing and colour conversion. */
const TOLERANCE = 8

function close(actual: Rgb, expected: Rgb): boolean {
  return actual.every(
    (channel, i) => Math.abs(channel - (expected[i] ?? 0)) <= TOLERANCE,
  )
}

/** A system colour as Chromium's emulation paints it, from a probe. */
async function systemColour(page: Page, keyword: string): Promise<Rgb> {
  await page.evaluate((colour) => {
    const probe = document.createElement("div")
    probe.id = "system-colour-probe"
    probe.style.cssText = `position: fixed; left: 0; top: 0; width: 20px; height: 20px; z-index: 2147483647; forced-color-adjust: none; background: ${colour}`
    document.body.append(probe)
  }, keyword)
  const colour = await pixel(page, 10, 10)
  await page.evaluate(() =>
    document.getElementById("system-colour-probe")?.remove(),
  )
  return colour
}

/** The share of pixels along the middle row of an element's text that paint `colour`. */
async function textShare(
  page: Page,
  locator: Locator,
  colour: Rgb,
): Promise<number> {
  await locator.scrollIntoViewIfNeeded()
  const text = await locator.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const { x, y, width, height } = range.getBoundingClientRect()
    return { x, y, width, height }
  })
  const y = Math.floor(text.y + text.height / 2)
  let hits = 0
  let total = 0
  for (let x = Math.ceil(text.x); x < text.x + text.width; x++) {
    total++
    if (close(await pixel(page, x, y), colour)) hits++
  }
  return hits / total
}

const FORCED_STRIPS = STRIPS.filter((strip) =>
  [
    "tabs default",
    "tabs default-accent",
    "segment default",
    "segment default-accent",
  ].includes(strip.name),
)

for (const scheme of MODES) {
  test.describe(`tab anatomy under forced colours · ${scheme}`, () => {
    for (const tabStyle of STYLES) {
      test(`marks the current item · ${tabStyle}`, async ({ page }) => {
        await seedApp(page, { style: "quiet", mode: scheme })
        await page.emulateMedia({
          forcedColors: "active",
          colorScheme: scheme,
          reducedMotion: "reduce",
        })
        await openControlFixture(page)
        await kitLook(page, { tabStyle })
        await page.mouse.move(0, 0)
        await settle(page)
        const highlight = await systemColour(page, "Highlight")
        const highlightText = await systemColour(page, "HighlightText")
        const canvasText = await systemColour(page, "CanvasText")
        for (const strip of FORCED_STRIPS) {
          const current = part(page, strip, "current")
          const other = part(page, strip, "other").first()
          await current.scrollIntoViewIfNeeded()
          const inside = async (item: Locator) => {
            const box = await boxOf(item)
            return pixel(
              page,
              Math.floor(box.x + 4),
              Math.floor(box.y + box.height / 2),
            )
          }
          const behind = await inside(current)
          expect(
            close(await inside(other), highlight),
            `${strip.name} other`,
          ).toBe(false)
          if (tabStyle === "underline") {
            const { bar } = await geometry(page, strip)
            const b = bar as Box
            const mark = await pixel(
              page,
              Math.floor(b.x + b.width / 2),
              Math.floor(b.y + 0.5),
            )
            expect(close(mark, highlight), `${strip.name} bar ${mark}`).toBe(
              true,
            )
            expect(close(behind, highlight), `${strip.name} no box`).toBe(false)
            expect(
              await textShare(page, current, canvasText),
              `${strip.name} label`,
            ).toBeGreaterThan(0.02)
          } else {
            expect(
              close(behind, highlight),
              `${strip.name} box ${behind}`,
            ).toBe(true)
            expect(
              await textShare(page, current, highlightText),
              `${strip.name} label`,
            ).toBeGreaterThan(0.02)
          }
        }
      })
    }
  })
}

const FRAME_TIERS = ["default", "strong", "accent", "none"] as const
type Tier = (typeof FRAME_TIERS)[number]

/** The colour each `border` tier gives a framed strip. */
const TIER_COLOUR: Record<Tier, string> = {
  default: "hsl(var(--border))",
  strong: "hsl(var(--border-strong))",
  accent: "hsl(var(--primary) / 0.35)",
  none: "transparent",
}

interface FrameStrip extends Strip {
  tier: Tier
}

const frameScope = (name: string) =>
  `[data-probe="anatomy-tab-frames"] [data-case="${name}"]`

/** The default-variant strips the `border` prop frames. */
const FRAME_STRIPS: FrameStrip[] = [
  ...FRAME_TIERS.flatMap((tier): FrameStrip[] => [
    { name: `frame ${tier}`, kind: "tabs", tier, scope: frameScope(tier) },
    {
      name: `frame ${tier} vertical`,
      kind: "tabs",
      tier,
      scope: frameScope(`${tier}-vertical`),
    },
  ]),
  {
    name: "frame default vertical rtl",
    kind: "tabs",
    tier: "default",
    scope: frameScope("default-vertical-rtl"),
  },
]

for (const mode of MODES) {
  test.describe(`tab frames · ${mode}`, () => {
    test("outline: the tier recolours the ruled frame and dividers, never a second frame", async ({
      page,
    }) => {
      await open(page, { mode }, "outline")
      for (const strip of FRAME_STRIPS) {
        const label = strip.name
        const g = await geometry(page, strip)
        const [list] = await stylesOf(page, strip, "list", [
          "border-top-color",
          "border-right-color",
          "border-bottom-color",
          "border-left-color",
        ])
        expect(Object.values(list ?? {}), `${label} list edge`).toEqual([
          "rgba(0, 0, 0, 0)",
          "rgba(0, 0, 0, 0)",
          "rgba(0, 0, 0, 0)",
          "rgba(0, 0, 0, 0)",
        ])
        expect(g.frame, `${label} frame`).not.toBeNull()
        const { color: rule } = await resolve(page, strip, {
          color: TIER_COLOUR[strip.tier],
        })
        const [frame] = await stylesOf(
          page,
          strip,
          "list",
          ["border-top-color"],
          "::before",
        )
        expect(frame?.["border-top-color"], `${label} frame colour`).toBe(rule)
        // One, the current cell, then Two, whose divider the current
        // cell's edge replaces, then Three.
        const side = g.vertical
          ? "border-top-color"
          : "border-inline-start-color"
        const items = await stylesOf(page, strip, "item", [side])
        expect(items[2]?.[side], `${label} divider`).toBe(rule)
        expect(
          items[1]?.[side],
          `${label} divider after the current cell`,
        ).toBe("rgba(0, 0, 0, 0)")
        const { color: edge } = await resolve(page, strip, {
          color: "hsl(var(--primary))",
        })
        const [current] = await stylesOf(page, strip, "current", [
          "border-top-color",
        ])
        expect(current?.["border-top-color"], `${label} current edge`).toBe(
          edge,
        )
      }
    })

    test("underline: a tier's frame replaces the baseline and none keeps it", async ({
      page,
    }) => {
      await open(page, { mode }, "underline")
      for (const strip of FRAME_STRIPS) {
        const label = strip.name
        const [list] = await stylesOf(page, strip, "list", [
          "border-top-width",
          "border-top-color",
          "box-shadow",
          "border-top-left-radius",
        ])
        if (strip.tier === "none") {
          expect(list?.["border-top-color"], label).toBe("rgba(0, 0, 0, 0)")
          expect(list?.["box-shadow"], `${label} baseline`).not.toBe("none")
          expect(list?.["border-top-left-radius"], `${label} corners`).toBe(
            "0px",
          )
          continue
        }
        const expected = await resolve(page, strip, {
          color: TIER_COLOUR[strip.tier],
          "border-top-left-radius": "var(--radius)",
        })
        expect(list?.["border-top-width"], `${label} frame width`).toBe("1px")
        expect(list?.["border-top-color"], `${label} frame`).toBe(
          expected.color,
        )
        expect(list?.["box-shadow"], `${label} no baseline`).toBe("none")
        expect(list?.["border-top-left-radius"], `${label} corners`).toBe(
          expected["border-top-left-radius"],
        )
      }
    })

    test("outline under forced colours paints the framed strip's own edge as Canvas", async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode })
      await page.emulateMedia({
        forcedColors: "active",
        colorScheme: mode,
        reducedMotion: "reduce",
      })
      await openControlFixture(page)
      await kitLook(page, { tabStyle: "outline" })
      await page.mouse.move(0, 0)
      await settle(page)
      const canvas = await systemColour(page, "Canvas")
      const canvasText = await systemColour(page, "CanvasText")
      for (const strip of FRAME_STRIPS.filter(
        (s) => s.tier !== "none" && !s.name.includes("vertical"),
      )) {
        const list = part(page, strip, "list")
        await list.scrollIntoViewIfNeeded()
        const box = await boxOf(list)
        const edge = await pixel(
          page,
          Math.floor(box.x + box.width / 2),
          Math.floor(box.y + 0.5),
        )
        expect(close(edge, canvas), `${strip.name} edge ${edge}`).toBe(true)
        expect(close(edge, canvasText), `${strip.name} edge ${edge}`).toBe(
          false,
        )
      }
      // The ruled frame lies under the triggers' forced edges, so a pixel
      // cannot show it; the computed colour can.
      for (const strip of FRAME_STRIPS.filter((s) => s.tier === "none")) {
        const [frame] = await stylesOf(
          page,
          strip,
          "list",
          ["border-top-color"],
          "::before",
        )
        const colour = rgbOf(frame?.["border-top-color"] ?? "")
        expect(close(colour, canvas), `${strip.name} frame ${colour}`).toBe(
          true,
        )
      }
    })
  })
}
