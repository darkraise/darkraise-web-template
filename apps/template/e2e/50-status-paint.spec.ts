import { test, expect, type Locator, type Page } from "@playwright/test"
import { gotoApp, kitLook, seedApp } from "./helpers/app"
import { computed, contrast, rgbOf, settle } from "./helpers/measure"

/**
 * Banners, alerts and badges paint from style tokens, and the banner mark,
 * banner surface and badge style signatures restyle them. A style's tokens
 * are injected into its own layer, as a compiled style sheet would carry
 * them; signatures are stamped on the root as the provider stamps them.
 * Each value is read through computed style in Chromium.
 */

const STATUSES = ["info", "success", "warning", "destructive"] as const
const MODES = ["light", "dark"] as const

async function open(page: Page, path: string, mode = "light") {
  await seedApp(page, { style: "quiet", mode })
  await gotoApp(page, path)
  await kitLook(page)
  await settle(page)
}

async function stamp(page: Page, name: string, value: string) {
  await page.evaluate(([n, v]) => document.documentElement.setAttribute(n, v), [
    name,
    value,
  ] as const)
  await settle(page)
}

/** A colour as Chromium computes `color: <css>` inside `scope`. */
function resolved(scope: Locator, css: string) {
  return scope.evaluate((el, text) => {
    const probe = document.createElement("span")
    probe.style.color = text
    el.append(probe)
    const out = getComputedStyle(probe).color
    probe.remove()
    return out
  }, css)
}

const banner = (page: Page, variant: string) =>
  page.locator(`.dr-banner[data-variant="${variant}"]`).first()

const alert = (page: Page, variant: string) =>
  page.locator(`.dr-alert[data-variant="${variant}"]`).first()

function pseudo(locator: Locator, property: string) {
  return locator.evaluate(
    (el, name) => getComputedStyle(el, "::before").getPropertyValue(name),
    property,
  )
}

test("a banner keeps its paint at the kit defaults", async ({ page }) => {
  await open(page, "/components/banner")
  const warning = banner(page, "warning")
  expect(await computed(warning, "background-color")).toBe(
    await resolved(warning, "hsl(var(--warning-subtle))"),
  )
  expect(await computed(warning, "border-inline-start-color")).toBe(
    await resolved(warning, "hsl(var(--warning-edge))"),
  )
  expect(await computed(warning, "border-inline-start-width")).toBe("4px")
  expect(await computed(warning, "border-top-color")).toBe(
    await resolved(warning, "hsl(var(--border))"),
  )
  expect(await computed(warning, "border-top-left-radius")).toBe("8px")
  expect(await computed(warning, "box-shadow")).toBe("none")
})

test("a style's status tokens reach banners, alerts and badges", async ({
  page,
}) => {
  await open(page, "/components/banner")
  await page.addStyleTag({
    content: `@layer style.base { :root {
      --banner-radius: 3px;
      --banner-fill: rgb(1, 2, 3);
      --banner-border: rgb(4, 5, 6);
      --banner-shadow: rgb(7, 8, 9) 0px 0px 0px 2px;
    } }`,
  })
  const warning = banner(page, "warning")
  expect(await computed(warning, "border-top-left-radius")).toBe("3px")
  expect(await computed(warning, "background-color")).toBe("rgb(1, 2, 3)")
  expect(await computed(warning, "border-top-color")).toBe("rgb(4, 5, 6)")
  expect(await computed(warning, "box-shadow")).toBe(
    "rgb(7, 8, 9) 0px 0px 0px 2px",
  )

  await gotoApp(page, "/components/badges")
  await kitLook(page)
  await settle(page)
  await page.addStyleTag({
    content: "@layer style.base { :root { --badge-radius: 9999px; } }",
  })
  expect(
    await computed(
      page.locator('.dr-badge[data-variant="success-subtle"]').first(),
      "border-top-left-radius",
    ),
  ).toBe("9999px")
})

test("a banner's status fill follows the surface alpha", async ({ page }) => {
  await open(page, "/components/banner")
  await page.addStyleTag({
    content: "@layer style.base { :root { --surface-fill-alpha: 0.5; } }",
  })
  const fill = await computed(banner(page, "success"), "background-color")
  expect(fill).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/)
})

test("the banner mark signature restyles the leading mark", async ({
  page,
}) => {
  await open(page, "/components/banner")
  const warning = banner(page, "warning")

  await stamp(page, "data-banner-mark", "rule")
  expect(await computed(warning, "border-top-width")).toBe("0px")
  expect(await computed(warning, "border-inline-start-width")).toBe("3px")
  expect(await computed(warning, "background-color")).toBe("rgba(0, 0, 0, 0)")

  await stamp(page, "data-banner-mark", "icon")
  expect(await computed(warning, "border-inline-start-width")).toBe("1px")
  expect(await computed(warning, "border-top-color")).toBe(
    await resolved(warning, "hsl(var(--warning-edge) / 0.3)"),
  )

  await stamp(page, "data-banner-mark", "lamp")
  expect(await computed(warning, "border-inline-start-width")).toBe("1px")
  expect(await pseudo(warning, "width")).toBe("8px")
  expect(await pseudo(warning, "background-color")).toBe(
    await resolved(warning, "hsl(var(--warning-edge))"),
  )
  expect(await computed(warning.locator(".dr-banner-icon"), "display")).toBe(
    "none",
  )
  const info = banner(page, "info")
  expect(await pseudo(info, "background-color")).toBe(
    await resolved(info, "hsl(var(--signal-fill))"),
  )
})

test("an alert lights its lamp in its icon's slot", async ({ page }) => {
  await open(page, "/components/alert")
  const warning = alert(page, "warning")
  await stamp(page, "data-banner-mark", "lamp")
  expect(await computed(warning.locator(":scope > svg"), "display")).toBe(
    "none",
  )
  expect(await pseudo(warning, "background-color")).toBe(
    await resolved(warning, "hsl(var(--warning-edge))"),
  )
  const box = await warning.boundingBox()
  const title = await warning.locator(".dr-alert-title").boundingBox()
  if (!box || !title) throw new Error("alert not rendered")
  const left = box.x + parseFloat(await pseudo(warning, "left"))
  const right = left + parseFloat(await pseudo(warning, "width"))
  // The dot sits inside the alert, clear of the text it leads.
  expect(left).toBeGreaterThan(box.x)
  expect(title.x - right).toBeGreaterThanOrEqual(8)
})

test("a card banner surface sets every banner on the card surface", async ({
  page,
}) => {
  await open(page, "/components/banner")
  await stamp(page, "data-banner-surface", "card")
  for (const variant of ["default", ...STATUSES]) {
    const item = banner(page, variant)
    expect(await computed(item, "background-color"), variant).toBe(
      await resolved(item, "var(--surface-card-fill)"),
    )
    expect(await computed(item, "border-top-color"), variant).toBe(
      await resolved(item, "var(--card-border)"),
    )
  }
})

for (const mode of MODES) {
  test(`the badge style signature restyles subtle badges · ${mode}`, async ({
    page,
  }) => {
    await open(page, "/components/badges", mode)
    for (const status of STATUSES) {
      const badge = page
        .locator(`.dr-badge[data-variant="${status}-subtle"]`)
        .first()
      await stamp(page, "data-badge-style", "tint")
      expect(await computed(badge, "border-top-color"), status).toBe(
        "rgba(0, 0, 0, 0)",
      )

      await stamp(page, "data-badge-style", "outline")
      expect(await computed(badge, "background-color"), status).toBe(
        "rgba(0, 0, 0, 0)",
      )
      expect(await computed(badge, "border-top-color"), status).toBe(
        await resolved(badge, `hsl(var(--${status}-edge))`),
      )

      await stamp(page, "data-badge-style", "chip")
      const fill = await computed(badge, "background-color")
      expect(fill, status).toBe(await resolved(badge, "hsl(var(--muted))"))
      // The status text stays readable on the neutral chip.
      expect(
        contrast(rgbOf(await computed(badge, "color")), rgbOf(fill)),
        status,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
}
