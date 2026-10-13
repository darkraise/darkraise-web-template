import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { AXES } from "@theme/axes/registry"
import { BUILTIN_FONTS } from "@theme/config/fonts"
import { FONTS, type Font } from "@theme/types"
import { stripCssComments } from "../test/strip-css-comments"

const css = stripCssComments(readFileSync("src/styles/theme.css", "utf8"))

const SANS = "ui-sans-serif, system-ui, -apple-system, sans-serif"
const SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
const STACKS: Record<Font, string> = {
  inter: `"Inter Variable", ${SANS}`,
  geist: `"Geist Variable", ${SANS}`,
  "ibm-plex-sans": `"IBM Plex Sans Variable", ${SANS}`,
  "hanken-grotesk": `"Hanken Grotesk Variable", ${SANS}`,
  newsreader: `"Newsreader Variable", ${SERIF}`,
}

/** Body of the first `<selector> {` block at or after `from`, braces balanced. */
function body(selector: string, from = 0): string {
  const start = css.indexOf(`${selector} {`, from)
  if (start === -1) throw new Error(`no ${selector} block`)
  const open = css.indexOf("{", start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i)
  }
  throw new Error(`unclosed ${selector} block`)
}

function declaration(block: string, name: string): string | undefined {
  return block
    .match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1]
    ?.replace(/\s+/g, " ")
    .trim()
}

describe("font axis tokens", () => {
  it("paints the default face on :root before any font is chosen", () => {
    const root = body(":root", css.indexOf("@layer base {"))
    expect(declaration(root, "--font-family-sans")).toBe(
      STACKS[AXES.font.default as Font],
    )
  })

  it("gives headings the sans face before a heading font is chosen", () => {
    const root = body(":root", css.indexOf("@layer base {"))
    expect(declaration(root, "--font-family-heading")).toBe(
      "var(--font-family-sans)",
    )
  })

  it.each(AXES.font.values.filter((font) => font !== AXES.font.default))(
    "switches --font-family-sans under data-font=%s",
    (font) => {
      expect(
        declaration(body(`[data-font="${font}"]`), "--font-family-sans"),
      ).toBe(STACKS[font as Font])
    },
  )

  it.each(FONTS)(
    "switches --font-family-heading under data-heading-font=%s",
    (font) => {
      expect(
        declaration(
          body(`[data-heading-font="${font}"]`),
          "--font-family-heading",
        ),
      ).toBe(STACKS[font])
    },
  )

  it("declares no block for the body heading font", () => {
    expect(css).not.toContain('[data-heading-font="body"]')
  })

  it("names each face as the font registry does", () => {
    for (const font of FONTS) {
      expect(BUILTIN_FONTS[font].family).toBe(STACKS[font])
    }
  })

  it("declares no block for the default face", () => {
    expect(css).not.toContain(`[data-font="${AXES.font.default}"]`)
  })

  it("routes the sans, heading and mono utilities through the face tokens", () => {
    const theme = body("@theme inline")
    expect(declaration(theme, "--font-sans")).toBe("var(--font-family-sans)")
    expect(declaration(theme, "--font-heading")).toBe(
      "var(--font-family-heading)",
    )
    expect(declaration(theme, "--font-mono")).toBe(
      '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
    )
  })
})
