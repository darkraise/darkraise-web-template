import { test, expect, type Page } from "@playwright/test"
import { STYLES } from "./fixtures/theme"
import {
  gotoApp,
  openAdvanced,
  openThemeSwitcher,
  reloadApp,
  seedApp,
} from "./helpers/app"
import { computed } from "./helpers/measure"

/**
 * The sidebar active-item indicator, in a real browser: jsdom parses no CSS,
 * so only here does a rule provably reach an element. The spec walks the
 * four-way `sidebarActiveBar` axis and counts `inset` layers in the active
 * item's COMPUTED box-shadow; a rule that never applied returns the same
 * count for "bar" and "both", which the `both > bar` comparison catches.
 *
 * The count alone cannot tell "bar" from "ring" (one inset layer each), so
 * the geometry is matched too. Chrome serialises a layer as "color offsetX
 * offsetY blur spread inset": a rail is "… 3px 0px 0px 0px inset" and a ring
 * "… 0px 0px 0px 1px inset". Matching only that numeric tail keeps the check
 * independent of the colour format and of the layer order.
 */
const RAIL_GEOMETRY = /3px 0px 0px 0px inset/
const RING_GEOMETRY = /0px 0px 0px 1px inset/

async function activeItemShadow(
  page: Page,
): Promise<{ count: number; shadow: string }> {
  return page.evaluate(() => {
    const el = document.querySelector(
      '.dr-sidebar-nav-item.active, .dr-sidebar-nav-item[data-status="active"]',
    )
    if (!el) throw new Error("no active sidebar item")
    const shadow = getComputedStyle(el).boxShadow
    const count = shadow
      .split(/,(?![^(]*\))/)
      .filter((l) => l.includes("inset")).length
    return { count, shadow }
  })
}

const ACTIVE_BAR_LABELS = {
  default: "Auto",
  bar: "Bar",
  ring: "Ring",
  both: "Both",
} as const

type ActiveBar = keyof typeof ACTIVE_BAR_LABELS

async function setActiveBar(page: Page, value: ActiveBar) {
  const panel = await openThemeSwitcher(page)
  await openAdvanced(page)
  await panel
    .locator('[aria-label="Sidebar Indicator"]')
    .getByRole("radio", { name: ACTIVE_BAR_LABELS[value], exact: true })
    .click()
  const nav = page.locator(".dr-sidebar-nav").first()
  if (value === "default") {
    await expect(nav).not.toHaveAttribute("data-active-bar", /.+/)
  } else {
    await expect(nav).toHaveAttribute("data-active-bar", value)
  }
}

/**
 * Inset layers on the active item per indicator value. Every style shares one
 * set of active-item rules, so one table serves them all: unset, the row is
 * marked by its tint alone (17-selection-overlays measures it); "bar" and
 * "ring" add one layer; "both" adds two.
 */
const INSET_LAYERS: Record<ActiveBar, number> = {
  default: 0,
  bar: 1,
  ring: 1,
  both: 2,
}

for (const style of STYLES) {
  const mode = "light"

  test.describe(`${style} · ${mode}`, () => {
    test(`sidebar indicator axis changes computed box-shadow layers`, async ({
      page,
    }) => {
      await seedApp(page, { style, mode })
      await gotoApp(page, "/")
      expect((await activeItemShadow(page)).count).toBe(INSET_LAYERS.default)

      await setActiveBar(page, "bar")
      const bar = await activeItemShadow(page)
      expect(bar.count).toBe(INSET_LAYERS.bar)
      // "bar" must carry the rail geometry and NOT the ring geometry, or a
      // "ring" that silently fell back to a rail would pass the counts.
      expect(bar.shadow).toMatch(RAIL_GEOMETRY)
      expect(bar.shadow).not.toMatch(RING_GEOMETRY)

      await setActiveBar(page, "ring")
      const ring = await activeItemShadow(page)
      expect(ring.count).toBe(INSET_LAYERS.ring)
      expect(ring.shadow).toMatch(RING_GEOMETRY)
      expect(ring.shadow).not.toMatch(RAIL_GEOMETRY)

      await setActiveBar(page, "both")
      const both = await activeItemShadow(page)
      expect(both.count).toBe(INSET_LAYERS.both)
      expect(both.shadow).toMatch(RAIL_GEOMETRY)
      expect(both.shadow).toMatch(RING_GEOMETRY)
      expect(both.count).toBeGreaterThan(bar.count)

      // Setting "default" again round-trips back to the unset baseline.
      await setActiveBar(page, "default")
      expect((await activeItemShadow(page)).count).toBe(INSET_LAYERS.default)
    })
  })
}

/**
 * The stacked layout's rail stamps the indicator setting itself rather than
 * through a SidebarNav, so under Glass, whose chrome is the most restyled, its
 * active item must still compute exactly the sidebar's shadow.
 */
for (const activeBar of Object.keys(ACTIVE_BAR_LABELS) as ActiveBar[]) {
  test(`glass · the stacked rail paints the sidebar's active shadow · ${activeBar}`, async ({
    page,
  }) => {
    await seedApp(page, {
      style: "glass",
      mode: "light",
      sidebarActiveBar: activeBar,
    })
    await gotoApp(page, "/")
    const sidebar = await activeItemShadow(page)
    expect(sidebar.count).toBe(INSET_LAYERS[activeBar])

    await page.evaluate(() => localStorage.setItem("layout-variant", "stacked"))
    await reloadApp(page)
    const rail = page.locator(
      '.dr-stacked-layout-rail-nav .dr-sidebar-nav-item[data-status="active"]',
    )
    await expect(rail).toHaveCount(1)
    expect(await computed(rail, "box-shadow")).toBe(sidebar.shadow)
  })
}
