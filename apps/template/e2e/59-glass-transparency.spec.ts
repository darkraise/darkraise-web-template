import { test, expect, type Page } from "@playwright/test"
import {
  OVERLAY_ALPHA_FLOOR,
  SURFACE_ALPHA_FLOOR,
  TRANSPARENCY_SCALE,
  effectiveAlpha,
  resolveRegistry,
  type TokenMap,
} from "darkraise-ui/theme-config"
import { GLASS_TRANSPARENCIES } from "./fixtures/theme"
import { openControlFixture } from "./helpers/controls"
import {
  applyTheme,
  closeThemeSwitcher,
  gotoApp,
  openThemeSwitcher,
  readThemeAttrs,
  reloadApp,
  seedApp,
  type ThemeSeed,
} from "./helpers/app"
import {
  alphaOf,
  computed,
  contrast,
  rgbOf,
  settle,
  textContrast,
  type Rgb,
} from "./helpers/measure"
import {
  emulateReducedTransparency,
  filtering,
  underFallbackMedia,
} from "./helpers/media"

/**
 * Every glass look's cards and popovers let the page through by the share
 * its Medium alpha declares, scaled by the Transparency step; more contrast
 * makes cards, popovers and dialogs opaque and reduced transparency does not;
 * Blur None leaves no glass backdrop filter. Light mode only, but for the
 * controls frosted inside a card and for text on a card over the strongest
 * ground, read from the rendered pixels, which are checked in both modes:
 * the kit's contrast suite covers both modes in its model, and the declared
 * alphas come from the registry, so a look whose values change is checked
 * as it is.
 */

test.describe.configure({ timeout: 120_000 })

const PAGE = "/components/cards"
const OVERLAYS = "/e2e/fixtures/baseline-overlays.html"
const registry = resolveRegistry()

interface Look {
  name: string
  style: string
  preset?: string
}

const LOOKS: Look[] = [
  { name: "glass", style: "glass" },
  ...Object.values(registry.presets)
    .filter((preset) => preset.builtIn && preset.style === "glass")
    .map((preset) => ({
      name: preset.name,
      style: "glass",
      preset: preset.name,
    })),
]

/** The look's light-mode Medium alphas, as the style and preset layers cascade. */
function declared(look: Look): { surface: number; overlay: number } {
  const style = registry.styles[look.style]?.tokens
  const preset = look.preset ? registry.presets[look.preset]?.tokens : undefined
  const tokens: TokenMap = {
    ...style?.shared,
    ...style?.light,
    ...preset?.shared,
    ...preset?.light,
  }
  return {
    surface: Number.parseFloat(tokens.surfaceFillAlpha ?? "1"),
    overlay: Number.parseFloat(tokens.overlayFillAlpha ?? "1"),
  }
}

/** Seeds `look` in light mode, with `theme` on top, as a returning user's stored choices. */
async function seedLook(page: Page, look: Look, theme: ThemeSeed = {}) {
  await seedApp(page, { style: look.style, mode: "light", ...theme })
  if (look.preset) {
    await page.addInitScript((name) => {
      if (localStorage.getItem("theme-preset") === null) {
        localStorage.setItem("theme-preset", name)
      }
    }, look.preset)
  }
}

const card = (page: Page) => page.locator("main .dr-card").first()

async function cardAlpha(page: Page): Promise<number> {
  return alphaOf(await computed(card(page), "background-color"))
}

/** The settings popover's fill alpha; the popover is closed again afterwards. */
async function popoverAlpha(page: Page): Promise<number> {
  const panel = await openThemeSwitcher(page)
  await settle(page)
  const alpha = alphaOf(await computed(panel, "background-color"))
  await closeThemeSwitcher(page)
  return alpha
}

/** Strictly decreasing: Low lets the least through, High the most. */
function expectFalling(values: number[], what: string) {
  expect(new Set(values).size, `${what} differs at every step`).toBe(
    values.length,
  )
  expect(values, `${what} falls from Low to High`).toEqual(
    [...values].sort((a, b) => b - a),
  )
}

for (const look of LOOKS) {
  test(`${look.name}: cards and popovers follow Transparency`, async ({
    page,
  }) => {
    const { surface, overlay } = declared(look)
    expect(surface, "the look declares a translucent card").toBeLessThan(1)
    expect(overlay, "the look declares a translucent popup").toBeLessThan(1)
    await seedLook(page, look)
    await gotoApp(page, PAGE)

    const cards: number[] = []
    const popovers: number[] = []
    for (const step of GLASS_TRANSPARENCIES) {
      await applyTheme(page, { glassTransparency: step })
      await reloadApp(page)
      expect((await readThemeAttrs(page))["data-glass-transparency"]).toBe(step)
      await settle(page)
      const scale = TRANSPARENCY_SCALE[step]
      const cardAt = await cardAlpha(page)
      const popoverAt = await popoverAlpha(page)
      expect(cardAt, `card at ${step}`).toBeCloseTo(
        effectiveAlpha(surface, scale, SURFACE_ALPHA_FLOOR),
        2,
      )
      expect(popoverAt, `popover at ${step}`).toBeCloseTo(
        effectiveAlpha(overlay, scale, OVERLAY_ALPHA_FLOOR),
        2,
      )
      cards.push(cardAt)
      popovers.push(popoverAt)
    }
    expectFalling(cards, "the card alpha")
    expectFalling(popovers, "the popover alpha")
  })
}

const GROUND_CARD = { width: 260, height: 104 }

/**
 * The viewport point where the ground differs most from the page colour,
 * read with the shell's regions hidden so only the body canvas and the
 * shell's ground art paint, and far enough from the edges for a card
 * centred on it to fit. A blur as wide as a frosted card's averages the
 * noise layer away first.
 */
async function strongestGround(page: Page): Promise<{ x: number; y: number }> {
  await page.evaluate(() => {
    for (const region of document.querySelectorAll<HTMLElement>(
      ".dr-shell > *",
    )) {
      region.style.visibility = "hidden"
    }
  })
  await settle(page)
  const png = await page.screenshot()
  return page.evaluate(
    async ({ b64, card }) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const scale = img.width / window.innerWidth
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) throw new Error("no 2d context")
      context.fillStyle = `hsl(${getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim()})`
      context.fillRect(0, 0, 1, 1)
      const [pr = 0, pg = 0, pb = 0] = context.getImageData(0, 0, 1, 1).data
      context.filter = "blur(8px)"
      context.drawImage(img, 0, 0)
      const { data } = context.getImageData(0, 0, img.width, img.height)
      let best = { x: 0, y: 0, distance: -1 }
      for (
        let y = card.height / 2;
        y <= window.innerHeight - card.height / 2;
        y += 8
      ) {
        for (
          let x = card.width / 2;
          x <= window.innerWidth - card.width / 2;
          x += 8
        ) {
          const i =
            (Math.floor(y * scale) * img.width + Math.floor(x * scale)) * 4
          const distance = Math.hypot(
            (data[i] ?? 0) - pr,
            (data[i + 1] ?? 0) - pg,
            (data[i + 2] ?? 0) - pb,
          )
          if (distance > best.distance) best = { x, y, distance }
        }
      }
      return { x: best.x, y: best.y }
    },
    { b64: png.toString("base64"), card: GROUND_CARD },
  )
}

/** A card centred on `point`, holding a line of body text and one of muted text. */
async function cardOver(page: Page, point: { x: number; y: number }) {
  await page.evaluate(
    ({ point, card }) => {
      const el = document.createElement("div")
      el.className = "dr-card"
      el.dataset.testid = "ground-card"
      Object.assign(el.style, {
        position: "fixed",
        left: `${point.x - card.width / 2}px`,
        top: `${point.y - card.height / 2}px`,
        width: `${card.width}px`,
        height: `${card.height}px`,
        padding: "16px",
        zIndex: "1000",
        visibility: "visible",
        display: "grid",
        alignContent: "center",
        gap: "8px",
      })
      el.innerHTML =
        '<p data-text="body" style="margin:0">Body text on glass</p>' +
        '<p data-text="muted" style="margin:0;color:hsl(var(--muted-foreground))">Muted text on glass</p>'
      document.body.append(el)
    },
    { point, card: GROUND_CARD },
  )
  const card = page.getByTestId("ground-card")
  await settle(page)
  return card
}

for (const look of LOOKS) {
  for (const mode of ["light", "dark"] as const) {
    test(`${look.name} ${mode}: text on a card over the strongest ground keeps 4.5:1`, async ({
      page,
    }) => {
      await seedLook(page, look, { mode })
      await gotoApp(page, PAGE)
      await settle(page)
      const card = await cardOver(page, await strongestGround(page))
      for (const text of ["body", "muted"]) {
        expect(
          await textContrast(card.locator(`[data-text="${text}"]`)),
          `${text} text`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
}

/**
 * The controls a glass card frosts, inside the control fixture's card, as
 * the look builds them: a tab or segment list has a well only under
 * `tabStyle: well`, and the secondary button is frosted only under
 * `buttonStyle: glass` (a capsule) and `soft` (the neutral well).
 */
function frostedControls(look: Look): [string, string][] {
  const { tabStyle, buttonStyle } = registry.signaturesFor(
    look.style,
    look.preset ?? "base",
  )
  const wells: [string, string][] =
    tabStyle === "well"
      ? [
          ["the tab well", '[data-case="tabs"] .dr-tabs-list'],
          ["the segment well", '[data-case="segment"] .dr-segment-group'],
        ]
      : []
  const capsules: [string, string][] =
    buttonStyle === "glass" || buttonStyle === "soft"
      ? [["the secondary button", '.dr-btn[data-case="secondary"]']]
      : []
  return [
    ...wells,
    ["the slider track", '[data-case="slider"] .dr-slider-track'],
    ["the progress track", '.dr-progress[data-case="progress"]'],
    ["the unchecked switch", '.dr-switch[data-case="switch"]'],
    ["the outline button", '.dr-btn[data-case="outline"]'],
    ...capsules,
    ["the field", '[data-case="input"] .dr-input'],
  ]
}

/** The fill alpha of each frosted control of `look`, by name. */
async function frostedAlphas(
  page: Page,
  look: Look,
): Promise<Record<string, number>> {
  const card = page.locator('[data-probe="anatomy-card"]')
  const out: Record<string, number> = {}
  for (const [name, selector] of frostedControls(look)) {
    out[name] = alphaOf(
      await computed(card.locator(selector).first(), "background-color"),
    )
  }
  return out
}

for (const look of LOOKS) {
  for (const mode of ["light", "dark"] as const) {
    test(`${look.name} ${mode}: wells, tracks, neutral buttons and fields in a card are frosted, opaque under more contrast`, async ({
      page,
    }) => {
      await seedLook(page, look, { mode })
      await openControlFixture(page)
      for (const [name, alpha] of Object.entries(
        await frostedAlphas(page, look),
      )) {
        expect(alpha, `${name} is translucent`).toBeLessThan(1)
        expect(alpha, `${name} is painted`).toBeGreaterThan(0)
      }
      await underFallbackMedia(page, async (media) => {
        await settle(page)
        for (const [name, alpha] of Object.entries(
          await frostedAlphas(page, look),
        )) {
          expect(alpha, `${name} under ${media}`).toBe(1)
        }
        if (
          registry.signaturesFor(look.style, look.preset ?? "base")
            .buttonStyle === "glass"
        ) {
          // The capsules' bright rim is a literal, so Glass's fallback
          // cannot reset it; an edge must still show on the opaque card.
          const panel = page.locator('[data-probe="anatomy-card"]')
          const ground = rgbOf(await computed(panel, "background-color"))
          for (const variant of ["outline", "secondary"]) {
            const paint = await computed(
              panel.locator(`.dr-btn[data-case="${variant}"]`),
              "border-top-color",
            )
            const alpha = alphaOf(paint)
            const edge = rgbOf(paint).map((channel, i) =>
              Math.round(channel * alpha + (ground[i] ?? 0) * (1 - alpha)),
            ) as Rgb
            expect(
              contrast(edge, ground),
              `the ${variant} button's edge on the card under ${media}`,
            ).toBeGreaterThanOrEqual(3)
          }
        }
      })
      // Reduced transparency keeps glass, and the controls in it with it.
      await emulateReducedTransparency(page, true)
      await settle(page)
      for (const [name, alpha] of Object.entries(
        await frostedAlphas(page, look),
      )) {
        expect(alpha, `${name} under reduced transparency`).toBeLessThan(1)
      }
    })
  }
}

for (const name of ["glass", "soft-glass"]) {
  const look = LOOKS.find((candidate) => candidate.name === name)
  if (!look) throw new Error(`no glass look ${name}`)

  test(`${name}: cards, popovers and dialogs turn opaque and unblurred under more contrast`, async ({
    page,
  }) => {
    await seedLook(page, look, { glassTransparency: "high" })
    await gotoApp(page, PAGE)
    expect(await cardAlpha(page)).toBeLessThan(1)
    await underFallbackMedia(page, async (media) => {
      await settle(page)
      expect(await cardAlpha(page), `card under ${media}`).toBe(1)
      expect(
        await computed(card(page), "backdrop-filter"),
        `card backdrop under ${media}`,
      ).toBe("none")
      expect(await popoverAlpha(page), `popover under ${media}`).toBe(1)
    })

    await page.goto(`${OVERLAYS}?show=dialog`)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await settle(page)
    expect(alphaOf(await computed(dialog, "background-color"))).toBeLessThan(1)
    await underFallbackMedia(page, async (media) => {
      await settle(page)
      expect(
        alphaOf(await computed(dialog, "background-color")),
        `dialog under ${media}`,
      ).toBe(1)
      expect(
        await computed(dialog, "backdrop-filter"),
        `dialog backdrop under ${media}`,
      ).toBe("none")
    })
  })

  test(`${name}: cards, popovers and dialogs stay translucent and blurred under reduced transparency`, async ({
    page,
  }) => {
    await seedLook(page, look)
    await gotoApp(page, PAGE)
    const { surface, overlay } = declared(look)
    await emulateReducedTransparency(page, true)
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-transparency: reduce)").matches,
      ),
    ).toBe(true)
    await settle(page)
    expect(await cardAlpha(page)).toBeCloseTo(surface, 2)
    expect(await computed(card(page), "backdrop-filter")).not.toBe("none")
    expect(await popoverAlpha(page)).toBeCloseTo(overlay, 2)

    await page.goto(`${OVERLAYS}?show=dialog`)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await settle(page)
    expect(alphaOf(await computed(dialog, "background-color"))).toBeCloseTo(
      overlay,
      2,
    )
    expect(await computed(dialog, "backdrop-filter")).not.toBe("none")
  })
}

test("Blur None leaves no glass backdrop filter in any glass look", async ({
  page,
}) => {
  const [first] = LOOKS
  if (!first) throw new Error("no glass look")
  await seedLook(page, first, { glassBlur: "none" })
  await gotoApp(page, PAGE)
  for (const look of LOOKS) {
    await page.evaluate(
      ({ preset }) => {
        if (preset) localStorage.setItem("theme-preset", preset)
        else localStorage.removeItem("theme-preset")
        localStorage.setItem("theme-glass-blur", "none")
      },
      { preset: look.preset ?? null },
    )
    await reloadApp(page)
    const attrs = await readThemeAttrs(page)
    expect(attrs["data-preset"], look.name).toBe(look.preset ?? "base")
    expect(attrs["data-glass-blur"], look.name).toBe("none")
    await openThemeSwitcher(page)
    await settle(page)
    expect(await filtering(page), `${look.name} under Blur None`).toEqual([])
    await closeThemeSwitcher(page)
  }

  await page.goto(`${OVERLAYS}?show=dialog`)
  await expect(page.getByRole("dialog")).toBeVisible()
  await settle(page)
  expect(await filtering(page), "the dialog and its scrim").toEqual([])
})
