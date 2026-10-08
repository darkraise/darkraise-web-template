import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { splitToken } from "./interactive-classes"

// Physical left/right styling does not mirror under dir="rtl". Every such use
// in the kit is either logical or listed in ALLOWED with the reason it stays
// physical. Paths are relative to packages/ui, where Vitest runs.

const PHYSICAL_PROPERTY =
  /^(?:left|right|margin-(?:left|right)|padding-(?:left|right)|border-(?:left|right)(?:-[a-z-]+)?|border-(?:top|bottom)-(?:left|right)-radius)$/
const PHYSICAL_VALUE_PROPERTY = /^(?:float|text-align)$/
const PHYSICAL_UTILITY = [
  /^-?[mp][lr]-/,
  /^-?(?:left|right)-/,
  /^border-[lr](?:-|$)/,
  /^rounded-(?:l|r|tl|tr|bl|br)(?:-|$)/,
  /^text-(?:left|right)$/,
  /^origin-(?:(?:top|bottom)-)?(?:left|right)$/,
  /^-?translate-x-/,
  /^(?:float|clear)-(?:left|right)$/,
  /^(?:bg|object)-(?:left|right)(?:-|$)/,
  /^(?:bg|object)-(?:top|bottom)-(?:left|right)$/,
  /^scroll-[mp][lr]-/,
]
const PHYSICAL_STYLE_KEY =
  /^(?:left|right|marginLeft|marginRight|paddingLeft|paddingRight|borderLeft\w*|borderRight\w*)$/

const FLOATING = "floating-ui places popups at viewport x coordinates"
const CENTRED = "centring: left 50% with a -50% translate is symmetric"
const SIDE_VARIANT =
  "a physical side value; its logical values resolve to it or have their own rule"

/** Deliberately physical uses: the file, why, and each exact snippet. */
const ALLOWED: readonly (readonly [string, string, readonly string[]])[] = [
  [
    "src/components/angle-slider/angle-slider.css",
    "AngleSlider is left physical; its pointer is centred",
    [
      ".dr-angle-slider-pointer { left-1/2 }",
      ".dr-angle-slider-pointer { -translate-x-1/2 }",
    ],
  ],
  [
    "src/components/background-page/background-page.css",
    "the glow follows the pointer's physical x",
    [
      ".dr-bg-mesh-cursor { left: calc(var(--dr-bg-mx) * 100%) }",
      ".dr-bg-spotlight-glow { left: calc(var(--dr-bg-mx) * 100%) }",
    ],
  ],
  [
    "src/components/badge/badge.css",
    SIDE_VARIANT,
    [
      '.dr-badge-anchor-indicator[data-position="top-right"], .dr-badge-anchor-dot[data-position="top-right"] { right: 0 }',
      '.dr-badge-anchor-indicator[data-position="top-left"], .dr-badge-anchor-dot[data-position="top-left"] { left: 0 }',
      '.dr-badge-anchor-indicator[data-position="bottom-right"], .dr-badge-anchor-dot[data-position="bottom-right"] { right: 0 }',
      '.dr-badge-anchor-indicator[data-position="bottom-left"], .dr-badge-anchor-dot[data-position="bottom-left"] { left: 0 }',
    ],
  ],
  [
    "src/components/carousel/carousel.css",
    CENTRED,
    [
      '.dr-carousel-previous[data-orientation="vertical"] { left-1/2 }',
      '.dr-carousel-previous[data-orientation="vertical"] { -translate-x-1/2 }',
      '.dr-carousel-next[data-orientation="vertical"] { left-1/2 }',
      '.dr-carousel-next[data-orientation="vertical"] { -translate-x-1/2 }',
    ],
  ],
  [
    "src/components/color-picker/ColorPicker.tsx",
    "the colour area and hue strip are left physical",
    ["left: `${hsv.s}%`", "left: `${(hsv.h / 360) * 100}%`"],
  ],
  [
    "src/components/combobox/Combobox.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)"],
  ],
  [
    "src/components/context-menu/ContextMenu.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)"],
  ],
  [
    "src/components/contribution-graph/ContributionGraph.tsx",
    "the tooltip sits at the hovered cell's measured physical centre",
    ["left: hovered.left"],
  ],
  [
    "src/components/dialog/dialog.css",
    CENTRED,
    [
      ".dr-dialog-content { left-[50%] }",
      ".dr-dialog-content { translate-x-[-50%] }",
    ],
  ],
  [
    "src/components/drawer/drawer.css",
    "data-direction always carries the resolved physical side",
    [
      '.dr-drawer-content[data-direction="left"] { left-0 }',
      '.dr-drawer-content[data-direction="left"] { rounded-r-[var(--overlay-radius)] }',
      '.dr-drawer-content[data-direction="right"] { right-0 }',
      '.dr-drawer-content[data-direction="right"] { rounded-l-[var(--overlay-radius)] }',
    ],
  ],
  [
    "src/components/dropdown-menu/DropdownMenu.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)"],
  ],
  [
    "src/components/floating-panel/floating-panel.css",
    "FloatingPanel is left physical; its resize edges are compass sides",
    [
      '.dr-floating-panel-edge[data-edge="e"] { right-0 }',
      '.dr-floating-panel-edge[data-edge="w"] { left-0 }',
      '.dr-floating-panel-edge[data-edge="nw"] { left-0 }',
      '.dr-floating-panel-edge[data-edge="ne"] { right-0 }',
      '.dr-floating-panel-edge[data-edge="sw"] { left-0 }',
      '.dr-floating-panel-edge[data-edge="se"] { right-0 }',
    ],
  ],
  [
    "src/components/hover-card/HoverCard.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)"],
  ],
  [
    "src/components/image-cropper/ImageCropper.tsx",
    "ImageCropper is left physical; the crop box is in image pixels",
    ["left: api.crop.x"],
  ],
  [
    "src/components/image-cropper/image-cropper.css",
    "ImageCropper is left physical: handles, thirds grid and centred readout",
    [
      '.dr-image-cropper-handle[data-position="top-left"] { left: 0 }',
      '.dr-image-cropper-handle[data-position="top"] { left: 50% }',
      '.dr-image-cropper-handle[data-position="top-right"] { right: 0 }',
      '.dr-image-cropper-handle[data-position="right"] { right: 0 }',
      '.dr-image-cropper-handle[data-position="bottom-right"] { right: 0 }',
      '.dr-image-cropper-handle[data-position="bottom"] { left: 50% }',
      '.dr-image-cropper-handle[data-position="bottom-left"] { left: 0 }',
      '.dr-image-cropper-handle[data-position="left"] { left: 0 }',
      '.dr-image-cropper-grid[data-axis="horizontal"]::before, .dr-image-cropper-grid[data-axis="horizontal"]::after { left: 0 }',
      '.dr-image-cropper-grid[data-axis="horizontal"]::before, .dr-image-cropper-grid[data-axis="horizontal"]::after { right: 0 }',
      '.dr-image-cropper-grid[data-axis="vertical"]::before { left: 33.3333% }',
      '.dr-image-cropper-grid[data-axis="vertical"]::after { left: 66.6666% }',
      ".dr-image-cropper-dimensions { left-1/2 }",
      ".dr-image-cropper-dimensions { -translate-x-1/2 }",
    ],
  ],
  [
    "src/components/image-editor/ImageEditor.tsx",
    "the text draft sits at the pointer's position on the canvas",
    ["left: textDraft.point.x"],
  ],
  [
    "src/components/menubar/Menubar.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)"],
  ],
  [
    "src/components/navigation-menu/NavigationMenu.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)"],
  ],
  [
    "src/components/navigation-menu/navigation-menu.css",
    "the arrow is a rotated square; its rounded corner is the tip",
    [".dr-navigation-menu-indicator-arrow { rounded-tl-sm }"],
  ],
  [
    "src/components/popover/Popover.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)", "left: arrowData?.x"],
  ],
  [
    "src/components/resizable/resizable.css",
    "the handle hairline is centred, and reset when the group is vertical",
    [
      ".dr-resizable-handle { after:left-1/2 }",
      ".dr-resizable-handle { after:-translate-x-1/2 }",
      ".dr-resizable-handle { data-[panel-group-direction=vertical]:after:left-0 }",
      ".dr-resizable-handle { data-[panel-group-direction=vertical]:after:translate-x-0 }",
    ],
  ],
  [
    "src/components/select/Select.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)"],
  ],
  [
    "src/components/select/select.css",
    "data-side always carries the resolved physical side",
    [
      '.dr-select-content[data-position="popper"] { data-[side=left]:-translate-x-1 }',
      '.dr-select-content[data-position="popper"] { data-[side=right]:translate-x-1 }',
    ],
  ],
  [
    "src/components/sheet/sheet.css",
    `${SIDE_VARIANT}; the auto pair resets the dialog's centring`,
    [
      ".dr-dialog-content.dr-sheet-content { left: auto }",
      ".dr-dialog-content.dr-sheet-content { right: auto }",
      '.dr-sheet-content[data-side="left"] { left-0 }',
      '.dr-sheet-content[data-side="right"] { right-0 }',
      '.dr-sheet-content[data-side="left"] { padding-left: max(1.5rem, env(safe-area-inset-left)) }',
      '.dr-sheet-content[data-side="right"] { padding-right: max(1.5rem, env(safe-area-inset-right)) }',
    ],
  ],
  [
    "src/components/sonner/sonner.css",
    "data-position always carries the resolved physical corner; centre is centred",
    [
      '.dr-toaster[data-position="top-left"] { left-4 }',
      '.dr-toaster[data-position="top-right"] { right-4 }',
      '.dr-toaster[data-position="top-center"] { left-1/2 }',
      '.dr-toaster[data-position="top-center"] { -translate-x-1/2 }',
      '.dr-toaster[data-position="bottom-left"] { left-4 }',
      '.dr-toaster[data-position="bottom-right"] { right-4 }',
      '.dr-toaster[data-position="bottom-center"] { left-1/2 }',
      '.dr-toaster[data-position="bottom-center"] { -translate-x-1/2 }',
    ],
  ],
  [
    "src/components/tabs/tabs.css",
    "the indicator is pinned at the left and moved by a measured translate",
    [".dr-tabs-indicator { left-0 }"],
  ],
  [
    "src/components/tooltip/Tooltip.tsx",
    FLOATING,
    ["left: Math.round(floating.x ?? 0)", "left: arrowData?.x"],
  ],
  [
    "src/components/virtualized-dropdown-menu/VirtualizedDropdownMenu.tsx",
    "a full-width virtual row: left 0 with width 100% is symmetric",
    ["left: 0"],
  ],
  [
    "src/layout/sidebar/sidebar-selection.css",
    "the indicator is pinned at the left and moved by a measured transform",
    [".dr-sidebar-nav-indicator { left: 0 }"],
  ],
  [
    "src/styles/theme.css",
    "the hit area is centred; the content strip's left and right pair is symmetric",
    [
      "@utility hit-area-24 &::before { left: 50% }",
      "main[data-content]::before { left: 0 }",
      "main[data-content]::before { right: 0 }",
    ],
  ],
]

function sourcesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory())
      return path === "src/test" ? [] : sourcesUnder(path)
    const skip =
      entry.name.includes(".test.") ||
      entry.name.includes(".stories.") ||
      entry.name.endsWith(".d.ts")
    return /\.(?:css|tsx?)$/.test(entry.name) && !skip ? [path] : []
  })
}

function isPhysicalUtility(token: string): boolean {
  const utility = splitToken(token).utility.replace(/^!|!$/g, "")
  return PHYSICAL_UTILITY.some((pattern) => pattern.test(utility))
}

function declarationFindings(where: string, declaration: string): string[] {
  const apply = /^@apply (.+)$/.exec(declaration)
  if (apply) {
    return (apply[1] as string)
      .split(" ")
      .filter(isPhysicalUtility)
      .map((token) => `${where} { ${token} }`)
  }
  const colon = declaration.indexOf(":")
  if (colon < 0) return []
  const property = declaration.slice(0, colon).trim()
  const value = declaration.slice(colon + 1).trim()
  const physical =
    PHYSICAL_PROPERTY.test(property) ||
    (PHYSICAL_VALUE_PROPERTY.test(property) && /^(?:left|right)\b/.test(value))
  return physical ? [`${where} { ${property}: ${value} }`] : []
}

/**
 * Physical declarations and @apply utilities, read through nested blocks.
 * Wrappers such as @layer and @media are left out of the label.
 */
function cssFindings(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const found: string[] = []
  const blocks: string[] = []
  let pending = ""
  const where = () =>
    blocks.filter((block) => !/^@(?!utility)/.test(block)).join(" ")
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string
    if (ch === '"' || ch === "'") {
      const close = text.indexOf(ch, i + 1)
      pending += text.slice(i, close + 1)
      i = close
    } else if (ch === "{") {
      blocks.push(pending.replace(/\s+/g, " ").trim())
      pending = ""
    } else if (ch === ";" || ch === "}") {
      const declaration = pending.replace(/\s+/g, " ").trim()
      if (declaration) found.push(...declarationFindings(where(), declaration))
      pending = ""
      if (ch === "}") blocks.pop()
    } else {
      pending += ch
    }
  }
  return found
}

/**
 * Comments go first: the literal reader pairs quote characters, so an
 * apostrophe in a comment would shift every pair after it. A line comment
 * starts at a line start or after whitespace, which leaves "https://" alone.
 */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/.*$/gm, "$1")
}

/** Physical utilities among the whitespace-split tokens of string literals. */
function literalFindings(source: string): string[] {
  return [...withoutComments(source).matchAll(/["'`]([^"'`]*)["'`]/g)]
    .flatMap((match) => (match[1] as string).split(/\s+/))
    .filter((token) => token !== "" && isPhysicalUtility(token))
}

/** The text between a bracket at `open` and its partner. */
function bracketed(code: string, open: number): string {
  let depth = 0
  for (let i = open; i < code.length; i++) {
    const ch = code[i] as string
    if ("([{".includes(ch)) depth++
    else if (")]}".includes(ch) && --depth === 0) return code.slice(open + 1, i)
  }
  return code.slice(open + 1)
}

/** Physical keys of the object literals anywhere inside an expression. */
function nestedObjectFindings(code: string): string[] {
  const found: string[] = []
  for (let i = 0; i < code.length; i++) {
    const ch = code[i] as string
    if (!"([{".includes(ch)) continue
    const inner = bracketed(code, i)
    found.push(
      ...(ch === "{" ? objectKeyFindings(inner) : nestedObjectFindings(inner)),
    )
    i += inner.length + 1
  }
  return found
}

/** Physical keys of an object literal's body, nested objects included. */
function objectKeyFindings(body: string): string[] {
  const found: string[] = []
  let start = 0
  for (let i = 0; i <= body.length; i++) {
    const ch = body[i]
    if (ch === "(" || ch === "[" || ch === "{") {
      const inner = bracketed(body, i)
      found.push(
        ...(ch === "{"
          ? objectKeyFindings(inner)
          : nestedObjectFindings(inner)),
      )
      i += inner.length + 1
    } else if (ch === "," || ch === undefined) {
      const entry = body.slice(start, i).replace(/\s+/g, " ").trim()
      const key = /^["']?([\w-]+)["']?\s*(?::|$)/.exec(entry)?.[1]
      if (key && PHYSICAL_STYLE_KEY.test(key)) found.push(entry)
      start = i + 1
    }
  }
  return found
}

/** Physical keys of the object literals written as style={{ ... }}. */
function styleKeyFindings(source: string): string[] {
  const code = withoutComments(source)
  return [...code.matchAll(/\bstyle=\{(?=\{)/g)].flatMap((match) =>
    objectKeyFindings(
      bracketed(code, (match.index as number) + match[0].length),
    ),
  )
}

function findingsOf(path: string): string[] {
  const text = readFileSync(path, "utf8")
  if (path.endsWith(".css")) return cssFindings(text)
  const found = literalFindings(text)
  return path.endsWith(".tsx") ? [...found, ...styleKeyFindings(text)] : found
}

const FILES = sourcesUnder("src")
const FINDINGS = FILES.flatMap((path) =>
  findingsOf(path).map((snippet) => `${path} | ${snippet}`),
)
const ALLOWED_KEYS = new Set(
  ALLOWED.flatMap(([file, , snippets]) =>
    snippets.map((snippet) => `${file} | ${snippet}`),
  ),
)

describe("the logical CSS readers", () => {
  it("flag physical declarations and @apply utilities, nested ones too", () => {
    expect(
      cssFindings(`
        @layer components {
          .a { margin-left: 0; inset-inline-start: 0; border-top-right-radius: 2px }
          .b { float: right; text-align: left; text-align: start }
          .c { @apply ps-2 data-[side=left]:pl-2 -translate-x-1/2 border-e; }
          .d { background: url("data:a;b"); &::after { right: 0 } padding-right: 1px }
        }
      `),
    ).toEqual([
      ".a { margin-left: 0 }",
      ".a { border-top-right-radius: 2px }",
      ".b { float: right }",
      ".b { text-align: left }",
      ".c { data-[side=left]:pl-2 }",
      ".c { -translate-x-1/2 }",
      ".d &::after { right: 0 }",
      ".d { padding-right: 1px }",
    ])
  })

  it("flag float, clear, origin corner, background and scroll utilities", () => {
    expect(
      cssFindings(`
        @layer components {
          .e { @apply float-left clear-right origin-top-left bg-right-top scroll-pl-2 float-start origin-top; }
        }
      `),
    ).toEqual([
      ".e { float-left }",
      ".e { clear-right }",
      ".e { origin-top-left }",
      ".e { bg-right-top }",
      ".e { scroll-pl-2 }",
    ])
  })

  it("flag background and object corners named vertical side first", () => {
    expect(
      cssFindings(`
        @layer components {
          .f { @apply bg-top-left bg-bottom-right object-top-left bg-top object-bottom; }
        }
      `),
    ).toEqual([
      ".f { bg-top-left }",
      ".f { bg-bottom-right }",
      ".f { object-top-left }",
    ])
  })

  it("read string literals as whitespace-split tokens, skipping comments", () => {
    expect(
      literalFindings(`
        // the user's choice, "ml-2" in prose
        /* it's "pr-4" here too */
        const a = cn("ms-2 hover:mr-1", 'text-right', \`origin-left\`)
        const url = "https://example.com" // isn't "left-0"
        const b = "rounded-tl-md right-0 border-l !pl-2"
      `),
    ).toEqual([
      "hover:mr-1",
      "text-right",
      "origin-left",
      "rounded-tl-md",
      "right-0",
      "border-l",
      "!pl-2",
    ])
  })

  it("read style object keys, not member access", () => {
    expect(
      styleKeyFindings(`
        <div style={{ left: rect.left, top: 0, insetInlineStart: x }} />
        <div style={{ ...rest, paddingRight, "borderLeftWidth": 1 }} />
        <div style={{ width: f({ x: 1 }), ...(on ? { right: 0 } : {}) }} />
      `),
    ).toEqual([
      "left: rect.left",
      "paddingRight",
      '"borderLeftWidth": 1',
      "right: 0",
    ])
  })
})

describe("logical CSS", () => {
  it("scans the kit's stylesheets and sources", () => {
    expect(
      FILES.filter((path) => path.endsWith(".css")).length,
    ).toBeGreaterThan(100)
    expect(
      FILES.filter((path) => path.endsWith(".tsx")).length,
    ).toBeGreaterThan(100)
  })

  it("uses no physical left or right outside the allowlist", () => {
    expect(FINDINGS.filter((finding) => !ALLOWED_KEYS.has(finding))).toEqual([])
  })

  it("allows only uses that still exist", () => {
    const found = new Set(FINDINGS)
    expect([...ALLOWED_KEYS].filter((key) => !found.has(key))).toEqual([])
  })
})
