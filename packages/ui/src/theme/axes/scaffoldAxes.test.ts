import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { scaffoldAxes } from "./scaffoldAxes"
import { AXIS_KEYS } from "./registry"

describe("scaffold axes.json", () => {
  it("matches the registry; run `pnpm --filter darkraise-ui write:scaffold-axes` after changing it", () => {
    const committed = readFileSync("../../create-app/bin/axes.json", "utf8")
    expect(committed).toBe(`${JSON.stringify(scaffoldAxes(), null, 2)}\n`)
  })

  it("lists all 19 accents and the 12 neutral surfaces", () => {
    const axes = scaffoldAxes()
    expect(axes.accentColor?.values).toHaveLength(19)
    expect(axes.accentColor?.values).toContain("coral")
    expect(axes.accentColor?.values.at(-1)).toBe("neutral")
    expect(axes.surfaceColor?.values).toHaveLength(12)
    expect(axes.surfaceColor?.values).toContain("zinc")
  })
})

// The script writes files when run, so its text is what gets checked.
describe("scripts/init.mjs", () => {
  const script = readFileSync("../../scripts/init.mjs", "utf8")

  function keysOf(block: RegExp): string[] {
    const body = script.match(block)?.[1]
    if (body === undefined) throw new Error(`no match for ${block}`)
    return [...body.matchAll(/^\s*(\w+):/gm)].map((m) => m[1] as string)
  }

  it("defaults every registry axis and nothing else", () => {
    expect(keysOf(/^\s{4}defaults: \{([^}]*)\}/m).sort()).toEqual(
      [...AXIS_KEYS].sort(),
    )
  })

  it("lists every registry axis in the switcher and nothing else", () => {
    expect(
      keysOf(/^\s{6}axes: \{([^}]*)\}/m)
        .filter((key) => key !== "presetAxes")
        .sort(),
    ).toEqual([...AXIS_KEYS].sort())
  })

  it("writes exactly the registry axes into theme.config.ts", () => {
    const written = (prefix: string) =>
      [
        ...script.matchAll(
          new RegExp(`\\$\\{config\\.theme\\.${prefix}\\.(\\w+)\\}`, "g"),
        ),
      ]
        .map((m) => m[1] as string)
        .filter((key) => key !== "presetAxes" && key !== "enabled")
        .sort()
    expect(written("defaults")).toEqual([...AXIS_KEYS].sort())
    expect(written("switcher\\.axes")).toEqual([...AXIS_KEYS].sort())
  })
})
