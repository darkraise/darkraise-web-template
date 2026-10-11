import { test, expect, type Page } from "@playwright/test"
import { seedApp } from "./helpers/app"
import { computed, settle } from "./helpers/measure"

/**
 * Modals and their scrim paint from style tokens, and the dialog header and
 * footer signatures restyle them. Each value is read through computed style
 * in Chromium, where the cascade and the layers actually resolve.
 */

const FIXTURE = "/e2e/fixtures/baseline-overlays.html?show=dialog"
const STYLES = ["quiet", "flat", "tactile", "glass"] as const
const MODES = ["light", "dark"] as const

async function openDialog(page: Page, style = "quiet", mode = "light") {
  await seedApp(page, { style, mode })
  await page.goto(FIXTURE)
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await settle(page)
  return dialog
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

const MODAL = [
  "background-color",
  "background-image",
  "border-top-color",
  "border-top-left-radius",
  "box-shadow",
]

for (const style of STYLES) {
  for (const mode of MODES) {
    test(`a ${style} ${mode} dialog keeps its overlay paint`, async ({
      page,
    }) => {
      const dialog = await openDialog(page, style, mode)
      const expected = await probe(
        page,
        "background: var(--overlay-bg); border: 1px solid var(--overlay-border); border-radius: var(--overlay-radius); box-shadow: var(--elevation-high), var(--glow-outer), var(--glow-inner)",
        MODAL,
      )
      const actual = await dialog.evaluate(
        (el, names) =>
          names.map((n) => getComputedStyle(el).getPropertyValue(n)),
        MODAL,
      )
      expect(actual).toEqual(expected)

      const backdrop = page.locator(".dr-overlay-backdrop")
      const [scrim, blur] = await probe(
        page,
        "background-color: color-mix(in oklab, #000 50%, transparent); backdrop-filter: var(--overlay-backdrop)",
        ["background-color", "backdrop-filter"],
      )
      expect(await computed(backdrop, "background-color")).toBe(scrim)
      expect(await computed(backdrop, "backdrop-filter")).toBe(blur)
    })
  }
}

test("a style's dialog tokens reach the modal and its scrim", async ({
  page,
}) => {
  const dialog = await openDialog(page)
  await page.addStyleTag({
    content: `@layer style.base { :root {
      --dialog-fill: rgb(10, 20, 30);
      --dialog-border: rgb(40, 50, 60);
      --dialog-radius: 3px;
      --modal-shadow: rgb(1, 2, 3) 0px 0px 0px 5px;
      --scrim: rgb(70, 80, 90);
      --scrim-backdrop: blur(3px);
    } }`,
  })
  expect(await computed(dialog, "background-color")).toBe("rgb(10, 20, 30)")
  expect(await computed(dialog, "border-top-color")).toBe("rgb(40, 50, 60)")
  expect(await computed(dialog, "border-top-left-radius")).toBe("3px")
  expect(await computed(dialog, "box-shadow")).toMatch(
    /^rgb\(1, 2, 3\) 0px 0px 0px 5px/,
  )
  const backdrop = page.locator(".dr-overlay-backdrop")
  expect(await computed(backdrop, "background-color")).toBe("rgb(70, 80, 90)")
  expect(await computed(backdrop, "backdrop-filter")).toBe("blur(3px)")
})

test("the card plane takes a style's fill alpha", async ({ page }) => {
  await openDialog(page)
  const [opaque, plain = ""] = await probe(
    page,
    "background-color: var(--surface-card-fill); color: hsl(var(--card))",
    ["background-color", "color"],
  )
  expect(opaque).toBe(plain)
  expect(opaque).toMatch(/^rgb\(/)

  await page.addStyleTag({
    content: "@layer style.base { :root { --surface-fill-alpha: 0.5; } }",
  })
  const [translucent] = await probe(
    page,
    "background-color: var(--surface-card-fill)",
    ["background-color"],
  )
  expect(translucent).toBe(plain.replace(/^rgb\((.*)\)$/, "rgba($1, 0.5)"))
  const [twin] = await probe(
    page,
    "background-color: var(--surface-card-fill-opaque)",
    ["background-color"],
  )
  expect(twin).toBe(plain)
})

test("the dialog header and footer follow their signatures", async ({
  page,
}) => {
  const dialog = await openDialog(page)
  const header = dialog.locator(".dr-overlay-header")
  const footer = dialog.locator(".dr-overlay-footer")
  const [pageFill] = await probe(page, "background: hsl(var(--background))", [
    "background-color",
  ])

  expect(await computed(header, "margin-top")).toBe("0px")
  expect(await computed(header, "background-color")).toBe("rgba(0, 0, 0, 0)")
  expect(await computed(footer, "border-top-width")).toBe("0px")

  const root = page.locator("html")
  await root.evaluate((el) => {
    el.setAttribute("data-dialog-header", "band")
    el.setAttribute("data-dialog-footer", "ruled")
  })
  expect(await computed(header, "margin-top")).toBe("-24px")
  expect(await computed(header, "background-color")).toBe(pageFill)
  expect(await computed(header, "border-bottom-width")).toBe("1px")
  expect(await computed(footer, "border-top-width")).toBe("1px")
  expect(await computed(footer, "background-color")).toBe("rgba(0, 0, 0, 0)")

  await root.evaluate((el) => el.setAttribute("data-dialog-footer", "band"))
  expect(await computed(footer, "margin-bottom")).toBe("-24px")
  expect(await computed(footer, "background-color")).toBe(pageFill)
  expect(
    await footer
      .locator("> *")
      .first()
      .evaluate((el) => getComputedStyle(el).flexGrow),
  ).toBe("1")
})
