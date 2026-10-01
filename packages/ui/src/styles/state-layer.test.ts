import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// jsdom never parses CSS, so the rules themselves are what this asserts.
//
// The state layer is a translucent wash of `currentColor` over a clickable
// surface, painted by a pseudo-element whose `opacity` carries the state.
//
// It started as a flood inset shadow, because the Terminal preset occupied the
// button pseudo-elements. Terminal is gone, and the shadow had two costs the
// pseudo-element does not: it rode the shared 150ms box-shadow transition, so
// the wash ramped instead of appearing, and animating a 100vmax shadow
// re-rasterised the whole button every frame. Opacity is composited, so the
// wash can apply instantly.
//
// Timing is deliberately asymmetric: instant in, short fade out.
function flat(path: string): string {
  // Prettier wraps long selectors inside :not( … ); undo that too.
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
}

const THEME = "src/styles/theme.css"
const BUTTON = "src/components/button/button.css"
const TOGGLE = "src/components/toggle/toggle.css"

// Clickable affordances that do not render a real <Button> and so have to opt
// into the layer themselves. Everything else inherits it from `.dr-btn`.
// `selector` is the text in front of `:hover::before` (or `pseudo`), guards
// included.
const HAND_ROLLED: { path: string; selector: string; pseudo?: string }[] = [
  {
    path: "src/components/number-input/number-input.css",
    selector: ".dr-number-input-stepper:not(:disabled)",
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
  {
    path: "src/components/tabs/tabs.css",
    selector: '.dr-tabs-trigger:not([data-state="active"]):not(:disabled)',
  },
  {
    // ::after, because the item's radio-group rule gives ::before to its
    // 24px hit area.
    path: "src/components/segment-group/segment-group.css",
    selector:
      '.dr-segment-group .dr-segment-group-item:not([data-state="checked"]):not(:disabled)',
    pseudo: "::after",
  },
  {
    path: "src/components/overlay-primitives/overlay-primitives.css",
    selector: ".dr-overlay-close-btn:not(:disabled)",
  },
]

describe("interaction state layer", () => {
  it("publishes strength as a number so variants can raise it", () => {
    expect(flat(THEME)).toMatch(/--state-layer-hover: 0\.08/)
    expect(flat(THEME)).toMatch(/--state-layer-press: 0\.16/)
  })

  it("applies instantly and fades out", () => {
    // The reported bug: an 8% wash ramping over the shared 150ms box-shadow
    // transition read as "nothing happened" for most of a quick hover, and
    // wobbled when a click interrupted it mid-ramp.
    expect(flat(THEME)).toMatch(/--state-layer-in: 0ms/)
    expect(flat(THEME)).toMatch(/--state-layer-out: 120ms/)
  })

  it("paints the wash with a pseudo-element, not a flood shadow", () => {
    const css = flat(BUTTON)
    expect(css).toMatch(
      /\.dr-btn:not\(\[data-variant="link"\]\)::before \{[^}]*background: var\(--state-layer-color, currentColor\)/,
    )
    expect(css).toMatch(/transition: opacity var\(--state-layer-out\)/)
    expect(css).not.toMatch(/100vmax/)
  })

  it("layers the wash above the background and below the label", () => {
    expect(flat(BUTTON)).toMatch(
      /\.dr-btn:not\(\[data-variant="link"\]\)::before \{[^}]*z-index: -1/,
    )
    expect(flat(BUTTON)).toMatch(/\.dr-btn \{[^}]*isolation: isolate/)
  })

  it("snaps on hover and press by overriding the duration", () => {
    const css = flat(BUTTON)
    expect(css).toMatch(
      /:hover::before \{ opacity: var\(--state-layer-hover\); transition-duration: var\(--state-layer-in\)/,
    )
    expect(css).toMatch(
      /:active::before \{ opacity: var\(--state-layer-press\); transition-duration: var\(--state-layer-in\)/,
    )
  })

  it("raises the strength on the filled variants", () => {
    // A saturated mid-tone washed 8% is a much smaller perceptual step than the
    // same wash on a neutral surface, so default and destructive were hard to
    // read at the shared value.
    expect(flat(BUTTON)).toMatch(
      /\.dr-btn\[data-variant="default"\], \.dr-btn\[data-variant="destructive"\] \{ --state-layer-hover: 0\.16; --state-layer-press: 0\.28/,
    )
  })

  it("never washes the link variant", () => {
    expect(flat(BUTTON)).not.toMatch(/\.dr-btn::before/)
    expect(flat(BUTTON)).toMatch(
      /\.dr-btn:not\(\[data-variant="link"\]\)::before/,
    )
  })

  it("gives toggles the hover and press layers, off while disabled", () => {
    const css = flat(TOGGLE)
    expect(css).toMatch(
      /\.dr-toggle:not\(:disabled\):hover::before \{ opacity: var\(--state-layer-hover\)/,
    )
    expect(css).toMatch(
      /\.dr-toggle:not\(:disabled\):active::before \{ opacity: var\(--state-layer-press\)/,
    )
  })

  for (const { path, selector, pseudo = "::before" } of HAND_ROLLED) {
    it(`${selector} opts into the shared layer`, () => {
      expect(flat(path)).toContain(`${selector}:hover${pseudo}`)
    })
  }
})
