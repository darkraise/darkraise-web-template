import {
  expect,
  type Page,
  type Locator,
  type ConsoleMessage,
} from "@playwright/test"
import { LS_KEYS } from "../fixtures/theme"

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
  preset?: string
  backgroundStyle?: string
  backgroundIntensity?: string
  gradientPattern?: string
  mode?: string
  density?: string
  elevation?: string
  buttonElevation?: string
  radius?: string
  fontSize?: string
  accentVibrancy?: string
  surfaceIntensity?: string
  canvasTint?: string
  /** Preset-specific axes: { glass: { blur: "high" } } → key `theme-glass-blur`. */
  presetAxes?: Record<string, Record<string, string>>
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
  const entries: [string, string][] = []

  if (authenticated) {
    entries.push(["auth-token", "mock-jwt-token"], ["auth-user", AUTH_USER])
  }
  const map: [keyof ThemeSeed, string][] = [
    ["accent", LS_KEYS.accent],
    ["surface", LS_KEYS.surface],
    ["preset", LS_KEYS.preset],
    ["backgroundStyle", LS_KEYS.backgroundStyle],
    ["backgroundIntensity", LS_KEYS.backgroundIntensity],
    ["gradientPattern", LS_KEYS.gradientPattern],
    ["mode", LS_KEYS.mode],
    ["density", LS_KEYS.density],
    ["elevation", LS_KEYS.elevation],
    ["buttonElevation", LS_KEYS.buttonElevation],
    ["radius", LS_KEYS.radius],
    ["fontSize", LS_KEYS.fontSize],
    ["accentVibrancy", LS_KEYS.accentVibrancy],
    ["surfaceIntensity", LS_KEYS.surfaceIntensity],
    ["canvasTint", LS_KEYS.canvasTint],
  ]
  for (const [field, key] of map) {
    const value = theme[field]
    if (typeof value === "string") entries.push([key, value])
  }
  for (const [preset, axes] of Object.entries(theme.presetAxes ?? {})) {
    for (const [axis, value] of Object.entries(axes)) {
      entries.push([`theme-${preset}-${axis}`, value])
    }
  }
  return entries
}

export async function seedApp(
  page: Page,
  theme: ThemeSeed = {},
  options: { authenticated?: boolean } = {},
) {
  const entries = storageEntries(theme, options.authenticated ?? true)

  // Seed only what is missing: the init script re-runs on every navigation and
  // reload, so an unconditional write would clobber changes a test just made
  // through the UI and make persistence assertions meaningless.
  await page.addInitScript((pairs: [string, string][]) => {
    for (const [k, v] of pairs) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, v)
    }
  }, entries)
}

/**
 * Overwrite the stored theme on an already-loaded page. Use this when one test
 * walks several axis values in a row — `seedApp` deliberately never overwrites,
 * so a second call inside the same test would be a no-op.
 */
export async function applyTheme(page: Page, theme: ThemeSeed) {
  await page.evaluate(
    (pairs: [string, string][]) => {
      for (const [k, v] of pairs) localStorage.setItem(k, v)
    },
    storageEntries(theme, false),
  )
}

/** Console messages that are expected and must not fail a test. */
const ALLOWED_CONSOLE = [
  /\[vite\]/i,
  /Download the React DevTools/i,
  /\[ThemeProvider\] Preset ".+" requires mode/,
]

export interface ConsoleWatcher {
  errors: string[]
  warnings: string[]
  /** Fails the test when any non-allowlisted console error was emitted. */
  assertClean(): void
}

export function watchConsole(page: Page): ConsoleWatcher {
  const errors: string[] = []
  const warnings: string[] = []

  const record = (msg: ConsoleMessage) => {
    const text = msg.text()
    if (ALLOWED_CONSOLE.some((re) => re.test(text))) return
    if (msg.type() === "error") errors.push(text)
    else if (msg.type() === "warning") warnings.push(text)
  }
  page.on("console", record)
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

  return {
    errors,
    warnings,
    assertClean() {
      expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([])
    },
  }
}

/** Navigate and wait for the app shell to be interactive. */
export async function gotoApp(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator("#root")).not.toBeEmpty()
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

/** Section labels currently rendered in the theme switcher popover. */
export async function switcherSections(page: Page) {
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
