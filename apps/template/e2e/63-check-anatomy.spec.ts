import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  attrOf,
  boxOf,
  kitLook,
  seedApp,
  type Box,
  type ThemeSeed,
} from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { markContrast, settle, type Region } from "./helpers/measure"

/**
 * checkStyle restyles every Checkbox and every Radio item that is not a
 * SegmentGroup item. `outline` leaves a checked or mixed checkbox unfilled
 * behind a 1.5px --primary edge with a --primary tick or bar, and draws a
 * chosen radio as a 1.5px --primary ring around a dot half the box across;
 * `round` draws every checkbox with --radius-pill. Box sizes, hit areas and
 * the focus ring stay as the kit default draws them, and SegmentGroups do
 * not change.
 */

const MODES = ["light", "dark"] as const
const STYLES = ["outline", "round"] as const
const SIZES = ["sm", "default", "lg"] as const
type CheckStyle = "box" | (typeof STYLES)[number]

const CHECKBOXES = '[data-probe="anatomy-checkboxes"]'
const RADIOS = '[data-probe="anatomy-radios"]'
const CARD_CHECKBOX = '[data-probe="anatomy-card"] [data-case="checkbox"]'
const SEGMENTS =
  '[data-probe="anatomy-segments"], [data-probe="anatomy-card"] [data-case="segment"]'

const PROPERTIES = [
  "border-top-width",
  "border-left-width",
  "border-top-color",
  "border-top-left-radius",
  "background-color",
  "color",
  "box-shadow",
  "opacity",
]

const checkbox = (page: Page, name: string) =>
  page.locator(`${CHECKBOXES} [data-case="${name}"]`)
const radios = (page: Page, group: string) =>
  page.locator(`${RADIOS} [data-case="${group}"] .dr-radio-group-item`)

async function open(page: Page, seed: ThemeSeed, checkStyle: CheckStyle) {
  await seedApp(page, { style: "quiet", mode: "light", ...seed })
  await openControlFixture(page)
  await kitLook(page, { checkStyle })
  await settle(page)
}

async function restamp(page: Page, checkStyle: CheckStyle) {
  await kitLook(page, { checkStyle })
  await settle(page)
}

/** Each matched element's PROPERTIES, in document order. */
function styles(locator: Locator): Promise<Record<string, string>[]> {
  return locator.evaluateAll(
    (elements, names) =>
      elements.map((el) => {
        const style = getComputedStyle(el)
        return Object.fromEntries(
          names.map((name) => [name, style.getPropertyValue(name)]),
        )
      }),
    PROPERTIES,
  )
}

/** What the browser computes for a colour and a border width at the root. */
async function resolved(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div")
    probe.style.color = "hsl(var(--primary))"
    probe.style.border = "1.5px solid"
    document.body.append(probe)
    const style = getComputedStyle(probe)
    const result = { primary: style.color, width: style.borderTopWidth }
    probe.remove()
    return result
  })
}

/** A 2px square centred on a point given as fractions of a box. */
const at = (box: Box, fx: number, fy: number): Region => ({
  x: box.x + box.width * fx - 1,
  y: box.y + box.height * fy - 1,
  width: 2,
  height: 2,
})

/** Inside the 6px edge a 4× control draws, at its vertical centre. */
const edgeOf = (box: Box): Region => ({
  x: box.x + 2,
  y: box.y + box.height / 2 - 1,
  width: 2,
  height: 2,
})

/** The ground just outside the edge, inside the 8px gap to a neighbour. */
const outside = (box: Box): Region => ({
  x: box.x - 5,
  y: box.y + box.height / 2 - 1,
  width: 2,
  height: 2,
})

/**
 * The edge and the tick are 1-1.5px strokes, which blend with the ground on
 * a one-pixel grid, so a control is drawn 4× while its colours are sampled.
 */
async function magnified<T>(
  control: Locator,
  measure: (box: Box) => Promise<T>,
): Promise<T> {
  await control.evaluate((el) => {
    ;(el as HTMLElement).style.zoom = "4"
  })
  await control.scrollIntoViewIfNeeded()
  try {
    return await measure(await boxOf(control))
  } finally {
    await control.evaluate((el) => {
      ;(el as HTMLElement).style.zoom = ""
    })
  }
}

/** Points on lucide's Check (long stroke) and Minus, in its 24-unit box. */
const TICK = [14.5 / 24, 11.5 / 24] as const
const BAR = [0.5, 0.5] as const
const INSIDE = [6 / 24, 6 / 24] as const

/** The checked and mixed checkbox of every size, and the one on the card. */
async function markedCheckboxes(page: Page): Promise<Locator[]> {
  const card = page.locator(CARD_CHECKBOX)
  await card.click()
  await expect(card).toHaveAttribute("data-state", "checked")
  await settle(page)
  return [
    ...SIZES.flatMap((size) => [
      checkbox(page, `${size}-checked`),
      checkbox(page, `${size}-indeterminate`),
    ]),
    card,
  ]
}

function expectMarks(readings: [string, number][]) {
  test.info().annotations.push({
    type: "mark contrast",
    description: readings
      .map(([label, value]) => `${label} ${value.toFixed(2)}`)
      .join("; "),
  })
  for (const [label, value] of readings) {
    expect(value, label).toBeGreaterThanOrEqual(3)
  }
}

test.describe("check anatomy", () => {
  for (const density of ["default", "compact", "spacious"] as const) {
    test(`keeps every box's size and place · ${density}`, async ({ page }) => {
      await open(page, density === "default" ? {} : { density }, "box")
      const controls = page.locator(
        `${CHECKBOXES} .dr-checkbox, ${RADIOS} .dr-radio-group-item`,
      )
      const boxes = () =>
        controls.evaluateAll((elements) =>
          elements.map((el) => {
            const { x, y, width, height } = el.getBoundingClientRect()
            return { x, y, width, height }
          }),
        )
      const before = await boxes()
      expect(before).toHaveLength(19)
      for (const checkStyle of STYLES) {
        await restamp(page, checkStyle)
        expect(await boxes(), checkStyle).toEqual(before)
      }
    })
  }

  test("outline leaves a checked box unfilled behind a 1.5px primary edge", async ({
    page,
  }) => {
    await open(page, {}, "box")
    const all = page.locator(`${CHECKBOXES} .dr-checkbox`)
    const before = await styles(all)
    const states = await all.evaluateAll((elements) =>
      elements.map((el) => el.getAttribute("data-state")),
    )
    await restamp(page, "outline")
    const after = await styles(all)
    const { primary, width } = await resolved(page)
    expect(states.filter((state) => state !== "unchecked")).toHaveLength(7)
    states.forEach((state, i) => {
      if (state === "unchecked") {
        expect(after[i], `checkbox ${i}`).toEqual(before[i])
        return
      }
      expect(after[i], `checkbox ${i}`).toEqual({
        ...before[i],
        "border-top-width": width,
        "border-left-width": width,
        "border-top-color": primary,
        "background-color": "rgba(0, 0, 0, 0)",
        color: primary,
      })
    })
  })

  test("outline rings a chosen radio and halves its dot", async ({ page }) => {
    await open(page, {}, "box")
    const all = page.locator(`${RADIOS} .dr-radio-group-item`)
    const before = await styles(all)
    const states = await all.evaluateAll((elements) =>
      elements.map((el) => el.getAttribute("data-state")),
    )
    await restamp(page, "outline")
    const after = await styles(all)
    const { primary, width } = await resolved(page)
    expect(states.filter((state) => state === "checked")).toHaveLength(4)
    states.forEach((state, i) => {
      expect(after[i], `radio ${i}`).toEqual(
        state === "checked"
          ? {
              ...before[i],
              "border-top-width": width,
              "border-left-width": width,
              "border-top-color": primary,
            }
          : before[i],
      )
    })

    for (const dir of ["ltr", "rtl"] as const) {
      await page.locator("html").evaluate((el, value) => {
        el.setAttribute("dir", value)
      }, dir)
      for (const size of SIZES) {
        const item = radios(page, size).nth(1)
        const box = await boxOf(item)
        const dot = await boxOf(item.locator("svg"))
        expect(dot.width, `${size} dot width`).toBeCloseTo(box.width / 2, 1)
        expect(dot.height, `${size} dot height`).toBeCloseTo(box.height / 2, 1)
        const offset = (axis: "x" | "y", extent: "width" | "height") =>
          Math.abs(dot[axis] + dot[extent] / 2 - (box[axis] + box[extent] / 2))
        expect(offset("x", "width"), `${size} ${dir} centred`).toBeLessThan(0.5)
        expect(offset("y", "height"), `${size} ${dir} centred`).toBeLessThan(
          0.5,
        )
      }
    }
  })

  test("round circles every checkbox and leaves radios alone", async ({
    page,
  }) => {
    await open(page, {}, "box")
    const checks = page.locator(`${CHECKBOXES} .dr-checkbox`)
    const radioItems = page.locator(`${RADIOS} .dr-radio-group-item`)
    const beforeChecks = await styles(checks)
    const beforeRadios = await styles(radioItems)
    await restamp(page, "round")
    const afterChecks = await styles(checks)
    const heights = await checks.evaluateAll((elements) =>
      elements.map((el) => el.getBoundingClientRect().height),
    )
    afterChecks.forEach((style, i) => {
      const radius = style["border-top-left-radius"] as string
      expect(parseFloat(radius), `checkbox ${i} radius`).toBeGreaterThanOrEqual(
        (heights[i] as number) / 2,
      )
      expect(style, `checkbox ${i}`).toEqual({
        ...beforeChecks[i],
        "border-top-left-radius": radius,
      })
    })
    expect(await styles(radioItems)).toEqual(beforeRadios)
  })

  test("round squares checkboxes under the sharp radius step", async ({
    page,
  }) => {
    await open(page, { radius: "sharp" }, "round")
    const radii = await styles(page.locator(`${CHECKBOXES} .dr-checkbox`))
    expect(radii).toHaveLength(11)
    for (const style of radii) {
      expect(style["border-top-left-radius"]).toBe("0px")
    }
  })

  test("keeps the keyboard focus ring", async ({ page }) => {
    await open(page, {}, "box")
    // A key press puts the page in keyboard modality, so a scripted focus
    // matches :focus-visible as a Tab press would.
    await page.keyboard.press("Shift")
    const targets = [
      checkbox(page, "default-checked"),
      checkbox(page, "default-unchecked"),
      radios(page, "default").nth(1),
    ]
    const ring = (target: Locator) =>
      target.evaluate((el) => {
        ;(el as HTMLElement).focus()
        const style = getComputedStyle(el)
        return {
          visible: el.matches(":focus-visible"),
          outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
          offset: style.outlineOffset,
        }
      })
    const expected = []
    for (const target of targets) expected.push(await ring(target))
    for (const [i, reading] of expected.entries()) {
      expect(reading, `target ${i}`).toMatchObject({
        visible: true,
        offset: "2px",
      })
      expect(reading?.outline, `target ${i}`).toMatch(/^solid 2px /)
    }
    for (const checkStyle of STYLES) {
      await restamp(page, checkStyle)
      for (const [i, target] of targets.entries()) {
        expect(await ring(target), `${checkStyle} ${i}`).toEqual(expected[i])
      }
    }
  })

  for (const checkStyle of STYLES) {
    test(
      `a tap 2px outside the face, inside the hit area, works · ${checkStyle}`,
      { tag: "@touch" },
      async ({ page }, testInfo) => {
        await open(page, {}, checkStyle)
        const tap = async (target: Locator) => {
          await target.scrollIntoViewIfNeeded()
          const box = await boxOf(target)
          const x = box.x - 2
          const y = box.y + box.height / 2
          if (testInfo.project.use.hasTouch) await page.touchscreen.tap(x, y)
          else await page.mouse.click(x, y)
        }
        const box = checkbox(page, "default-unchecked")
        await tap(box)
        await expect(box).toHaveAttribute("aria-checked", "true")
        const first = radios(page, "default").first()
        await tap(first)
        await expect(first).toHaveAttribute("aria-checked", "true")
      },
    )
  }
})

for (const mode of MODES) {
  test.describe(`check anatomy · ${mode}`, () => {
    test("outline marks reach 3:1 against the ground beside them", async ({
      page,
    }) => {
      await open(page, { mode }, "outline")
      const readings: [string, number][] = []
      for (const target of await markedCheckboxes(page)) {
        const name = await attrOf(target, "data-case")
        const mixed = (await attrOf(target, "data-state")) === "indeterminate"
        await magnified(target, async (box) => {
          const svg = await boxOf(target.locator("svg"))
          const [mx, my] = mixed ? BAR : TICK
          readings.push(
            [
              `${name} edge`,
              await markContrast(page, edgeOf(box), outside(box)),
            ],
            [
              `${name} ${mixed ? "bar" : "tick"}`,
              await markContrast(page, at(svg, mx, my), at(svg, ...INSIDE)),
            ],
          )
        })
      }
      for (const size of SIZES) {
        const item = radios(page, size).nth(1)
        await magnified(item, async (box) => {
          readings.push(
            [
              `radio ${size} ring`,
              await markContrast(page, edgeOf(box), outside(box)),
            ],
            [
              `radio ${size} dot`,
              await markContrast(page, item.locator("svg"), at(box, 0.18, 0.5)),
            ],
          )
        })
      }
      expectMarks(readings)
    })

    test("round fills and ticks reach 3:1", async ({ page }) => {
      await open(page, { mode }, "round")
      const readings: [string, number][] = []
      for (const target of await markedCheckboxes(page)) {
        const name = await attrOf(target, "data-case")
        const mixed = (await attrOf(target, "data-state")) === "indeterminate"
        await magnified(target, async (box) => {
          const svg = await boxOf(target.locator("svg"))
          const fill = at(svg, ...INSIDE)
          const [mx, my] = mixed ? BAR : TICK
          readings.push(
            [`${name} fill`, await markContrast(page, fill, outside(box))],
            [
              `${name} ${mixed ? "bar" : "tick"}`,
              await markContrast(page, at(svg, mx, my), fill),
            ],
          )
        })
      }
      expectMarks(readings)
    })

    test("leaves every SegmentGroup as the default draws it", async ({
      page,
    }) => {
      await open(page, { mode }, "box")
      const record = () =>
        page.locator(SEGMENTS).evaluateAll((roots) =>
          roots.flatMap((root) =>
            [root, ...root.querySelectorAll("*")].map((el) => {
              const reading: Record<string, string> = {}
              for (const pseudo of [null, "::before", "::after"]) {
                const style = getComputedStyle(el, pseudo)
                for (let i = 0; i < style.length; i++) {
                  const name = style.item(i)
                  if (name.startsWith("transition")) continue
                  reading[`${pseudo ?? ""}${name}`] =
                    style.getPropertyValue(name)
                }
              }
              const { x, y, width, height } = el.getBoundingClientRect()
              reading.box = `${x} ${y} ${width} ${height}`
              return reading
            }),
          ),
        )
      const before = await record()
      expect(before.length).toBeGreaterThan(20)
      for (const checkStyle of STYLES) {
        await restamp(page, checkStyle)
        expect(await record(), checkStyle).toEqual(before)
      }
    })
  })
}
