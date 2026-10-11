import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { stripCssComments } from "../test/strip-css-comments"

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
  return stripCssComments(readFileSync(path, "utf8"))
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
}

const THEME = "src/styles/theme.css"
const BUTTON = "src/components/button/button.css"
const TOGGLE = "src/components/toggle/toggle.css"

const SEGMENT = "src/components/segment-group/segment-group.css"

/** Every rule that applies the shared layer, as [file, selector list]. */
const LAYER_HOSTS: Array<[string, string]> = [
  ["src/components/banner/banner.css", ".dr-banner-close"],
  ["src/components/button/button.css", '.dr-btn:not([data-variant="link"])'],
  [
    "src/components/color-picker/color-picker.css",
    ".dr-color-picker-trigger, .dr-color-picker-eye-dropper-trigger",
  ],
  [
    "src/components/combobox/combobox.css",
    ".dr-combobox-clear-trigger, .dr-combobox-trigger",
  ],
  ["src/components/date-picker/date-picker.css", ".dr-date-picker-trigger"],
  [
    "src/components/editable/editable.css",
    ".dr-editable-edit-trigger, .dr-editable-submit-trigger, .dr-editable-cancel-trigger",
  ],
  [
    "src/components/file-upload/file-upload.css",
    ".dr-file-upload-item-delete-trigger",
  ],
  [
    "src/components/floating-panel/floating-panel.css",
    ".dr-floating-panel-trigger",
  ],
  ["src/components/image-editor/image-editor.css", ".dr-image-editor-preset"],
  ["src/components/json-tree-view/json-tree-view.css", ".dr-json-show-more"],
  [
    "src/components/multi-select/multi-select.css",
    ".dr-multi-select-chip-remove",
  ],
  ["src/components/number-input/number-input.css", ".dr-number-input-stepper"],
  [
    "src/components/overlay-primitives/overlay-primitives.css",
    ".dr-overlay-close-btn",
  ],
  [
    "src/components/password-input/password-input.css",
    ".dr-password-input-trigger",
  ],
  ["src/components/tabs/tabs.css", ".dr-tabs-trigger"],
  [
    "src/components/tags-input/tags-input.css",
    ".dr-tags-input-item-delete-trigger, .dr-tags-input-clear-trigger",
  ],
  ["src/components/toggle/toggle.css", ".dr-toggle"],
]

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(path)
    return entry.name.endsWith(".css") ? [path] : []
  })
}

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
  {
    path: "src/components/password-input/password-input.css",
    selector: ".dr-password-input-trigger:not(:disabled)",
  },
  {
    path: "src/components/date-picker/date-picker.css",
    selector: ".dr-date-picker-trigger:not(:disabled)",
  },
  {
    path: "src/components/combobox/combobox.css",
    selector: ".dr-combobox-clear-trigger:not(:disabled)",
  },
  {
    path: "src/components/combobox/combobox.css",
    selector: ".dr-combobox-trigger:not(:disabled)",
  },
  {
    path: "src/components/multi-select/multi-select.css",
    selector: ".dr-multi-select-chip-remove:not(:disabled)",
  },
  {
    path: "src/components/tags-input/tags-input.css",
    selector: ".dr-tags-input-item-delete-trigger:not(:disabled)",
  },
  {
    path: "src/components/tags-input/tags-input.css",
    selector: ".dr-tags-input-clear-trigger:not(:disabled)",
  },
  {
    path: "src/components/file-upload/file-upload.css",
    selector: ".dr-file-upload-item-delete-trigger:not(:disabled)",
  },
  {
    path: "src/components/editable/editable.css",
    selector: ".dr-editable-edit-trigger:not(:disabled)",
  },
  {
    path: "src/components/editable/editable.css",
    selector: ".dr-editable-submit-trigger:not(:disabled)",
  },
  {
    path: "src/components/editable/editable.css",
    selector: ".dr-editable-cancel-trigger:not(:disabled)",
  },
  {
    path: "src/components/banner/banner.css",
    selector: ".dr-banner-close:not(:disabled)",
  },
  {
    path: "src/components/color-picker/color-picker.css",
    selector: ".dr-color-picker-trigger:not(:disabled)",
  },
  {
    path: "src/components/color-picker/color-picker.css",
    selector: ".dr-color-picker-eye-dropper-trigger:not(:disabled)",
  },
  {
    path: "src/components/floating-panel/floating-panel.css",
    selector: ".dr-floating-panel-trigger:not(:disabled)",
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
    expect(flat(THEME)).toMatch(
      /@utility state-layer \{ &::before \{[^}]*background: var\(--state-layer-color, currentColor\)/,
    )
    expect(flat(THEME)).toMatch(
      /@utility state-layer \{[^}]*transition: opacity var\(--state-layer-out\)/,
    )
    expect(flat(BUTTON)).not.toMatch(/100vmax/)
  })

  it("layers the wash above the background and below the label", () => {
    expect(flat(THEME)).toMatch(
      /@utility state-layer \{ &::before \{[^}]*z-index: -1/,
    )
    expect(flat(BUTTON)).toMatch(/\.dr-btn \{[^}]*isolation: isolate/)
  })

  it("snaps on hover and press by overriding the duration", () => {
    const css = flat(BUTTON)
    expect(css).toMatch(
      /:hover::before \{ opacity: var\(--btn-hover-layer, var\(--state-layer-hover\)\); transition-duration: var\(--state-layer-in\)/,
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
      /\.dr-btn\[data-variant="default"\], \.dr-btn\[data-variant="destructive"\] \{ --btn-hover-layer: 0\.16; --state-layer-press: 0\.28/,
    )
  })

  it("never washes the link variant", () => {
    expect(flat(BUTTON)).not.toMatch(/\.dr-btn::before/)
    expect(flat(BUTTON)).toContain(
      '.dr-btn:not([data-variant="link"]) { @apply state-layer; }',
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

  it("washes the current page toward its fill's wash at the filled strengths", () => {
    expect(flat("src/components/pagination/pagination.css")).toMatch(
      /\.dr-pagination-link\[data-active="true"\]\[data-variant="ghost"\] \{[^}]*--state-layer-color: hsl\(var\(--primary-fill-wash\)\); --btn-hover-layer: 0\.16; --state-layer-press: 0\.28;/,
    )
  })

  for (const { path, selector, pseudo = "::before" } of HAND_ROLLED) {
    it(`${selector} opts into the shared layer`, () => {
      expect(flat(path)).toContain(`${selector}:hover${pseudo}`)
    })
  }
})

describe("shared state-layer utility", () => {
  it("declares the wash once, as a utility", () => {
    expect(flat(THEME)).toContain(
      '@utility state-layer { &::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--state-layer-color, currentColor); opacity: 0; pointer-events: none; transition: opacity var(--state-layer-out) var(--ease-out); } }',
    )
  })

  it.each(LAYER_HOSTS)("%s applies it to %s", (path, selectors) => {
    expect(flat(path)).toContain(`${selectors} { @apply state-layer; }`)
  })

  it("leaves no hand-copied ::before wash in component CSS", () => {
    const copies = stylesheets("src/components").filter((path) =>
      /::before \{[^}]*background: (?:var\(--state-layer-color, currentColor\)|currentColor);/.test(
        flat(path),
      ),
    )
    expect(copies).toEqual([])
  })

  // The segment item's ::before is its 24px hit area (hit-area-24), so its
  // wash stays a hand-written ::after.
  it("keeps SegmentGroup's ::after wash as the one copy", () => {
    const owners = stylesheets("src/components").filter((path) =>
      flat(path).includes("var(--state-layer-color, currentColor)"),
    )
    expect(owners).toEqual([SEGMENT])
    expect(flat(SEGMENT)).toMatch(
      /\.dr-segment-group \.dr-segment-group-item::after \{[^}]*background: var\(--state-layer-color, currentColor\)/,
    )
  })
})
