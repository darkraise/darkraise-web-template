import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { computed, settle } from "./helpers/measure"

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
