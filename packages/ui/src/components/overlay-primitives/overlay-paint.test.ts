import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// Modals and scrims read style tokens instead of literals, and the dialog
// header and footer signatures restyle them from the root attribute. jsdom
// computes no cascade, so the source rules are what this asserts; the
// effective values are checked in Chromium by the template's e2e suite.

const DIR = join("src", "components")
const OVERLAY = join(DIR, "overlay-primitives", "overlay-primitives.css")
const DIALOG = join(DIR, "dialog", "dialog.css")
const SHEET = join(DIR, "sheet", "sheet.css")
const DRAWER = join(DIR, "drawer", "drawer.css")
const TOUR = join(DIR, "tour", "tour.css")
const THEME = join("src", "styles", "theme.css")

interface Rule {
  selectors: string[]
  wrappers: string[]
  body: string
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function rulesOf(path: string): Rule[] {
  return cssRules(stripCssComments(readFileSync(path, "utf8"))).map((rule) => ({
    selectors: rule.selector
      .split(/,(?![^(]*\))/)
      .map(normalise)
      .filter(Boolean),
    wrappers: rule.wrappers,
    body: normalise(rule.body),
  }))
}

/** Every body of a rule whose selector list holds `selector`, joined. */
function bodyOf(path: string, selector: string, wrappers?: string[]): string {
  const bodies = rulesOf(path)
    .filter((rule) => rule.selectors.includes(selector))
    .filter(
      (rule) =>
        wrappers === undefined ||
        rule.wrappers.join(" > ") === wrappers.join(" > "),
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in ${path}`)
  return bodies.join(" ")
}

describe("overlay token defaults", () => {
  it.each([
    ["--dialog-fill", "var(--overlay-bg)"],
    ["--dialog-border", "var(--overlay-border)"],
    ["--dialog-radius", "var(--overlay-radius)"],
    ["--modal-shadow", "var(--elevation-high)"],
    ["--scrim", "color-mix(in oklab, #000 50%, transparent)"],
    ["--scrim-backdrop", "var(--overlay-backdrop)"],
  ])("declares %s as %s on the layered :root", (token, value) => {
    const root = bodyOf(OVERLAY, ":root", ["@layer base"])
    expect(root).toContain(`${token}: ${value};`)
  })
})

describe("overlay token readers", () => {
  it("draws the modal shadow from --modal-shadow", () => {
    expect(bodyOf(THEME, "@utility modal-surface")).toBe(
      "box-shadow: var(--modal-shadow), var(--glow-outer), var(--glow-inner);",
    )
  })

  it.each([
    [DIALOG, ".dr-dialog-content"],
    [SHEET, ".dr-sheet-content"],
    [DRAWER, ".dr-drawer-content"],
  ])("%s paints %s from the dialog tokens", (path, selector) => {
    const body = bodyOf(path, selector)
    expect(body).toMatch(
      /@apply overlay-surface; background: var\(--dialog-fill\); border-color: var\(--dialog-border\);/,
    )
  })

  it("rounds the dialog with --dialog-radius", () => {
    expect(bodyOf(DIALOG, ".dr-dialog-content")).toContain(
      "rounded-[var(--dialog-radius)]",
    )
  })

  it.each([
    '.dr-sheet-content[data-side="top"]',
    '.dr-sheet-content[data-side="bottom"]',
    '.dr-sheet-content[data-side="left"]',
    '.dr-sheet-content[data-side="right"]',
    '.dr-sheet-content[data-side="start"]',
    '.dr-sheet-content[data-side="end"]',
  ])("rounds %s with --dialog-radius", (selector) => {
    const body = bodyOf(SHEET, selector)
    expect(body).toContain("var(--dialog-radius)")
    expect(body).not.toContain("--overlay-radius")
  })

  it.each([
    '.dr-drawer-content[data-direction="bottom"]',
    '.dr-drawer-content[data-direction="top"]',
    '.dr-drawer-content[data-direction="left"]',
    '.dr-drawer-content[data-direction="right"]',
  ])("rounds %s with --dialog-radius", (selector) => {
    const body = bodyOf(DRAWER, selector)
    expect(body).toContain("var(--dialog-radius)")
    expect(body).not.toContain("--overlay-radius")
  })

  // A `surface` prop recomposes --overlay-bg on the element itself; the
  // style's dialog fill must not hide it.
  it.each([
    [DIALOG, ".dr-dialog-content[data-surface-fill]"],
    [DRAWER, ".dr-drawer-content[data-surface-fill]"],
  ])("%s keeps the surface prop's fill on %s", (path, selector) => {
    expect(bodyOf(path, selector)).toBe("background: var(--overlay-bg);")
  })

  it.each([
    [OVERLAY, ".dr-overlay-backdrop", "var(--scrim)"],
    [DRAWER, ".dr-drawer-overlay", "var(--scrim)"],
    [
      TOUR,
      ".dr-tour-backdrop",
      "color-mix(in oklab, var(--scrim) 80%, transparent)",
    ],
  ])("%s shades %s with the scrim tokens", (path, selector, colour) => {
    const body = bodyOf(path, selector)
    expect(body).toContain(`background-color: ${colour};`)
    expect(body).toContain("-webkit-backdrop-filter: var(--scrim-backdrop);")
    expect(body).toContain("backdrop-filter: var(--scrim-backdrop);")
    expect(body).not.toContain("bg-black")
  })
})

describe("dialog header and footer signatures", () => {
  it("draws a page-tone band under the header", () => {
    expect(
      bodyOf(OVERLAY, '[data-dialog-header="band"] .dr-overlay-header'),
    ).toBe(
      "margin: -1.5rem -1.5rem 0; padding: 1rem 1.5rem; background: hsl(var(--background)); border-bottom: 1px solid hsl(var(--border));",
    )
  })

  it("rules the footer off from the body", () => {
    expect(
      bodyOf(OVERLAY, '[data-dialog-footer="ruled"] .dr-overlay-footer'),
    ).toBe(
      "margin-inline: -1.5rem; padding: 1rem 1.5rem 0; border-top: 1px solid hsl(var(--border));",
    )
  })

  it("sets the footer in a page-tone tray with full-width actions", () => {
    expect(
      bodyOf(OVERLAY, '[data-dialog-footer="band"] .dr-overlay-footer'),
    ).toBe(
      "margin: 0 -1.5rem -1.5rem; padding: 1rem 1.5rem; background: hsl(var(--background)); border-top: 1px solid hsl(var(--border));",
    )
    expect(
      bodyOf(OVERLAY, '[data-dialog-footer="band"] .dr-overlay-footer > *', [
        "@layer components",
        "@media (width >= 40rem)",
      ]),
    ).toBe("flex: 1;")
  })
})
