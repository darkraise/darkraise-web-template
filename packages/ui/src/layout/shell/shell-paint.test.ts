import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PAINT_TOKENS } from "../../theme/config/tokens"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// The shell reads its look from style tokens declared once on the layered
// :root, and the bar span and bar edge signatures restyle it from the root
// attribute. jsdom computes no cascade, so the source rules are what this
// asserts; the effective values are checked in Chromium by the template's
// e2e suite.

const SOURCES = {
  shell: join("src", "layout", "shell", "shell.css"),
  styles: join("src", "layout", "shell", "shell-styles.css"),
  header: join("src", "layout", "layout-header", "layout-header.css"),
  sidebar: join("src", "layout", "sidebar", "sidebar-layout.css"),
  theme: join("src", "styles", "theme.css"),
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

/** Every body `file` gives `selector` inside exactly `wrappers`, joined. */
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

const MD = "@media (width >= 48rem)"
const FORCED =
  "@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)"
const RAIL_TONED =
  ':root:not([data-rail-tone="inverse"], [data-rail-tone="accent"])'
const BAR_TONED =
  ':root:not([data-bar-tone="inverse"], [data-bar-tone="accent"], [data-bar-edge="veil"])'
const DETACHED =
  ':is([data-shell-style="island"], [data-shell-style="floating"], [data-shell-style="inset"])'
const INSET_BAR_TONED =
  ':root:not([data-bar-tone="inverse"], [data-bar-tone="accent"])'
const VEIL_BAR =
  '[data-bar-edge="veil"] .dr-shell:where(:not([data-shell-style="island"], [data-shell-style="inset"])) > [data-region="bar"]'

describe("shell token defaults", () => {
  it.each([
    ["--chrome-flat-fill", "var(--shell-flat-chrome, hsl(var(--muted)))"],
    ["--chrome-bar-height", "3.5rem"],
    ["--shell-shadow", "initial"],
    ["--shell-content-fill", "initial"],
    ["--shell-content-edge", "initial"],
    ["--shell-content-shadow", "initial"],
    ["--shell-ground-fill", "initial"],
    ["--shell-frame-edge", "hsl(var(--border))"],
  ])("declares %s as %s on the layered :root", (token, value) => {
    expect(bodyOf("shell", ":root", ["@layer base"])).toContain(
      `${token}: ${value};`,
    )
  })
})

describe("shell token readers", () => {
  it("paints the ground from the ground fill", () => {
    expect(bodyOf("shell", ".dr-shell")).toContain(
      "background: var(--shell-ground-fill, hsl(var(--shell-ground)));",
    )
  })

  it("paints a detached content pane from the content tokens", () => {
    expect(
      bodyOf("styles", `.dr-shell${DETACHED} > [data-region="content"]`),
    ).toBe(
      "background: var(--shell-content-fill, hsl(var(--background) / var(--surface-fill-alpha))); border-color: var(--shell-content-edge, var(--chrome-edge)); box-shadow: var(--card-edge), var(--shell-content-shadow, var(--shell-region-shadow));",
    )
  })

  it("keeps a floating content plane clear unless a style fills it", () => {
    expect(
      bodyOf(
        "styles",
        '.dr-shell[data-shell-style="floating"] > [data-region="content"]',
      ),
    ).toBe(
      "grid-area: 1 / 1 / -1 / -1; background: var(--shell-content-fill, transparent);",
    )
  })

  it("recesses the ground under the island and inset panes", () => {
    expect(
      bodyOf(
        "styles",
        '.dr-shell:is([data-shell-style="island"], [data-shell-style="inset"])',
      ),
    ).toBe(
      "background: var(--shell-ground-fill, color-mix(in oklab, hsl(var(--shell-ground)) 95%, hsl(var(--foreground))));",
    )
  })

  it("rounds detached regions by the shell radius plus the card's offset", () => {
    expect(
      bodyOf("styles", '.dr-shell[data-shell-style="island"] > [data-region]'),
    ).toBe(
      "border: 1px solid var(--chrome-edge); border-radius: calc(var(--shell-radius) + var(--card-radius) - var(--radius)); box-shadow: var(--card-edge), var(--shell-region-shadow);",
    )
  })

  it("edges detached chrome like a card under its separation shadow", () => {
    expect(
      bodyOf(
        "styles",
        '.dr-shell:is([data-shell-style="island"], [data-shell-style="floating"]) > :is([data-region="nav"], [data-region="subnav"], [data-region="panel"], [data-region="bar"])',
      ),
    ).toBe(
      "box-shadow: var(--chrome-shadow), var(--card-edge), var(--shell-region-shadow);",
    )
  })

  it("rings the framed shell in the frame edge", () => {
    expect(bodyOf("styles", '.dr-shell[data-shell-style="framed"]')).toContain(
      "box-shadow: 0 0 0 1px var(--shell-frame-edge), var(--shell-region-shadow);",
    )
  })

  it("feeds every region shadow from the shell shadow", () => {
    const theme = rules("theme")
    for (const selector of [
      '[data-shell-style="island"]',
      '[data-shell-style="floating"]',
      '[data-shell-style="framed"]',
    ]) {
      const body = theme
        .filter((rule) => rule.selectors.includes(selector))
        .map((rule) => rule.body)
        .join(" ")
      expect(body, selector).toMatch(
        /--shell-region-shadow: var\(--shell-shadow, /,
      )
    }
    expect(bodyOf("theme", ":root", ["@layer base"])).toContain(
      "--shell-region-shadow: var(--shell-shadow, 0 0 transparent);",
    )
  })

  it("sizes the bar and the rail header from the bar height", () => {
    expect(bodyOf("header", ".dr-layout-header")).toContain(
      "height: var(--chrome-bar-height);",
    )
    expect(bodyOf("header", ".dr-layout-header")).not.toMatch(/\bh-14\b/)
    expect(bodyOf("sidebar", ".dr-sidebar-layout-aside-header")).toContain(
      "height: var(--chrome-bar-height);",
    )
    expect(readFileSync(SOURCES.styles, "utf8")).not.toContain("3.5rem")
  })
})

describe("chrome that gives up or tones its surface", () => {
  const RAILS =
    ':is([data-region="nav"], [data-region="subnav"], [data-region="panel"])'
  const CHROME =
    ':is([data-region="nav"], [data-region="subnav"], [data-region="panel"], [data-region="bar"])'

  it.each(["flat", "inset"])(
    "drops the %s chrome canvas on the region itself",
    (shell) => {
      expect(
        bodyOf("styles", `.dr-shell[data-shell-style="${shell}"] > ${CHROME}`),
      ).toContain("background: none;")
    },
  )

  it("fills flat chrome from the flat fill unless its region is toned", () => {
    expect(
      bodyOf(
        "styles",
        `${RAIL_TONED} .dr-shell[data-shell-style="flat"] > ${RAILS}::before`,
      ),
    ).toBe("background: var(--chrome-flat-fill);")
    expect(
      bodyOf(
        "styles",
        `${BAR_TONED} .dr-shell[data-shell-style="flat"] > [data-region="bar"]::before`,
      ),
    ).toBe("background: var(--chrome-flat-fill);")
  })

  it("clears inset chrome unless its region is toned", () => {
    expect(
      bodyOf(
        "styles",
        `${RAIL_TONED} .dr-shell[data-shell-style="inset"] > ${RAILS}::before`,
      ),
    ).toBe("background: none;")
    expect(
      bodyOf(
        "styles",
        `${INSET_BAR_TONED} .dr-shell[data-shell-style="inset"] > [data-region="bar"]::before`,
      ),
    ).toBe("background: none;")
  })

  it("keeps a toned rail and bar filled over a gradient canvas", () => {
    const base = ["@layer base"]
    expect(
      bodyOf(
        "theme",
        '[data-background-style="gradient"]:not([data-rail-tone="inverse"], [data-rail-tone="accent"])',
        base,
      ),
    ).toBe("--chrome-rail-bg: transparent;")
    expect(
      bodyOf(
        "theme",
        '[data-background-style="gradient"]:not([data-bar-tone="inverse"], [data-bar-tone="accent"])',
        base,
      ),
    ).toBe("--chrome-bar-bg: transparent;")
  })

  it("rebinds no style token on a shell element", () => {
    const names = Object.values(PAINT_TOKENS)
    for (const file of ["shell", "styles"] as const) {
      for (const rule of rules(file)) {
        if (rule.wrappers.includes("@layer base")) continue
        for (const name of names) {
          expect(rule.body, `${file} ${rule.selectors.join(", ")}`).not.toMatch(
            new RegExp(`(?:^|; )${name}:`),
          )
        }
      }
    }
  })
})

describe("bar span signature", () => {
  it("runs the bar across the rails from md up", () => {
    expect(
      bodyOf(
        "shell",
        '[data-bar-span="full"] .dr-shell[data-structure="sidebar"]',
        ["@layer components", MD],
      ),
    ).toBe('grid-template-areas: "bar bar" "nav content";')
    expect(
      bodyOf(
        "shell",
        '[data-bar-span="full"] .dr-shell[data-structure="stacked"]',
        ["@layer components", MD],
      ),
    ).toBe('grid-template-areas: "bar bar bar" "nav subnav content";')
  })
})

describe("bar edge signature", () => {
  const BAR = ':is(.dr-shell > [data-region="bar"], .dr-layout-header)'

  it("drops the rule under the bar", () => {
    expect(bodyOf("shell", `[data-bar-edge="none"] ${BAR}`)).toBe(
      "border-bottom-color: transparent;",
    )
  })

  it("runs the content up under a veiled bar", () => {
    const content =
      '[data-bar-edge="veil"] .dr-shell:not([data-shell-style="floating"], [data-shell-style="island"], [data-shell-style="inset"]) > [data-region="content"]'
    expect(bodyOf("shell", content)).toBe(
      "grid-row-start: 1; padding-block-start: calc(var(--chrome-bar-height) + var(--spacing) * 6);",
    )
  })

  it("veils the bar with two masked blur layers over a fading tint", () => {
    expect(bodyOf("shell", VEIL_BAR)).toBe(
      "border-bottom-color: transparent; background: none; -webkit-backdrop-filter: none; backdrop-filter: none;",
    )
    const layers = bodyOf("shell", `${VEIL_BAR}::before`)
    expect(layers).toContain("inset: 0 0 -1.625rem 0;")
    expect(layers).toContain(
      "background: linear-gradient(hsl(var(--surface-header) / 0.85), hsl(var(--surface-header) / 0.55) 55%, hsl(var(--surface-header) / 0));",
    )
    expect(layers).toContain("backdrop-filter: blur(4px);")
    expect(bodyOf("shell", `${VEIL_BAR}::after`)).toContain(
      "backdrop-filter: blur(14px);",
    )
  })

  it("falls back to an opaque ruled bar without transparency", () => {
    expect(
      bodyOf("shell", `${VEIL_BAR}::before`, ["@layer components", FORCED]),
    ).toBe(
      "inset: 0; background: var(--chrome-bar-bg); -webkit-backdrop-filter: none; backdrop-filter: none; -webkit-mask-image: none; mask-image: none;",
    )
    expect(
      bodyOf("shell", `${VEIL_BAR}::after`, ["@layer components", FORCED]),
    ).toBe("content: none;")
    expect(bodyOf("shell", VEIL_BAR, ["@layer components", FORCED])).toBe(
      "border-bottom-color: var(--chrome-edge);",
    )
  })
})
