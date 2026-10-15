import { readFileSync, writeFileSync } from "node:fs"
import { test, expect, type Page } from "@playwright/test"
import { kitLook, seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"

/**
 * With every signature at its kit default, the controls the preset
 * signatures restyle must compute exactly what master computed before any
 * signature rule or well-fill reader existed. Each probe's elements, their
 * ::before and ::after, are recorded at rest, then the change each hover
 * and keyboard focus makes, and compared with the committed snapshot.
 *
 * ANATOMY_DEFAULTS_UPDATE=1 rewrites the snapshot. Only a change meant to
 * alter the kit defaults re-records it; a failing comparison is a regression
 * to fix, never a reason to re-record.
 */

const SNAPSHOT = new URL("./fixtures/anatomy-defaults.json", import.meta.url)
const UPDATE = process.env.ANATOMY_DEFAULTS_UPDATE === "1"
const MODES = ["light", "dark"] as const

/** Probes, and for a probe shared with other specs the part recorded. */
const PROBES: { probe: string; within?: string }[] = [
  { probe: "anatomy-buttons" },
  { probe: "anatomy-pagination" },
  { probe: "calendar", within: ".dr-calendar-nav-btn" },
  { probe: "anatomy-switches" },
  { probe: "anatomy-checkboxes" },
  { probe: "anatomy-radios" },
  { probe: "anatomy-tabs" },
  { probe: "anatomy-segments" },
  { probe: "anatomy-sliders" },
  { probe: "anatomy-progress" },
  { probe: "anatomy-card" },
]

type Reading = { [element: string]: { [property: string]: string } }
type ProbeSnapshot = { [state: string]: Reading }
type Snapshot = { [mode: string]: { [probe: string]: ProbeSnapshot } }

// Transitions and animations would make every reading a blend; the
// indeterminate progress bar would never hold still.
const FROZEN = `*, *::before, *::after {
  transition: none !important;
  animation: none !important;
}`

/**
 * Every element of the probe (or of each `within` match), keyed by its
 * order, tag, first class and data-case, with its box relative to the probe
 * and the properties a signature rule could change. Shapes inside an SVG
 * follow the SVG's colour and are skipped.
 */
async function record(page: Page, probe: string, within?: string) {
  return page.evaluate(
    async ({ probe, within }) => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const root = document.querySelector<HTMLElement>(
        `[data-probe="${probe}"]`,
      )
      if (!root) throw new Error(`no probe "${probe}"`)
      const scopes = within ? [...root.querySelectorAll(within)] : [root]
      if (scopes.length === 0) throw new Error(`no "${within}" in "${probe}"`)
      const elements = scopes.flatMap((scope) => [
        ...(within ? [scope] : []),
        ...scope.querySelectorAll("*"),
      ])
      const origin = root.getBoundingClientRect()
      const px = (value: number) => value.toFixed(2)
      const own = [
        "display",
        "position",
        "opacity",
        "color",
        "background-color",
        "background-image",
        "border-style",
        "border-width",
        "border-color",
        "border-radius",
        "box-shadow",
        "outline-style",
        "outline-width",
        "outline-color",
        "outline-offset",
        "transform",
        "translate",
      ]
      const pseudo = [
        "content",
        "width",
        "height",
        "top",
        "right",
        "bottom",
        "left",
        "opacity",
        "background-color",
        "background-image",
        "border-style",
        "border-width",
        "border-color",
        "border-radius",
        "box-shadow",
        "transform",
      ]
      // Values a property takes when nothing sets it are left out, as are
      // the width and colour of a border or outline that is not drawn, so a
      // reading lists what paints. A value that appears or goes still
      // differs from the snapshot.
      const initial: { [property: string]: string } = {
        position: "static",
        opacity: "1",
        "background-color": "rgba(0, 0, 0, 0)",
        "background-image": "none",
        "border-style": "none",
        "border-radius": "0px",
        "box-shadow": "none",
        "outline-style": "none",
        transform: "none",
        translate: "none",
      }
      const undrawn: { [property: string]: string } = {
        "border-width": "border-style",
        "border-color": "border-style",
        "outline-width": "outline-style",
        "outline-color": "outline-style",
        "outline-offset": "outline-style",
      }
      const read = (
        style: CSSStyleDeclaration,
        properties: string[],
        prefix: string,
        entry: { [property: string]: string },
      ) => {
        for (const property of properties) {
          const value = style.getPropertyValue(property)
          if (value === initial[property]) continue
          const drawnBy = undrawn[property]
          if (drawnBy && style.getPropertyValue(drawnBy) === "none") continue
          entry[`${prefix}${property}`] = value
        }
      }
      const out: { [element: string]: { [property: string]: string } } = {}
      elements.forEach((el, index) => {
        if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return
        const name = el.classList[0] ?? ""
        const kase = el.getAttribute("data-case")
        const key = `${index} ${el.tagName.toLowerCase()}${name ? `.${name}` : ""}${kase ? `[${kase}]` : ""}`
        const rect = el.getBoundingClientRect()
        const entry: { [property: string]: string } = {
          box: `${px(rect.left - origin.left)},${px(rect.top - origin.top)} ${px(rect.width)}x${px(rect.height)}`,
        }
        if (el.matches(":hover")) entry.hover = "true"
        if (el.matches(":focus-visible")) entry.focus = "true"
        read(getComputedStyle(el), own, "", entry)
        for (const part of ["::before", "::after"]) {
          const style = getComputedStyle(el, part)
          if (style.getPropertyValue("content") === "none") continue
          read(style, pseudo, `${part} `, entry)
        }
        out[key] = entry
      })
      return out
    },
    { probe, within },
  )
}

/** What `state` changed against `rest`, property by property. */
function changes(rest: Reading, state: Reading): Reading {
  const out: Reading = {}
  for (const [key, entry] of Object.entries(state)) {
    const before = rest[key] ?? {}
    const changed: { [property: string]: string } = {}
    for (const property of new Set([
      ...Object.keys(before),
      ...Object.keys(entry),
    ])) {
      const value = entry[property] ?? "<absent>"
      if (value !== (before[property] ?? "<absent>")) changed[property] = value
    }
    if (Object.keys(changed).length > 0) out[key] = changed
  }
  return out
}

/** Interactive elements of a probe: centre point, label, whether disabled. */
async function targets(page: Page, probe: string, within?: string) {
  return page.evaluate(
    ({ probe, within }) => {
      const root = document.querySelector(`[data-probe="${probe}"]`)
      if (!root) throw new Error(`no probe "${probe}"`)
      const selector = 'button, a[href], [role="slider"]'
      const found = within
        ? [...root.querySelectorAll(within)].filter((el) =>
            el.matches(selector),
          )
        : [...root.querySelectorAll(selector)]
      return found.map((el, index) => ({
        index,
        label:
          el.getAttribute("aria-label") ??
          el.getAttribute("data-case") ??
          el.textContent?.trim() ??
          "",
        disabled:
          el.matches(":disabled") ||
          el.hasAttribute("data-disabled") ||
          el.getAttribute("aria-disabled") === "true",
      }))
    },
    { probe, within },
  )
}

/** Scroll target `index` into view and return its centre. */
async function centreOf(
  page: Page,
  probe: string,
  within: string | undefined,
  index: number,
  focus: boolean,
) {
  return page.evaluate(
    ({ probe, within, index, focus }) => {
      const root = document.querySelector(`[data-probe="${probe}"]`)
      if (!root) throw new Error(`no probe "${probe}"`)
      const selector = 'button, a[href], [role="slider"]'
      const found = within
        ? [...root.querySelectorAll(within)].filter((el) =>
            el.matches(selector),
          )
        : [...root.querySelectorAll(selector)]
      const el = found[index] as HTMLElement | undefined
      if (!el) throw new Error(`no target ${index} in "${probe}"`)
      el.scrollIntoView({ block: "center", inline: "center" })
      if (focus) el.focus()
      const rect = el.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        focused: el.matches(":focus-visible"),
      }
    },
    { probe, within, index, focus },
  )
}

async function rest(page: Page) {
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
  })
}

async function recordProbe(
  page: Page,
  probe: string,
  within?: string,
): Promise<ProbeSnapshot> {
  await rest(page)
  const atRest = await record(page, probe, within)
  const snapshot: ProbeSnapshot = { rest: atRest }
  // A key press puts the page in keyboard modality, so a scripted focus
  // matches :focus-visible as a Tab press would.
  await page.keyboard.press("Shift")
  for (const target of await targets(page, probe, within)) {
    const name = `${target.index} ${target.label}`
    await rest(page)
    const point = await centreOf(page, probe, within, target.index, false)
    await page.mouse.move(point.x, point.y)
    snapshot[`${name} :hover`] = changes(
      atRest,
      await record(page, probe, within),
    )
    await rest(page)
    if (target.disabled) continue
    const focused = await centreOf(page, probe, within, target.index, true)
    expect(focused.focused, `${probe} ${name} matches :focus-visible`).toBe(
      true,
    )
    snapshot[`${name} :focus-visible`] = changes(
      atRest,
      await record(page, probe, within),
    )
  }
  await rest(page)
  return snapshot
}

const recorded: Snapshot = {}

if (UPDATE) test.describe.configure({ mode: "serial" })

for (const mode of MODES) {
  test.describe(`anatomy defaults · ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await openControlFixture(page)
      await kitLook(page)
      await page.addStyleTag({ content: FROZEN })
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
    })

    for (const { probe, within } of PROBES) {
      test(`${probe} computes what master computed`, async ({ page }) => {
        test.setTimeout(120_000)
        const actual = await recordProbe(page, probe, within)
        if (UPDATE) {
          recorded[mode] = { ...recorded[mode], [probe]: actual }
          return
        }
        const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8")) as Snapshot
        expect(actual).toEqual(snapshot[mode]?.[probe])
      })
    }
  })
}

test.afterAll(() => {
  if (!UPDATE) return
  const complete = MODES.every(
    (mode) => Object.keys(recorded[mode] ?? {}).length === PROBES.length,
  )
  if (!complete) throw new Error("not every probe was recorded; not written")
  writeFileSync(SNAPSHOT, `${JSON.stringify(recorded, null, 2)}\n`)
})
