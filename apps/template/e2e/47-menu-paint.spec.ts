import { test, expect, type Locator, type Page } from "@playwright/test"
import { kitLook, seedApp } from "./helpers/app"
import { computed, settle } from "./helpers/measure"

/**
 * Menu rows and tooltips paint from style tokens, and the menu highlight,
 * menu tone, tooltip tone and label case signatures restyle them. Each value
 * is read through computed style in Chromium.
 */

const FIXTURE = "/e2e/fixtures/baseline-overlays.html?show=menu"
const STYLES = ["quiet", "flat", "tactile", "glass"] as const
const MODES = ["light", "dark"] as const

async function openMenu(page: Page, style = "quiet", mode = "light") {
  await seedApp(page, { style, mode })
  await page.goto(FIXTURE)
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await kitLook(page)
  await settle(page)
  const item = menu.getByRole("menuitem", { name: /Profile/ })
  await item.focus()
  await expect(item).toBeFocused()
  await settle(page)
  return { menu, item }
}

/** Computed values of a throwaway element styled with `css`. */
function probe(page: Page, css: string, properties: string[]) {
  return page.evaluate(
    ([text, names]) => {
      const el = document.createElement("div")
      el.setAttribute("style", text)
      document.body.append(el)
      const style = getComputedStyle(el)
      const out = names.map((name) => style.getPropertyValue(name))
      el.remove()
      return out
    },
    [css, properties] as const,
  )
}

/** Sets a root attribute and waits out the rows' colour transition. */
async function setRoot(page: Page, name: string, value: string) {
  await page
    .locator("html")
    .evaluate((el, [n, v]) => el.setAttribute(n, v), [name, value] as const)
  await settle(page)
}

async function paint(locator: Locator) {
  return [
    await computed(locator, "background-color"),
    await computed(locator, "color"),
  ]
}

for (const style of STYLES) {
  for (const mode of MODES) {
    test(`the kit look keeps a menu row's highlight and corner under ${style} ${mode}`, async ({
      page,
    }) => {
      const { item } = await openMenu(page, style, mode)
      const [fill, text, radius] = await probe(
        page,
        "background-color: hsl(var(--accent)); color: hsl(var(--accent-foreground)); border-radius: calc(var(--radius) - 4px)",
        ["background-color", "color", "border-top-left-radius"],
      )
      expect(await paint(item)).toEqual([fill, text])
      expect(await computed(item, "border-top-left-radius")).toBe(radius)
    })
  }
}

test("a style's menu item radius reaches the rows", async ({ page }) => {
  const { item } = await openMenu(page)
  await page.addStyleTag({
    content: "@layer style.base { :root { --menu-item-radius: 9px; } }",
  })
  expect(await computed(item, "border-top-left-radius")).toBe("9px")
})

test("the highlighted row follows the menu highlight signature", async ({
  page,
}) => {
  const { item } = await openMenu(page)
  const [tintFill, tintText, solidFill, solidText] = await probe(
    page,
    "background-color: hsl(var(--primary) / 0.12); color: hsl(var(--primary-text)); border-top: 1px solid hsl(var(--primary-fill)); border-bottom: 1px solid hsl(var(--primary-foreground))",
    ["background-color", "color", "border-top-color", "border-bottom-color"],
  )
  await setRoot(page, "data-menu-highlight", "tint")
  expect(await paint(item)).toEqual([tintFill, tintText])
  await setRoot(page, "data-menu-highlight", "solid")
  expect(await paint(item)).toEqual([solidFill, solidText])
  const shortcut = item.locator(".dr-menu-shortcut")
  expect(await computed(shortcut, "color")).toBe(solidText)
})

test("an inverse menu swaps its surface and keeps its text legible", async ({
  page,
}) => {
  const { menu, item } = await openMenu(page)
  const label = menu.locator(".dr-menu-label")
  const [face, ink, muted, wash] = await probe(
    page,
    "background-color: hsl(var(--foreground)); color: hsl(var(--background)); border-top: 1px solid hsl(var(--background) / 0.7); border-bottom: 1px solid hsl(var(--background) / 0.14)",
    ["background-color", "color", "border-top-color", "border-bottom-color"],
  )
  await setRoot(page, "data-menu-tone", "inverse")
  expect(await paint(menu)).toEqual([face, ink])
  expect(await computed(label, "color")).toBe(muted)
  expect(await paint(item)).toEqual([wash, ink])
})

test("menu labels follow an upper or lower label case", async ({ page }) => {
  const { menu } = await openMenu(page)
  const label = menu.locator(".dr-menu-label")
  expect(await computed(label, "text-transform")).toBe("none")
  await setRoot(page, "data-label-case", "none")
  expect(await computed(label, "text-transform")).toBe("none")
  await setRoot(page, "data-label-case", "upper")
  expect(await computed(label, "text-transform")).toBe("uppercase")
  await setRoot(page, "data-label-case", "lower")
  expect(await computed(label, "text-transform")).toBe("lowercase")
})

test("a tooltip follows the tooltip tone signature", async ({ page }) => {
  await openMenu(page)
  await page.evaluate(() => {
    const tip = document.createElement("div")
    tip.className = "dr-tooltip-content"
    tip.dataset.probeTip = ""
    tip.textContent = "Tip"
    document.body.append(tip)
  })
  const tip = page.locator("[data-probe-tip]")
  const [overlay, overlayText, face, ink, accent, onAccent] = await probe(
    page,
    "background: var(--overlay-bg); color: hsl(var(--popover-foreground)); border-top: 1px solid hsl(var(--foreground)); border-bottom: 1px solid hsl(var(--background)); outline: 1px solid hsl(var(--primary-fill)); text-decoration-color: hsl(var(--primary-foreground))",
    [
      "background-color",
      "color",
      "border-top-color",
      "border-bottom-color",
      "outline-color",
      "text-decoration-color",
    ],
  )
  expect(await paint(tip)).toEqual([overlay, overlayText])
  await setRoot(page, "data-tooltip-tone", "inverse")
  expect(await paint(tip)).toEqual([face, ink])
  await setRoot(page, "data-tooltip-tone", "accent")
  expect(await paint(tip)).toEqual([accent, onAccent])
})
