import {
  expect,
  test,
  type Page,
  type Locator,
  type ConsoleMessage,
  type Request,
} from "@playwright/test"
import {
  SIGNATURES,
  signatureAttribute,
  type SignatureKey,
  type StampedSignature,
} from "darkraise-ui/theme-config"
import { LS_KEYS, SHELL_STYLE_KEY, type Font } from "../fixtures/theme"

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** `boundingBox()` is null for detached or hidden elements — fail with a
 *  useful message instead of a downstream TypeError. */
export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  if (!box) throw new Error("element is not visible, so it has no box")
  return box
}

/** `getAttribute()` is null when the attribute is absent, which for the
 *  state attributes these tests compare against is always a test bug. */
export async function attrOf(locator: Locator, name: string): Promise<string> {
  const value = await locator.getAttribute(name)
  if (value === null) throw new Error(`expected a "${name}" attribute`)
  return value
}

export interface ThemeSeed {
  accent?: string
  surface?: string
  style?: string
  preset?: string
  glassTransparency?: string
  glassBlur?: string
  backgroundStyle?: string
  backgroundIntensity?: string
  gradientPattern?: string
  mode?: string
  density?: string
  elevation?: string
  radius?: string
  /** Seeds the layout store's stored pick; shell style is not a theme axis. */
  shellStyle?: string
  sidebarSelection?: string
  fontSize?: string
  contrast?: string
  darkAccentChroma?: string
  tintWithAccent?: string
  signalColor?: string
  font?: Font
  headingFont?: string
}

const AUTH_USER = JSON.stringify({
  id: "1",
  name: "Demo User",
  email: "demo@example.com",
})

/**
 * Seed auth + theme into localStorage before any app script runs, so the very
 * first paint already uses the theme under test. Driving the same state through
 * the UI would need one popover interaction per axis value and would not cover
 * the boot-time read path at all.
 */
function storageEntries(theme: ThemeSeed, authenticated: boolean) {
  const entries: [string, string][] = [["darkraise-demo.language", "en"]]

  if (authenticated) {
    entries.push(["auth-token", "mock-jwt-token"], ["auth-user", AUTH_USER])
  }
  const map: [keyof ThemeSeed, string][] = [
    ["accent", LS_KEYS.accent],
    ["surface", LS_KEYS.surface],
    ["style", LS_KEYS.style],
    ["preset", LS_KEYS.preset],
    ["glassTransparency", LS_KEYS.glassTransparency],
    ["glassBlur", LS_KEYS.glassBlur],
    ["backgroundStyle", LS_KEYS.backgroundStyle],
    ["backgroundIntensity", LS_KEYS.backgroundIntensity],
    ["gradientPattern", LS_KEYS.gradientPattern],
    ["mode", LS_KEYS.mode],
    ["density", LS_KEYS.density],
    ["elevation", LS_KEYS.elevation],
    ["radius", LS_KEYS.radius],
    ["shellStyle", SHELL_STYLE_KEY],
    ["sidebarSelection", LS_KEYS.sidebarSelection],
    ["fontSize", LS_KEYS.fontSize],
    ["contrast", LS_KEYS.contrast],
    ["darkAccentChroma", LS_KEYS.darkAccentChroma],
    ["tintWithAccent", LS_KEYS.tintWithAccent],
    ["signalColor", LS_KEYS.signalColor],
    ["font", LS_KEYS.font],
    ["headingFont", LS_KEYS.headingFont],
  ]
  for (const [field, key] of map) {
    const value = theme[field]
    if (typeof value === "string") entries.push([key, value])
  }
  return entries
}

export async function seedApp(
  page: Page,
  theme: ThemeSeed = {},
  options: { authenticated?: boolean } = {},
) {
  const entries = storageEntries(theme, options.authenticated ?? true)

  // The init script re-runs on every navigation, reload and frame, so it seeds
  // once per tab: the sessionStorage flag survives reloads and same-origin
  // navigations, and a new page starts without it. What the app stores or
  // erases afterwards therefore survives a reload, which persistence tests
  // depend on. A second seedApp call before the first navigation is skipped.
  // Same-origin frames share the top document storage, and a cross-origin
  // frame that failed to load has an opaque origin whose storage access
  // throws, so only the top frame seeds.
  await page.addInitScript((pairs: [string, string][]) => {
    if (window !== window.top) return
    if (sessionStorage.getItem("e2e-seeded") !== null) return
    for (const [k, v] of pairs) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, v)
    }
    sessionStorage.setItem("e2e-seeded", "1")
  }, entries)
}

/**
 * Shows the kit's own look on the loaded page: no style sheet matches the
 * root and every signature sits at its kit default, whatever the built-in
 * styles set. The engine's inline tokens stay those of the seeded style.
 */
export async function kitLook(page: Page) {
  const stamped = (Object.keys(SIGNATURES) as SignatureKey[]).filter(
    (key): key is StampedSignature => key !== "navSelection",
  )
  const defaults = stamped.map(
    (key) => [signatureAttribute(key), SIGNATURES[key].default] as const,
  )
  await page.locator("html").evaluate((el, pairs) => {
    el.setAttribute("data-style", "kit")
    for (const [name, value] of pairs) el.setAttribute(name, value)
  }, defaults)
}

/**
 * Overwrite the stored theme on an already-loaded page. Use this when one test
 * walks several axis values in a row: `seedApp` seeds once per tab, so a
 * second call inside the same test would be a no-op.
 */
export async function applyTheme(page: Page, theme: ThemeSeed) {
  await page.evaluate(
    (pairs: [string, string][]) => {
      for (const [k, v] of pairs) localStorage.setItem(k, v)
    },
    storageEntries(theme, false),
  )
}

/**
 * Console errors and warnings that are expected and must not fail a test.
 * The Vite client logs its routine messages at debug, info or log level; a
 * `[vite]` error, such as an internal server error or a lost websocket, is
 * a real failure.
 */
const ALLOWED_CONSOLE = [/Download the React DevTools/i]

export interface ConsoleWatcher {
  errors: string[]
  warnings: string[]
  /** Fails the test when any non-allowlisted console error was emitted. */
  assertClean(): void
}

const consoleWatchers = new WeakMap<Page, ConsoleWatcher[]>()

export function watchConsole(page: Page): ConsoleWatcher {
  const errors: string[] = []
  const warnings: string[] = []

  const record = (msg: ConsoleMessage) => {
    const type = msg.type()
    if (type !== "error" && type !== "warning") return
    const text = msg.text()
    if (ALLOWED_CONSOLE.some((re) => re.test(text))) return
    if (type === "error") errors.push(text)
    else warnings.push(text)
  }
  page.on("console", record)
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

  const watcher: ConsoleWatcher = {
    errors,
    warnings,
    assertClean() {
      expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([])
    },
  }
  consoleWatchers.set(page, [...(consoleWatchers.get(page) ?? []), watcher])
  return watcher
}

/**
 * The app renders only after i18n initialises, which can finish after the
 * load event that goto and reload resolve on, and #root holds a loading
 * placeholder until then. The pre-render script stamps data-style before the
 * app runs, so the placeholder leaving is what shows ThemeProvider has
 * mounted; data-style then covers a page the pre-render script never ran on.
 */
async function waitForTheme(page: Page) {
  await expect(page.locator("#root .app-loading")).toHaveCount(0)
  await expect(page.locator("html")).toHaveAttribute("data-style", /.+/)
}

/**
 * A dev-server load holds about 250 module responses whose resources Chromium
 * frees only when the page that loaded them is garbage-collected. Under
 * parallel workers that collection lags, three loads' worth pile up in one
 * renderer, and the next navigation fails with ERR_INSUFFICIENT_RESOURCES;
 * collecting before each navigation keeps one load's worth.
 */
export async function collectGarbage(page: Page) {
  await page.waitForLoadState("networkidle")
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("HeapProfiler.collectGarbage")
  await cdp.detach()
}

async function loadRoot(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator("#root")).not.toBeEmpty()
}

/**
 * The request's network error, or null when it failed for another reason.
 * Chromium cancels a module script answered with an HTTP error status and
 * reports it as net::ERR_ABORTED; that response is a broken build, not a
 * dropped request, so it does not count.
 */
async function networkFailure(request: Request): Promise<string | null> {
  const errorText = request.failure()?.errorText ?? ""
  if (!errorText.startsWith("net::ERR_")) return null
  const response = await request.response()
  if (response && !response.ok()) return null
  return `${errorText} ${request.url()}`
}

/**
 * Navigate and wait for the app shell to be interactive.
 *
 * A dropped module request (a Docker veth change aborts in-flight requests
 * with net::ERR_NETWORK_CHANGED) leaves #root on its placeholder for good, so
 * a load that stays empty after a net::ERR_* failure navigates once more.
 * Console output recorded during the abandoned load is dropped, since it
 * belongs to a page the test never uses.
 */
export async function gotoApp(page: Page, path: string) {
  await collectGarbage(page)
  const pending: Promise<string | null>[] = []
  const recordFailure = (request: Request) => {
    pending.push(networkFailure(request))
  }
  const consoleMarks = (consoleWatchers.get(page) ?? []).map((watcher) => ({
    watcher,
    errors: watcher.errors.length,
    warnings: watcher.warnings.length,
  }))
  page.on("requestfailed", recordFailure)
  try {
    await loadRoot(page, path)
  } catch (error) {
    page.off("requestfailed", recordFailure)
    const failures = (await Promise.all(pending)).filter(
      (failure) => failure !== null,
    )
    if (failures.length === 0) throw error
    const firstAttempt = failures.join("\n")
    for (const mark of consoleMarks) {
      mark.watcher.errors.length = mark.errors
      mark.watcher.warnings.length = mark.warnings
    }
    try {
      await loadRoot(page, path)
    } catch (retryError) {
      if (retryError instanceof Error) {
        retryError.message =
          `gotoApp: #root stayed empty after one retry. ` +
          `Failed requests of the first attempt:\n${firstAttempt}\n\n` +
          retryError.message
      }
      throw retryError
    }
    test
      .info()
      .annotations.push({ type: "gotoApp retry", description: firstAttempt })
  } finally {
    page.off("requestfailed", recordFailure)
  }
  await waitForTheme(page)
}

/**
 * Reload once the previous load has settled, then wait until the stored theme
 * has been painted again.
 */
export async function reloadApp(page: Page) {
  await collectGarbage(page)
  await page.reload()
  await waitForTheme(page)
}

/** All `data-*` attributes the ThemeProvider writes on <html>. */
export async function readThemeAttrs(page: Page) {
  return page.evaluate(() =>
    Object.fromEntries(
      [...document.documentElement.attributes]
        .filter((a) => a.name.startsWith("data-"))
        .map((a) => [a.name, a.value]),
    ),
  )
}

/** Resolved value of a CSS custom property on <html>. */
export async function readToken(page: Page, name: string) {
  return page.evaluate(
    (token) =>
      getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    name,
  )
}

export async function readTokens(page: Page, names: string[]) {
  return page.evaluate((tokens) => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(
      tokens.map((t) => [t, style.getPropertyValue(t).trim()]),
    )
  }, names)
}

export function themeSwitcher(page: Page) {
  return page.locator('[aria-label="Theme settings"]')
}

export async function openThemeSwitcher(page: Page) {
  const panel = themeSwitcher(page)
  if (await panel.isVisible().catch(() => false)) return panel
  await page.getByRole("button", { name: "Customize theme" }).click()
  await expect(panel).toBeVisible()
  return panel
}

export async function closeThemeSwitcher(page: Page) {
  await page.keyboard.press("Escape")
  await expect(themeSwitcher(page)).toHaveCount(0)
}

/**
 * Open the Advanced disclosure in the open theme panel. It starts closed each
 * time the popover mounts, so callers open it rather than track its state.
 */
export async function openAdvanced(page: Page) {
  const trigger = themeSwitcher(page).getByRole("button", {
    name: "Advanced",
    exact: true,
  })
  if ((await trigger.getAttribute("aria-expanded")) === "true") return
  await trigger.click()
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expect(
    themeSwitcher(page)
      .getByRole("region", { name: "Advanced", exact: true })
      .locator(".dr-theme-switcher-section-label")
      .first(),
  ).toBeVisible()
}

/** Section labels in the theme switcher popover: Brand, then Advanced. */
export async function switcherSections(page: Page) {
  await openAdvanced(page)
  return themeSwitcher(page)
    .locator(".dr-theme-switcher-section-label")
    .allTextContents()
}

/**
 * Drive a 4-value axis slider by keyboard. The switcher renders 4-value axes as
 * a stepped slider rather than a toggle group, so there is no clickable cell.
 */
export async function setAxisSlider(
  page: Page,
  label: string,
  targetIndex: number,
) {
  // Query by accessible name. The axis label lives ON the role="slider"
  // thumb; it used to sit on a wrapper span, which left the slider itself
  // unnamed for assistive technology.
  const thumb = themeSwitcher(page).getByRole("slider", { name: label }).first()
  await thumb.focus()
  const current = Number(await thumb.getAttribute("aria-valuenow"))
  const delta = targetIndex - current
  const key = delta > 0 ? "ArrowRight" : "ArrowLeft"
  for (let i = 0; i < Math.abs(delta); i++) await page.keyboard.press(key)
  await expect(thumb).toHaveAttribute("aria-valuenow", String(targetIndex))
}

/** The page must not scroll sideways at any supported viewport. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(1)
}

/** The router's error boundary renders these; a crashed route must fail loudly. */
export async function expectNoErrorBoundary(page: Page) {
  await expect(
    page.getByText(/Something went wrong|Unexpected Application Error/i),
  ).toHaveCount(0)
}

/** Text inside table cells that the layout broke across lines. */
export async function wrappedTableText(scope: Locator): Promise<string[]> {
  return scope.evaluate((root) => {
    const wrapped: string[] = []
    for (const cell of root.querySelectorAll("th, td")) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent?.trim() ?? ""
        if (!text) continue
        const range = document.createRange()
        range.selectNodeContents(node)
        const tops = new Set(
          [...range.getClientRects()].map((rect) => Math.round(rect.top)),
        )
        if (tops.size > 1) wrapped.push(text)
      }
    }
    return wrapped
  })
}
