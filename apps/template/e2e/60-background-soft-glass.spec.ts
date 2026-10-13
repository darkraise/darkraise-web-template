import { test, expect, type Page } from "@playwright/test"
import {
  applyTheme,
  gotoApp,
  readThemeAttrs,
  reloadApp,
  seedApp,
  type ThemeSeed,
} from "./helpers/app"
import { computed, settle } from "./helpers/measure"

/**
 * The shell paints the look's ground under Solid and its gradient art, or
 * the page canvas, under Gradient, so the two differ under every style.
 * Soft Glass stamps its island shell and faces and follows the Radius axis.
 * A global floating panel stays on the viewport under Glass, whose cards
 * now carry a backdrop filter.
 */

const shell = (page: Page) => page.locator(".dr-shell").first()

interface Look {
  name: string
  style: string
  preset?: string
}

async function seedLook(page: Page, look: Look, theme: ThemeSeed = {}) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await seedApp(page, { style: look.style, mode: "light", ...theme })
  if (look.preset) {
    await page.addInitScript((name) => {
      if (localStorage.getItem("theme-preset") === null) {
        localStorage.setItem("theme-preset", name)
      }
    }, look.preset)
  }
}

/** A colour as Chromium computes `background-color: <css>` on a child of <body>. */
function resolved(page: Page, css: string) {
  return page.evaluate((text) => {
    const el = document.createElement("div")
    el.style.backgroundColor = text
    document.body.append(el)
    const out = getComputedStyle(el).backgroundColor
    el.remove()
    return out
  }, css)
}

async function ground(page: Page) {
  await settle(page)
  return {
    color: await computed(shell(page), "background-color"),
    image: await computed(shell(page), "background-image"),
    body: await page.evaluate(
      () => getComputedStyle(document.body).backgroundImage,
    ),
  }
}

const BACKGROUND_LOOKS: Look[] = [
  { name: "quiet", style: "quiet" },
  { name: "glass", style: "glass" },
  { name: "aurora-night", style: "glass", preset: "aurora-night" },
]

for (const look of BACKGROUND_LOOKS) {
  test(`${look.name}: Solid and Gradient paint the shell differently`, async ({
    page,
  }) => {
    await seedLook(page, look, { backgroundStyle: "solid" })
    await gotoApp(page, "/")
    expect((await readThemeAttrs(page))["data-background-style"]).toBe("solid")
    const solid = await ground(page)
    expect(solid.image, "Solid paints no art").toBe("none")
    expect(solid.color, "Solid paints an opaque ground").toMatch(/^rgb\(/)

    await applyTheme(page, { backgroundStyle: "gradient" })
    await reloadApp(page)
    expect((await readThemeAttrs(page))["data-background-style"]).toBe(
      "gradient",
    )
    const gradient = await ground(page)
    expect(gradient).not.toEqual(solid)
    if (look.preset) {
      expect(gradient.image, "the preset's art").toContain("gradient(")
    } else {
      expect(gradient.color, "the shell lets the canvas through").toBe(
        "rgba(0, 0, 0, 0)",
      )
      expect(gradient.image).toBe("none")
      expect(gradient.body, "the page canvas").toContain("gradient(")
    }
  })
}

test("Card Stock keeps its own ground under Solid", async ({ page }) => {
  await seedLook(
    page,
    { name: "card-stock", style: "tactile", preset: "card-stock" },
    { backgroundStyle: "solid" },
  )
  await gotoApp(page, "/")
  await settle(page)
  expect(await computed(shell(page), "background-color")).toBe(
    await resolved(page, "hsl(var(--neutral-3))"),
  )
})

const SOFT_GLASS: Look = {
  name: "soft-glass",
  style: "glass",
  preset: "soft-glass",
}

test("Soft Glass stamps its shell, faces and backdrop", async ({ page }) => {
  await seedLook(page, SOFT_GLASS)
  await gotoApp(page, "/components/cards")
  await settle(page)
  const attrs = await readThemeAttrs(page)
  expect(attrs).toMatchObject({
    "data-style": "glass",
    "data-preset": "soft-glass",
    "data-accent": "indigo",
    "data-surface": "cool",
    "data-font": "hanken-grotesk",
    "data-heading-font": "newsreader",
    "data-glass-blur": "high",
    "data-background-style": "gradient",
  })
  await expect(shell(page)).toHaveAttribute("data-shell-style", "island")
  expect(
    await computed(
      page.locator("main .dr-page-header-title").first(),
      "font-family",
    ),
  ).toMatch(/^"Newsreader Variable"/)
  expect(
    await computed(
      page.locator("main .dr-page-header-description").first(),
      "font-family",
    ),
  ).toMatch(/^"Hanken Grotesk Variable"/)
  const image = await computed(shell(page), "background-image")
  expect(image.match(/radial-gradient\(/g) ?? []).toHaveLength(4)
  expect(image).toContain("linear-gradient(135deg")
})

test("Soft Glass card corners follow every Radius step", async ({ page }) => {
  await seedLook(page, SOFT_GLASS)
  await gotoApp(page, "/components/cards")
  const card = page.locator("main .dr-card").first()
  for (const [radius, px] of [
    ["sharp", 0],
    ["subtle", 4],
    ["rounded", 8],
    ["pill", 16],
  ] as const) {
    await applyTheme(page, { radius })
    await reloadApp(page)
    await settle(page)
    expect((await readThemeAttrs(page))["data-radius"]).toBe(radius)
    expect(
      Number.parseFloat(await computed(card, "border-top-left-radius")),
      radius,
    ).toBe(px)
  }
})

test("a global floating panel stays on the viewport under Glass", async ({
  page,
}) => {
  await seedLook(page, { name: "glass", style: "glass" })
  await gotoApp(page, "/components/floating-panel")
  expect(
    await computed(page.locator("main .dr-card").first(), "backdrop-filter"),
    "Glass cards filter their backdrop",
  ).not.toBe("none")
  await page.getByRole("button", { name: "Open another global panel" }).click()
  const panel = page.locator(".dr-floating-panel", {
    hasText: "Global panel #1",
  })
  await expect(panel).toBeVisible()
  await settle(page)
  expect(await computed(panel, "position")).toBe("fixed")
  expect(
    await panel.evaluate((el) => el.closest(".dr-card") === null),
    "the panel is portalled out of the cards",
  ).toBe(true)
  const before = await panel.boundingBox()
  if (!before) throw new Error("the panel has no box")
  // defaultPosition is { x: 80 + id * 32, y: 120 + id * 32 } with id 1.
  expect(before.x).toBeCloseTo(112, 0)
  expect(before.y).toBeCloseTo(152, 0)

  const scrolled = await page
    .locator("main .dr-card")
    .first()
    .evaluate((el) => {
      let node: HTMLElement | null = el.parentElement
      while (node) {
        const { overflowY } = getComputedStyle(node)
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        ) {
          node.scrollTop = 400
          return node.scrollTop
        }
        node = node.parentElement
      }
      return 0
    })
  expect(scrolled, "the page scrolled under the panel").toBeGreaterThan(0)
  await settle(page)
  expect(await panel.boundingBox()).toEqual(before)
})
