import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const UI_SRC = join(import.meta.dirname, "..", "..")
const TEMPLATE_SRC = join(UI_SRC, "..", "..", "..", "apps", "template", "src")

// Alpha at or above 0.5 counts as a fill, so the Tailwind and the raw-CSS
// spellings of "half-opaque or more" both have to be enumerated.
const TW_FILL_ALPHA = String.raw`(?:5\d|[6-9]\d|100)`
const CSS_FILL_ALPHA = String.raw`(?:0?\.[5-9]\d*|1(?:\.0+)?|(?:[5-9]\d|100)%)`
// A var() reading --primary, either directly or as the fallback of another
// custom property. The fallback form is how a fill can quietly opt out of the
// migration: the outer variable is only set on some variants, so the others
// silently resolve to bare --primary.
const PRIMARY_VAR = String.raw`var\(\s*(?:--primary|[\w-]+\s*,\s*var\(\s*--primary\s*\))\s*\)`
const OPAQUE_FILL = new RegExp(
  [
    String.raw`bg-primary(?:\/${TW_FILL_ALPHA}(?!\d)|(?![-/\w]))`,
    // Only a background whose whole value is one hsl() counts. Gradient stops
    // are deliberately out of scope: glass paints its checked checkbox and
    // slider range from stops at 0.55 and 0.35 that average below the
    // threshold, and the preset's identity needs that weight.
    String.raw`background(?:-color)?:\s*hsl\(\s*${PRIMARY_VAR}\s*(?:\/\s*${CSS_FILL_ALPHA}\s*)?\)`,
  ].join("|"),
)
// Stripping block comments wholesale is the only reliable way to tell a
// declaration from a sentence about one. scifi.css discusses `bg-primary` in
// prose at two points, and it indents its continuation lines rather than
// prefixing them with `*`, so every line-shape heuristic misreads that prose
// as code.
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g

function sourceFiles(): string[] {
  return [UI_SRC, TEMPLATE_SRC].flatMap((root) =>
    readdirSync(root, { recursive: true, encoding: "utf8" })
      .filter((p) => /\.(css|tsx)$/.test(p) && !p.includes(".test."))
      .map((p) => join(root, p)),
  )
}

describe("primary-fill migration", () => {
  // --primary-foreground is chosen for contrast against --primary-fill only.
  // A background painted with bare --primary would carry a label with no
  // contrast guarantee: white measures 1.98:1 on dark yellow.
  it("paints no opaque background from --primary", () => {
    const offenders = sourceFiles().filter((file) =>
      OPAQUE_FILL.test(readFileSync(file, "utf8").replace(BLOCK_COMMENT, " ")),
    )

    expect(offenders).toEqual([])
  })
})
