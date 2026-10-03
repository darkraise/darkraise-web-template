import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { scaffoldAxes } from "./scaffoldAxes"
import { AXES, AXIS_KEYS } from "./registry"

describe("scaffold axes.json", () => {
  it("matches the registry; run `pnpm --filter darkraise-ui write:scaffold-axes` after changing it", () => {
    const committed = readFileSync("../../create-app/bin/axes.json", "utf8")
    expect(committed).toBe(`${JSON.stringify(scaffoldAxes(), null, 2)}\n`)
  })

  it("lists all 19 accents and the 12 neutral surfaces", () => {
    const axes = scaffoldAxes()
    expect(axes.accentColor?.values).toHaveLength(19)
    expect(axes.accentColor?.values).toContain("coral")
    expect(axes.accentColor?.values.slice(-1)).toEqual(["neutral"])
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

  it("defaults every axis to the registry default", () => {
    const body = script.match(/^\s{4}defaults: \{([^}]*)\}/m)?.[1] ?? ""
    const defaults = Object.fromEntries(
      [...body.matchAll(/^\s*(\w+): "([^"]*)"/gm)].map((m) => [m[1], m[2]]),
    )
    expect(defaults).toEqual(
      Object.fromEntries(AXIS_KEYS.map((key) => [key, AXES[key].default])),
    )
  })

  it("lists every registry axis in the switcher and nothing else", () => {
    expect(keysOf(/^\s{6}axes: \{([^}]*)\}/m).sort()).toEqual(
      [...AXIS_KEYS].sort(),
    )
  })

  it("writes exactly the registry axes into theme.config.ts", () => {
    const written = (prefix: string) =>
      [
        ...script.matchAll(
          new RegExp(`\\$\\{config\\.theme\\.${prefix}\\.(\\w+)\\}`, "g"),
        ),
      ]
        .map((m) => m[1] as string)
        .filter((key) => key !== "enabled")
        .sort()
    expect(written("defaults")).toEqual([...AXIS_KEYS].sort())
    expect(written("switcher\\.axes")).toEqual([...AXIS_KEYS].sort())
  })
})

describe("create-app/bin/create.mjs", () => {
  it("writes an index.html that loads nothing from a third party", () => {
    const script = readFileSync("../../create-app/bin/create.mjs", "utf8")
    const html = script.match(/const indexHtml = `([\s\S]*?)`/)?.[1]
    expect(html).toBeDefined()
    expect(html).not.toMatch(/https?:\/\//)
  })

  it("writes every registry axis into the switcher config", () => {
    const script = readFileSync("../../create-app/bin/create.mjs", "utf8")
    const written = [
      ...script.matchAll(/\$\{config\.theme\.switcher\.axes\.(\w+)\}/g),
    ]
      .map((m) => m[1] as string)
      .filter((key) => key !== "enabled")
      .sort()
    expect(written).toEqual([...AXIS_KEYS].sort())
  })
})
