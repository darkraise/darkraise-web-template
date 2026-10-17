import { test, expect, type Locator, type Page } from "@playwright/test"
import { gotoApp, seedApp, type ThemeSeed } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { contrast, pixel, settle } from "./helpers/measure"

/**
 * Glass's view-switch track and selected pane in Chromium. The default and
 * outline Tabs lists and the SegmentGroups paint a sheen and a backdrop
 * filter under Glass, and neither under Flat or under a Glass preset that
 * keeps today's track; more contrast takes both away and paints the pane
 * in the opaque card colour; forced colours leave no image on a track or
 * on the current sidebar row. The pane sits on the current item, and the
 * focus ring reads against what it crosses, in both orientations and
 * right to left, at Blur None and High.
 */

const MODES = ["light", "dark"] as const
const TABS = '[data-probe="anatomy-tabs"]'
const SEGMENTS = '[data-probe="anatomy-segments"]'

const TRACKS = [
  ["tabs default", `${TABS} [data-case="default"] .dr-tabs-list`],
  ["tabs vertical", `${TABS} [data-case="default-vertical"] .dr-tabs-list`],
  ["tabs outline", `${TABS} [data-case="outline"] .dr-tabs-list`],
  ["segment default", `${SEGMENTS} [data-case="default"] .dr-segment-group`],
  [
    "segment vertical",
    `${SEGMENTS} [data-case="default-vertical"] .dr-segment-group`,
  ],
  ["segment outline", `${SEGMENTS} [data-case="outline"] .dr-segment-group`],
] as const

const TAB_PARTS = {
  indicator: ".dr-tabs-indicator",
  current: '.dr-tabs-trigger[data-state="active"]',
}
const SEGMENT_PARTS = {
  indicator: ".dr-segment-group-indicator",
  current: '.dr-segment-group-item[data-state="checked"]',
}

const STRIPS = [
  { name: "tabs default", scope: `${TABS} [data-case="default"]`, ...TAB_PARTS },
  {
    name: "tabs vertical",
    scope: `${TABS} [data-case="default-vertical"]`,
    ...TAB_PARTS,
  },
  {
    name: "tabs right to left",
    scope: `${TABS} [data-case="default-rtl"]`,
    ...TAB_PARTS,
  },
  {
    name: "segment default",
    scope: `${SEGMENTS} [data-case="default"]`,
    ...SEGMENT_PARTS,
  },
  {
    name: "segment vertical",
    scope: `${SEGMENTS} [data-case="default-vertical"]`,
    ...SEGMENT_PARTS,
  },
]

async function open(page: Page, seed: ThemeSeed) {
  await seedApp(page, seed)
  await openControlFixture(page)
}

function paint(locator: Locator) {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el)
    return { image: style.backgroundImage, backdrop: style.backdropFilter }
  })
}

async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (!found) throw new Error("element is not rendered")
  return found
}

for (const mode of MODES) {
  test(`Glass frosts and lights every view track · ${mode}`, async ({
    page,
  }) => {
    await open(page, { style: "glass", mode, glassBlur: "medium" })
    for (const [name, selector] of TRACKS) {
      const found = await paint(page.locator(selector))
      expect(found.image, name).toContain("linear-gradient")
      expect(found.backdrop, name).toContain("blur(")
    }
  })

  for (const [look, seed] of [
    ["Flat", { style: "flat" }],
    ["Milk Glass", { style: "glass", preset: "milk-glass" }],
  ] as const) {
    test(`${look} paints no sheen and no backdrop on a view track · ${mode}`, async ({
      page,
    }) => {
      await open(page, { ...seed, mode })
      for (const [name, selector] of TRACKS) {
        expect(await paint(page.locator(selector)), name).toEqual({
          image: "none",
          backdrop: "none",
        })
      }
    })
  }

  test(`more contrast clears the track and paints the pane in the card · ${mode}`, async ({
    page,
  }) => {
    await page.emulateMedia({ contrast: "more" })
    await open(page, { style: "glass", mode })
    for (const [name, selector] of TRACKS) {
      const strip = page.locator(selector)
      expect(await paint(strip), name).toEqual({
        image: "none",
        backdrop: "none",
      })
      const face = await strip
        .locator(TAB_PARTS.indicator + ", " + SEGMENT_PARTS.indicator)
        .first()
        .evaluate((el) => {
          const probe = document.createElement("span")
          probe.style.color = "hsl(var(--card))"
          el.append(probe)
          const card = getComputedStyle(probe).color
          probe.remove()
          const style = getComputedStyle(el)
          return {
            image: style.backgroundImage,
            colour: style.backgroundColor,
            card,
          }
        })
      expect(face.image, name).toBe("none")
      expect(face.colour, name).toBe(face.card)
    }
  })

  test(`forced colours leave no image on a track or the current row · ${mode}`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active", colorScheme: mode })
    await open(page, { style: "glass", mode })
    for (const [name, selector] of TRACKS) {
      expect(await paint(page.locator(selector)), name).toEqual({
        image: "none",
        backdrop: "none",
      })
    }
    // In the rail the indicator paints the surface and the row is
    // transparent; a collapsed rail's popover entry paints its own.
    await page.emulateMedia({ reducedMotion: "reduce" })
    await gotoApp(page, "/categories")
    await page.getByRole("button", { name: "Collapse sidebar" }).click()
    await settle(page)
    await page
      .locator(".dr-sidebar-layout-nav-scroll .dr-sidebar-nav")
      .getByRole("button", { name: "Products" })
      .click()
    const entry = page.locator(
      ".dr-sidebar-nav-popover-content .dr-sidebar-nav-current",
    )
    await expect(entry).toHaveCount(1)
    await settle(page)
    expect(
      await entry.evaluate((el) => getComputedStyle(el).backgroundImage),
    ).toBe("none")
  })

  test(`outline tabs and segments show the pane inside their ring · ${mode}`, async ({
    page,
  }) => {
    await open(page, { style: "glass", mode })
    for (const [name, scope] of [
      ["tabs", `${TABS} [data-case="outline"] ${TAB_PARTS.indicator}`],
      ["segment", `${SEGMENTS} [data-case="outline"] ${SEGMENT_PARTS.indicator}`],
    ] as const) {
      const pane = await page.locator(scope).evaluate((el) => {
        const style = getComputedStyle(el)
        return { image: style.backgroundImage, shadow: style.boxShadow }
      })
      expect(pane.image, name).toContain("linear-gradient")
      expect(pane.shadow, name).toContain("inset")
    }
  })

  for (const glassBlur of ["none", "high"] as const) {
    test(`the pane sits on the current item and the focus ring reads · Blur ${glassBlur} · ${mode}`, async ({
      page,
    }) => {
      await open(page, { style: "glass", mode, glassBlur })
      for (const strip of STRIPS) {
        const scope = page.locator(strip.scope)
        const item = scope.locator(strip.current)
        await item.scrollIntoViewIfNeeded()
        await settle(page)
        const pane = await box(scope.locator(strip.indicator))
        const cell = await box(item)
        for (const key of ["x", "y", "width", "height"] as const) {
          expect(
            Math.abs(pane[key] - cell[key]),
            `${strip.name} ${key}`,
          ).toBeLessThanOrEqual(1)
        }

        // The ring's band along the item's top edge, read focused and then
        // unfocused: what the ring crosses is the track (outside the item)
        // or the pane (inside it).
        await item.evaluate((el) => (el as HTMLElement).focus())
        await settle(page)
        const ring = await item.evaluate((el) => {
          const style = getComputedStyle(el)
          return {
            visible: el.matches(":focus-visible"),
            width: Number.parseFloat(style.outlineWidth),
            offset: Number.parseFloat(style.outlineOffset),
          }
        })
        expect(ring.visible, strip.name).toBe(true)
        const x = Math.round(cell.x + cell.width / 2)
        const y = Math.round(cell.y - ring.offset - ring.width / 2)
        const focused = await pixel(page, x, y)
        await item.evaluate((el) => (el as HTMLElement).blur())
        await settle(page)
        const resting = await pixel(page, x, y)
        expect(
          contrast(focused, resting),
          `${strip.name} focus ring at (${x}, ${y})`,
        ).toBeGreaterThanOrEqual(3)
      }
    })
  }
}
