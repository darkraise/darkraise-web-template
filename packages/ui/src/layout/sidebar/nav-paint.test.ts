import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { SIDEBAR_SELECTIONS } from "../../theme/types"
import { SIGNATURES } from "../../theme/config/signatures"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// The nav selection looks read the public --nav-selection-* tokens over
// their own paints, the nav rows read --nav-item-radius, and the marker and
// label case signatures restyle the rows from the root attribute. jsdom
// computes no cascade, so the source rules are what this asserts; the
// effective values are checked in Chromium by the template's e2e suite.

const SOURCES = {
  selection: join("src", "layout", "sidebar", "sidebar-selection.css"),
  nav: join("src", "layout", "sidebar", "sidebar-nav.css"),
  stacked: join("src", "layout", "stacked-layout", "stacked-layout.css"),
  top: join("src", "layout", "top-nav-layout", "top-nav-layout.css"),
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

/** The look tokens a selection rule sets, as `name: value` pairs. */
function lookOf(look: string): Record<string, string> {
  const body = bodyOf("selection", `[data-sidebar-selection="${look}"]`)
  return Object.fromEntries(
    body
      .split(/;\s*/)
      .filter(Boolean)
      .map((d) => {
        const at = d.indexOf(":")
        return [d.slice(0, at).trim(), d.slice(at + 1).trim()]
      }),
  )
}

const LOOKS = SIDEBAR_SELECTIONS.filter((v) => v !== "auto")

describe("selection values", () => {
  it("offers ten settings, the five new looks after the four kit looks", () => {
    expect(SIDEBAR_SELECTIONS).toEqual([
      "auto",
      "chip",
      "pill",
      "tile",
      "frosted",
      "tint",
      "accent",
      "rule",
      "key",
      "tab",
    ])
    expect(SIGNATURES.navSelection.values).toEqual(LOOKS)
  })
})

describe("selection tokens", () => {
  it.each([
    ["--nav-selection-fill", "initial"],
    ["--nav-selection-edge", "initial"],
    ["--nav-selection-shadow", "initial"],
    ["--nav-selection-glow", "initial"],
    ["--nav-item-radius", "calc(var(--radius) - 2px)"],
  ])("declares %s as %s on the layered :root", (token, value) => {
    expect(bodyOf("selection", ":root", ["@layer base"])).toContain(
      `${token}: ${value};`,
    )
  })

  it.each(LOOKS)("lets the public tokens override the %s look", (look) => {
    const tokens = lookOf(look)
    expect(tokens["--sidebar-active-surface"]).toMatch(
      /^var\(--nav-selection-fill, .+\)$/,
    )
    expect(tokens["--sidebar-active-edge"]).toMatch(
      /^var\(--nav-selection-edge, .+\)$/,
    )
    expect(tokens["--sidebar-active-shadow"]).toMatch(
      /^var\(--nav-selection-shadow, .+\)$/,
    )
    expect(tokens["--sidebar-active-glow"]).toMatch(
      /^var\(--nav-selection-glow, .+\)$/,
    )
  })

  it("declares no public selection token on a nav element", () => {
    for (const file of Object.keys(SOURCES) as (keyof typeof SOURCES)[]) {
      for (const rule of rules(file)) {
        if (rule.wrappers.includes("@layer base")) continue
        expect(rule.body, `${file} ${rule.selectors.join(", ")}`).not.toMatch(
          /(?:^|; )--nav-(?:selection-[a-z]+|item-radius):/,
        )
      }
    }
  })
})

describe("the new looks", () => {
  it("tints the row and sets its label in the accent", () => {
    expect(lookOf("tint")).toEqual({
      "--sidebar-active-surface":
        "var(--nav-selection-fill, var(--sidebar-tint))",
      "--sidebar-active-edge": "var(--nav-selection-edge, transparent)",
      "--sidebar-active-shadow": "var(--nav-selection-shadow, 0 0 transparent)",
      "--sidebar-active-glow": "var(--nav-selection-glow, 0 0 transparent)",
      "--sidebar-active-backdrop": "none",
      "--sidebar-active-marker": "transparent",
      "--sidebar-active-tile": "transparent",
      "--sidebar-active-icon": "hsl(var(--primary-text))",
      "--sidebar-active-text": "hsl(var(--primary-text))",
    })
  })

  it("washes the row in the accent behind an accent edge", () => {
    expect(lookOf("accent")).toEqual({
      "--sidebar-active-surface":
        "var(--nav-selection-fill, hsl(var(--primary) / 0.12))",
      "--sidebar-active-edge":
        "var(--nav-selection-edge, hsl(var(--primary) / 0.3))",
      "--sidebar-active-shadow": "var(--nav-selection-shadow, 0 0 transparent)",
      "--sidebar-active-glow": "var(--nav-selection-glow, 0 0 transparent)",
      "--sidebar-active-backdrop": "none",
      "--sidebar-active-marker": "transparent",
      "--sidebar-active-tile": "transparent",
      "--sidebar-active-icon": "hsl(var(--primary-text))",
    })
  })

  it("marks the row with a full-height accent rule and no fill", () => {
    expect(lookOf("rule")).toEqual({
      "--sidebar-active-surface": "var(--nav-selection-fill, transparent)",
      "--sidebar-active-edge": "var(--nav-selection-edge, transparent)",
      "--sidebar-active-shadow": "var(--nav-selection-shadow, 0 0 transparent)",
      "--sidebar-active-glow": "var(--nav-selection-glow, 0 0 transparent)",
      "--sidebar-active-backdrop": "none",
      "--sidebar-active-marker": "hsl(var(--primary-text))",
      "--sidebar-active-tile": "transparent",
      "--sidebar-active-icon": "hsl(var(--primary-text))",
      "--sidebar-active-text": "hsl(var(--primary-text))",
      "--sidebar-marker-start": "0px",
      "--sidebar-marker-width": "2px",
      "--sidebar-marker-height": "100%",
      "--sidebar-marker-radius": "0px",
    })
  })

  it("raises the row on the neutral button's face", () => {
    expect(lookOf("key")).toEqual({
      "--sidebar-active-surface":
        "var(--nav-selection-fill, var(--btn-neutral-sheen), linear-gradient(var(--btn-neutral-fill), var(--btn-neutral-fill)), var(--surface-card-fill-opaque))",
      "--sidebar-active-edge":
        "var(--nav-selection-edge, var(--btn-neutral-border, var(--field-edge)))",
      "--sidebar-active-shadow":
        "var(--nav-selection-shadow, var(--btn-neutral-edge), var(--btn-neutral-shadow))",
      "--sidebar-active-glow": "var(--nav-selection-glow, 0 0 transparent)",
      "--sidebar-active-backdrop": "none",
      "--sidebar-active-marker": "transparent",
      "--sidebar-active-tile": "transparent",
      "--sidebar-active-icon": "hsl(var(--sidebar-foreground-hover))",
    })
  })

  it("lifts the row as a card tab", () => {
    expect(lookOf("tab")).toEqual({
      "--sidebar-active-surface":
        "var(--nav-selection-fill, var(--sidebar-chip-opaque))",
      "--sidebar-active-edge":
        "var(--nav-selection-edge, var(--sidebar-chip-edge))",
      "--sidebar-active-shadow":
        "var(--nav-selection-shadow, var(--sidebar-tab-shadow))",
      "--sidebar-active-glow": "var(--nav-selection-glow, 0 0 transparent)",
      "--sidebar-active-backdrop": "none",
      "--sidebar-active-marker": "transparent",
      "--sidebar-active-tile": "transparent",
      "--sidebar-active-icon": "hsl(var(--primary-text))",
    })
  })

  it("sets the current row's label from the look", () => {
    expect(
      bodyOf("selection", "[data-sidebar-selection] .dr-sidebar-nav-current"),
    ).toContain("color: var(--sidebar-active-text);")
    expect(bodyOf("selection", "[data-sidebar-selection]")).toContain(
      "--sidebar-active-text: hsl(var(--sidebar-foreground-hover));",
    )
  })
})

describe("nav marker signature", () => {
  it.each([
    ["none", "--sidebar-active-marker: transparent;"],
    ["bar", "--sidebar-active-marker: hsl(var(--primary-text));"],
  ])("%s sets the marker on every look", (value, body) => {
    expect(
      bodyOf(
        "selection",
        `[data-nav-marker="${value}"] [data-sidebar-selection]`,
      ),
    ).toBe(body)
  })

  it("rule draws a full-height accent rule on every look", () => {
    expect(
      bodyOf("selection", '[data-nav-marker="rule"] [data-sidebar-selection]'),
    ).toBe(
      "--sidebar-active-marker: hsl(var(--primary-text)); --sidebar-marker-start: 0px; --sidebar-marker-width: 2px; --sidebar-marker-height: 100%; --sidebar-marker-radius: 0px;",
    )
  })

  it("bar keeps the pill's 3px bar on a rule look", () => {
    expect(
      bodyOf(
        "selection",
        '[data-nav-marker="bar"] [data-sidebar-selection="rule"]',
      ),
    ).toBe(
      "--sidebar-marker-start: 3px; --sidebar-marker-width: 3px; --sidebar-marker-height: 16px; --sidebar-marker-radius: calc(var(--radius) - 4px);",
    )
  })

  it("draws the marker from the geometry tokens", () => {
    const marker = bodyOf("selection", ".dr-sidebar-nav-indicator::before")
    expect(marker).toContain("inset-inline-start: var(--sidebar-marker-start);")
    expect(marker).toContain("width: var(--sidebar-marker-width);")
    expect(marker).toContain("height: var(--sidebar-marker-height);")
    expect(marker).toContain(
      "margin-top: calc(var(--sidebar-marker-height) / -2);",
    )
    expect(marker).toContain("border-radius: var(--sidebar-marker-radius);")
  })
})

describe("label case on nav labels", () => {
  it.each([
    ["nav", ".dr-sidebar-nav-group-label"],
    ["stacked", ".dr-stacked-layout-aside-label"],
  ] as const)("%s sets %s as written or in lower case", (file, label) => {
    expect(bodyOf(file, `[data-label-case="none"] ${label}`)).toBe(
      "text-transform: none; letter-spacing: normal;",
    )
    expect(bodyOf(file, `[data-label-case="lower"] ${label}`)).toBe(
      "text-transform: lowercase; letter-spacing: normal;",
    )
  })
})

describe("nav item radius", () => {
  it.each([
    ["nav", ".dr-sidebar-nav-link"],
    ["nav", ".dr-sidebar-nav-popover-trigger"],
    ["nav", ".dr-sidebar-nav-collapsible-row"],
    ["nav", ".dr-sidebar-nav-chevron-button"],
    ["selection", ".dr-sidebar-nav-indicator"],
    ["stacked", ".dr-stacked-layout-rail-item"],
    ["top", ".dr-top-nav-layout-nav-item"],
  ] as const)("%s %s reads the nav item radius", (file, selector) => {
    const body = bodyOf(file, selector)
    expect(body).toContain("rounded-[var(--nav-item-radius)]")
    expect(body).not.toMatch(/\brounded-md\b/)
  })
})

describe("top nav selection", () => {
  it("paints the active item with the selection look", () => {
    expect(
      bodyOf(
        "top",
        '.dr-top-nav-layout-nav[data-sidebar-selection] .dr-top-nav-layout-nav-item:is(.active, [data-active="true"])',
      ),
    ).toBe(
      "background: var(--sidebar-active-surface); box-shadow: 0 0 0 1px var(--sidebar-active-edge), var(--sidebar-active-shadow), var(--sidebar-active-glow); -webkit-backdrop-filter: var(--sidebar-active-backdrop); backdrop-filter: var(--sidebar-active-backdrop); color: hsl(var(--foreground));",
    )
  })
})
