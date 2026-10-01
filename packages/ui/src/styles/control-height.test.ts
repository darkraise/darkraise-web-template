import { describe, it, expect } from "vitest"
import { globSync, readFileSync } from "node:fs"

// jsdom never lays anything out, so the height contract is asserted on the
// stylesheet text. Controls take a fixed border-box height from their family
// token instead of padding around a line box: padding-derived heights were
// why an outline button stood 2px taller than a filled one and an input 6px
// taller than the button beside it.

const THEME = "src/styles/theme.css"

/** Comments stripped, whitespace collapsed, and no padding inside parens, so
 *  a prettier-wrapped `max(\n  a,\n  b\n)` reads as `max(a, b)`. */
function flat(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
}

function densityBlock(step: string): string {
  const match = flat(THEME).match(
    new RegExp(`\\[data-density="${step}"\\] \\{([^}]*)\\}`),
  )
  if (!match?.[1]) throw new Error(`no [data-density="${step}"] block`)
  return match[1]
}

/** Source files, tests excluded, whose text matches `pattern`. */
function readersOf(pattern: RegExp): string[] {
  return globSync("src/**/*.{css,ts,tsx}")
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => !/\.test\.tsx?$/.test(file))
    .filter((file) => pattern.test(readFileSync(file, "utf8")))
}

describe("button family tokens", () => {
  it("defaults on :root to the control height and the button radius", () => {
    const css = flat(THEME)
    expect(css).toContain("--btn-height: var(--control-height);")
    expect(css).toMatch(/--btn-radius: var\(--radius-[a-z]+\);/)
  })

  it.each([
    [":root", "0.75rem", "0.375rem"],
    ["compact", "0.5rem", "0.25rem"],
    ["comfortable", "1rem", "0.5rem"],
    ["spacious", "1.25rem", "0.625rem"],
  ])("%s sets --btn-px %s and --btn-px-tight %s", (step, px, tight) => {
    const block = step === ":root" ? flat(THEME) : densityBlock(step)
    expect(block).toContain(`--btn-px: ${px};`)
    expect(block).toContain(`--btn-px-tight: ${tight};`)
  })

  it("leaves no reader of --density-button-px or --density-button-py", () => {
    expect(readersOf(/--density-button-p[xy](?![\w-])/)).toEqual([])
  })
})
