import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, it, expect } from "vitest"
import { SHELL_STYLES } from "./types"

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
    // The spec pins this: a shell's separation from the page belongs to the
    // shell style, not to the page's elevation setting.
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

const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, "")

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
      "--chrome-rail-bg: hsl(var(--muted)); --chrome-bar-bg: hsl(var(--muted)); --chrome-canvas: none;",
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
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "")
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
      "border-right: 1px solid var(--chrome-edge);",
    )
    expect(shellBodies(`.dr-shell > :is(${RAILS})::before`)).toBe(
      "background: var(--chrome-rail-bg);",
    )
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

const shellPresets = readFileSync(
  resolve(process.cwd(), "src/layout/shell/shell-presets.css"),
  "utf8",
)
const sidebarLayout = readFileSync(
  resolve(process.cwd(), "src/layout/sidebar/sidebar-layout.css"),
  "utf8",
)
const layoutHeader = readFileSync(
  resolve(process.cwd(), "src/layout/layout-header/layout-header.css"),
  "utf8",
)

describe("preset chrome", () => {
  it("paints glass chrome on every chrome region", () => {
    for (const region of ["nav", "subnav", "bar", "panel"]) {
      expect(shellPresets).toContain(`[data-region="${region}"]`)
    }
  })

  it("gives a detached glass region its fog edge back", () => {
    // The generic shell-style rule is (0,3,0) and would otherwise replace
    // the fog border and the specular with a neutral one.
    expect(shellPresets).toMatch(/island[\s\S]*?border-color: var\(--fog-20\)/)
  })

  it("keeps the seam edge on the welded styles", () => {
    expect(shellPresets).toContain("border-right: 1px solid var(--fog-20)")
    expect(shellPresets).toContain("border-bottom: 1px solid var(--fog-20)")
  })

  it("no longer duplicates chrome paint in the layout files", () => {
    // Chrome is a region concern now; a layout-class rule would sit at
    // (0,2,0) and lose to the shell-style rules.
    expect(sidebarLayout).not.toContain('[data-style="glass"]')
    expect(layoutHeader).not.toContain('[data-style="glass"]')
  })
})
