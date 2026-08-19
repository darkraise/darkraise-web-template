import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// jsdom never parses CSS, so the rules themselves are what this asserts.
//
// The state layer is a Material-style translucent wash of `currentColor` over
// a clickable surface: 8% on hover, 16% while pressed. It is painted as a
// flood inset shadow rather than a pseudo-element (which would collide with
// the preset bracket decorations) or a transform (which would make every
// button a containing block for `position: fixed`). Because the layer reads
// `currentColor`, one pair of tokens covers every variant and both modes: it
// lightens a filled button whose text is white and darkens a ghost button
// whose text is dark.
function flat(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
}

function bodyOf(path: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = flat(path).match(
    new RegExp(`[{}]\\s*${escaped}\\s*\\{([^{}]*)\\}`),
  )
  if (!match?.[1]) throw new Error(`Rule not found in ${path}: ${selector}`)
  return match[1].trim()
}

const THEME = "src/styles/theme.css"
const BUTTON = "src/components/button/button.css"
const TOGGLE = "src/components/toggle/toggle.css"

// Clickable affordances that do not render a real <Button> and so have to opt
// into the layer themselves. Everything else inherits it from `.dr-btn`.
const HAND_ROLLED: { path: string; selector: string }[] = [
  {
    path: "src/components/number-input/number-input.css",
    selector: ".dr-number-input-stepper",
  },
  {
    path: "src/components/json-tree-view/json-tree-view.css",
    selector: ".dr-json-show-more",
  },
  {
    path: "src/components/image-editor/image-editor.css",
    selector: ".dr-image-editor-preset",
  },
  {
    path: "src/components/image-editor/image-editor.css",
    selector: ".dr-image-editor-history-trigger",
  },
  {
    path: "src/components/image-editor/image-editor.css",
    selector: ".dr-image-editor-extension",
  },
]

describe("interaction state layer", () => {
  it("publishes the hover and press layers as theme tokens", () => {
    const css = flat(THEME)
    expect(css).toMatch(
      /--state-layer-hover: color-mix\(in srgb, currentColor 8%, transparent\)/,
    )
    expect(css).toMatch(
      /--state-layer-press: color-mix\(in srgb, currentColor 16%, transparent\)/,
    )
  })

  it("gives the button a transparent layer at rest, composed into its shadow", () => {
    const base = bodyOf(BUTTON, ".dr-btn")
    expect(base).toMatch(/--state-layer: transparent/)
    expect(base).toMatch(
      /box-shadow:[^;]*inset 0 0 0 100vmax var\(--state-layer\)/,
    )
  })

  it("raises the layer on hover and deepens it while pressed", () => {
    expect(bodyOf(BUTTON, '.dr-btn:not([data-variant="link"]):hover')).toMatch(
      /--state-layer: var\(--state-layer-hover\)/,
    )
    expect(bodyOf(BUTTON, '.dr-btn:not([data-variant="link"]):active')).toMatch(
      /--state-layer: var\(--state-layer-press\)/,
    )
  })

  it("drops the per-variant hover colour maths the layer replaces", () => {
    // `color-mix(... 90%, black)` darkened only the two filled variants and
    // did nothing for ghost/outline/secondary, which each grew their own
    // hover rule instead. The layer covers all five uniformly.
    expect(flat(BUTTON)).not.toMatch(/color-mix\(in srgb, var\(--hue\) 90%/)
  })

  it("never washes the link variant", () => {
    // `link` renders as inline underlined text with no surface, so a
    // full-bleed rectangular wash behind it reads as a stray highlight. It is
    // also the one variant the Glass preset does not re-skin, so without this
    // exclusion Glass buttons would wash on link and nowhere else.
    const css = flat(BUTTON)
    expect(css).toMatch(
      /\.dr-btn:not\(\[data-variant="link"\]\):hover \{ --state-layer: var\(--state-layer-hover\)/,
    )
    expect(css).toMatch(
      /\.dr-btn:not\(\[data-variant="link"\]\):active \{ --state-layer: var\(--state-layer-press\)/,
    )
  })

  it("gives toggles the press layer but not the hover layer", () => {
    // A hover wash competes with `data-state=on`, which is itself a fill —
    // a hovered-but-off toggle would read as selected.
    const css = flat(TOGGLE)
    expect(css).toMatch(/--state-layer: var\(--state-layer-press\)/)
    expect(css).not.toMatch(/--state-layer: var\(--state-layer-hover\)/)
  })

  for (const { path, selector } of HAND_ROLLED) {
    it(`${selector} opts into the shared layer`, () => {
      expect(bodyOf(path, selector)).toMatch(
        /box-shadow:[^;]*inset 0 0 0 100vmax var\(--state-layer\)/,
      )
    })
  }
})
