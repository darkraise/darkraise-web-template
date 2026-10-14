import { test, expect, type Locator, type Page } from "@playwright/test"
import { kitLook, seedApp, type StampedSignatures } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import {
  computed,
  contrast,
  labelContrast,
  markContrast,
  rgbOf,
  settle,
  textContrast,
} from "./helpers/measure"

/**
 * The buttonStyle and iconButton signatures on the control fixture's
 * anatomy probes, stamped over the kit look after the fixture settles.
 * Every value keeps each button's box; key sets the face on a 2px base and
 * presses it 1px through a transform; soft tints the faces; glass adds a
 * sheen above the label band and frosts the neutral capsules; round turns
 * icon-size buttons into circles and changes nothing else. Ghost and link
 * ignore buttonStyle.
 */

const MODES = ["light", "dark"] as const
const STYLES = ["key", "soft", "glass"] as const
const RESTYLED = ["default", "destructive", "secondary", "outline"] as const
const LEFT_ALONE = ["ghost", "link"] as const
const SIZES = ["sm", "default", "lg", "icon"] as const

/** What a buttonStyle rule may change, read on every button. */
const PAINT = [
  "background-color",
  "background-image",
  "color",
  "border-top-color",
  "border-inline-start-color",
  "box-shadow",
  "border-top-left-radius",
  "transform",
  "opacity",
  "outline-style",
]

const BUTTONS = '[data-probe="anatomy-buttons"] .dr-btn'

/** Every icon-size button the iconButton signature reaches. */
const ICON_BUTTONS = [
  '[data-probe="anatomy-buttons"] .dr-btn[data-size="icon"]',
  '[data-probe="anatomy-pagination"] .dr-btn[data-size="icon"]',
  '[data-probe="calendar"] .dr-calendar-nav-btn',
].join(", ")

function button(page: Page, variant: string, size: string) {
  return page.locator(
    `[data-probe="anatomy-buttons"] [data-case="btn-${variant}-${size}"]`,
  )
}

async function stamp(page: Page, signatures: StampedSignatures) {
  await kitLook(page, signatures)
  await settle(page)
}

type Reading = Record<string, Record<string, string>>

/** Layout box and the paint properties of each button `selector` matches. */
async function read(page: Page, selector: string): Promise<Reading> {
  return page.evaluate(
    ({ selector, properties }) => {
      const out: Record<string, Record<string, string>> = {}
      document.querySelectorAll<HTMLElement>(selector).forEach((el, index) => {
        const style = getComputedStyle(el)
        const entry: Record<string, string> = {
          // Offsets, not the bounding box: a pressed key's transform moves
          // the painted face, never the layout box.
          box: `${el.offsetLeft},${el.offsetTop} ${el.offsetWidth}x${el.offsetHeight}`,
        }
        for (const property of properties) {
          entry[property] = style.getPropertyValue(property)
        }
        out[`${index} ${el.dataset.case ?? el.className}`] = entry
      })
      return out
    },
    { selector, properties: PAINT },
  )
}

function only(reading: Reading, property: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(reading).map(([key, entry]) => [key, entry[property] ?? ""]),
  )
}

function without(reading: Reading, properties: string[]): Reading {
  return Object.fromEntries(
    Object.entries(reading).map(([key, entry]) => [
      key,
      Object.fromEntries(
        Object.entries(entry).filter(([name]) => !properties.includes(name)),
      ),
    ]),
  )
}

/** A value as the browser computes it on a probe element at the root. */
async function resolved(page: Page, property: string, value: string) {
  return page.evaluate(
    ([name, raw]) => {
      const probe = document.createElement("div")
      probe.style.setProperty(name, raw)
      document.body.append(probe)
      const out = getComputedStyle(probe).getPropertyValue(name)
      probe.remove()
      return out
    },
    [property, value] as const,
  )
}

/** The outset, non-inset shadow layers of a key's base: `0 <depth> 0`. */
function bases(shadow: string): string[] {
  return shadow
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter((layer) => / 0px [12]px 0px 0px$/.test(layer))
}

async function centre(locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) throw new Error("the button has no box")
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function release(page: Page) {
  await page.mouse.up()
  await page.mouse.move(0, 0)
  await settle(page)
}

for (const mode of MODES) {
  test.describe(`button anatomy · ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await openControlFixture(page)
      await stamp(page, {})
    })

    test("every buttonStyle value keeps each box and leaves ghost and link alone", async ({
      page,
    }) => {
      const solid = await read(page, BUTTONS)
      const plain = await read(
        page,
        LEFT_ALONE.map((v) => `${BUTTONS}[data-variant="${v}"]`).join(", "),
      )
      for (const style of STYLES) {
        await stamp(page, { buttonStyle: style })
        expect(only(await read(page, BUTTONS), "box"), style).toEqual(
          only(solid, "box"),
        )
        expect(
          await read(
            page,
            LEFT_ALONE.map((v) => `${BUTTONS}[data-variant="${v}"]`).join(", "),
          ),
          `${style} leaves ghost and link alone`,
        ).toEqual(plain)
      }
    })

    test("key sets the face on a 2px base and presses it 1px", async ({
      page,
    }) => {
      await stamp(page, { buttonStyle: "key" })
      const strong = await resolved(page, "color", "hsl(var(--border-strong))")
      for (const variant of RESTYLED) {
        const face = button(page, variant, "default")
        const base = bases(await computed(face, "box-shadow"))
        expect(base, variant).toHaveLength(1)
        expect(base[0], variant).toMatch(/ 0px 2px 0px 0px$/)
        if (variant === "secondary" || variant === "outline") {
          expect(base[0], variant).toBe(`${strong} 0px 2px 0px 0px`)
        }
        // 0.5lh is half the 20px line box: the sheen ends where the
        // label's line box begins, or at 35% if that comes first.
        expect(await computed(face, "background-image"), variant).toContain(
          "linear-gradient(rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) min(35%, 50% - 10px))",
        )
        expect(await computed(face, "transition-property")).toContain(
          "transform",
        )

        const next = button(page, variant, "lg")
        const point = await centre(face)
        const before = await next.boundingBox()
        await page.mouse.move(point.x, point.y)
        await page.mouse.down()
        await settle(page)
        expect(await computed(face, "transform"), variant).toBe(
          "matrix(1, 0, 0, 1, 0, 1)",
        )
        const pressed = bases(await computed(face, "box-shadow"))
        expect(pressed, variant).toHaveLength(1)
        expect(pressed[0], variant).toMatch(/ 0px 1px 0px 0px$/)
        expect(await next.boundingBox(), `${variant} neighbour`).toEqual(before)
        await release(page)
        expect(await computed(face, "transform"), variant).toBe("none")
      }
    })

    test("key presses instantly under reduced motion and never presses a disabled button", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await stamp(page, { buttonStyle: "key" })
      const face = button(page, "default", "default")
      expect(await computed(face, "transition-duration")).toBe("0s")
      const point = await centre(face)
      await page.mouse.move(point.x, point.y)
      await page.mouse.down()
      // Read in the same frame as the press, with no settle: a transition
      // would still report the starting value here.
      expect(await computed(face, "transform")).toBe("matrix(1, 0, 0, 1, 0, 1)")
      await release(page)

      for (const variant of RESTYLED) {
        const disabled = button(page, variant, "disabled")
        const at = await centre(disabled)
        await page.mouse.move(at.x, at.y)
        await page.mouse.down()
        await settle(page)
        expect(await computed(disabled, "transform"), variant).toBe("none")
        expect(bases(await computed(disabled, "box-shadow")), variant).toEqual([
          expect.stringMatching(/ 0px 2px 0px 0px$/),
        ])
        await release(page)
      }
    })

    test("soft tints the faces and steps one deeper on hover", async ({
      page,
    }) => {
      await stamp(page, { buttonStyle: "soft" })
      const tint = mode === "light" ? 3 : 4
      const expected: Record<string, [string, string]> = {
        default: [`hsl(var(--primary-${tint}))`, "hsl(var(--primary-text))"],
        destructive: [
          "hsl(var(--destructive-subtle))",
          "hsl(var(--destructive-text))",
        ],
        secondary: ["hsl(var(--muted))", "hsl(var(--muted-foreground))"],
      }
      for (const [variant, [fill, label]] of Object.entries(expected)) {
        for (const size of SIZES) {
          const face = button(page, variant, size)
          expect(
            await computed(face, "background-color"),
            `${variant} ${size}`,
          ).toBe(await resolved(page, "background-color", fill))
          expect(await computed(face, "color"), `${variant} ${size}`).toBe(
            await resolved(page, "color", label),
          )
        }
      }
      for (const variant of ["default", "destructive"]) {
        const face = button(page, variant, "default")
        expect(await computed(face, "background-image")).toBe("none")
        expect(await computed(face, "border-top-color")).toBe(
          "rgba(0, 0, 0, 0)",
        )
      }
      const outline = button(page, "outline", "default")
      expect(await computed(outline, "border-top-color")).toBe(
        await resolved(page, "color", "hsl(var(--primary))"),
      )
      expect(await computed(outline, "color")).toBe(
        await resolved(page, "color", "hsl(var(--primary-text))"),
      )

      const face = button(page, "default", "default")
      const point = await centre(face)
      await page.mouse.move(point.x, point.y)
      await settle(page)
      expect(await computed(face, "background-color")).toBe(
        await resolved(page, "color", `hsl(var(--primary-${tint + 1}))`),
      )
      const disabled = button(page, "default", "disabled")
      const at = await centre(disabled)
      await page.mouse.move(at.x, at.y)
      await settle(page)
      expect(await computed(disabled, "background-color")).toBe(
        await resolved(page, "color", `hsl(var(--primary-${tint}))`),
      )
    })

    test("glass holds the sheen above the label band and frosts the neutral capsules", async ({
      page,
    }) => {
      await stamp(page, { buttonStyle: "glass" })
      for (const variant of ["default", "destructive"]) {
        const face = button(page, variant, "default")
        expect(await computed(face, "background-image"), variant).toBe(
          "linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) min(35%, 50% - 10px))",
        )
        expect(await computed(face, "box-shadow"), variant).toMatch(
          /^rgba\(255, 255, 255, 0\.4\) 0px 1px 0px 0px inset, /,
        )
      }
      for (const style of ["key", "glass"] as const) {
        await stamp(page, { buttonStyle: style })
        for (const variant of ["default", "destructive"]) {
          // The smallest face has the tallest label band for its height.
          const face = button(page, variant, "sm")
          const plain = contrast(
            rgbOf(await computed(face, "color")),
            rgbOf(await computed(face, "background-color")),
          )
          expect(
            Math.abs((await labelContrast(page, face)) - plain),
            `${style} ${variant}: no sheen behind the label`,
          ).toBeLessThan(0.05)
        }
      }
      await stamp(page, { buttonStyle: "glass" })
      const rim = mode === "light" ? 0.7 : 0.14
      const glint = mode === "light" ? 0.6 : 0.08
      for (const variant of ["secondary", "outline"]) {
        const face = button(page, variant, "default")
        expect(await computed(face, "border-top-color"), variant).toBe(
          `rgba(255, 255, 255, ${rim})`,
        )
        expect(await computed(face, "box-shadow"), variant).toMatch(
          new RegExp(
            `^rgba\\(255, 255, 255, ${glint}\\) 0px 1px 0px 0px inset, `,
          ),
        )
      }
      const secondary = button(page, "secondary", "default")
      const outline = button(page, "outline", "default")
      // Quiet's cards are opaque, so the capsule is an opaque card.
      expect(await computed(secondary, "background-color")).toBe(
        await resolved(page, "color", "hsl(var(--card))"),
      )
      expect(await computed(outline, "background-color")).toBe(
        await resolved(page, "color", "var(--btn-neutral-fill)"),
      )
      // A translucent host frosts it at the host's own alpha.
      await page.evaluate(() =>
        document.documentElement.style.setProperty(
          "--surface-fill-alpha",
          "0.6",
        ),
      )
      await settle(page)
      expect(await computed(secondary, "background-color")).toBe(
        await resolved(page, "color", "hsl(var(--card) / 0.6)"),
      )
      expect(await computed(secondary, "backdrop-filter")).toBe("none")
    })

    test("labels clear 4.5:1 under every value, at rest and hovered", async ({
      page,
    }) => {
      test.setTimeout(120_000)
      const cards = page.locator(
        '[data-probe="anatomy-card"] .dr-btn[data-case]',
      )
      for (const style of STYLES) {
        await stamp(page, { buttonStyle: style })
        for (const variant of RESTYLED) {
          for (const size of ["sm", "default", "lg"]) {
            const face = button(page, variant, size)
            const ratio =
              style === "soft"
                ? await textContrast(face)
                : await labelContrast(page, face)
            expect(ratio, `${style} ${variant} ${size}`).toBeGreaterThanOrEqual(
              4.5,
            )
          }
        }
        for (const face of await cards.all()) {
          const ratio =
            style === "soft"
              ? await textContrast(face)
              : await labelContrast(page, face)
          expect(ratio, `${style} on card`).toBeGreaterThanOrEqual(4.5)
        }
        for (const variant of RESTYLED) {
          const face = button(page, variant, "default")
          const point = await centre(face)
          await page.mouse.move(point.x, point.y)
          await settle(page)
          const ratio = await labelContrast(page, face)
          expect(ratio, `${style} ${variant} hovered`).toBeGreaterThanOrEqual(
            4.5,
          )
          await release(page)
        }
      }
    })

    test("soft's outline edge clears 3:1 against the page", async ({
      page,
    }) => {
      await stamp(page, { buttonStyle: "soft" })
      const face = button(page, "outline", "lg")
      await face.scrollIntoViewIfNeeded()
      const box = await face.boundingBox()
      if (!box) throw new Error("the button has no box")
      const middle = box.y + box.height / 4
      const ratio = await markContrast(
        page,
        { x: box.x, y: middle, width: 1, height: box.height / 2 },
        { x: box.x - 4, y: middle, width: 2, height: box.height / 2 },
      )
      expect(ratio).toBeGreaterThanOrEqual(3)
    })

    test("the keyboard focus ring survives every value", async ({ page }) => {
      // A key press puts the page in keyboard modality, so a scripted focus
      // matches :focus-visible as a Tab press would.
      await page.keyboard.press("Shift")
      for (const style of STYLES) {
        await stamp(page, { buttonStyle: style })
        for (const variant of RESTYLED) {
          const face = button(page, variant, "default")
          await face.focus()
          expect(
            await face.evaluate((el) => el.matches(":focus-visible")),
          ).toBe(true)
          expect(await computed(face, "outline-style"), style).toBe("solid")
          expect(await computed(face, "outline-width"), style).toBe("2px")
          await face.blur()
        }
      }
    })

    test("round turns every icon-size button into a circle and changes nothing else", async ({
      page,
    }) => {
      const square = await read(page, ICON_BUTTONS)
      const others = await read(page, `${BUTTONS}:not([data-size="icon"])`)
      const names = Object.keys(square).join(" ")
      expect(names).toContain("dr-pagination-link")
      expect(names).toContain("dr-calendar-nav-btn")
      await stamp(page, { iconButton: "round" })
      const round = await read(page, ICON_BUTTONS)
      const pill = await resolved(
        page,
        "border-top-left-radius",
        "var(--radius-pill)",
      )
      for (const [key, entry] of Object.entries(round)) {
        expect(entry["border-top-left-radius"], key).toBe(pill)
      }
      for (const face of await page.locator(ICON_BUTTONS).all()) {
        const box = await face.boundingBox()
        if (!box) throw new Error("the button has no box")
        expect(box.width).toBe(box.height)
        expect(
          parseFloat(await computed(face, "border-top-left-radius")),
        ).toBeGreaterThanOrEqual(box.width / 2)
      }
      expect(without(round, ["border-top-left-radius"])).toEqual(
        without(square, ["border-top-left-radius"]),
      )
      expect(await read(page, `${BUTTONS}:not([data-size="icon"])`)).toEqual(
        others,
      )
    })

    test("round and every buttonStyle value compose on icon buttons", async ({
      page,
    }) => {
      const pill = await resolved(
        page,
        "border-top-left-radius",
        "var(--radius-pill)",
      )
      for (const style of STYLES) {
        await stamp(page, { buttonStyle: style, iconButton: "round" })
        for (const variant of [...RESTYLED, ...LEFT_ALONE]) {
          const face = button(page, variant, "icon")
          expect(
            await computed(face, "border-top-left-radius"),
            `${style} ${variant}`,
          ).toBe(pill)
        }
      }
    })
  })
}

test.describe("button anatomy · sharp radius", () => {
  test("round squares icon buttons under the sharp Radius step", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", radius: "sharp" })
    await openControlFixture(page)
    await stamp(page, { iconButton: "round" })
    for (const face of await page.locator(ICON_BUTTONS).all()) {
      expect(await computed(face, "border-top-left-radius")).toBe("0px")
    }
  })
})

for (const density of ["compact", "spacious"] as const) {
  test.describe(`button anatomy · ${density}`, () => {
    test("every value keeps each box at this density", async ({ page }) => {
      await seedApp(page, { style: "quiet", density })
      await openControlFixture(page)
      await stamp(page, {})
      const solid = only(await read(page, BUTTONS), "box")
      for (const signatures of [
        ...STYLES.map((buttonStyle) => ({ buttonStyle })),
        { iconButton: "round" as const },
      ]) {
        await stamp(page, signatures)
        expect(
          only(await read(page, BUTTONS), "box"),
          JSON.stringify(signatures),
        ).toEqual(solid)
      }
    })
  })
}

test.describe("button anatomy · touch", () => {
  test(
    "a round icon button answers a tap anywhere in a 24px circle and not in its corners",
    { tag: "@touch" },
    async ({ page }) => {
      await seedApp(page, { style: "quiet" })
      await openControlFixture(page)
      await stamp(page, {})
      const faces = await page.locator(ICON_BUTTONS).all()
      const squareRadii = await Promise.all(
        faces.map(async (face) =>
          parseFloat(await computed(face, "border-top-left-radius")),
        ),
      )
      await stamp(page, { iconButton: "round" })
      for (const [index, face] of faces.entries()) {
        const point = await centre(face)
        const { circle, corners } = await face.evaluate(
          (el, { x, y, radius }) => {
            const inside = (px: number, py: number) => {
              const hit = document.elementFromPoint(px, py)
              return hit !== null && el.contains(hit)
            }
            const half = el.getBoundingClientRect().width / 2
            // Halfway along the diagonal from the circle's edge to the
            // square face's rounded corner: inside the square, outside the
            // circle.
            const reach = (half - radius) * Math.SQRT2 + radius
            const offset = (half + reach) / 2 / Math.SQRT2
            return {
              circle: Array.from({ length: 16 }, (_, i) => {
                const angle = (i / 16) * 2 * Math.PI
                return inside(
                  x + 11.5 * Math.cos(angle),
                  y + 11.5 * Math.sin(angle),
                )
              }),
              corners: (
                [
                  [-1, -1],
                  [1, -1],
                  [1, 1],
                  [-1, 1],
                ] as const
              ).map(([dx, dy]) => inside(x + dx * offset, y + dy * offset)),
            }
          },
          { ...point, radius: squareRadii[index] ?? 0 },
        )
        expect(circle.every(Boolean), `face ${index} circle`).toBe(true)
        expect(corners, `face ${index} corners`).toEqual([
          false,
          false,
          false,
          false,
        ])
      }
    },
  )
})
