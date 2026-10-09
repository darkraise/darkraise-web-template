import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, it, expect } from "vitest"
import { SHELL_STYLES } from "./types"
import { stripCssComments } from "../test/strip-css-comments"

// vitest runs with the package root as cwd; import.meta.url is not a file URL
// under this config.
const css = readFileSync(resolve(process.cwd(), "src/styles/theme.css"), "utf8")

const SHELL_TOKENS = [
  "--shell-gap",
  "--shell-pad",
  "--shell-radius",
  "--shell-region-shadow",
  "--shell-ground",
]

// Everything before the first per-style block. A token whose only definition
// sits inside a [data-shell-style] block resolves to nothing under `classic`.
const beforeStyleBlocks = css.slice(0, css.indexOf('[data-shell-style="'))

describe("shell tokens", () => {
  it.each(SHELL_TOKENS)("declares %s outside the style blocks", (token) => {
    expect(beforeStyleBlocks).toContain(`${token}:`)
  })

  it.each(SHELL_STYLES.filter((style) => style !== "classic"))(
    "binds a block for %s",
    (style) => {
      expect(css).toContain(`[data-shell-style="${style}"]`)
    },
  )

  it("gives classic no block of its own, since it is the default", () => {
    expect(css).not.toContain('[data-shell-style="classic"]')
  })

  it("does not round shell regions into lozenges under the pill radius", () => {
    const scaleOf = (selector: string) => {
      const block = css.slice(css.indexOf(selector))
      return /--shell-radius-scale:\s*([^;]+);/.exec(block)?.[1]?.trim()
    }
    expect(scaleOf('[data-radius="pill"] {')).toBe(
      scaleOf('[data-radius="rounded"] {'),
    )
  })

  it("keeps the region shadow off the elevation axis", () => {
    // A shell's separation from the page belongs to the shell style, not to
    // the page's elevation setting.
    const styleBlocks = css.slice(css.indexOf('[data-shell-style="'))
    expect(styleBlocks).not.toMatch(
      /--shell-region-shadow:[^;]*var\(--elevation-/,
    )
  })
})

/** The contents of the first block `opener` opens, braces balanced. */
function block(source: string, opener: RegExp): string {
  const match = opener.exec(source)
  if (!match) throw new Error(`no block for ${String(opener)}`)
  const start = match.index + match[0].length
  let depth = 1
  let end = start
  while (depth > 0 && end < source.length) {
    if (source[end] === "{") depth++
    else if (source[end] === "}") depth--
    end++
  }
  return source.slice(start, end - 1).replace(/\s+/g, " ")
}

const uncommented = stripCssComments(css)

const CHROME_TOKENS: Array<[string, string]> = [
  ["--chrome-rail-bg", "hsl(var(--surface-sidebar))"],
  ["--chrome-bar-bg", "hsl(var(--surface-header))"],
  ["--chrome-edge", "hsl(var(--sidebar-border))"],
  ["--chrome-shadow", "0 0 transparent"],
  ["--chrome-backdrop", "none"],
  ["--chrome-canvas", "none"],
]

describe("chrome tokens", () => {
  const baseLayer = block(uncommented, /@layer base \{/)
  const baseRoot = block(uncommented, /@layer base \{\s*:root \{/)

  it.each(CHROME_TOKENS)(
    "declares %s as %s on the base :root",
    (name, value) => {
      expect(baseRoot).toContain(`${name}: ${value};`)
    },
  )

  // A gradient canvas shows through unfrosted chrome: the rails and the bar
  // give up their fill, and the seam takes a neutral derived from the engine
  // rather than a fixed hue.
  it("clears the chrome fill under a gradient background", () => {
    const gradient = block(baseLayer, /\[data-background-style="gradient"\] \{/)
    expect(gradient.trim()).toBe(
      "--chrome-rail-bg: transparent; --chrome-bar-bg: transparent; --chrome-edge: hsl(var(--neutral-7) / 0.6);",
    )
  })

  it("retires the region border token", () => {
    expect(uncommented).not.toContain("--shell-region-border")
  })
})

const shellStyles = readFileSync(
  resolve(process.cwd(), "src/layout/shell/shell-styles.css"),
  "utf8",
)

describe("shell style rules", () => {
  it("never reaches for !important", () => {
    expect(shellStyles).not.toMatch(/!important/)
  })

  it("targets the shell root, not the document element", () => {
    // A document-level selector would lose to a pinned shellStyle prop.
    expect(shellStyles).not.toMatch(
      /\[data-shell-style="[a-z]+"\]\s+\.dr-shell/,
    )
  })

  it("styles regions by role rather than by layout class", () => {
    expect(shellStyles).not.toMatch(/\.dr-sidebar-layout|\.dr-stacked-layout/)
    expect(shellStyles).toContain('[data-region="nav"]')
  })

  it("gives classic no rules, since it is the unstyled base", () => {
    expect(shellStyles).not.toContain('data-shell-style="classic"')
  })

  it("covers every non-default style", () => {
    for (const style of SHELL_STYLES.filter((s) => s !== "classic")) {
      expect(shellStyles).toContain(`data-shell-style="${style}"`)
    }
  })

  it("frosts floating chrome with the chrome backdrop", () => {
    expect(shellStyles).not.toMatch(/--backdrop-(?:filter|blur)/)
    expect(shellStyles).toMatch(
      /-webkit-backdrop-filter:\s*var\(--chrome-backdrop\);\s*backdrop-filter:\s*var\(--chrome-backdrop\);/,
    )
  })

  it("edges detached regions with the chrome edge", () => {
    expect(shellStyles).toContain("border: 1px solid var(--chrome-edge);")
  })

  // The detached rule is (0,3,0) and replaces the region rule's box-shadow,
  // so detached chrome restates its own layer under the separation shadow.
  it("keeps the chrome shadow on detached chrome", () => {
    expect(shellStyles).toContain(
      "box-shadow: var(--chrome-shadow), var(--shell-region-shadow);",
    )
  })

  // The fill sits on a region's ::before, so a shell style that clears or
  // tones the chrome rebinds the fill tokens; a background-color on the
  // region would land under the fill and never show.
  it("clears and tones chrome by rebinding the chrome tokens", () => {
    const inset = rulesOf(shellStyles).find(
      (r) =>
        r.selector.includes(
          '[data-shell-style="inset"] > [data-region="nav"]',
        ) && r.body.includes("--chrome-rail-bg"),
    )
    expect(inset?.body).toBe(
      "--chrome-rail-bg: transparent; --chrome-bar-bg: transparent; --chrome-canvas: none;",
    )
    const flat = rulesOf(shellStyles).find(
      (r) =>
        r.selector.includes(
          '[data-shell-style="flat"] > [data-region="nav"]',
        ) && r.body.includes("--chrome-rail-bg"),
    )
    expect(flat?.body).toBe(
      "--chrome-rail-bg: var(--shell-flat-chrome, hsl(var(--muted))); --chrome-bar-bg: var(--shell-flat-chrome, hsl(var(--muted))); --chrome-canvas: none;",
    )
    const painted = rulesOf(shellStyles).filter((r) =>
      /background(?:-color|-image)?\s*:/.test(r.body),
    )
    for (const rule of painted) {
      expect(rule.selector, "only the handle is painted directly").toMatch(
        /^(?:\.dr-shell\[data-shell-style="[a-z]+"\] > \[data-region="handle"\](?:, )?)+$/,
      )
    }
  })

  // Dark flat keeps --muted through the fallback above, so the tone is
  // declared for light mode only.
  it("declares the flat chrome tone for light mode only", () => {
    const declared = rulesOf(css).filter((r) =>
      r.body.includes("--shell-flat-chrome:"),
    )
    expect(declared.map((r) => r.selector)).toEqual([
      ':root:not([data-mode="dark"])',
    ])
    expect(declared[0]?.body).toBe(
      "--shell-flat-chrome: hsl(from hsl(var(--background)) h s calc(l - 8.25));",
    )
  })

  // An unsupported relative colour is invalid at computed-value time, which
  // skips the --muted fallback and paints the chrome transparent.
  it("guards the flat chrome tone behind relative colour support", () => {
    expect(css).toMatch(
      /@supports \(color: hsl\(from red h s calc\(l - 1\)\)\) \{\s*:root:not\(\[data-mode="dark"\]\) \{\s*--shell-flat-chrome:/,
    )
  })
})

const shell = readFileSync(
  resolve(process.cwd(), "src/layout/shell/shell.css"),
  "utf8",
)

interface Rule {
  selector: string
  body: string
}

/** Innermost rules, whitespace collapsed; @layer and @media are transparent. */
function rulesOf(source: string): Rule[] {
  const text = stripCssComments(source)
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    // Prettier wraps long :is() lists, leaving spaces inside the parens.
    selector: (m[1] as string)
      .replace(/\s+/g, " ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .trim(),
    body: (m[2] as string).replace(/\s+/g, " ").trim(),
  }))
}

/** Every body shell.css gives `selector`, joined. */
function shellBodies(selector: string): string {
  const bodies = rulesOf(shell)
    .filter((rule) => rule.selector === selector)
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector} in shell.css`)
  return bodies.join(" ")
}

const RAILS =
  '[data-region="nav"], [data-region="subnav"], [data-region="panel"]'
const CHROME = `${RAILS}, [data-region="bar"]`

describe("region chrome", () => {
  // Chrome belongs to the region, so one rule paints every layout's chrome
  // and a style changes it through the tokens alone. The region's own
  // background is the canvas; its ::before lays the fill over it, so a fill
  // can be a colour or any background list and the canvas stays underneath.
  it("frames every chrome region and paints the canvas as its background", () => {
    const body = shellBodies(`.dr-shell > :is(${CHROME})`)
    expect(body).toContain("position: relative;")
    expect(body).toContain("isolation: isolate;")
    expect(body).toContain("background: var(--chrome-canvas);")
    expect(body).toContain("box-shadow: var(--chrome-shadow);")
    expect(body).toContain(
      "-webkit-backdrop-filter: var(--chrome-backdrop); backdrop-filter: var(--chrome-backdrop);",
    )
    expect(body).not.toMatch(/background-color\s*:/)
  })

  it("lays the fill layer between the canvas and the content", () => {
    const body = shellBodies(`.dr-shell > :is(${CHROME})::before`)
    expect(body).toContain('content: "";')
    expect(body).toContain("position: absolute;")
    expect(body).toContain("inset: 0;")
    expect(body).toContain("z-index: -1;")
    expect(body).toContain("border-radius: inherit;")
  })

  it("fills the rails and edges them on the content side", () => {
    expect(shellBodies(`.dr-shell > :is(${RAILS})`)).toContain(
      "border-inline-end: 1px solid var(--chrome-edge);",
    )
    expect(shellBodies(`.dr-shell > :is(${RAILS})::before`)).toBe(
      "background: var(--chrome-rail-bg);",
    )
  })

  // The panel is its own scrollport, so an absolute fill would scroll away
  // and leave the canvas bare below the first screen.
  it("keeps the panel's fill on its scrollport", () => {
    const body = shellBodies('.dr-shell > [data-region="panel"]::before')
    expect(body).toContain("position: sticky;")
    expect(body).toContain("top: 0;")
    expect(body).toContain("height: 100%;")
  })

  // A region's inline overlays must stack above the content region (itself
  // an isolated stacking context) or the content paints over them. The bar
  // sits one higher because split-panel puts the panel after it in the DOM,
  // and an equal z-index would let the panel cover the bar's open menus.
  it("stacks the rails above the content", () => {
    expect(shellBodies(`.dr-shell > :is(${RAILS})`)).toContain("z-index: 1;")
  })

  it("stacks the bar above the rails", () => {
    expect(shellBodies('.dr-shell > [data-region="bar"]')).toContain(
      "z-index: 2;",
    )
  })

  // Shell-style rules sit at (0,3,0), so a z-index there would flatten the
  // order above for that style.
  it("leaves the region stacking order to shell.css", () => {
    expect(shellStyles).not.toMatch(/z-index\s*:/)
  })

  it("fills the bar and edges it on the content side", () => {
    expect(shellBodies('.dr-shell > [data-region="bar"]')).toContain(
      "border-bottom: 1px solid var(--chrome-edge);",
    )
    expect(shellBodies('.dr-shell > [data-region="bar"]::before')).toBe(
      "background: var(--chrome-bar-bg);",
    )
  })

  it("draws the seams inside chrome in the chrome edge", () => {
    expect(shellBodies(`.dr-shell > :is(${CHROME}) [data-seam]`)).toBe(
      "border-color: var(--chrome-edge);",
    )
  })

  it("leaves the content and the handle unpainted", () => {
    for (const rule of rulesOf(shell).filter((r) =>
      /\[data-region="(?:content|handle)"\]/.test(r.selector),
    )) {
      expect(rule.body).not.toMatch(/background|border|box-shadow/)
    }
  })
})

/** A layout stylesheet with its comments dropped. */
function layoutCss(path: string): string {
  return stripCssComments(
    readFileSync(resolve(process.cwd(), "src/layout", path), "utf8"),
  )
}

const LAYOUT_SHEETS = [
  "sidebar/sidebar-layout.css",
  "layout-header/layout-header.css",
  "stacked-layout/stacked-layout.css",
  "split-panel-layout/split-panel-layout.css",
]

describe("layouts leave chrome to the region", () => {
  it.each(LAYOUT_SHEETS)("%s paints no surface or edge colour", (path) => {
    const source = layoutCss(path)
    expect(source).not.toMatch(
      /(?<![\w-])bg-(?:surface-sidebar|surface-header|background|card)(?![\w-])/,
    )
    expect(source).not.toMatch(/(?<![\w-])border-border(?:-default)?(?![\w-])/)
    expect(source).not.toContain("--sidebar-border")
  })

  it.each([
    ["sidebar/sidebar-layout.css", ".dr-sidebar-layout-aside"],
    ["stacked-layout/stacked-layout.css", ".dr-stacked-layout-rail"],
    ["stacked-layout/stacked-layout.css", ".dr-stacked-layout-aside"],
    [
      "split-panel-layout/split-panel-layout.css",
      ".dr-split-panel-layout-aside",
    ],
  ])("%s %s draws no region edge of its own", (path, selector) => {
    const rule = rulesOf(layoutCss(path)).find((r) => r.selector === selector)
    expect(rule, `no rule ${selector} in ${path}`).toBeDefined()
    expect(rule?.body).not.toMatch(
      /(?<![\w-])border-[rb](?![\w-])|border-(?:right|bottom)\s*:/,
    )
  })

  // A LayoutHeader also renders outside a shell, so it keeps its own fill
  // and bottom edge, read from the tokens the region rule paints; inside a
  // shell both rules set the same element's one border, so nothing doubles.
  it("lets a standalone header paint itself from the chrome tokens", () => {
    const rule = rulesOf(layoutCss("layout-header/layout-header.css")).find(
      (r) => r.selector === ".dr-layout-header",
    )
    expect(rule, "no rule .dr-layout-header").toBeDefined()
    expect(rule?.body).toMatch(/(?<![\w-])border-b(?![\w-])/)
    expect(rule?.body).toContain("background: var(--chrome-bar-bg);")
    expect(rule?.body).toContain("border-color: var(--chrome-edge);")
  })

  it("drops the per-layout gradient overlay classes", () => {
    const sidebarLayout = readFileSync(
      resolve(process.cwd(), "src/layout/sidebar/SidebarLayout.tsx"),
      "utf8",
    )
    expect(sidebarLayout).not.toMatch(/gradient-overlay|bg-surface-/)
    expect(uncommented).not.toMatch(/\.(?:sidebar|header)-gradient-overlay/)
  })

  it("retires the preset chrome sheet", () => {
    expect(
      existsSync(resolve(process.cwd(), "src/layout/shell/shell-presets.css")),
    ).toBe(false)
    expect(css).not.toContain("shell-presets.css")
  })

  // The drawer is an overlay over page content, so it keeps its overlay
  // fill; only its seams follow the chrome.
  it("draws the mobile drawer's seams in the chrome edge", () => {
    const drawer = layoutCss("mobile-drawer/mobile-drawer.css")
    expect(drawer).toContain("border-color: var(--chrome-edge);")
    expect(drawer).not.toContain("--sidebar-border")
    expect(drawer).not.toContain("--chrome-rail-bg")
    expect(drawer).not.toMatch(/(?<![\w-])(?:bg-|background(?:-color)?\s*:)/)
  })
})
