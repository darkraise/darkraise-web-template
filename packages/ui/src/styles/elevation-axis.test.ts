import { describe, expect, it } from "vitest"
import { globSync, readFileSync } from "node:fs"
import { stripCssComments } from "../test/strip-css-comments"

function withoutComments(source: string): string {
  return stripCssComments(source)
}

const sheets = globSync("src/**/*.css", { cwd: process.cwd() }).map((file) => ({
  file: file.replace(/\\/g, "/"),
  css: withoutComments(readFileSync(file, "utf8")),
}))
const themeCss =
  sheets.find(({ file }) => file === "src/styles/theme.css")?.css ?? ""

describe("elevation axis CSS", () => {
  // `\[data-elevation=` needs the bracket right before the name, so Card's
  // own `[data-card-elevation="medium"]` levels never match.
  it("has no selector for the removed low and medium levels", () => {
    expect(sheets.length).toBeGreaterThan(0)
    const offenders = sheets
      .filter(({ css }) => /\[data-elevation="(?:low|medium)"\]/.test(css))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it("keeps the root ramps under standard", () => {
    const body = themeCss.match(
      /(?:^|\n)\[data-elevation="standard"\]\s*\{([^}]*)\}/,
    )?.[1]
    expect(body?.replace(/\s+/g, " ").trim()).toBe(
      "--elevation-current: var(--elevation-medium); --elevation-current-lift-tint: var(--elevation-lift-tint-medium);",
    )
  })

  it("gives flat and high their own ramp in both modes", () => {
    for (const level of ["flat", "high"]) {
      expect(themeCss).toMatch(
        new RegExp(`(?:^|\\n)\\[data-elevation="${level}"\\]\\s*\\{`),
      )
      expect(themeCss).toMatch(
        new RegExp(
          `\\[data-mode="dark"\\]\\[data-elevation="${level}"\\]\\s*\\{`,
        ),
      )
    }
  })
})

describe("button shadow", () => {
  it("has no button elevation selector", () => {
    const offenders = sheets
      .filter(({ css }) => /\[data-button-elevation\b/.test(css))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })
})

describe("card elevation", () => {
  // A card is content, and content looks the same under every style; the
  // glow axes, not a style, add a halo.
  it("composes no glass halo into a card elevation token", () => {
    const offenders = sheets
      .filter(({ css }) =>
        /--card-elevation-[a-z]+:[^;]*--glass-halo/.test(css),
      )
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })
})
