import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { computed, pixel, rgbOf, settle, type Rgb } from "./helpers/measure"

/**
 * Kit states and marks under forced colours (Windows High Contrast), read
 * from rendered pixels. Chromium's emulation repaints with the system
 * palette, so a pixel is compared with reference probes painted with the
 * system colours themselves rather than with fixed values.
 */

const FIXTURE = "/e2e/fixtures/forced-colors.html"
const SCHEMES = ["light", "dark"] as const
type Scheme = (typeof SCHEMES)[number]

/** Per-channel tolerance for anti-aliasing and colour conversion. */
const TOLERANCE = 8

async function openForced(page: Page, scheme: Scheme): Promise<void> {
  await seedApp(page, { style: "quiet", mode: scheme })
  await page.emulateMedia({
    forcedColors: "active",
    colorScheme: scheme,
    reducedMotion: "reduce",
  })
  await page.goto(FIXTURE)
  await page.getByTestId("forced-colors").waitFor()
  await expect(page.locator("html")).toHaveAttribute("data-style", "quiet")
  await page.mouse.move(0, 0)
  await settle(page)
}

/** The rendered pixel at (dx, dy) from the element's top-left corner. */
async function pixelIn(
  page: Page,
  locator: Locator,
  dx: number,
  dy: number,
): Promise<Rgb> {
  await locator.scrollIntoViewIfNeeded()
  const box = await boxOf(locator)
  return pixel(page, Math.floor(box.x + dx), Math.floor(box.y + dy))
}

/** The rendered pixel at the centre of the element's box. */
async function centrePixel(page: Page, locator: Locator): Promise<Rgb> {
  const box = await boxOf(locator)
  return pixelIn(page, locator, box.width / 2, box.height / 2)
}

/**
 * A system colour as painted, read from its reference probe. Emulated
 * Highlight is translucent, so a fill inside a CanvasText track is read
 * against `highlight-on-text`, Highlight painted over CanvasText.
 */
function refColour(
  page: Page,
  name:
    | "highlight"
    | "highlight-text"
    | "canvas"
    | "highlight-on-text"
    | "mark",
): Promise<Rgb> {
  return centrePixel(page, page.locator(`[data-probe="ref-${name}"]`))
}

function near(actual: Rgb, expected: Rgb): boolean {
  return actual.every(
    (channel, i) => Math.abs(channel - (expected[i] ?? 0)) <= TOLERANCE,
  )
}

type At = (box: { width: number; height: number }) => [number, number]

/** Inside the item's leading padding, clear of its label and boundary. */
const INSIDE: At = (box) => [4, box.height / 2]

/**
 * A pixel inside the chosen item paints Highlight and the same pixel on an
 * unchosen sibling does not.
 */
async function expectChosen(
  page: Page,
  scope: Locator,
  chosen: string,
  unchosen: string,
  at: At = INSIDE,
): Promise<void> {
  const highlight = await refColour(page, "highlight")
  for (const [selector, painted] of [
    [chosen, true],
    [unchosen, false],
  ] as const) {
    const item = scope.locator(selector).first()
    const [dx, dy] = at(await boxOf(item))
    const colour = await pixelIn(page, item, dx, dy)
    expect(
      near(colour, highlight),
      `${selector}: ${colour} against Highlight ${highlight}`,
    ).toBe(painted)
  }
}

/**
 * The share of pixels along the middle row of an element's text that paint
 * `colour`, every `step` pixels. Text forced onto a Canvas backplate reads 0.
 */
async function textShare(
  page: Page,
  locator: Locator,
  colour: Rgb,
  step = 2,
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
  for (let x = Math.ceil(text.x); x < text.x + text.width; x += step) {
    total++
    if (near(await pixel(page, x, y), colour)) hits++
  }
  return hits / total
}

test.describe("fixture", () => {
  for (const scheme of SCHEMES) {
    test(`paints distinct reference colours · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      expect(
        await page.evaluate(
          () => matchMedia("(forced-colors: active)").matches,
        ),
      ).toBe(true)
      const highlight = await refColour(page, "highlight")
      const canvas = await refColour(page, "canvas")
      expect(near(highlight, canvas), `${highlight} vs ${canvas}`).toBe(false)
    })
  }
})

test.describe("selection controls", () => {
  const ACTIVE_TAB = '.dr-tabs-trigger[data-state="active"]'
  const INACTIVE_TAB = '.dr-tabs-trigger[data-state="inactive"]'
  /** The upper row of the underline's 2px bar; the lower one lies over the baseline. */
  const UNDERLINE_BAR: At = (box) => [box.width / 2, box.height - 2]
  const CASES: Array<[string, string, string, At?]> = [
    ["tabs-default", ACTIVE_TAB, INACTIVE_TAB],
    ["tabs-outline", ACTIVE_TAB, INACTIVE_TAB],
    ["tabs-enclosed", ACTIVE_TAB, INACTIVE_TAB],
    ["tabs-underline", ACTIVE_TAB, INACTIVE_TAB, UNDERLINE_BAR],
    [
      "segment-group",
      '.dr-segment-group-item[data-state="checked"]',
      '.dr-segment-group-item[data-state="unchecked"]',
    ],
    [
      "listbox-filled",
      '.dr-listbox-item[data-selected="true"]',
      '.dr-listbox-item:not([data-selected="true"])',
    ],
    [
      "listbox-outline",
      '.dr-listbox-item[data-selected="true"]',
      '.dr-listbox-item:not([data-selected="true"])',
    ],
    [
      "tree-filled",
      '.dr-tree-view-item[data-selected="true"]',
      '.dr-tree-view-item:not([data-selected="true"])',
    ],
    [
      "tree-outline",
      '.dr-tree-view-item[data-selected="true"]',
      '.dr-tree-view-item:not([data-selected="true"])',
    ],
    ["toggle", '.dr-toggle[data-state="on"]', '.dr-toggle[data-state="off"]'],
    [
      "toggle-group",
      '.dr-toggle[data-state="on"]',
      '.dr-toggle[data-state="off"]',
    ],
    [
      "pagination",
      '.dr-pagination-link[data-active="true"]',
      '.dr-pagination-link:not([data-active="true"])',
    ],
    [
      "switch",
      '.dr-switch[data-state="checked"]',
      '.dr-switch[data-state="unchecked"]',
      (box) => [8, box.height / 2],
    ],
  ]

  for (const scheme of SCHEMES) {
    for (const [probe, chosen, unchosen, at] of CASES) {
      test(`${probe} marks the chosen item · ${scheme}`, async ({ page }) => {
        await openForced(page, scheme)
        const scope = page.locator(`[data-probe="${probe}"]`)
        await expectChosen(page, scope, chosen, unchosen, at)
      })
    }

    test(`chosen labels stay legible · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const highlight = await refColour(page, "highlight")
      const glyphs = await refColour(page, "highlight-text")
      for (const selector of [
        `[data-probe="tabs-default"] ${ACTIVE_TAB}`,
        '[data-probe="segment-group"] .dr-segment-group-item[data-state="checked"]',
        '[data-probe="listbox-filled"] .dr-listbox-item[data-selected="true"]',
        '[data-probe="tree-filled"] .dr-tree-view-item[data-selected="true"]',
        '[data-probe="toggle"] .dr-toggle[data-state="on"]',
      ]) {
        const label = page.locator(selector)
        const share = await textShare(page, label, highlight)
        expect(share, selector).toBeGreaterThan(0.2)
        const ink = await textShare(page, label, glyphs)
        expect(ink, `${selector} glyphs`).toBeGreaterThan(0.02)
      }
      // Two narrow digits: every pixel, or their 1px stems fall between samples.
      const pageLabel = page.locator(
        '[data-probe="pagination"] .dr-pagination-link[data-active="true"]',
      )
      expect(await textShare(page, pageLabel, highlight, 1)).toBeGreaterThan(
        0.2,
      )
      expect(
        await textShare(page, pageLabel, glyphs, 1),
        "page label glyphs",
      ).toBeGreaterThan(0.02)
    })

    test(`switch thumbs read on their tracks · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const thumb = (state: string) =>
        page.locator(`.dr-switch[data-state="${state}"] .dr-switch-thumb`)
      const canvas = await refColour(page, "canvas")
      const highlight = await refColour(page, "highlight")
      expect(near(await centrePixel(page, thumb("unchecked")), canvas)).toBe(
        false,
      )
      expect(near(await centrePixel(page, thumb("checked")), highlight)).toBe(
        false,
      )
    })

    test(`tab reserved borders paint Canvas · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const canvas = await refColour(page, "canvas")
      const inactive = page.locator(
        `[data-probe="tabs-underline"] ${INACTIVE_TAB}`,
      )
      const [dx, dy] = UNDERLINE_BAR(await boxOf(inactive))
      const reserved = await pixelIn(page, inactive, dx, dy)
      expect(near(reserved, canvas), `${reserved} vs ${canvas}`).toBe(true)
      // The trigger's boundary outline paints over the seam row, so the
      // indicator's seam edge is read from its computed colour.
      const seam = rgbOf(
        await computed(
          page.locator('[data-probe="tabs-enclosed"] .dr-tabs-indicator'),
          "border-bottom-color",
        ),
      )
      expect(near(seam, canvas), `${seam} vs ${canvas}`).toBe(true)
    })
  }
})

test.describe("tab edges", () => {
  /** The trigger's bottom row, which lies on the strip's baseline. */
  const BASELINE: At = (box) => [box.width / 2, box.height - 1]

  for (const scheme of SCHEMES) {
    test(`the enclosed baseline opens under the active tab · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      const canvas = await refColour(page, "canvas")
      const probe = page.locator('[data-probe="tabs-enclosed"]')
      const list = probe.locator(".dr-tabs-list")
      const listBox = await boxOf(list)
      const tail = await pixelIn(
        page,
        list,
        listBox.width - 4,
        listBox.height - 1,
      )
      expect(near(tail, canvas), `baseline past the tabs: ${tail}`).toBe(false)
      for (const [state, open] of [
        ["active", true],
        ["inactive", false],
      ] as const) {
        const trigger = probe.locator(`.dr-tabs-trigger[data-state="${state}"]`)
        const [dx, dy] = BASELINE(await boxOf(trigger))
        const seam = await pixelIn(page, trigger, dx, dy)
        expect(near(seam, canvas), `${state} tab: ${seam}`).toBe(open)
      }
    })

    test(`the underline baseline runs under every tab · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      const trigger = page.locator(
        '[data-probe="tabs-underline"] .dr-tabs-trigger[data-state="inactive"]',
      )
      const [dx, dy] = BASELINE(await boxOf(trigger))
      const colour = await pixelIn(page, trigger, dx, dy)
      expect(near(colour, await refColour(page, "canvas"))).toBe(false)
    })
  }
})

test.describe("menus, pickers and navigation", () => {
  for (const scheme of SCHEMES) {
    test(`calendar marks the selected day · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      await expectChosen(
        page,
        page.locator('[data-probe="calendar"]'),
        '.dr-calendar-day-btn[data-selected-single="true"]',
        ".dr-calendar-day-btn:not([data-selected-single]):not([aria-current])",
      )
    })

    test(`a focused menu row is marked · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      await page.locator('[data-probe="menu"] button').focus()
      await page.keyboard.press("ArrowDown")
      const first = page.locator(".dr-menu-content .dr-menu-item").first()
      await expect(first).toBeFocused()
      await settle(page)
      await expectChosen(
        page,
        page.locator(".dr-menu-content"),
        ".dr-menu-item:focus",
        ".dr-menu-item:not(:focus)",
      )
    })

    test(`an open sub-trigger is marked · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      await page.locator('[data-probe="submenu"] button').focus()
      await page.keyboard.press("ArrowDown")
      const content = page.locator(".dr-menu-content:not(.dr-menu-sub-content)")
      const share = content.getByRole("menuitem", { name: "Share" })
      await share.hover()
      await expect(share).toHaveAttribute("data-state", "open")
      // Over the submenu, the sub-trigger is neither hovered nor focused, so
      // only its open state can paint it.
      await page.getByRole("menuitem", { name: "Email" }).hover()
      await expect(share).toHaveAttribute("data-state", "open")
      await expect(share).not.toBeFocused()
      await settle(page)
      await expectChosen(
        page,
        content,
        ".dr-menu-sub-trigger",
        ".dr-menu-item:not(.dr-menu-sub-trigger):not(:focus)",
      )
    })

    test(`a focused menubar row is marked · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      await page
        .locator('[data-probe="menubar"]')
        .getByRole("menuitem", { name: "File" })
        .click()
      const row = page.locator(".dr-menubar-content .dr-menubar-item").first()
      await page.keyboard.press("ArrowDown")
      await expect(row).toBeFocused()
      await settle(page)
      await expectChosen(
        page,
        page.locator(".dr-menubar-content"),
        ".dr-menubar-item:focus",
        ".dr-menubar-item:not(:focus)",
      )
    })

    test(`chosen rows stay legible · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const highlight = await refColour(page, "highlight")
      for (const selector of [
        '[data-probe="calendar"] .dr-calendar-day-btn[data-selected-single="true"]',
        '[data-probe="sidebar"] .dr-sidebar-nav-current',
      ]) {
        const share = await textShare(page, page.locator(selector), highlight)
        expect(share, selector).toBeGreaterThan(0.2)
      }
      await page.locator('[data-probe="menu"] button').focus()
      await page.keyboard.press("ArrowDown")
      const row = page.locator(".dr-menu-content .dr-menu-item:focus")
      await expect(row).toHaveCount(1)
      await settle(page)
      expect(await textShare(page, row, highlight)).toBeGreaterThan(0.2)
    })

    test(`a selected timeline tile is marked over its content · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      await page.locator(".dr-virtualized-timeline-tile").first().waitFor()
      await expectChosen(
        page,
        page.locator('[data-probe="timeline"]'),
        '.dr-virtualized-timeline-tile[data-selected="true"]',
        '.dr-virtualized-timeline-tile:not([data-selected="true"])',
        (box) => [1, box.height / 2],
      )
    })

    test(`invalid number and date inputs dash their edge · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      for (const selector of [
        '[data-probe="number-input"] .dr-number-input-control',
        '[data-probe="date-input"] .dr-date-input',
      ]) {
        expect(
          await computed(page.locator(selector), "border-top-style"),
          selector,
        ).toBe("dashed")
      }
    })

    test(`the sidebar current row is marked · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      await expectChosen(
        page,
        page.locator('[data-probe="sidebar"]'),
        ".dr-sidebar-nav-current",
        ".dr-sidebar-nav-item:not(.dr-sidebar-nav-current)",
      )
    })
  }
})

test.describe("structural marks, fills and boundaries", () => {
  /** A point at a fraction of the element's width, on its middle row. */
  const across =
    (fraction: number): At =>
    (box) => [box.width * fraction, box.height / 2]

  for (const scheme of SCHEMES) {
    test(`marks differ from Canvas · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const canvas = await refColour(page, "canvas")
      const marks: Array<[string, At]> = [
        ['[data-probe="separator"] .dr-separator', across(0.5)],
        ['[data-probe="slider"] .dr-slider-track', across(0.85)],
        ['[data-probe="progress"] .dr-progress', across(0.85)],
        ['[data-probe="scroll-area"] .dr-scroll-thumb', across(0.5)],
        ['[data-probe="resizable"] .dr-resizable-handle', across(0.5)],
        [
          '[data-probe="steps"] .dr-steps-separator:not([data-status="complete"])',
          across(0.5),
        ],
        ['[data-probe="skeleton"] .dr-skeleton', across(0.5)],
      ]
      for (const [selector, at] of marks) {
        const mark = page.locator(selector).first()
        const [dx, dy] = at(await boxOf(mark))
        const colour = await pixelIn(page, mark, dx, dy)
        expect(near(colour, canvas), `${selector}: ${colour}`).toBe(false)
      }
    })

    test(`fills paint Highlight · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const onCanvas = await refColour(page, "highlight")
      const onText = await refColour(page, "highlight-on-text")
      const fills: Array<[string, At, Rgb]> = [
        ['[data-probe="slider"] .dr-slider-range', across(0.25), onText],
        ['[data-probe="progress"] .dr-progress', across(0.25), onText],
        [
          '[data-probe="steps"] .dr-steps-separator[data-status="complete"]',
          across(0.5),
          onCanvas,
        ],
      ]
      for (const [selector, at, expected] of fills) {
        const fill = page.locator(selector).first()
        const [dx, dy] = at(await boxOf(fill))
        const colour = await pixelIn(page, fill, dx, dy)
        expect(near(colour, expected), `${selector}: ${colour}`).toBe(true)
      }
    })

    test(`a menu separator differs from Canvas · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      await page.locator('[data-probe="menu"] button').focus()
      await page.keyboard.press("ArrowDown")
      const separator = page.locator(".dr-menu-content .dr-menu-separator")
      await separator.waitFor()
      await settle(page)
      const canvas = await refColour(page, "canvas")
      await expect
        .poll(async () => near(await centrePixel(page, separator), canvas), {
          message: "the separator paints Canvas",
        })
        .toBe(false)
    })

    test(`the scroll bar's reserved edge paints Canvas · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      const bar = page.locator(
        '[data-probe="scroll-area"] .dr-scroll-bar[data-orientation="vertical"]',
      )
      const box = await boxOf(bar)
      const edge = await pixelIn(page, bar, 0, box.height / 2)
      const canvas = await refColour(page, "canvas")
      expect(near(edge, canvas), `${edge} vs ${canvas}`).toBe(true)
    })

    test(`the spinner gap paints Canvas · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const circle = page.locator('[data-probe="spinner"] .dr-spinner-circle')
      const box = await boxOf(circle)
      const gap = await pixelIn(page, circle, box.width / 2, 1)
      const canvas = await refColour(page, "canvas")
      expect(near(gap, canvas), `${gap} vs ${canvas}`).toBe(true)
    })
  }
})

test.describe("data colours and marked text", () => {
  for (const scheme of SCHEMES) {
    test(`a colour swatch keeps its colour · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const swatch = page.locator(
        '[data-probe="color-picker"] .dr-color-picker-swatch',
      )
      const colour = await centrePixel(page, swatch)
      expect(near(colour, [255, 0, 0]), `${colour}`).toBe(true)
    })

    test(`a highlight match paints Mark · ${scheme}`, async ({ page }) => {
      await openForced(page, scheme)
      const match = page.locator('[data-probe="highlight"] .dr-highlight-match')
      const box = await boxOf(match)
      const colour = await pixelIn(page, match, 1, box.height / 2)
      const mark = await refColour(page, "mark")
      expect(near(colour, mark), `${colour} vs ${mark}`).toBe(true)
      expect(await textShare(page, match, mark)).toBeGreaterThan(0.2)
    })
  }
})

test.describe("chosen items under focus and with children", () => {
  type Focus = (page: Page, item: Locator) => Promise<void>

  const focusItem: Focus = async (page, item) => {
    await page.keyboard.press("Shift")
    await item.focus()
    await expect(item).toBeFocused()
    expect(await item.evaluate((node) => node.matches(":focus-visible"))).toBe(
      true,
    )
  }

  /** A listbox keeps DOM focus and marks its active row with data-focused. */
  const focusListboxRow: Focus = async (page, item) => {
    await page.keyboard.press("Shift")
    await page.locator('[data-probe="listbox-filled"] [role="listbox"]').focus()
    await page.keyboard.press("Home")
    await expect(item).toHaveAttribute("data-focused", "true")
  }

  const RING_CASES: Array<[string, string, Focus]> = [
    ["tree-filled", '.dr-tree-view-item[data-selected="true"]', focusItem],
    [
      "calendar",
      '.dr-calendar-day-btn[data-selected-single="true"]',
      focusItem,
    ],
    ["toggle", '.dr-toggle[data-state="on"]', focusItem],
    ["sidebar", ".dr-sidebar-nav-current", focusItem],
    ["tabs-enclosed", '.dr-tabs-trigger[data-state="active"]', focusItem],
    [
      "listbox-filled",
      '.dr-listbox-item[data-selected="true"]',
      focusListboxRow,
    ],
  ]

  for (const scheme of SCHEMES) {
    for (const [probe, selector, focus] of RING_CASES) {
      test(`a focused chosen item keeps a visible ring · ${probe} · ${scheme}`, async ({
        page,
      }) => {
        await openForced(page, scheme)
        const item = page.locator(`[data-probe="${probe}"] ${selector}`).first()
        await item.scrollIntoViewIfNeeded()
        await focus(page, item)
        await settle(page)
        const ring = await item.evaluate((node) => {
          const style = getComputedStyle(node)
          return {
            offset: parseFloat(style.outlineOffset),
            width: parseFloat(style.outlineWidth),
          }
        })
        const box = await boxOf(item)
        const y = box.height / 2
        const onRing = await pixelIn(
          page,
          item,
          -(ring.offset + ring.width / 2),
          y,
        )
        const fill = await pixelIn(page, item, 5, y)
        const gap = Math.max(
          ...onRing.map((channel, i) => Math.abs(channel - (fill[i] ?? 0))),
        )
        expect(gap, `ring ${onRing} on fill ${fill}`).toBeGreaterThan(120)
      })
    }

    test(`secondary text in a chosen row takes the row colour · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      await page.locator('[data-probe="menu"] button').focus()
      await page.keyboard.press("ArrowDown")
      const row = page.locator(".dr-menu-content .dr-menu-item:focus")
      await expect(row).toHaveCount(1)
      await settle(page)
      expect(await computed(row.locator(".dr-menu-shortcut"), "color")).toBe(
        await computed(row, "color"),
      )
      const current = page.locator(
        '[data-probe="sidebar"] .dr-sidebar-nav-current',
      )
      expect(
        await computed(current.locator(".dr-sidebar-nav-badge"), "color"),
      ).toBe(await computed(current, "color"))
    })

    test(`a menubar shortcut in a chosen row takes the row colour · ${scheme}`, async ({
      page,
    }) => {
      await openForced(page, scheme)
      await page
        .locator('[data-probe="menubar"]')
        .getByRole("menuitem", { name: "File" })
        .click()
      const row = page.locator(".dr-menubar-content .dr-menubar-item").first()
      await page.keyboard.press("ArrowDown")
      await expect(row).toBeFocused()
      await settle(page)
      const highlight = await refColour(page, "highlight")
      const glyphs = await refColour(page, "highlight-text")
      const shortcut = row.locator(".dr-menubar-shortcut")
      expect(await computed(shortcut, "color")).toBe(
        await computed(row, "color"),
      )
      expect(await textShare(page, shortcut, highlight)).toBeGreaterThan(0.2)
      expect(
        await textShare(page, shortcut, glyphs),
        "shortcut glyphs",
      ).toBeGreaterThan(0.02)
    })
  }
})
