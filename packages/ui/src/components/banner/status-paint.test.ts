import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// Banners, alerts and badges read their radius, fill, frame and shadow from
// style tokens, and the banner mark, banner surface and badge style
// signatures restyle them from the root attribute. jsdom computes no
// cascade, so the source rules are what this asserts; the effective values
// are checked in Chromium by the template's e2e suite.

const SOURCES = {
  banner: join("src", "components", "banner", "banner.css"),
  alert: join("src", "components", "alert", "alert.css"),
  badge: join("src", "components", "badge", "badge.css"),
} as const

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

function rules(file: keyof typeof SOURCES): Rule[] {
  return cssRules(stripCssComments(readFileSync(SOURCES[file], "utf8"))).map(
    (rule) => ({
      selectors: rule.selector
        .split(/,(?![^(]*\))/)
        .map(normalise)
        .filter(Boolean),
      wrappers: rule.wrappers,
      body: normalise(rule.body),
    }),
  )
}

function bodyOf(
  file: keyof typeof SOURCES,
  selector: string,
  wrappers: string[] = ["@layer components"],
): string {
  const bodies = rules(file)
    .filter(
      (rule) =>
        rule.selectors.includes(selector) &&
        rule.wrappers.join(" | ") === wrappers.join(" | "),
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) {
    throw new Error(
      `no rule ${selector} in ${file} inside ${wrappers.join(" | ")}`,
    )
  }
  return bodies.join(" ")
}

const STATUS = ["info", "success", "warning", "destructive"] as const
const BANNER_STATUS = '.dr-banner[data-variant="warning"]'
const ALERT_STATUS = '.dr-alert[data-variant="warning"]'
const SUBTLE = '.dr-badge[data-variant="warning-subtle"]'

describe("status token defaults", () => {
  it.each([
    ["--banner-radius", "var(--radius)"],
    ["--banner-fill", "initial"],
    ["--banner-border", "hsl(var(--border))"],
    ["--banner-shadow", "initial"],
  ])("declares %s as %s on the layered :root", (token, value) => {
    expect(bodyOf("banner", ":root", ["@layer base"])).toContain(
      `${token}: ${value};`,
    )
  })

  it("declares the badge radius on the layered :root, the old clamp its default", () => {
    expect(bodyOf("badge", ":root", ["@layer base"])).toBe(
      "--badge-radius: min(var(--radius-control), 0.375rem);",
    )
    expect(bodyOf("badge", ".dr-badge")).toContain(
      "border-radius: var(--badge-radius);",
    )
    expect(bodyOf("badge", ".dr-badge")).not.toContain("0.375rem")
  })
})

describe("banner and alert readers", () => {
  it.each([
    ["banner", ".dr-banner"],
    ["alert", ".dr-alert"],
  ] as const)("%s frames itself from the status tokens", (file, selector) => {
    const body = bodyOf(file, selector)
    expect(body).toContain("rounded-[var(--banner-radius)]")
    expect(body).not.toMatch(/\brounded-lg\b/)
    expect(body).toContain("border-color: var(--banner-border);")
    expect(body).toContain("box-shadow: var(--banner-shadow, none);")
    expect(body).toContain("-webkit-backdrop-filter: var(--surface-backdrop);")
    expect(body).toContain("backdrop-filter: var(--surface-backdrop);")
  })

  it.each([
    ["banner", '.dr-banner[data-variant="default"]', "--muted"],
    ["alert", ".dr-alert", "--muted"],
    ...STATUS.map(
      (s) =>
        [
          "banner",
          `.dr-banner[data-variant="${s}"]`,
          "--banner-subtle",
        ] as const,
    ),
    ...STATUS.map(
      (s) =>
        ["alert", `.dr-alert[data-variant="${s}"]`, "--alert-subtle"] as const,
    ),
  ] as const)(
    "%s %s fills from the banner fill over its own alpha-aware fill",
    (file, selector, fill) => {
      expect(bodyOf(file, selector)).toContain(
        `background: var(--banner-fill, hsl(var(${fill}) / var(--surface-alpha)));`,
      )
    },
  )
})

describe("banner mark signature", () => {
  it.each([
    ["banner", BANNER_STATUS],
    ["alert", ALERT_STATUS],
  ] as const)("rule keeps only the leading rule on %s", (file, selector) => {
    expect(bodyOf(file, `[data-banner-mark="rule"] ${selector}`)).toBe(
      "border-width: 0; border-inline-start-width: 3px; background: var(--banner-fill, transparent); border-start-start-radius: 0; border-end-start-radius: 0;",
    )
  })

  it("icon frames the tinted box in its status and drops the stripe", () => {
    expect(bodyOf("banner", `[data-banner-mark="icon"] ${BANNER_STATUS}`)).toBe(
      "border-inline-start-width: 1px; border-color: hsl(var(--banner-edge) / 0.3);",
    )
    expect(bodyOf("alert", `[data-banner-mark="icon"] ${ALERT_STATUS}`)).toBe(
      "border-inline-start-width: 1px; border-color: hsl(var(--alert-edge) / 0.3);",
    )
  })

  it("lamp lights a dot in the status colour, the signal for info", () => {
    expect(bodyOf("banner", ".dr-banner")).toContain(
      "--banner-lamp: hsl(var(--signal-fill));",
    )
    expect(bodyOf("banner", BANNER_STATUS)).toContain(
      "--banner-lamp: hsl(var(--banner-edge));",
    )
    expect(bodyOf("banner", '.dr-banner[data-variant="info"]')).toContain(
      "--banner-lamp: hsl(var(--signal-fill));",
    )
    expect(
      bodyOf("banner", '[data-banner-mark="lamp"] .dr-banner::before'),
    ).toBe(
      '@apply rounded-full; content: ""; flex: none; width: 0.5rem; height: 0.5rem; background: var(--banner-lamp); box-shadow: 0 0 0 3px color-mix(in oklab, var(--banner-lamp) 18%, transparent), 0 0 8px color-mix(in oklab, var(--banner-lamp) 60%, transparent);',
    )
    expect(
      bodyOf("banner", '[data-banner-mark="lamp"] .dr-banner .dr-banner-icon'),
    ).toBe("display: none;")
    expect(bodyOf("banner", `[data-banner-mark="lamp"] ${BANNER_STATUS}`)).toBe(
      "border-inline-start-width: 1px; border-inline-start-color: var(--banner-border);",
    )
    expect(
      bodyOf("alert", '[data-banner-mark="lamp"] .dr-alert::before'),
    ).toContain("background: var(--alert-lamp);")
    expect(bodyOf("alert", '[data-banner-mark="lamp"] .dr-alert > svg')).toBe(
      "display: none;",
    )
    expect(bodyOf("alert", '[data-banner-mark="lamp"] .dr-alert')).toBe(
      "padding-inline-start: 2.75rem;",
    )
  })
})

describe("banner surface signature", () => {
  it.each([
    ["banner", ".dr-banner"],
    ["alert", ".dr-alert"],
  ] as const)("card sets %s on the card's surface", (file, selector) => {
    expect(bodyOf(file, `[data-banner-surface="card"] ${selector}`)).toBe(
      "background: var(--banner-fill, var(--surface-card-fill)); border-color: var(--card-border); box-shadow: var(--card-edge), var(--banner-shadow, 0 0 transparent);",
    )
  })
})

describe("badge style signature", () => {
  it("tint drops the frame", () => {
    expect(bodyOf("badge", `[data-badge-style="tint"] ${SUBTLE}`)).toBe(
      "border-color: transparent;",
    )
  })

  it("chip sets the status text on a neutral chip", () => {
    expect(bodyOf("badge", `[data-badge-style="chip"] ${SUBTLE}`)).toBe(
      "background-color: hsl(var(--muted)); border-color: transparent;",
    )
  })

  it("outline keeps the status frame and text and drops the fill", () => {
    expect(bodyOf("badge", `[data-badge-style="outline"] ${SUBTLE}`)).toBe(
      "background-color: transparent;",
    )
  })
})
