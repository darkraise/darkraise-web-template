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
import { alphaOf, computed, settle } from "./helpers/measure"
import { filtering, underFallbackMedia } from "./helpers/media"

/**
 * Every glass look's cards and popovers let the page through by the share
 * its Medium alpha declares, scaled by the Transparency step; reduced
 * transparency and more contrast make cards, popovers and dialogs opaque;
 * Blur None leaves no glass backdrop filter. Light mode only: the kit's
 * contrast suite covers both modes, and the declared alphas come from the
 * registry, so a look whose values change is checked as it is.
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

for (const name of ["glass", "soft-glass"]) {
  const look = LOOKS.find((candidate) => candidate.name === name)
  if (!look) throw new Error(`no glass look ${name}`)

  test(`${name}: cards, popovers and dialogs turn opaque and unblurred under the fallback media`, async ({
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
