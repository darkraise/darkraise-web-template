import { test, expect, type Locator, type Page } from "@playwright/test"
import { STYLES } from "./fixtures/theme"
import { gotoApp, reloadApp, seedApp } from "./helpers/app"
import { contrast, pixel, rgbOf, settle, type Rgb } from "./helpers/measure"

/**
 * The sidebar selection in a real browser. Pixels rather than computed
 * styles, because Glass paints translucent layers over a gradient.
 */

const LOOKS = ["chip", "pill", "tile", "frosted"] as const
const MODES = ["light", "dark"] as const
/** Blue is the default accent; neutral is the faintest on a light rail. */
const ACCENTS = ["blue", "neutral"] as const
/** The surface or its edge against the rail. */
const SURFACE_FLOOR = 1.2
/** The icon, tile or pill against the surface. */
const CUE_FLOOR = 3

const nav = (page: Page) =>
  page.locator(".dr-sidebar-layout-nav-scroll .dr-sidebar-nav")
const current = (page: Page) => nav(page).locator(".dr-sidebar-nav-current")
const indicator = (page: Page) => nav(page).locator(".dr-sidebar-nav-indicator")

async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (!found) throw new Error("element is not rendered")
  return found
}

async function cue(page: Page, look: (typeof LOOKS)[number]): Promise<Rgb> {
  if (look === "tile") {
    return rgbOf(
      await current(page)
        .locator(".dr-sidebar-nav-icon")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    )
  }
  if (look === "pill") {
    return rgbOf(
      await indicator(page).evaluate(
        (el) => getComputedStyle(el, "::before").backgroundColor,
      ),
    )
  }
  return rgbOf(
    await current(page)
      .locator(".dr-sidebar-nav-icon-svg")
      .evaluate((el) => getComputedStyle(el).color),
  )
}

for (const style of STYLES) {
  for (const mode of MODES) {
    for (const accent of ACCENTS) {
      for (const look of LOOKS) {
        test(`${look} reads on the ${style} ${mode} rail · ${accent}`, async ({
          page,
        }) => {
          await seedApp(page, { style, mode, accent, sidebarSelection: look })
          await gotoApp(page, "/orders")
          await expect(nav(page)).toHaveAttribute("data-indicator", "ready")
          await settle(page)
          const row = await box(current(page))
          const x = Math.round(row.x + row.width - 8)
          const surface = await pixel(
            page,
            x,
            Math.round(row.y + row.height / 2),
          )
          const edge = await pixel(page, x, Math.floor(row.y) - 1)
          // The group label row above "Orders" is empty at the row's far end.
          const rail = await pixel(page, x, Math.round(row.y) - 14)
          expect(
            Math.max(contrast(surface, rail), contrast(edge, rail)),
            "surface or edge against the rail",
          ).toBeGreaterThanOrEqual(SURFACE_FLOOR)
          expect(
            contrast(await cue(page, look), surface),
            "cue against the surface",
          ).toBeGreaterThanOrEqual(CUE_FLOOR)
        })
      }
    }
  }
}

for (const [style, mode] of [
  ["quiet", "light"],
  ["glass", "dark"],
] as const) {
  for (const look of LOOKS) {
    test(`${look} keeps an accent cue in the collapsed rail's popover · ${style} ${mode}`, async ({
      page,
    }) => {
      // No collapse or fade animation: frosted blur re-rendered every frame
      // starves a loaded worker, and a fading popover has no stable pixels.
      await page.emulateMedia({ reducedMotion: "reduce" })
      await seedApp(page, { style, mode, sidebarSelection: look })
      await gotoApp(page, "/categories")
      await page.getByRole("button", { name: "Collapse sidebar" }).click()
      await settle(page)
      await nav(page).getByRole("button", { name: "Products" }).click()
      const entry = page.locator(
        ".dr-sidebar-nav-popover-content .dr-sidebar-nav-current",
      )
      await expect(entry).toHaveCount(1)
      await settle(page)
      const row = await box(entry)
      const surface = await pixel(
        page,
        Math.round(row.x + row.width - 8),
        Math.round(row.y + row.height / 2),
      )
      const label = rgbOf(
        await entry.evaluate((el) => getComputedStyle(el).color),
      )
      expect(
        contrast(label, surface),
        "label against the surface",
      ).toBeGreaterThanOrEqual(CUE_FLOOR)
    })
  }
}

/** Starts recording the indicator's transitions; read them with `runs`. */
async function recordTransitions(page: Page) {
  await indicator(page).evaluate((el) => {
    const runs: string[] = []
    ;(window as unknown as { runs: string[] }).runs = runs
    el.addEventListener("transitionrun", (event) =>
      runs.push((event as TransitionEvent).propertyName),
    )
  })
}

const runs = (page: Page) =>
  page.evaluate(() => (window as unknown as { runs: string[] }).runs)

test.describe("the indicator", () => {
  async function expectAligned(page: Page) {
    await settle(page)
    const [moved, row] = [await box(indicator(page)), await box(current(page))]
    for (const key of ["x", "y", "width", "height"] as const) {
      expect(Math.abs(moved[key] - row[key]), key).toBeLessThanOrEqual(1)
    }
  }

  async function arriveAtOrders(page: Page) {
    await gotoApp(page, "/orders")
    await expect(nav(page)).toHaveAttribute("data-indicator", "ready")
    await settle(page)
  }

  test.beforeEach(async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
  })

  test("lands on the row after navigating", async ({ page }) => {
    await gotoApp(page, "/")
    await nav(page).getByRole("link", { name: "Orders" }).click()
    await expect(current(page)).toContainText("Orders")
    await expectAligned(page)
  })

  test("slides to the next row", async ({ page }) => {
    await arriveAtOrders(page)
    await recordTransitions(page)
    await nav(page).getByRole("link", { name: "Customers" }).click()
    await expect(indicator(page)).toHaveAttribute("data-animate", "true")
    await expect.poll(() => runs(page)).toContain("transform")
    await expectAligned(page)
  })

  test("follows the row when a group above it opens and closes", async ({
    page,
  }) => {
    await arriveAtOrders(page)
    const toggle = nav(page).getByRole("button", { name: "Products" })
    await toggle.click()
    await expectAligned(page)
    await toggle.click()
    await expectAligned(page)
  })

  test("follows the sidebar's collapse without a transition", async ({
    page,
  }) => {
    await arriveAtOrders(page)
    // Slide first, so the indicator holds data-animate="true" going in.
    await nav(page).getByRole("link", { name: "Customers" }).click()
    await expectAligned(page)
    await recordTransitions(page)
    await page.getByRole("button", { name: "Collapse sidebar" }).click()
    await expectAligned(page)
    await expect(indicator(page)).toHaveAttribute("data-animate", "false")
    expect(await runs(page)).toEqual([])
  })

  test("does not transition under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await arriveAtOrders(page)
    await recordTransitions(page)
    await nav(page).getByRole("link", { name: "Customers" }).click()
    await expect(indicator(page)).toHaveAttribute("data-animate", "true")
    expect(
      await indicator(page).evaluate(
        (el) => getComputedStyle(el).transitionProperty,
      ),
    ).toBe("none")
    await expectAligned(page)
    expect(await runs(page)).toEqual([])
  })
})

/** How far Pill's marker sits from its nav's left edge, in px. */
function markerToEdge(navLocator: Locator) {
  return navLocator.evaluate((el) => {
    const moved = el.querySelector(".dr-sidebar-nav-indicator")
    if (!moved) throw new Error("no indicator")
    const marker =
      moved.getBoundingClientRect().left +
      parseFloat(getComputedStyle(moved, "::before").left)
    return Math.abs(marker - el.getBoundingClientRect().left)
  })
}

test("the collapsed rail puts Pill's marker on the nav's edge", async ({
  page,
}) => {
  await seedApp(page, {
    style: "quiet",
    mode: "light",
    sidebarSelection: "pill",
  })
  await gotoApp(page, "/orders")
  await page.getByRole("button", { name: "Collapse sidebar" }).click()
  await settle(page)
  expect(await markerToEdge(nav(page))).toBeLessThanOrEqual(1)
})

test("the stacked rail puts Pill's marker on the nav's edge", async ({
  page,
}) => {
  await seedApp(page, {
    style: "quiet",
    mode: "light",
    sidebarSelection: "pill",
  })
  await gotoApp(page, "/orders")
  await page.evaluate(() => localStorage.setItem("layout-variant", "stacked"))
  await reloadApp(page)
  const rail = page.locator(".dr-stacked-layout-rail-nav")
  await expect(rail).toHaveAttribute("data-indicator", "ready")
  await settle(page)
  expect(await markerToEdge(rail)).toBeLessThanOrEqual(1)
})

for (const look of ["chip", "tile"] as const) {
  test(`the stacked rail draws ${look}'s icon cue`, async ({ page }) => {
    await seedApp(page, {
      style: "quiet",
      mode: "light",
      sidebarSelection: look,
    })
    await gotoApp(page, "/orders")
    await page.evaluate(() => localStorage.setItem("layout-variant", "stacked"))
    await reloadApp(page)
    const rail = page.locator(".dr-stacked-layout-rail-nav")
    await expect(rail).toHaveAttribute("data-indicator", "ready")
    const item = rail.locator(".dr-sidebar-nav-current")
    await expect(item).toHaveCount(1)
    const seen = await item.evaluate((el) => {
      const pick = (selector: string) => {
        const found = el.querySelector(selector)
        if (!found) throw new Error(`no ${selector}`)
        return getComputedStyle(found)
      }
      // Resolve a token the way the rail would, from inside the row.
      const resolve = (value: string) => {
        const probe = document.createElement("span")
        probe.style.color = value
        el.append(probe)
        const color = getComputedStyle(probe).color
        probe.remove()
        return color
      }
      const moved = el
        .closest(".dr-stacked-layout-rail-nav")
        ?.querySelector(".dr-sidebar-nav-indicator")
      if (!moved) throw new Error("no indicator")
      return {
        glyph: pick(".dr-sidebar-nav-icon-svg").color,
        tile: pick(".dr-sidebar-nav-icon").backgroundColor,
        chip: getComputedStyle(moved).backgroundColor,
        primaryText: resolve("hsl(var(--primary-text))"),
        primaryFill: resolve("hsl(var(--primary-fill))"),
        primaryForeground: resolve("hsl(var(--primary-foreground))"),
      }
    })
    if (look === "tile") {
      expect(seen.tile).toBe(seen.primaryFill)
      expect(seen.glyph).toBe(seen.primaryForeground)
      // An icon rail shows the tile without the chip around it.
      expect(seen.chip).toBe("rgba(0, 0, 0, 0)")
    } else {
      expect(seen.glyph).toBe(seen.primaryText)
      expect(seen.tile).toBe("rgba(0, 0, 0, 0)")
    }
  })
}

const DETAIL_ROUTES = [
  ["/orders/ord-1", "Orders"],
  ["/customers/cust-1", "Customers"],
  // A child whose href is outside its parent's path.
  ["/categories", "Categories"],
] as const

for (const [path, label] of DETAIL_ROUTES) {
  test(`${path} keeps ${label} active`, async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, path)
    await expect(current(page)).toHaveCount(1)
    await expect(current(page)).toContainText(label)
    // Through the real router adapter: one link in the nav names the page.
    await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(1)
  })
}

test("a stored indicator migrates to a look", async ({ page }) => {
  // Only before the migration marker exists, so the reload after it does not
  // re-seed the old key.
  await page.addInitScript(() => {
    if (localStorage.getItem("theme-settings-version") === null) {
      localStorage.setItem("theme-sidebar-active-bar", "bar")
    }
  })
  await seedApp(page, { style: "quiet", mode: "light" })
  await gotoApp(page, "/")
  // Quiet's Auto is chip, so "pill" can only have come from the migration.
  await expect(nav(page)).toHaveAttribute("data-sidebar-selection", "pill")
  expect(
    await page.evaluate(() => [
      localStorage.getItem("theme-sidebar-active-bar"),
      localStorage.getItem("theme-sidebar-selection"),
    ]),
  ).toEqual([null, "pill"])
})
