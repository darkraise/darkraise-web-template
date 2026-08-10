import { test, expect, type Page } from "@playwright/test"
import { DARK_ONLY_PRESETS, PRESETS, type Preset } from "./fixtures/theme"
import { gotoApp, seedApp } from "./helpers/app"

/**
 * Every prior test for the sidebar active-item indicator reads the stylesheet
 * as TEXT (jsdom parses no CSS), so none of them prove a rule actually applies
 * to an element. This drives a real browser: it flips the four-way
 * `activeBar` control per preset and counts `inset` layers in the active
 * item's COMPUTED box-shadow. A preset whose rules never left `@layer
 * components` (or landed in the wrong file, as sci-fi's do — scifi.css is
 * unlayered and beats @layer components regardless of specificity) would
 * return the same count for "bar" and "both", which is exactly what the
 * `both > bar` comparison below is built to catch.
 *
 * The layer COUNT alone cannot tell "bar" apart from "ring" — both produce
 * exactly one inset layer in every preset, so a broken "ring" that silently
 * fell back to a rail would still pass a count-only check. The geometry
 * differs, though: a rail layer carries a 3px horizontal offset
 * (`inset 3px 0 0 0`), a ring layer carries no offset and a 1px spread
 * (`inset 0 0 0 1px`). Chrome's computed `box-shadow` serialises each layer
 * as "color offsetX offsetY blurRadius spreadRadius inset", e.g.
 * "rgb(60, 131, 246) 3px 0px 0px 0px inset" for a rail and
 * "rgb(60, 131, 246) 0px 0px 0px 1px inset" for a ring (observed directly —
 * see RAIL_GEOMETRY / RING_GEOMETRY below). Matching the whole layer text is
 * fragile (color format varies between rgb()/rgba(), and layer order and
 * color position vary by preset), so the geometry regexes below match only
 * the numeric+inset tail, which is stable across all of it. Some presets'
 * OWN glow tokens contain the same "0 0 0 1px" shape as an OUTER (non-inset)
 * layer — e.g. glass's `--glass-halo-raised` — but since that layer has no
 * trailing "inset" keyword, RING_GEOMETRY (which requires "1px inset"
 * contiguous) does not match it.
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

const activeBarControl = (page: Page) =>
  page.getByRole("radiogroup", { name: "Sidebar active-item indicator" })

async function selectActiveBar(
  page: Page,
  name:
    | "Each preset's own indicator"
    | "Left rail only"
    | "Uniform ring only"
    | "Ring and left rail",
) {
  await activeBarControl(page).getByRole("radio", { name }).click()
}

/**
 * Unset ("Default" item / pre-interaction) inset-layer count per preset,
 * measured on `master` before this branch existed — `SidebarLayout` there
 * held `useState(true)` and `SidebarNav` mapped that to an OMITTED
 * `data-active-bar` attribute, so every preset rendered its own default
 * indicator. Re-measured directly rather than assumed:
 *
 *   git checkout master && pnpm --filter darkraise-ui build
 *   (drive gotoApp("/") per preset/mode, read insetLayers() with no
 *   interaction — master's initial state is already "unset")
 *
 *   MASTER default light unset=1
 *   MASTER glass light unset=2
 *   MASTER neon dark unset=2
 *   MASTER terminal dark unset=1
 *   MASTER scifi dark unset=2
 *   MASTER playful light unset=1
 *
 * This branch's Task 4 regressed that: `SidebarLayout` started at the
 * literal `"bar"` value instead of `undefined`, which forced a rail
 * everywhere the demo mounted — glass silently dropped from ring+rail (2)
 * to rail-only (1) before anyone touched the control. The fix restores an
 * actual unset state (`undefined`), exposed on the wire as a fourth
 * "Default" control item since a single-selection ToggleGroup can't hold
 * `undefined` itself.
 */
const UNSET_LAYERS: Record<Preset, number> = {
  default: 1,
  glass: 2,
  neon: 2,
  terminal: 1,
  scifi: 2,
  playful: 1,
}

/**
 * Explicit "bar"/"ring" baseline inset-layer count per preset, measured in
 * a real browser on this branch. Neon and Sci-fi carry 2 rather than 1:
 * their own `--affordance-glow` / `--scifi-active-glow` tokens already
 * embed one inset layer as part of their "lit from within" look, on top of
 * the explicit rail-or-ring inset the activeBar variant adds. Glass drops
 * to 1 here (below its own unset default of 2) because its dedicated
 * `data-active-bar="bar"`/`"ring"` overrides intentionally show a single
 * indicator when the caller asks for one explicitly. "both" always adds
 * exactly one more inset layer than "bar"/"ring" alone, on every preset.
 */
const EXPLICIT_LAYERS: Record<Preset, number> = {
  default: 1,
  glass: 1,
  neon: 2,
  terminal: 1,
  scifi: 2,
  playful: 1,
}

for (const preset of PRESETS) {
  const mode = DARK_ONLY_PRESETS.includes(preset) ? "dark" : "light"
  const unset = UNSET_LAYERS[preset]
  const explicit = EXPLICIT_LAYERS[preset]

  test.describe(`${preset} · ${mode}`, () => {
    test(`active-bar control changes computed box-shadow layers`, async ({
      page,
    }) => {
      await seedApp(page, { preset, mode })
      await gotoApp(page, "/")
      await expect(activeBarControl(page)).toBeVisible()

      // Before touching the control, `activeBar` is unset — each preset
      // renders its own pre-existing default, matching master.
      expect((await activeItemShadow(page)).count).toBe(unset)

      await selectActiveBar(page, "Left rail only")
      const bar = await activeItemShadow(page)
      expect(bar.count).toBe(explicit)
      // "bar" must carry the rail geometry and NOT the ring geometry, or a
      // "ring" that silently fell back to a rail would still pass the count
      // checks above on every preset.
      expect(bar.shadow).toMatch(RAIL_GEOMETRY)
      expect(bar.shadow).not.toMatch(RING_GEOMETRY)

      await selectActiveBar(page, "Uniform ring only")
      const ring = await activeItemShadow(page)
      expect(ring.count).toBe(explicit)
      expect(ring.shadow).toMatch(RING_GEOMETRY)
      expect(ring.shadow).not.toMatch(RAIL_GEOMETRY)

      await selectActiveBar(page, "Ring and left rail")
      const both = await activeItemShadow(page)
      expect(both.count).toBe(explicit + 1)
      expect(both.shadow).toMatch(RAIL_GEOMETRY)
      expect(both.shadow).toMatch(RING_GEOMETRY)

      // The comparison that actually catches an unconverted preset: an
      // unconverted preset returns the same count for "bar" and "both".
      expect(both.count).toBeGreaterThan(bar.count)

      // Selecting "Default" again round-trips back to the unset baseline.
      await selectActiveBar(page, "Each preset's own indicator")
      expect((await activeItemShadow(page)).count).toBe(unset)
    })
  })
}
