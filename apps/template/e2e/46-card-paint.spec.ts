import { test, expect, type Locator, type Page } from "@playwright/test"
import { gotoApp, kitLook, seedApp } from "./helpers/app"
import { computed, settle } from "./helpers/measure"

/**
 * Cards paint from style tokens, and the divider and footer signatures
 * restyle their regions. A card with a header, content and footer is added
 * to the cards page so every case has the same structure; each value is
 * read through computed style in Chromium.
 */

const STYLES = ["quiet", "flat", "tactile", "glass"] as const
const MODES = ["light", "dark"] as const

async function openCard(page: Page, style = "quiet", mode = "light") {
  await seedApp(page, { style, mode })
  await gotoApp(page, "/components/cards")
  await kitLook(page)
  await settle(page)
  await page.evaluate(() => {
    const card = document.createElement("div")
    card.className = "dr-card"
    card.dataset.probeCard = ""
    for (const [name, text] of [
      ["dr-card-header", "Header"],
      ["dr-card-content", "Content"],
      ["dr-card-footer", "Footer"],
    ] as const) {
      const region = document.createElement("div")
      region.className = name
      region.textContent = text
      card.append(region)
    }
    document.querySelector("main")?.prepend(card)
  })
  return page.locator("[data-probe-card]")
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

function before(card: Locator, property: string) {
  return card.evaluate(
    (el, name) => getComputedStyle(el, "::before").getPropertyValue(name),
    property,
  )
}

const CARD = [
  "background-color",
  "border-top-color",
  "border-top-left-radius",
  "backdrop-filter",
]

for (const style of STYLES) {
  for (const mode of MODES) {
    test(`the kit look keeps a card's paint under ${style} ${mode}`, async ({
      page,
    }) => {
      const card = await openCard(page, style, mode)
      const expected = await probe(
        page,
        "background-color: var(--surface-card-fill); border: 1px solid hsl(var(--border-subtle)); border-radius: var(--radius)",
        CARD,
      )
      const actual = await card.evaluate(
        (el, names) =>
          names.map((n) => getComputedStyle(el).getPropertyValue(n)),
        CARD,
      )
      expect(actual).toEqual(expected)
      expect(await before(card, "background-image")).toBe("none")
      expect(await before(card, "background-color")).toBe("rgba(0, 0, 0, 0)")
      const header = card.locator(".dr-card-header")
      expect(await computed(header, "border-bottom-width")).toBe("0px")
    })
  }
}

test("a style's card tokens reach the card", async ({ page }) => {
  const card = await openCard(page)
  await page.addStyleTag({
    content: `@layer style.base { :root {
      --card-border: rgb(1, 2, 3);
      --card-radius: 7px;
      --card-rim: linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255));
      --surface-backdrop: blur(2px);
    } }`,
  })
  expect(await computed(card, "border-top-color")).toBe("rgb(1, 2, 3)")
  expect(await computed(card, "border-top-left-radius")).toBe("7px")
  expect(await computed(card, "backdrop-filter")).toBe("blur(2px)")
  expect(await before(card, "background-image")).toBe(
    "linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))",
  )
  expect(await before(card, "border-top-left-radius")).toBe("7px")
})

test("the card divider and footer follow their signatures", async ({
  page,
}) => {
  const card = await openCard(page)
  const header = card.locator(".dr-card-header")
  const content = card.locator(".dr-card-content")
  const footer = card.locator(".dr-card-footer")
  const root = page.locator("html")
  const [subtle, seam, pageFill] = await probe(
    page,
    "border-top: 1px solid hsl(var(--border-subtle)); border-bottom: 1px solid var(--seam); background: hsl(var(--background))",
    ["border-top-color", "border-bottom-color", "background-color"],
  )
  const gap = await computed(header, "padding-bottom")

  await root.evaluate((el) => el.setAttribute("data-card-divider", "hairline"))
  expect(await computed(header, "border-bottom-width")).toBe("1px")
  expect(await computed(header, "border-bottom-color")).toBe(subtle)
  expect(await computed(footer, "border-top-color")).toBe(subtle)
  expect(await computed(content, "padding-top")).toBe(gap)
  expect(await computed(footer, "padding-top")).toBe(gap)

  await root.evaluate((el) => el.setAttribute("data-card-divider", "seam"))
  await page.addStyleTag({
    content:
      "@layer style.base { :root { --seam-highlight: rgb(250, 251, 252); } }",
  })
  expect(await computed(header, "border-bottom-color")).toBe(seam)
  expect(await computed(header, "box-shadow")).toBe(
    "rgb(250, 251, 252) 0px 1px 0px 0px",
  )
  expect(await computed(footer, "box-shadow")).toBe(
    "rgb(250, 251, 252) 0px 1px 0px 0px inset",
  )

  await root.evaluate((el) => {
    el.removeAttribute("data-card-divider")
    el.setAttribute("data-card-footer", "inset")
  })
  expect(await computed(footer, "background-color")).toBe(pageFill)
  expect(await computed(footer, "padding-top")).toBe(gap)
  expect(await computed(footer, "border-top-width")).toBe("1px")
  const radius = parseFloat(await computed(card, "border-bottom-left-radius"))
  expect(parseFloat(await computed(footer, "border-bottom-left-radius"))).toBe(
    radius - 1,
  )
})
