import { test, expect, type Page } from "@playwright/test"
import {
  SIGNATURES,
  resolveRegistry,
  signatureAttribute,
} from "darkraise-ui/theme-config"
import { gotoApp, seedApp } from "./helpers/app"
import { labelContrast, settle } from "./helpers/measure"

/**
 * Every built-in look, light and dark, on the kitchen sink. The control
 * anatomy a look picks changes no control's size: the reference is the
 * same page with the six anatomy signatures stamped back to their kit
 * defaults, so the look's fonts, density and radius stay as they are. And
 * every control label clears 4.5:1 against what is painted behind its line
 * of text. Nothing here names a look, so a look whose picks change is
 * checked as it is.
 */

test.describe.configure({ timeout: 120_000 })
test.use({ viewport: { width: 1440, height: 1000 } })

const PAGE = "/components/kitchen-sink"
const MODES = ["light", "dark"] as const

const registry = resolveRegistry()
const LOOKS = [
  ...Object.keys(registry.styles).map((style) => ({ style, preset: "base" })),
  ...Object.values(registry.presets)
    .filter((preset) => preset.builtIn)
    .map((preset) => ({ style: preset.style, preset: preset.name })),
]

const ANATOMY = [
  "buttonStyle",
  "iconButton",
  "switchStyle",
  "checkStyle",
  "tabStyle",
  "sliderStyle",
] as const

/**
 * Every control a control anatomy signature restyles, and the items of
 * each tab list and segment group. Segment items are radio items too.
 */
const CONTROLS = [
  ".dr-btn",
  ".dr-switch",
  ".dr-checkbox",
  ".dr-radio-group-item",
  ".dr-slider",
  ".dr-tabs-list",
  ".dr-tabs-trigger",
  ".dr-segment-group",
].join(", ")

/** Text a control carries or that names one. */
const LABELS = [
  ".dr-btn",
  ".dr-tabs-trigger",
  ".dr-segment-group-item",
  "label",
].join(", ")

/** Each control's size, keyed by its order and first class. */
async function sizes(page: Page): Promise<Record<string, string>> {
  return page.evaluate((selector) => {
    const out: Record<string, string> = {}
    document.querySelectorAll(`main :is(${selector})`).forEach((el, i) => {
      let { width, height } = el.getBoundingClientRect()
      // A tab list or segment group is measured without the space between
      // its items, which tabStyle `outline` closes so its cells meet; its
      // items are measured on their own.
      if (el.matches(".dr-tabs-list, .dr-segment-group")) {
        const vertical = el.getAttribute("data-orientation") === "vertical"
        const items = [
          ...el.querySelectorAll(".dr-tabs-trigger, .dr-segment-group-item"),
        ]
          .map((item) => item.getBoundingClientRect())
          .sort((a, b) => (vertical ? a.top - b.top : a.left - b.left))
        let space = 0
        items.slice(1).forEach((item, k) => {
          const before = items[k] as DOMRect
          space += vertical
            ? item.top - before.bottom
            : item.left - before.right
        })
        if (vertical) height -= space
        else width -= space
      }
      out[`${i} ${el.classList[0]}`] =
        `${width.toFixed(2)}x${height.toFixed(2)}`
    })
    return out
  }, CONTROLS)
}

async function kitAnatomy(page: Page) {
  const defaults = ANATOMY.map(
    (key) => [signatureAttribute(key), SIGNATURES[key].default] as const,
  )
  await page.locator("html").evaluate((el, pairs) => {
    for (const [name, value] of pairs) el.setAttribute(name, value)
  }, defaults)
}

for (const { style, preset } of LOOKS) {
  for (const mode of MODES) {
    test(`${style} ${preset} ${mode}: the anatomy keeps every control's size and every label at 4.5:1`, async ({
      page,
    }) => {
      await seedApp(page, { style, preset, mode })
      await gotoApp(page, PAGE)
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      await page.mouse.move(0, 0)
      await settle(page)

      const picked = registry.signaturesFor(style, preset)
      const html = page.locator("html")
      for (const key of ANATOMY) {
        await expect(html).toHaveAttribute(signatureAttribute(key), picked[key])
      }

      const low: string[] = []
      const labels = page.locator("main").locator(LABELS)
      for (let i = 0; i < (await labels.count()); i++) {
        const label = labels.nth(i)
        const text = (await label.innerText()).trim()
        if (!text || !(await label.isVisible())) continue
        const ratio = await labelContrast(page, label)
        if (ratio < 4.5) low.push(`${text}: ${ratio.toFixed(2)}`)
      }
      expect(low, "labels under 4.5:1").toEqual([])

      const asPicked = await sizes(page)
      await kitAnatomy(page)
      await settle(page)
      expect(asPicked, "control sizes against the kit anatomy").toEqual(
        await sizes(page),
      )
    })
  }
}
