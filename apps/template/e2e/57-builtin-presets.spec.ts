import { readFileSync } from "node:fs"
import { test, expect, type Page } from "@playwright/test"
import { generateTokens } from "darkraise-ui/theme"
import {
  PAINT_TOKENS,
  SIGNATURES,
  resolveRegistry,
  signatureAttribute,
  type PaintToken,
  type ResolvedPreset,
  type SignatureKey,
  type StampedSignature,
} from "darkraise-ui/theme-config"
import {
  gotoApp,
  openThemeSwitcher,
  readThemeAttrs,
  seedApp,
  themeSwitcher,
  watchConsole,
} from "./helpers/app"
import { computed, settle, textContrast } from "./helpers/measure"
import { filtering, underFallbackMedia } from "./helpers/media"

/**
 * Every built-in preset, read from the kit's registry: what the pre-render
 * script and the provider stamp for it, what is painted before the app runs,
 * and whether its text stays readable. Nothing here names a preset, so a
 * preset that gains paint tokens, signatures or axes is covered as it is.
 */

// Each preset test loads the page three times and reads about fifteen
// screenshots, which a busy dev server can stretch past the default.
test.describe.configure({ timeout: 90_000 })

// With the entry module blocked, only the document's own script and styles
// have run.
const APP_SCRIPTS = /\/src\/main\.tsx/

/** A page with a header, cards holding text, the rail and the bar, and no data to wait for. */
const PAGE = "/components/cards"

const MODES = ["light", "dark"] as const
type Mode = (typeof MODES)[number]

const AXES = JSON.parse(
  readFileSync(
    new URL("../../../create-app/bin/axes.json", import.meta.url),
    "utf8",
  ),
) as Record<string, { attribute: string | null }>

const registry = resolveRegistry()
const PRESETS = Object.values(registry.presets).filter(
  (preset) => preset.builtIn,
)

const STAMPED = (Object.keys(SIGNATURES) as SignatureKey[]).filter(
  (key): key is StampedSignature => key !== "navSelection",
)

type Attrs = Record<string, string>

/** The attributes `preset` puts on <html>: its style, itself, each axis it sets and every signature. */
function stampedBy(preset: ResolvedPreset, mode: Mode): Attrs {
  const signatures = registry.signaturesFor(preset.style, preset.name)
  const attrs: Attrs = {
    "data-mode": mode,
    "data-style": preset.style,
    "data-preset": preset.name,
  }
  for (const [axis, value] of Object.entries(preset.axes)) {
    const attribute = AXES[axis]?.attribute
    if (attribute) attrs[attribute] = value
  }
  for (const key of STAMPED) attrs[signatureAttribute(key)] = signatures[key]
  return attrs
}

/** The look a nav draws under `preset`: the axis when it names one, else the signature. */
function navLook(preset: ResolvedPreset): string {
  const axis =
    preset.axes.sidebarSelection ??
    registry.styles[preset.style]?.defaults.sidebarSelection ??
    "auto"
  return axis === "auto"
    ? registry.signaturesFor(preset.style, preset.name).navSelection
    : axis
}

type TokenInput = Parameters<typeof generateTokens>[0]

const GROUND_LAYER = /hsl\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)/g

/** The engine colours the look's shellGround paint lays over the page, read as the provider reads them. */
function groundArt(attrs: Attrs): NonNullable<TokenInput["groundArt"]> {
  const mode = attrs["data-mode"] as Mode
  const style = registry.styles[attrs["data-style"] ?? ""]?.tokens
  const preset = registry.presets[attrs["data-preset"] ?? ""]?.tokens
  const art = Object.entries({
    ...style?.shared,
    ...style?.[mode],
    ...preset?.shared,
    ...preset?.[mode],
  })
    .filter(([token]) => token.startsWith("shellGround"))
    .map(([, value]) => value ?? "")
    .join(", ")
  if (art.includes("var(--ground-blob")) return { layers: [], blobs: true }
  return {
    layers: [...art.matchAll(GROUND_LAYER)].map(([, token, alpha]) => ({
      token: token as string,
      alpha: alpha === undefined ? 1 : Number(alpha),
    })),
    blobs: false,
  }
}

/** The token set the kit's engine gives the axes stamped on <html>. */
function engineTokens(attrs: Attrs): Record<string, string> {
  const style = registry.styles[attrs["data-style"] ?? ""]
  return generateTokens({
    accentColor: attrs["data-accent"] as TokenInput["accentColor"],
    surfaceColor: attrs["data-surface"] as TokenInput["surfaceColor"],
    frosted: style?.frosted ?? false,
    backgroundStyle: attrs[
      "data-background-style"
    ] as TokenInput["backgroundStyle"],
    mode: attrs["data-mode"] as TokenInput["mode"],
    contrast: attrs["data-contrast"] as TokenInput["contrast"],
    darkAccentChroma: attrs[
      "data-dark-accent-chroma"
    ] as TokenInput["darkAccentChroma"],
    tintWithAccent: attrs["data-tint-with-accent"] === "on",
    backgroundIntensity: attrs[
      "data-background-intensity"
    ] as TokenInput["backgroundIntensity"],
    hairlines: style?.hairlines,
    signalColor: attrs["data-signal-color"] as TokenInput["signalColor"],
    railTone: attrs["data-rail-tone"] as TokenInput["railTone"],
    barTone: attrs["data-bar-tone"] as TokenInput["barTone"],
    groundArt: groundArt(attrs),
  })
}

/** The custom properties set inline on <html>: the engine's tokens, applied by the provider or from its cache. */
function inlineTokens(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const { style } = document.documentElement
    const tokens: Record<string, string> = {}
    for (const name of style) {
      if (name.startsWith("--")) tokens[name] = style.getPropertyValue(name)
    }
    return tokens
  })
}

/**
 * Each paint token `preset` declares for `mode`, as <html> computes it and as
 * the declared value computes on a child of <html>, where var() substitutes
 * the same way. The two differ when the preset's rule is missing from the
 * loaded sheets or another rule outranks it.
 */
async function paintTokens(page: Page, preset: ResolvedPreset, mode: Mode) {
  const declared = Object.entries({
    ...preset.tokens.shared,
    ...preset.tokens[mode],
  }).map(([token, value]) => [PAINT_TOKENS[token as PaintToken], value])
  return page.evaluate((pairs) => {
    const root = getComputedStyle(document.documentElement)
    const probe = document.createElement("div")
    document.documentElement.append(probe)
    const applied: Record<string, string> = {}
    const expected: Record<string, string> = {}
    for (const [name = "", value = ""] of pairs) {
      probe.style.setProperty(name, value)
      applied[name] = root.getPropertyValue(name).trim()
      expected[name] = getComputedStyle(probe).getPropertyValue(name).trim()
    }
    probe.remove()
    return { applied, expected }
  }, declared)
}

/** Seeds `preset` and `mode`, and a shell style when given, as a returning user's stored choices. */
async function seedPreset(
  page: Page,
  preset: ResolvedPreset,
  mode: Mode,
  shellStyle?: string,
) {
  await seedApp(page, { style: preset.style, mode, shellStyle })
  await page.addInitScript((name) => {
    if (localStorage.getItem("theme-preset") === null) {
      localStorage.setItem("theme-preset", name)
    }
  }, preset.name)
}

/** Loads `path` with the app's scripts blocked, so only the document's own script and styles have run. */
async function loadWithoutApp(page: Page, path: string) {
  await page.route(APP_SCRIPTS, (route) => route.abort())
  await page.goto(path)
  await expect(page.locator("#root .app-loading")).toHaveCount(1)
  await page.unroute(APP_SCRIPTS)
}

// Body text on each ground a preset can repaint. The bar holds no running
// text under the sidebar layout, so its ink is read from an icon button,
// whose colour is the one text placed in the bar inherits.
type TextList = ReadonlyArray<[name: string, selector: string]>

const TEXT: TextList = [
  ["the page description", "main .dr-page-header-description"],
  ["a card's body text", "main .dr-card .dr-card .dr-card-content p"],
  [
    "an idle rail item",
    ".dr-sidebar-nav-link:not(.active) .dr-sidebar-nav-label",
  ],
  ["the bar's select label", ".dr-layout-header .dr-locale-option-label"],
  ["the bar's ink", ".dr-layout-header .dr-layout-switcher-trigger"],
]

// Text that sits directly on the page, with no card under it.
const PAGE_TEXT: TextList = [
  ["the page title", "main .dr-page-header-title"],
  ["the page description", "main .dr-page-header-description"],
]

/**
 * Every text in `texts` holds 4.5:1 against the pixels painted behind it. The
 * ground is always read from a screenshot: a preset may make a surface
 * translucent, blur what is behind it, paint a gradient ground or tone the
 * chrome through a pseudo-element, and computed style resolves none of those.
 */
async function expectReadable(page: Page, texts: TextList, when: string) {
  await settle(page)
  for (const [name, selector] of texts) {
    const ratio = await textContrast(page.locator(selector).first(), {
      ground: "painted",
    })
    expect.soft(ratio, `${name} ${when}`).toBeGreaterThanOrEqual(4.5)
  }
}

const BLUR_TOKENS = [
  "--chrome-backdrop",
  "--surface-backdrop",
  "--overlay-backdrop",
  "--scrim-backdrop",
]

/**
 * The blur tokens on <html>, the card fill's alpha, and every rendered
 * element or pseudo-element that still filters its backdrop, read once the
 * transitions a media change starts have ended.
 */
async function translucency(page: Page) {
  await settle(page)
  const tokens = await page.evaluate((names) => {
    const root = getComputedStyle(document.documentElement)
    return {
      blurs: Object.fromEntries(
        names.map((name) => [name, root.getPropertyValue(name).trim()]),
      ),
      fillAlpha: root.getPropertyValue("--surface-fill-alpha").trim(),
    }
  }, BLUR_TOKENS)
  return { ...tokens, filtering: await filtering(page) }
}

const OPAQUE = {
  blurs: Object.fromEntries(BLUR_TOKENS.map((name) => [name, "none"])),
  fillAlpha: "1",
  filtering: [],
}

for (const preset of PRESETS) {
  for (const mode of MODES) {
    test(`${preset.name} ${mode}: stamps, paints before the app runs and stays readable`, async ({
      page,
    }) => {
      const stamped = stampedBy(preset, mode)
      await seedPreset(page, preset, mode)

      // A first visit with the choice stored and nothing cached: only the
      // pre-render script has run.
      await loadWithoutApp(page, PAGE)
      const scripted = await readThemeAttrs(page)
      expect(scripted, "stamped by the pre-render script").toMatchObject(
        stamped,
      )
      expect(await inlineTokens(page), "nothing is cached yet").toEqual({})

      // With nothing cached, inline tokens can only come from the provider,
      // which stamps its attributes in the same pass.
      const consoleWatch = watchConsole(page)
      await gotoApp(page, PAGE)
      await expect
        .poll(async () => Object.keys(await inlineTokens(page)).length)
        .toBeGreaterThan(0)
      const hydrated = await readThemeAttrs(page)
      expect(hydrated, "the provider agrees with the script").toEqual(scripted)
      if (preset.shellStyle) {
        await expect(page.locator(".dr-shell").first()).toHaveAttribute(
          "data-shell-style",
          preset.shellStyle,
        )
      }
      await expect(page.locator(".dr-sidebar-nav").first()).toHaveAttribute(
        "data-sidebar-selection",
        navLook(preset),
      )
      const engine = await inlineTokens(page)
      expect(engine, "the engine's tokens for the preset's axes").toEqual(
        engineTokens(hydrated),
      )
      const painted = await paintTokens(page, preset, mode)
      expect(painted.applied, "the preset's paint tokens").toEqual(
        painted.expected,
      )

      await expectReadable(page, TEXT, "as painted")
      await underFallbackMedia(page, async (media) => {
        expect
          .soft(await translucency(page), `translucency under ${media}`)
          .toEqual(OPAQUE)
        await expectReadable(page, TEXT, `under ${media}`)
      })
      consoleWatch.assertClean()

      // The return visit, again without the app: the script alone stamps
      // the same attributes and restores the engine's tokens from its
      // cache, so the first paint is already the preset's. The paint tokens
      // are not read here: the dev server delivers the kit stylesheet with
      // the app's modules.
      await page.route(APP_SCRIPTS, (route) => route.abort())
      await page.reload()
      await expect(page.locator("#root .app-loading")).toHaveCount(1)
      expect(await readThemeAttrs(page), "stamped on the return visit").toEqual(
        hydrated,
      )
      expect(await inlineTokens(page), "tokens before the app runs").toEqual(
        engine,
      )
    })

    // A shell style the user picked outranks the preset's own. Only a
    // detached content region paints a fill of its own, so under the classic
    // shell whatever the preset paints as the shell ground sits directly
    // behind the page's text.
    test(`${preset.name} ${mode}: page text stays readable under the classic shell`, async ({
      page,
    }) => {
      await seedPreset(page, preset, mode, "classic")
      await gotoApp(page, PAGE)
      await expect(page.locator("html")).toHaveAttribute(
        "data-preset",
        preset.name,
      )
      await expect(page.locator(".dr-shell").first()).toHaveAttribute(
        "data-shell-style",
        "classic",
      )
      await expectReadable(page, PAGE_TEXT, "under the classic shell")
    })
  }
}

test.describe("built-in presets", () => {
  test("switching between two presets of one style repaints without a reload", async ({
    page,
  }) => {
    // The style with the most presets, and its first two.
    const presetsOf = (name: string) =>
      PRESETS.filter((preset) => preset.style === name)
    const style = PRESETS.map((preset) => preset.style).reduce((most, name) =>
      presetsOf(name).length > presetsOf(most).length ? name : most,
    )
    const pair = presetsOf(style).slice(0, 2)
    expect(pair, `presets of ${style}`).toHaveLength(2)

    const consoleWatch = watchConsole(page)
    await seedApp(page, { style, mode: "light" })
    await gotoApp(page, PAGE)
    // Lost on any navigation, so its survival shows the page never reloaded.
    await page.evaluate(() => {
      ;(window as unknown as { samePage?: boolean }).samePage = true
    })
    const base = await readThemeAttrs(page)
    const shell = page.locator(".dr-shell").first()
    const baseShell = await shell.getAttribute("data-shell-style")
    await openThemeSwitcher(page)
    const control = themeSwitcher(page).getByRole("radiogroup", {
      name: "Preset",
      exact: true,
    })

    for (const preset of pair) {
      await control
        .getByRole("radio", { name: preset.label, exact: true })
        .click()
      await expect(page.locator("html")).toHaveAttribute(
        "data-preset",
        preset.name,
      )
      const attrs = await readThemeAttrs(page)
      expect(attrs, `stamped for ${preset.name}`).toMatchObject(
        stampedBy(preset, "light"),
      )
      await expect(shell).toHaveAttribute(
        "data-shell-style",
        preset.shellStyle ?? baseShell ?? "",
      )
      await expect(page.locator(".dr-sidebar-nav").first()).toHaveAttribute(
        "data-sidebar-selection",
        navLook(preset),
      )
      expect(await inlineTokens(page), `tokens of ${preset.name}`).toEqual(
        engineTokens(attrs),
      )
      const painted = await paintTokens(page, preset, "light")
      expect(painted.applied, `paint tokens of ${preset.name}`).toEqual(
        painted.expected,
      )
    }

    await control.getByRole("radio", { name: "Base", exact: true }).click()
    await expect(page.locator("html")).toHaveAttribute("data-preset", "base")
    expect(await readThemeAttrs(page)).toEqual(base)
    await expect(shell).toHaveAttribute("data-shell-style", baseShell ?? "")
    expect(
      await page.evaluate(
        () => (window as unknown as { samePage?: boolean }).samePage,
      ),
    ).toBe(true)
    consoleWatch.assertClean()
  })

  test("a backdrop a preset outside Glass sets is dropped under more contrast", async ({
    page,
  }) => {
    const preset = PRESETS.find(
      (candidate) => !registry.styles[candidate.style]?.frosted,
    )
    if (!preset) throw new Error("no built-in preset of an unfrosted style")
    await seedPreset(page, preset, "light")
    await gotoApp(page, PAGE)
    // No built-in preset outside Glass sets a backdrop, so the rule one
    // would compile to is added here, in the layer the kit compiles a
    // preset's tokens into.
    await page.addStyleTag({
      content: `@layer style.preset { [data-preset="${preset.name}"] {
        --surface-fill-alpha: 0.5;
        --surface-backdrop: blur(12px);
        --chrome-backdrop: blur(12px);
        --overlay-backdrop: blur(12px);
        --scrim-backdrop: blur(4px);
      } }`,
    })
    const card = page.locator("main .dr-card").first()
    const frosted = await translucency(page)
    expect(frosted.fillAlpha).toBe("0.5")
    expect(frosted.blurs["--surface-backdrop"]).toBe("blur(12px)")
    expect(frosted.filtering).toContain("div.dr-card")
    expect(await computed(card, "backdrop-filter")).toBe("blur(12px)")

    await underFallbackMedia(page, async (media) => {
      expect(await translucency(page), `translucency under ${media}`).toEqual(
        OPAQUE,
      )
      expect(await computed(card, "backdrop-filter")).toBe("none")
      await expectReadable(page, TEXT, `under ${media}`)
    })
    expect((await translucency(page)).filtering).toContain("div.dr-card")
  })
})
