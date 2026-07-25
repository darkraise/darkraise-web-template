import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, relative, resolve } from "node:path"

const thisDir = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(thisDir, "..")
const themeCss = readFileSync(resolve(thisDir, "theme.css"), "utf8")

function collectSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collectSources(full, out)
    } else if (entry.endsWith(".css") || entry.endsWith(".tsx")) {
      out.push(full)
    }
  }
  return out
}

describe("icon size token", () => {
  it("declares the full --icon-size ladder from --icon-scale", () => {
    expect(themeCss).toMatch(
      /--icon-size-2xs:\s*calc\(\s*0\.625rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
    expect(themeCss).toMatch(
      /--icon-size-xs:\s*calc\(\s*0\.75rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
    expect(themeCss).toMatch(
      /--icon-size-sm:\s*calc\(\s*0\.875rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
    expect(themeCss).toMatch(
      /--icon-size:\s*calc\(\s*1rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
    expect(themeCss).toMatch(
      /--icon-size-lg:\s*calc\(\s*1\.25rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
    expect(themeCss).toMatch(
      /--icon-size-xl:\s*calc\(\s*1\.5rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
    expect(themeCss).toMatch(
      /--icon-size-2xl:\s*calc\(\s*2\.5rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
    expect(themeCss).toMatch(
      /--icon-size-3xl:\s*calc\(\s*4rem\s*\*\s*var\(--icon-scale\)\s*\)/,
    )
  })

  it("declares a neutral --icon-scale default on :root", () => {
    expect(themeCss).toMatch(/--icon-scale:\s*1;/)
  })

  // WARNING — this guard is narrow. This codebase has been found sizing an
  // SVG glyph in SIX distinct ways, discovered one at a time across five
  // rounds of this task because each prior sweep pattern-matched instead of
  // enumerating. Do not add a seventh without widening this comment.
  //
  //   1. Bracket-selector Tailwind arbitrary variants: `[&_svg]:size-N`,
  //      `[&_svg]:h-N`/`w-N`, `[&>svg]:size-N`, `[&>svg]:h-N`/`w-N`.
  //      COVERED by the regex below — this is the only one it can see.
  //   2. A literal `size-N`/`h-N w-N` className set directly on a JSX icon
  //      element (e.g. `<Check className="h-4 w-4" />`). NOT covered — a
  //      regex over raw text can't tell an icon component from a `<div>`,
  //      so banning this pattern outright would false-positive on
  //      structural boxes, avatars, and decorative squares.
  //   3. A plain `svg { ... }` or `> svg { ... }` CSS rule sized via
  //      `@apply h-N w-N`, with no `&_`/`&>` bracket wrapper (e.g.
  //      `.dr-accordion-trigger > svg`). NOT covered — same reason as #2,
  //      one level up: the selector text alone doesn't distinguish an
  //      icon-bearing rule from any other child-combinator rule.
  //   4. A named CSS class applied directly to the icon's own `className`
  //      (e.g. `<User className="dr-user-menu-item-icon" />`, with
  //      `.dr-user-menu-item-icon { h-4 w-4 }` declared elsewhere, or a
  //      `Record<Size, string>` map like Checkbox's `checkIconSize` or
  //      RadioGroup's `radioIndicatorSizeClass`). NOT covered — the class
  //      name carries no marker that ties it to an icon; finding these
  //      requires reading every `h-N w-N`/`size-N` CSS declaration and
  //      tracing its className back to a JSX usage.
  //   5. A raw `<svg>` element with literal `width`/`height` HTML
  //      attributes and no CSS class at all (e.g. `TreeView.tsx`'s
  //      `DefaultChevron`, `width="14" height="14"`). NOT covered — no
  //      Tailwind utility is involved, so no CSS-oriented regex helps.
  //   6. NO size specified anywhere, so the glyph falls back to the icon
  //      library's own default (lucide-react ships `width="24" height="24"`
  //      on every icon). `InputOTPSeparator`'s `<Dot />` sat like this.
  //      NOT covered, and — this is the important part — it is
  //      *undiscoverable by any search for literals*, because there is no
  //      literal anywhere in this repository to find. Mechanisms #1–#5 are
  //      all defined by the presence of a number in our own source; this
  //      one is defined by its absence. The only way to find it is to
  //      enumerate the glyphs (every `lucide-react` import, every raw
  //      `<svg>`) and ask what sizes each one, rather than enumerating the
  //      numbers and asking what they size.
  //
  // A green run here proves only that mechanism #1 is clean. It says
  // nothing about #2–#6. See the Task 3 report for the full manual audit,
  // including which sites in each mechanism were converted to a token and
  // which were pinned as literals because a fixed-size control box (not
  // the font-size axis) bounds the glyph.
  //
  // One trap worth knowing before you write a sweep of your own: a regex
  // that matches JSX tags cannot see a tag nested inside an attribute
  // value. In `icon={<TriangleAlert className="h-16 w-16" />}` the attribute
  // matcher for `<ErrorLayout ...>` stops at the first `>`, which belongs
  // to the *inner* tag, so the inner tag is swallowed and never reported.
  // Four error-page glyphs hid behind exactly this for three rounds. Scan
  // backwards from the className, or work lexically over all literals.
  it("no source sizes an SVG with a literal bracket-selector utility", () => {
    const bannedPattern = /(_svg]|>svg]):(size|h|w)-\d/

    const offenders = collectSources(srcDir)
      .filter((file) => bannedPattern.test(readFileSync(file, "utf8")))
      .map((file) => relative(srcDir, file))
    expect(offenders).toEqual([])
  })
})
