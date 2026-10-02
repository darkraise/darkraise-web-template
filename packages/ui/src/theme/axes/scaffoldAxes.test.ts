import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { scaffoldAxes } from "./scaffoldAxes"

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
