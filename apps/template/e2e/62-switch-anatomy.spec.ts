import { test, expect, type Locator, type Page } from "@playwright/test"
import { kitLook, seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import {
  computed,
  contrast,
  markContrast,
  rgbOf,
  settle,
  textContrast,
  type Region,
  type Rgb,
} from "./helpers/measure"

/**
 * switchStyle restyles every switch from the root attribute. On the control
 * fixture's switches, under Quiet in light and dark with every other
 * signature at its kit default: each value keeps the 36x20 box, the 24px
 * hit area and the focus ring, draws its own track, thumb and marks, keeps
 * 3:1 for its state marks and 4.5:1 for its glyphs, and mirrors right to
 * left.
 */

const MODES = ["light", "dark"] as const
const STYLES = ["pill", "track", "slide", "marked"] as const
const NEW_STYLES = ["track", "slide", "marked"] as const
type SwitchStyle = (typeof STYLES)[number]

const PROBE = '[data-probe="anatomy-switches"]'
const CASES = ["off", "on", "off-disabled", "on-disabled"] as const

const switchOf = (page: Page, name: string) =>
  page.locator(`${PROBE} .dr-switch[data-case="${name}"]`)
const thumbOf = (sw: Locator) => sw.locator(".dr-switch-thumb")
const marksOf = (sw: Locator) => sw.locator(".dr-switch-marks")

async function open(page: Page, mode: string) {
  await seedApp(page, { style: "quiet", mode })
  await openControlFixture(page)
}

async function look(page: Page, switchStyle: SwitchStyle) {
  await kitLook(page, { switchStyle })
  await settle(page)
}

async function boxOf(locator: Locator): Promise<Region> {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) throw new Error("no box")
  return box
}

/** A part's box relative to its switch, to the hundredth of a pixel. */
async function within(part: Locator, sw: Locator) {
  const [inner, outer] = [await boxOf(part), await boxOf(sw)]
  const round = (value: number) => Math.round(value * 100) / 100
  return {
    x: round(inner.x - outer.x),
    y: round(inner.y - outer.y),
    width: round(inner.width),
    height: round(inner.height),
  }
}

/** A region given relative to a switch's box. */
function at(box: Region, x: number, y: number, width: number, height: number) {
  return { x: box.x + x, y: box.y + y, width, height }
}

function pseudo(
  locator: Locator,
  which: "::before" | "::after",
  property: string,
): Promise<string> {
  return locator.evaluate(
    (el, [w, p]) => getComputedStyle(el, w).getPropertyValue(p),
    [which, property] as const,
  )
}

/** What a colour value computes to as a background on the page. */
function paint(page: Page, value: string): Promise<string> {
  return page.evaluate((v) => {
    const probe = document.createElement("div")
    probe.style.backgroundColor = v
    document.body.append(probe)
    const out = getComputedStyle(probe).backgroundColor
    probe.remove()
    return out
  }, value)
}

/** What a radius value computes to on the page. */
function radius(page: Page, value: string): Promise<string> {
  return page.evaluate((v) => {
    const probe = document.createElement("div")
    probe.style.borderTopLeftRadius = v
    document.body.append(probe)
    const out = getComputedStyle(probe).borderTopLeftRadius
    probe.remove()
    return out
  }, value)
}

/**
 * Pixels in a region that stand at least 2:1 off a ground colour: the ink a
 * glyph leaves in a stretch of plain track.
 */
async function inkPixels(page: Page, region: Region, ground: Rgb) {
  const clip = {
    x: Math.round(region.x),
    y: Math.round(region.y),
    width: Math.round(region.width),
    height: Math.round(region.height),
  }
  const png = await page.screenshot({ clip, scale: "css" })
  const colours = await page.evaluate(
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
    { b64: png.toString("base64"), width: clip.width, height: clip.height },
  )
  return colours.filter((colour) => contrast(colour, ground) >= 2).length
}

async function rtl(page: Page) {
  await page.locator(PROBE).evaluate((el) => el.setAttribute("dir", "rtl"))
  await settle(page)
}

for (const mode of MODES) {
  test.describe(`switch anatomy · ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, mode)
    })

    test("every style keeps the 36x20 box, the 24px hit area and the focus ring", async ({
      page,
    }) => {
      await look(page, "pill")
      const boxes = async () =>
        Promise.all(CASES.map(async (name) => boxOf(switchOf(page, name))))
      const hitArea = async () =>
        Promise.all(
          CASES.map(async (name) => ({
            width: await pseudo(switchOf(page, name), "::before", "width"),
            height: await pseudo(switchOf(page, name), "::before", "height"),
          })),
        )
      const pill = { boxes: await boxes(), hitArea: await hitArea() }
      for (const box of pill.boxes) {
        expect([box.width, box.height]).toEqual([36, 20])
      }
      for (const style of NEW_STYLES) {
        await look(page, style)
        expect(await boxes(), style).toEqual(pill.boxes)
        expect(await hitArea(), style).toEqual(pill.hitArea)
        await switchOf(page, "off").focus()
        await page.keyboard.press("Tab")
        const on = switchOf(page, "on")
        await expect(on).toBeFocused()
        expect(await computed(on, "outline-style"), style).toBe("solid")
        expect(await computed(on, "outline-width"), style).toBe("2px")
        expect(await computed(on, "outline-offset"), style).toBe("2px")
        await on.blur()
      }
    })

    test("track narrows the track to 14px under a 20px thumb that overhangs it", async ({
      page,
    }) => {
      await look(page, "track")
      const off = switchOf(page, "off")
      const on = switchOf(page, "on")
      for (const sw of [off, on]) {
        expect(await computed(sw, "border-top-width")).toBe("3px")
        expect(await computed(sw, "border-bottom-width")).toBe("3px")
        expect(await computed(sw, "background-clip")).toBe("padding-box")
        expect(await computed(sw, "border-top-color")).toBe("rgba(0, 0, 0, 0)")
      }
      expect(await within(thumbOf(off), off)).toEqual({
        x: 0,
        y: 0,
        width: 20,
        height: 20,
      })
      expect(await within(thumbOf(on), on)).toEqual({
        x: 16,
        y: 0,
        width: 20,
        height: 20,
      })
      expect(await computed(on, "background-color")).toBe(
        await paint(page, "hsl(var(--primary-4))"),
      )
      expect(await computed(off, "background-color")).toBe(
        await paint(page, "var(--well-fill, hsl(var(--input)))"),
      )
      const accent = await paint(page, "hsl(var(--primary-text))")
      expect(await computed(thumbOf(on), "background-image")).toBe(
        `linear-gradient(${accent}, ${accent})`,
      )
      expect(await computed(thumbOf(off), "background-color")).toBe(
        await paint(page, "var(--surface-card-fill-opaque)"),
      )
      expect(await computed(thumbOf(off), "box-shadow")).toMatch(
        new RegExp(
          `^${(await paint(page, "hsl(var(--border-strong))")).replace(/[()]/g, "\\$&")} 0px 0px 0px 1px`,
        ),
      )

      // The accent thumb against the --primary-4 track it sits on and the
      // page it overhangs.
      const onBox = await boxOf(on)
      const onTrack = await markContrast(
        page,
        thumbOf(on),
        at(onBox, 6, 8, 4, 4),
      )
      const onPage = await markContrast(
        page,
        thumbOf(on),
        at(onBox, 38, 8, 4, 4),
      )
      // The ring of the card-tone thumb, at its inline end against the
      // track and at its top against the page.
      const offBox = await boxOf(off)
      const ringTrack = await markContrast(
        page,
        at(offBox, 20, 8, 1, 4),
        at(offBox, 24, 8, 6, 4),
      )
      const ringPage = await markContrast(
        page,
        at(offBox, 9, -1, 2, 1),
        at(offBox, 8, -6, 4, 3),
      )
      for (const value of [onTrack, onPage, ringTrack, ringPage]) {
        expect(value).toBeGreaterThanOrEqual(3)
      }

      // The same thumb on a card.
      const card = page.locator(
        '[data-probe="anatomy-card"] .dr-switch[data-case="switch"]',
      )
      const cardBox = await boxOf(card)
      const ringCard = await markContrast(
        page,
        at(cardBox, 9, -1, 2, 1),
        at(cardBox, 8, -6, 4, 3),
      )
      expect(ringCard).toBeGreaterThanOrEqual(3)
    })

    test("slide draws a slot, a ridged thumb and a lamp where the thumb has left", async ({
      page,
    }) => {
      await look(page, "slide")
      const off = switchOf(page, "off")
      const on = switchOf(page, "on")
      const slot = await paint(page, "var(--well-fill, hsl(var(--input)))")
      const edge = await paint(page, "var(--field-edge)")
      const slotRadius = await radius(
        page,
        "min(var(--switch-radius), calc(var(--radius) * 0.25))",
      )
      for (const sw of [off, on]) {
        expect(await computed(sw, "background-color")).toBe(slot)
        expect(await computed(sw, "border-top-color")).toBe(edge)
        expect(await computed(sw, "border-top-left-radius")).toBe(slotRadius)
        const thumb = thumbOf(sw)
        expect(await computed(thumb, "background-color")).toBe(
          await paint(
            page,
            "var(--thumb-fill, var(--surface-card-fill-opaque))",
          ),
        )
        expect(await pseudo(thumb, "::after", "content")).toBe('""')
        expect(await pseudo(thumb, "::after", "width")).toBe("5px")
        expect(await pseudo(thumb, "::after", "height")).toBe("8px")
        expect(await pseudo(thumb, "::after", "background-image")).toContain(
          "repeating-linear-gradient",
        )
      }
      expect(await within(thumbOf(off), off)).toEqual({
        x: 2,
        y: 2,
        width: 18,
        height: 16,
      })
      expect(await within(thumbOf(on), on)).toEqual({
        x: 16,
        y: 2,
        width: 18,
        height: 16,
      })
      expect(await within(marksOf(off), off)).toEqual({
        x: 24,
        y: 7,
        width: 6,
        height: 6,
      })
      expect(await within(marksOf(on), on)).toEqual({
        x: 6,
        y: 7,
        width: 6,
        height: 6,
      })
      const accent = await paint(page, "hsl(var(--primary-text))")
      expect(await computed(marksOf(on), "background-image")).toBe(
        `linear-gradient(${accent}, ${accent})`,
      )
      expect(await computed(marksOf(on), "box-shadow")).toBe(
        `${accent} 0px 0px 4px 0px`,
      )
      expect(await computed(marksOf(off), "background-color")).toBe(edge)
      expect(await computed(marksOf(off), "box-shadow")).toBe("none")

      // The lit lamp against the slot above it, clear of its glow.
      const lamp = await markContrast(
        page,
        marksOf(on),
        at(await boxOf(on), 3, 3, 10, 2),
      )
      const offBox = await boxOf(off)
      // The thumb's ring at its free edge against the slot.
      const ring = await markContrast(
        page,
        at(offBox, 20, 8, 1, 4),
        at(offBox, 21, 5, 2, 10),
      )
      for (const value of [lamp, ring]) {
        expect(value).toBeGreaterThanOrEqual(3)
      }
    })

    test("marked writes an O in the inline-end half when off and an I in the inline-start half when on", async ({
      page,
    }) => {
      const off = switchOf(page, "off")
      const on = switchOf(page, "on")
      const halves = async () => {
        const [offBox, onBox] = [await boxOf(off), await boxOf(on)]
        const offGround = rgbOf(await computed(off, "background-color"))
        const onGround = rgbOf(await computed(on, "background-color"))
        return {
          off: await inkPixels(page, at(offBox, 21, 5, 10, 10), offGround),
          on: await inkPixels(page, at(onBox, 5, 5, 10, 10), onGround),
        }
      }
      await look(page, "pill")
      expect(await halves()).toEqual({ off: 0, on: 0 })

      await look(page, "marked")
      const ink = await halves()
      expect(ink.off).toBeGreaterThan(4)
      expect(ink.on).toBeGreaterThan(4)
      expect(await pseudo(marksOf(off), "::before", "content")).toBe('"O"')
      expect(await pseudo(marksOf(off), "::after", "content")).toBe("none")
      expect(await pseudo(marksOf(on), "::after", "content")).toBe('"I"')
      expect(await pseudo(marksOf(on), "::before", "content")).toBe("none")
      for (const [marks, which] of [
        [marksOf(off), "::before"],
        [marksOf(on), "::after"],
      ] as const) {
        expect(await pseudo(marks, which, "font-size")).toBe("9px")
        expect(await pseudo(marks, which, "font-weight")).toBe("600")
      }
      const offText = await textContrast(marksOf(off))
      const onText = await textContrast(marksOf(on))
      expect(offText).toBeGreaterThanOrEqual(4.5)
      expect(onText).toBeGreaterThanOrEqual(4.5)
    })

    test("every style mirrors its thumb, lamp and marks right to left", async ({
      page,
    }) => {
      const parts = async () => {
        const out: { [part: string]: Region } = {}
        for (const name of ["off", "on"]) {
          const sw = switchOf(page, name)
          out[`${name} thumb`] = await within(thumbOf(sw), sw)
          out[`${name} marks`] = await within(marksOf(sw), sw)
        }
        return out
      }
      const mirrored = (parts: { [part: string]: Region }) =>
        Object.fromEntries(
          Object.entries(parts).map(([name, box]) => [
            name,
            {
              ...box,
              x: Math.round((36 - box.x - box.width) * 100) / 100,
            },
          ]),
        )
      const ltr: { [style: string]: { [part: string]: Region } } = {}
      for (const style of STYLES) {
        await look(page, style)
        ltr[style] = await parts()
      }
      await rtl(page)
      for (const style of STYLES) {
        await look(page, style)
        const actual = await parts()
        const expected = mirrored(ltr[style] ?? {})
        // The empty marks span of pill and track is a 0x0 flex item after
        // the thumb, not a mark; only its drawn forms must mirror.
        if (style === "pill" || style === "track") {
          delete actual["off marks"]
          delete actual["on marks"]
          delete expected["off marks"]
          delete expected["on marks"]
        }
        expect(actual, style).toEqual(expected)
      }
      await look(page, "marked")
      const [offBox, onBox] = [
        await boxOf(switchOf(page, "off")),
        await boxOf(switchOf(page, "on")),
      ]
      const offGround = rgbOf(
        await computed(switchOf(page, "off"), "background-color"),
      )
      const onGround = rgbOf(
        await computed(switchOf(page, "on"), "background-color"),
      )
      expect(
        await inkPixels(page, at(offBox, 5, 5, 10, 10), offGround),
      ).toBeGreaterThan(4)
      expect(
        await inkPixels(page, at(onBox, 21, 5, 10, 10), onGround),
      ).toBeGreaterThan(4)
    })

    test("a disabled switch keeps its style's parts and fades", async ({
      page,
    }) => {
      await look(page, "pill")
      const faded = await computed(switchOf(page, "off-disabled"), "opacity")
      expect(Number(faded)).toBeLessThan(1)
      for (const style of NEW_STYLES) {
        await look(page, style)
        for (const name of ["off", "on"]) {
          const sw = switchOf(page, name)
          const disabled = switchOf(page, `${name}-disabled`)
          expect(await computed(disabled, "opacity"), style).toBe(faded)
          expect(
            await within(thumbOf(disabled), disabled),
            `${style} ${name}`,
          ).toEqual(await within(thumbOf(sw), sw))
          expect(
            await within(marksOf(disabled), disabled),
            `${style} ${name}`,
          ).toEqual(await within(marksOf(sw), sw))
          expect(await computed(thumbOf(disabled), "background-color")).toBe(
            await computed(thumbOf(sw), "background-color"),
          )
        }
      }
    })

    // theme.css restates the checked track and thumb in system colours; the
    // marks span is exempt from that coverage because its lamp and glyph
    // stay visible on their own.
    test("under forced colours a checked switch keeps its thumb, lamp and glyph", async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active", colorScheme: mode })
      const on = switchOf(page, "on")
      for (const style of NEW_STYLES) {
        await look(page, style)
        const track = at(await boxOf(on), 3, 4, 2, 12)
        expect(
          await markContrast(page, thumbOf(on), track),
          style,
        ).toBeGreaterThanOrEqual(3)
      }
      await look(page, "slide")
      expect(
        await markContrast(page, marksOf(on), at(await boxOf(on), 3, 4, 2, 12)),
      ).toBeGreaterThanOrEqual(3)
      await look(page, "marked")
      const ground = rgbOf(await computed(on, "background-color"))
      expect(
        await inkPixels(page, at(await boxOf(on), 5, 5, 10, 10), ground),
      ).toBeGreaterThan(4)
    })
  })
}

test.describe("switch anatomy · hit area", () => {
  for (const style of NEW_STYLES) {
    test(
      `${style}: a tap in the 2px band outside the face toggles the switch`,
      { tag: "@touch" },
      async ({ page, hasTouch }) => {
        await open(page, "light")
        await look(page, style)
        const sw = switchOf(page, "off")
        const box = await boxOf(sw)
        const x = box.x + box.width / 2
        const hits = (y: number) =>
          page.evaluate(
            ([px, py]) =>
              document
                .elementFromPoint(px, py)
                ?.closest(".dr-switch")
                ?.getAttribute("data-case") ?? null,
            [x, y] as const,
          )
        const tap = async (y: number) => {
          if (hasTouch) await page.touchscreen.tap(x, y)
          else await page.mouse.click(x, y)
        }
        const above = box.y - 1
        const below = box.y + box.height + 1
        expect(await hits(above)).toBe("off")
        expect(await hits(below)).toBe("off")
        // The band ends with the 24px hit area.
        expect(await hits(box.y - 3)).toBeNull()
        expect(await hits(box.y + box.height + 3)).toBeNull()
        await tap(above)
        await expect(sw).toHaveAttribute("aria-checked", "true")
        await tap(below)
        await expect(sw).toHaveAttribute("aria-checked", "false")
      },
    )
  }
})
