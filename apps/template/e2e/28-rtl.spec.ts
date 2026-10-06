import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { computed, pixel, rgbOf, settle } from "./helpers/measure"

/**
 * Kit components inside a right-to-left document, read from layout, computed
 * style and the keyboard. The fixture's <html> carries dir="rtl", so nothing
 * here passes a dir prop.
 */

const FIXTURE = "/e2e/fixtures/rtl.html"

async function openFixture(page: Page): Promise<void> {
  await seedApp(page, { style: "quiet", mode: "light" })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(FIXTURE)
  await page.getByTestId("rtl").waitFor()
  await expect(page.locator("html")).toHaveAttribute("data-style", "quiet")
  await page.mouse.move(0, 0)
  await settle(page)
}

test.describe("fixture", () => {
  test("renders right to left", async ({ page }) => {
    await openFixture(page)
    expect(await computed(page.getByTestId("rtl"), "direction")).toBe("rtl")
  })
})

test.describe("inline icons", () => {
  test("mirror under a right-to-left document", async ({ page }) => {
    await openFixture(page)
    const icon = page.locator('[data-probe="icon-inline"] svg')
    expect(await computed(icon, "scale")).toBe("-1 1")
  })
})

test.describe("tabs", () => {
  test("inherit the document direction and mirror their arrow keys", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="tabs"]')
    await expect(probe.locator(".dr-tabs")).not.toHaveAttribute("dir")
    expect(await computed(probe.getByRole("tablist"), "direction")).toBe("rtl")
    const first = probe.getByRole("tab", { name: "Tab 1" })
    const second = probe.getByRole("tab", { name: "Tab 2" })
    await first.focus()
    await page.keyboard.press("ArrowLeft")
    await expect(second).toBeFocused()
    expect((await boxOf(second)).x).toBeLessThan((await boxOf(first)).x)
  })

  test("keep the indicator on the active tab after scrolling", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="tabs"]')
    const list = probe.getByRole("tablist")
    await probe.getByRole("tab", { name: "Tab 1" }).focus()
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowLeft")
    const last = probe.getByRole("tab", { name: "Tab 6" })
    await expect(last).toHaveAttribute("data-state", "active")
    await settle(page)
    expect(await list.evaluate((el) => el.scrollLeft)).toBeLessThan(0)
    const tab = await boxOf(last)
    const indicator = await boxOf(list.locator(".dr-tabs-indicator"))
    expect(Math.abs(indicator.x - tab.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(indicator.width - tab.width)).toBeLessThanOrEqual(1)
  })
})

test.describe("scroll area", () => {
  test("puts the vertical bar on the left edge", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="scroll-area"]')
    const root = await boxOf(probe.locator(".dr-scroll-area"))
    const bar = await boxOf(
      probe.locator('.dr-scroll-bar[data-orientation="vertical"]'),
    )
    expect(Math.abs(bar.x - root.x)).toBeLessThanOrEqual(1)
  })

  test("moves the horizontal thumb left as content scrolls", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="scroll-area"]')
    const bar = probe.locator('.dr-scroll-bar[data-orientation="horizontal"]')
    const thumb = bar.locator(".dr-scroll-thumb")
    const track = await boxOf(bar)
    const start = await boxOf(thumb)
    expect(
      Math.abs(start.x + start.width - (track.x + track.width)),
    ).toBeLessThanOrEqual(2)
    await probe
      .locator("[data-darkraise-scroll-viewport]")
      .evaluate((el) => el.scrollTo({ left: -200 }))
    await settle(page)
    expect((await boxOf(thumb)).x).toBeLessThan(start.x - 10)
  })
})

test.describe("submenus", () => {
  /** The box once it has held still for three frames: popups position
   *  asynchronously, and a submenu anchors to its row where it is at open. */
  async function steadyBox(locator: Locator) {
    await locator.evaluate(async (el) => {
      let last = ""
      let same = 0
      for (let i = 0; i < 120 && same < 3; i++) {
        await new Promise((resolve) => requestAnimationFrame(resolve))
        const r = el.getBoundingClientRect()
        const key = [r.x, r.y, r.width, r.height].join()
        same = key === last ? same + 1 : 0
        last = key
      }
    })
    return boxOf(locator)
  }

  async function opensToTheLeft(page: Page, open: () => Promise<void>) {
    await open()
    await page.mouse.move(0, 0)
    const more = page.getByRole("menuitem", { name: "More" })
    const trigger = await steadyBox(more)
    await more.focus()
    await expect(more).toHaveAttribute("aria-expanded", "false")
    await page.keyboard.press("ArrowLeft")
    await expect(more).toHaveAttribute("aria-expanded", "true")
    const nested = page.getByRole("menuitem", { name: "Nested" })
    await expect(nested).toBeVisible()
    const menu = await steadyBox(page.getByRole("menu").filter({ has: nested }))
    const viewport = page.viewportSize()
    if (!viewport) throw new Error("no viewport")
    expect(menu.x + menu.width).toBeLessThanOrEqual(trigger.x + 1)
    expect(menu.x).toBeGreaterThanOrEqual(0)
    expect(menu.y + menu.height).toBeLessThanOrEqual(viewport.height)
  }

  test("a dropdown submenu opens toward the left", async ({ page }) => {
    await openFixture(page)
    await opensToTheLeft(page, () =>
      page
        .locator('[data-probe="dropdown-submenu"]')
        .getByRole("button", { name: "Dropdown" })
        .click(),
    )
  })

  test("a context submenu opens toward the left", async ({ page }) => {
    await openFixture(page)
    await opensToTheLeft(page, () =>
      page
        .locator('[data-probe="context-submenu"]')
        .getByText("Context area")
        .click({ button: "right", position: { x: 300, y: 8 } }),
    )
  })

  test("a menubar submenu opens toward the left", async ({ page }) => {
    await openFixture(page)
    await opensToTheLeft(page, () =>
      page
        .locator('[data-probe="menubar-submenu"]')
        .getByRole("menuitem", { name: "File" })
        .click(),
    )
  })
})

test.describe("menu rows", () => {
  test("an inset item's indicator sits at the inline start", async ({
    page,
  }) => {
    await openFixture(page)
    await page
      .locator('[data-probe="menu-indicator"]')
      .getByRole("button", { name: "Options" })
      .click()
    const item = page.getByRole("menuitemcheckbox", { name: "Show grid" })
    await expect(item).toBeVisible()
    await settle(page)
    const row = await boxOf(item)
    const indicator = await boxOf(item.locator("svg"))
    expect(indicator.x).toBeGreaterThan(row.x + row.width - 32)
  })
})

test.describe("sidebar", () => {
  test("the collapsed rail's pill sits on the rail's right edge", async ({
    page,
  }) => {
    await openFixture(page)
    const nav = page.locator('[data-probe="sidebar-rail"] .dr-sidebar-nav')
    await expect(nav).toHaveAttribute("data-indicator", "ready")
    const { pillRight, navRight } = await nav.evaluate((el) => {
      const indicator = el.querySelector(".dr-sidebar-nav-indicator")
      if (!indicator) throw new Error("no indicator")
      const pill = getComputedStyle(indicator, "::before")
      const left =
        indicator.getBoundingClientRect().left + parseFloat(pill.left)
      return {
        pillRight: left + parseFloat(pill.width),
        navRight: el.getBoundingClientRect().right,
      }
    })
    expect(Math.abs(pillRight - navRight)).toBeLessThanOrEqual(1)
  })

  test("a closed group's chevron points left and turns down when open", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="sidebar-tree"]')
    const chevron = probe.locator(".dr-sidebar-nav-collapsible-chevron")
    expect(await computed(chevron, "rotate")).toBe("180deg")
    await probe.getByRole("button", { name: "Products" }).click()
    await expect(chevron).toHaveAttribute("data-open", "true")
    await settle(page)
    expect(await computed(chevron, "rotate")).toBe("90deg")
  })
})

test.describe("steps", () => {
  test("the left arrow moves to the visually next step", async ({ page }) => {
    await openFixture(page)
    const triggers = page.locator('[data-probe="steps"] [role="tab"]')
    const first = await boxOf(triggers.nth(0))
    const second = await boxOf(triggers.nth(1))
    expect(second.x).toBeLessThan(first.x)
    await triggers.nth(0).focus()
    await page.keyboard.press("ArrowLeft")
    await expect(triggers.nth(1)).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(triggers.nth(0)).toBeFocused()
  })
})

test.describe("tree chevrons", () => {
  test("point along the reading order when closed and down when open", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="tree-chevrons"]')
    const indicator = (name: string) =>
      probe
        .locator(".dr-tree-view-branch-control", { hasText: name })
        .locator(".dr-tree-view-branch-indicator")
    expect(await computed(indicator("Closed"), "rotate")).toBe("180deg")
    expect(await computed(indicator("Open"), "rotate")).toBe("90deg")
    const toggle = (name: string) =>
      probe.getByRole("button", { name: `Toggle ${name}` }).locator("svg")
    expect(await computed(toggle("root"), "rotate")).toBe("90deg")
    expect(await computed(toggle("closed"), "rotate")).toBe("180deg")
  })
})

test.describe("slider", () => {
  test("the range fills from the track's right edge", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="slider"]')
    const track = await boxOf(probe.locator(".dr-slider-track"))
    const range = await boxOf(probe.locator(".dr-slider-range"))
    const thumb = await boxOf(probe.getByRole("slider"))
    const trackRight = track.x + track.width
    expect(Math.abs(range.x + range.width - trackRight)).toBeLessThanOrEqual(1)
    expect(Math.abs(range.width - track.width * 0.3)).toBeLessThanOrEqual(1)
    expect(Math.abs(thumb.x + thumb.width / 2 - range.x)).toBeLessThanOrEqual(1)
  })
})

test.describe("progress", () => {
  test("the value fills from the track's right edge", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="progress"]')
    const track = await boxOf(probe.getByRole("progressbar"))
    const fill = await boxOf(probe.locator(".dr-progress-indicator"))
    expect(
      Math.abs(fill.x - (track.x + track.width * 0.7)),
    ).toBeLessThanOrEqual(1)
  })
})

test.describe("background page", () => {
  for (const [variant, glow] of [
    ["mesh", ".dr-bg-mesh-cursor"],
    ["spotlight", ".dr-bg-spotlight-glow"],
  ] as const) {
    test(`the ${variant} glow follows the physical pointer x`, async ({
      page,
    }) => {
      await openFixture(page)
      const root = page.locator(
        `[data-probe="background-${variant}"] .dr-background-page`,
      )
      const box = await boxOf(root)
      const glowBox = await boxOf(root.locator(glow))
      const centre = glowBox.x + glowBox.width / 2
      expect(Math.abs(centre - (box.x + box.width * 0.2))).toBeLessThanOrEqual(
        1,
      )
    })
  }
})

test.describe("resizable", () => {
  test("dragging the handle toward the left grows the panel on the right", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="resizable"]')
    const first = probe.locator('[data-panel-id="first"]')
    const before = await boxOf(first)
    const second = await boxOf(probe.locator('[data-panel-id="second"]'))
    expect(before.x).toBeGreaterThan(second.x)
    const handle = await boxOf(probe.getByRole("separator"))
    const x = handle.x + handle.width / 2
    const y = handle.y + handle.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 40, y, { steps: 4 })
    await page.mouse.up()
    await expect
      .poll(async () => Math.round((await boxOf(first)).width - before.width))
      .toBe(40)
  })

  test("the left arrow grows the panel on the right", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="resizable"]')
    const first = probe.locator('[data-panel-id="first"]')
    const before = await boxOf(first)
    await probe.getByRole("separator").focus()
    await page.keyboard.press("ArrowLeft")
    await expect
      .poll(async () => Math.round((await boxOf(first)).width - before.width))
      .toBe(20)
  })
})

test.describe("carousel", () => {
  test("next moves the viewport to slide 2", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="carousel"]')
    const viewport = await boxOf(probe.locator(".dr-carousel-content-wrapper"))
    const slide = probe.getByRole("group").nth(1)
    const next = probe.getByRole("button", { name: "Next slide" })
    await next.click()
    await expect
      .poll(async () => Math.round((await boxOf(slide)).x - viewport.x))
      .toBe(0)
  })

  test("the buttons sit at the inline sides and their arrows mirror", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="carousel"]')
    const viewport = await boxOf(probe.locator(".dr-carousel-content-wrapper"))
    const next = probe.getByRole("button", { name: "Next slide" })
    const previous = probe.getByRole("button", { name: "Previous slide" })
    const nextBox = await boxOf(next)
    expect(nextBox.x + nextBox.width).toBeLessThanOrEqual(viewport.x)
    expect((await boxOf(previous)).x).toBeGreaterThanOrEqual(
      viewport.x + viewport.width,
    )
    expect(await computed(next.locator("svg"), "scale")).toBe("-1 1")
  })
})

test.describe("virtualized timeline", () => {
  test("mirrors the grid and the collapsed chevron", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="timeline-end"]')
    const cells = probe.getByRole("gridcell")
    expect((await boxOf(cells.nth(1))).x).toBeLessThan(
      (await boxOf(cells.nth(0))).x,
    )
    const collapsed = probe.locator(
      '.dr-virtualized-timeline-disclosure[data-collapsed="true"]',
    )
    expect(await computed(collapsed, "rotate")).toBe("90deg")
  })

  for (const side of ["end", "start"] as const) {
    test(`puts the ${side} rail on its edge with marks outboard`, async ({
      page,
    }) => {
      await openFixture(page)
      const probe = page.locator(`[data-probe="timeline-${side}"]`)
      const viewport = await boxOf(
        probe.locator(".dr-virtualized-timeline-viewport"),
      )
      const rail = await boxOf(probe.getByRole("slider"))
      const tick = probe
        .locator(".dr-virtualized-timeline-scrubber-tick")
        .first()
      const tickBox = await boxOf(tick)
      const label = await boxOf(tick.locator("span"))
      if (side === "end") {
        expect(rail.x + rail.width).toBeLessThanOrEqual(viewport.x + 1)
        expect(Math.abs(tickBox.x - rail.x)).toBeLessThanOrEqual(1)
        expect(label.x - tickBox.x).toBeGreaterThanOrEqual(5)
      } else {
        expect(rail.x).toBeGreaterThanOrEqual(viewport.x + viewport.width - 1)
        expect(
          Math.abs(tickBox.x + tickBox.width - (rail.x + rail.width)),
        ).toBeLessThanOrEqual(1)
        expect(
          tickBox.x + tickBox.width - (label.x + label.width),
        ).toBeGreaterThanOrEqual(5)
      }
    })
  }
})

test.describe("sheet and drawer sides", () => {
  test("the mobile drawer opens from the right edge", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 })
    await openFixture(page)
    await page
      .locator('[data-probe="mobile-drawer"]')
      .getByRole("button", { name: "Open menu" })
      .click()
    const sheet = page.getByRole("dialog", { name: "Navigation" })
    await expect(sheet).toHaveAttribute("data-state", "open")
    await settle(page)
    const box = await boxOf(sheet)
    expect(box.x + box.width).toBeCloseTo(600, 0)
    expect(box.x).toBeGreaterThan(0)
  })
})

test.describe("badge anchor corners", () => {
  test("the default corner is the top left", async ({ page }) => {
    await openFixture(page)
    const anchor = await boxOf(
      page.locator('[data-probe="badge-anchor"] .dr-badge-anchor'),
    )
    const badge = await boxOf(
      page.locator('[data-probe="badge-anchor"] .dr-badge-anchor-indicator'),
    )
    expect(badge.x + badge.width / 2).toBeCloseTo(anchor.x, 0)
    expect(badge.y + badge.height / 2).toBeCloseTo(anchor.y, 0)
  })
})

test.describe("field and control edges", () => {
  test("the switch thumb stays inside its track", async ({ page }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="switch"]')
    for (const name of ["Unchecked", "Checked"]) {
      const track = probe.getByRole("switch", { name, exact: true })
      const outer = await boxOf(track)
      const thumb = await boxOf(track.locator(".dr-switch-thumb"))
      expect(thumb.x).toBeGreaterThanOrEqual(outer.x)
      expect(thumb.x + thumb.width).toBeLessThanOrEqual(outer.x + outer.width)
    }
  })

  test("a button group squares its joins and rounds its outer ends", async ({
    page,
  }) => {
    await openFixture(page)
    const group = page.locator('[data-probe="button-group"]')
    const first = group.getByRole("button", { name: "One" })
    const middle = group.getByRole("button", { name: "Two" })
    const last = group.getByRole("button", { name: "Three" })
    expect(await computed(first, "border-top-right-radius")).not.toBe("0px")
    expect(await computed(first, "border-top-left-radius")).toBe("0px")
    expect(await computed(middle, "border-top-right-radius")).toBe("0px")
    expect(await computed(middle, "border-top-left-radius")).toBe("0px")
    expect(await computed(last, "border-top-left-radius")).not.toBe("0px")
    expect(await computed(last, "border-top-right-radius")).toBe("0px")
    const firstBox = await boxOf(first)
    const middleBox = await boxOf(middle)
    expect(middleBox.x + middleBox.width - firstBox.x).toBeCloseTo(1, 0)
  })

  test("the input prefix divider faces the field", async ({ page }) => {
    await openFixture(page)
    const addon = page.locator('[data-probe="input-prefix"] .dr-input-addon')
    expect(await computed(addon, "border-left-width")).toBe("1px")
    expect(await computed(addon, "border-right-width")).toBe("0px")
  })
})

test.describe("tabs edges", () => {
  const near = (a: number[], b: number[]) =>
    a.every((value, i) => Math.abs(value - (b[i] ?? 0)) <= 8)

  test("the vertical enclosed seam sits on the panel side", async ({
    page,
  }) => {
    await openFixture(page)
    const probe = page.locator('[data-probe="tabs-enclosed"]')
    await probe.scrollIntoViewIfNeeded()
    const list = await boxOf(probe.getByRole("tablist"))
    const panel = probe.getByRole("tabpanel")
    expect(list.x).toBeGreaterThan((await boxOf(panel)).x)
    const line = rgbOf(await computed(panel, "border-top-color"))
    const x = Math.round(list.x)
    const middle = async (name: string) => {
      const box = await boxOf(probe.getByRole("tab", { name }))
      return Math.round(box.y + box.height / 2)
    }
    expect(near(await pixel(page, x, await middle("One")), line)).toBe(true)
    expect(near(await pixel(page, x, await middle("Two")), line)).toBe(false)
  })
})
