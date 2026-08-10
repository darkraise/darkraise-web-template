import { test, expect, type Page } from "@playwright/test"
import { DARK_ONLY_PRESETS, PRESETS, type Preset } from "./fixtures/theme"
import { gotoApp, seedApp } from "./helpers/app"

/**
 * Every prior test for the sidebar active-item indicator reads the stylesheet
 * as TEXT (jsdom parses no CSS), so none of them prove a rule actually applies
 * to an element. This drives a real browser: it flips the three-way
 * `activeBar` control per preset and counts `inset` layers in the active
 * item's COMPUTED box-shadow. A preset whose rules never left `@layer
 * components` (or landed in the wrong file, as sci-fi's do — scifi.css is
 * unlayered and beats @layer components regardless of specificity) would
 * return the same count for "bar" and "both", which is exactly what the
 * `both > bar` comparison below is built to catch.
 */
async function insetLayers(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector(
      '.dr-sidebar-nav-item.active, .dr-sidebar-nav-item[data-status="active"]',
    )
    if (!el) throw new Error("no active sidebar item")
    const shadow = getComputedStyle(el).boxShadow
    return shadow.split(/,(?![^(]*\))/).filter((l) => l.includes("inset"))
      .length
  })
}

const activeBarControl = (page: Page) =>
  page.getByRole("radiogroup", { name: "Sidebar active-item indicator" })

async function selectActiveBar(
  page: Page,
  name: "Left rail only" | "Uniform ring only" | "Ring and left rail",
) {
  await activeBarControl(page).getByRole("radio", { name }).click()
}

/**
 * Baseline ("bar"/"ring") inset-layer count per preset, measured in a real
 * browser rather than assumed from the stylesheet source.
 *
 * Neon and Sci-fi carry 2 rather than 1: their own `--affordance-glow` /
 * `--scifi-active-glow` tokens already embed one inset layer as part of
 * their "lit from within" look (see real_neon_tube_wall_recipe /
 * scifi-active-glow), on top of the explicit rail-or-ring inset the
 * activeBar variant adds. "both" always adds exactly one more inset layer
 * than "bar" or "ring" alone, on every preset.
 *
 * `SidebarLayout` initializes its `activeBar` state to the literal `"bar"`
 * (not `undefined`), so the demo's pre-interaction render already carries
 * `data-active-bar="bar"` — there is no reachable "omitted prop" state in
 * this app to assert against separately.
 */
const BASELINE_LAYERS: Record<Preset, number> = {
  default: 1,
  glass: 1,
  neon: 2,
  terminal: 1,
  scifi: 2,
  playful: 1,
}

for (const preset of PRESETS) {
  const mode = DARK_ONLY_PRESETS.includes(preset) ? "dark" : "light"
  const baseline = BASELINE_LAYERS[preset]

  test.describe(`${preset} · ${mode}`, () => {
    test(`active-bar control changes computed box-shadow layers`, async ({
      page,
    }) => {
      await seedApp(page, { preset, mode })
      await gotoApp(page, "/")
      await expect(activeBarControl(page)).toBeVisible()

      // Before touching the control, the demo already renders
      // data-active-bar="bar" (SidebarLayout's initial state), so the
      // pre-interaction count matches the "bar" baseline for this preset.
      expect(await insetLayers(page)).toBe(baseline)

      await selectActiveBar(page, "Left rail only")
      const barLayers = await insetLayers(page)
      expect(barLayers).toBe(baseline)

      await selectActiveBar(page, "Uniform ring only")
      expect(await insetLayers(page)).toBe(baseline)

      await selectActiveBar(page, "Ring and left rail")
      const bothLayers = await insetLayers(page)
      expect(bothLayers).toBe(baseline + 1)

      // The comparison that actually catches an unconverted preset: an
      // unconverted preset returns the same count for "bar" and "both".
      expect(bothLayers).toBeGreaterThan(barLayers)
    })
  })
}
