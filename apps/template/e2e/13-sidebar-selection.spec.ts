import { test, expect, type Locator, type Page } from "@playwright/test"
import { STYLES } from "./fixtures/theme"
import { gotoApp, reloadApp, seedApp } from "./helpers/app"
import { contrast, pixel, rgbOf, settle, type Rgb } from "./helpers/measure"

/**
 * The sidebar selection in a real browser. Pixels rather than computed
 * styles, because Glass paints translucent layers over a gradient.
 */

const LOOKS = [
  "chip",
  "pill",
  "tile",
  "frosted",
  "tint",
  "accent",
  "rule",
  "key",
  "tab",
] as const
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

/**
 * Each colour value as a child of the element resolves it, so custom
 * properties set on the element or its ancestors apply.
 */
function resolveColours(locator: Locator, values: string[]) {
  return locator.evaluate(
    (el, list) =>
      list.map((value) => {
        const probe = document.createElement("span")
        probe.style.color = value
        el.append(probe)
        const color = getComputedStyle(probe).color
        probe.remove()
        return color
      }),
    values,
  )
}

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
  if (look === "pill" || look === "rule") {
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
          // The rule look has no surface: its marker carries the row.
          if (look === "rule") {
            expect(
              contrast(await cue(page, look), rail),
              "rule against the rail",
            ).toBeGreaterThanOrEqual(CUE_FLOOR)
            return
          }
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
      const label = await entry.evaluate((el) => getComputedStyle(el).color)
      const [foreground, foregroundHover] = await resolveColours(entry, [
        "hsl(var(--sidebar-foreground))",
        "hsl(var(--sidebar-foreground-hover))",
      ])
      const seen = { label, foreground, foregroundHover }
      // The plain nav label colours: an entry painted in either carries no cue.
      expect(seen.label, "label against --sidebar-foreground").not.toBe(
        seen.foreground,
      )
      expect(seen.label, "label against --sidebar-foreground-hover").not.toBe(
        seen.foregroundHover,
      )
      const row = await box(entry)
      const surface = await pixel(
        page,
        Math.round(row.x + row.width - 8),
        Math.round(row.y + row.height / 2),
      )
      expect(
        contrast(rgbOf(seen.label), surface),
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

  test("keeps a slide when the nav re-renders under zoom", async ({ page }) => {
    await arriveAtOrders(page)
    // Zoom puts the rows on fractions of a pixel that an inline style reads
    // back rounded to six significant digits.
    await page.evaluate(() => {
      document.documentElement.style.zoom = "1.25"
    })
    await settle(page)
    await nav(page).getByRole("link", { name: "Customers" }).click()
    await expect(indicator(page)).toHaveAttribute("data-animate", "true")
    // A new language rebuilds the nav items under the same pathname.
    await page.getByRole("combobox", { name: "Language" }).click()
    await page.getByRole("option", { name: "Tiếng Việt" }).click()
    await expect(page.locator("html")).toHaveAttribute("lang", "vi")
    await settle(page)
    await expect(indicator(page)).toHaveAttribute("data-animate", "true")
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
      const moved = el
        .closest(".dr-stacked-layout-rail-nav")
        ?.querySelector(".dr-sidebar-nav-indicator")
      if (!moved) throw new Error("no indicator")
      return {
        glyph: pick(".dr-sidebar-nav-icon-svg").color,
        tile: pick(".dr-sidebar-nav-icon").backgroundColor,
        chip: getComputedStyle(moved).backgroundColor,
      }
    })
    // Resolve each token the way the rail would, from inside the row.
    const [primaryText, primaryFill, primaryForeground] = await resolveColours(
      item,
      [
        "hsl(var(--primary-text))",
        "hsl(var(--primary-fill))",
        "hsl(var(--primary-foreground))",
      ],
    )
    if (look === "tile") {
      expect(seen.tile).toBe(primaryFill)
      expect(seen.glyph).toBe(primaryForeground)
      // An icon rail shows the tile without the chip around it.
      expect(seen.chip).toBe("rgba(0, 0, 0, 0)")
    } else {
      expect(seen.glyph).toBe(primaryText)
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

test.describe("selection tokens and signatures", () => {
  async function arrive(page: Page, look: string) {
    await seedApp(page, {
      style: "quiet",
      mode: "light",
      sidebarSelection: look,
    })
    await gotoApp(page, "/orders")
    await expect(nav(page)).toHaveAttribute("data-indicator", "ready")
    await settle(page)
  }

  async function stamp(page: Page, name: string, value: string) {
    await page.evaluate(
      ([n, v]) => document.documentElement.setAttribute(n, v),
      [name, value] as const,
    )
    await settle(page)
  }

  const marker = (page: Page, property: string) =>
    indicator(page).evaluate(
      (el, name) => getComputedStyle(el, "::before").getPropertyValue(name),
      property,
    )

  test("a style's selection tokens override the look", async ({ page }) => {
    await arrive(page, "chip")
    await page.addStyleTag({
      content: `@layer style.base { :root {
        --nav-selection-fill: rgb(1, 2, 3);
        --nav-selection-edge: rgb(4, 5, 6);
        --nav-selection-shadow: rgb(7, 8, 9) 0px 2px 0px 0px;
        --nav-selection-glow: rgb(10, 11, 12) 0px 0px 6px 0px;
        --nav-item-radius: 5px;
      } }`,
    })
    await settle(page)
    expect(
      await indicator(page).evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    ).toBe("rgb(1, 2, 3)")
    expect(
      await indicator(page).evaluate((el) => getComputedStyle(el).boxShadow),
    ).toBe(
      "rgb(4, 5, 6) 0px 0px 0px 1px, rgb(7, 8, 9) 0px 2px 0px 0px, rgb(10, 11, 12) 0px 0px 6px 0px",
    )
    expect(
      await indicator(page).evaluate(
        (el) => getComputedStyle(el).borderTopLeftRadius,
      ),
    ).toBe("5px")
    expect(
      await current(page).evaluate(
        (el) => getComputedStyle(el).borderTopLeftRadius,
      ),
    ).toBe("5px")
  })

  for (const look of ["tint", "rule"]) {
    test(`the ${look} look sets the label in the accent`, async ({ page }) => {
      await arrive(page, look)
      const [accent] = await resolveColours(current(page), [
        "hsl(var(--primary-text))",
      ])
      expect(
        await current(page).evaluate((el) => getComputedStyle(el).color),
      ).toBe(accent)
    })
  }

  test("the marker follows the marker signature", async ({ page }) => {
    await arrive(page, "pill")
    const [accent] = await resolveColours(nav(page), [
      "hsl(var(--primary-text))",
    ])
    expect(await marker(page, "background-color")).toBe(accent)
    expect(await marker(page, "width")).toBe("3px")

    await stamp(page, "data-nav-marker", "none")
    expect(await marker(page, "background-color")).toBe("rgba(0, 0, 0, 0)")

    await stamp(page, "data-nav-marker", "rule")
    const row = await box(current(page))
    expect(await marker(page, "background-color")).toBe(accent)
    expect(await marker(page, "width")).toBe("2px")
    expect(parseFloat(await marker(page, "height"))).toBeCloseTo(row.height, 0)
    const offset = async () =>
      parseFloat(await marker(page, "top")) +
      parseFloat(await marker(page, "margin-top"))
    expect(await offset()).toBeCloseTo(0, 0)

    await stamp(page, "data-nav-marker", "bar")
    expect(await marker(page, "width")).toBe("3px")
    expect(await marker(page, "height")).toBe("16px")
    expect(await offset()).toBeCloseTo((row.height - 16) / 2, 0)
  })

  test("a chip draws the bar under the bar marker", async ({ page }) => {
    await arrive(page, "chip")
    expect(await marker(page, "background-color")).toBe("rgba(0, 0, 0, 0)")
    await stamp(page, "data-nav-marker", "bar")
    const [accent] = await resolveColours(nav(page), [
      "hsl(var(--primary-text))",
    ])
    expect(await marker(page, "background-color")).toBe(accent)
  })

  test("group labels follow the label case signature", async ({ page }) => {
    await arrive(page, "chip")
    const label = nav(page).locator(".dr-sidebar-nav-group-label").first()
    const transform = () =>
      label.evaluate((el) => getComputedStyle(el).textTransform)
    expect(await transform()).toBe("uppercase")
    await stamp(page, "data-label-case", "upper")
    expect(await transform()).toBe("uppercase")
    await stamp(page, "data-label-case", "none")
    expect(await transform()).toBe("none")
    expect(
      await label.evaluate((el) => getComputedStyle(el).letterSpacing),
    ).toBe("normal")
    await stamp(page, "data-label-case", "lower")
    expect(await transform()).toBe("lowercase")
  })

  test("the top nav draws the selection look", async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem("layout-variant", "top-nav"),
    )
    await seedApp(page, {
      style: "quiet",
      mode: "light",
      sidebarSelection: "accent",
    })
    await gotoApp(page, "/orders")
    const topNav = page.locator(".dr-top-nav-layout-nav")
    await expect(topNav).toHaveAttribute("data-sidebar-selection", "accent")
    const active = topNav.locator(".dr-top-nav-layout-nav-item.active")
    await expect(active).toHaveCount(1)
    await settle(page)
    const [fill, edge] = await resolveColours(topNav, [
      "hsl(var(--primary) / 0.12)",
      "hsl(var(--primary) / 0.3)",
    ])
    expect(
      await active.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(fill)
    expect(
      await active.evaluate((el) => getComputedStyle(el).boxShadow),
    ).toContain(`${edge} 0px 0px 0px 1px`)
  })

  test("the rule look keeps a fill on the top nav's active item", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem("layout-variant", "top-nav"),
    )
    await seedApp(page, {
      style: "quiet",
      mode: "light",
      sidebarSelection: "rule",
    })
    await gotoApp(page, "/orders")
    const topNav = page.locator(".dr-top-nav-layout-nav")
    await expect(topNav).toHaveAttribute("data-sidebar-selection", "rule")
    const active = topNav.locator(".dr-top-nav-layout-nav-item.active")
    await expect(active).toHaveCount(1)
    await settle(page)
    const [fill] = await resolveColours(topNav, [
      "hsl(var(--sidebar-active-bg))",
    ])
    expect(fill).not.toBe("rgba(0, 0, 0, 0)")
    expect(
      await active.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(fill)
  })

  // Tactile draws an inverse bar. Its own look is the chip; the rule look
  // is one a user picks over it.
  for (const [look, picked] of [
    ["chip", {}],
    ["rule", { sidebarSelection: "rule" }],
  ] as const) {
    test(`the top nav's active item stays readable on a toned bar · ${look}`, async ({
      page,
    }) => {
      await page.addInitScript(() =>
        localStorage.setItem("layout-variant", "top-nav"),
      )
      await seedApp(page, { style: "tactile", mode: "light", ...picked })
      await gotoApp(page, "/orders")
      await expect(page.locator("html")).toHaveAttribute(
        "data-bar-tone",
        "inverse",
      )
      const topNav = page.locator(".dr-top-nav-layout-nav")
      await expect(topNav).toHaveAttribute("data-sidebar-selection", look)
      const active = topNav.locator(".dr-top-nav-layout-nav-item.active")
      await expect(active).toHaveCount(1)
      await settle(page)
      const [card] = await resolveColours(topNav, ["hsl(var(--card))"])
      expect(
        await active.evaluate((el) => getComputedStyle(el).backgroundColor),
      ).not.toBe(card)
      // The bar paints its fill on a pseudo-element, which a walk up the
      // item's ancestors cannot see, so the ground is read from a pixel.
      const row = await box(active)
      const ground = await pixel(
        page,
        Math.round(row.x + row.width - 5),
        Math.round(row.y + row.height / 2),
      )
      const ink = rgbOf(
        await active.evaluate((el) => getComputedStyle(el).color),
      )
      expect(contrast(ink, ground)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
