import { describe, it, expect } from "vitest"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import { accentColors } from "@theme/palettes/accentColors"
import { resolveSurfaceScale } from "@theme/engine/generateTokens"
import { SURFACE_COLORS, ACCENT_COLORS, type SurfaceColor } from "@theme/types"

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

describe("surface ramps", () => {
  it("makes every registered neutral ramp selectable", () => {
    // Derived from the registry rather than a list of twelve, so registering a
    // thirteenth ramp without exposing it fails here too.
    const registered = Object.keys(surfaceColors)
    const missing = registered.filter(
      (name) => !(SURFACE_COLORS as readonly string[]).includes(name),
    )
    expect(missing).toEqual([])
  })

  it("keeps every accent usable as a surface", () => {
    // Widening must not cost consumers the accent-as-surface capability they
    // already have.
    const missing = ACCENT_COLORS.filter(
      (name) => !(SURFACE_COLORS as readonly string[]).includes(name),
    )
    expect(missing).toEqual([])
  })

  it.each(["light", "dark"] as const)(
    "resolves a neutral ramp to itself in %s mode",
    (mode) => {
      // A neutral is already a surface ramp: tinting it against slate would
      // drag every warm ground back toward slate's hue.
      for (const name of Object.keys(surfaceColors)) {
        const resolved = resolveSurfaceScale(name as SurfaceColor, mode)
        expect(resolved, `${name} in ${mode}`).toEqual(surfaceColors[name])
      }
    },
  )

  it("still desaturates an accent used as a surface", () => {
    // Regression guard: the accent path is what every current consumer on a
    // non-slate surface is running, and this release must not move it.
    const resolved = resolveSurfaceScale("violet", "light")
    expect(resolved).not.toEqual(accentColors.violet)
    for (const step of STEPS) {
      const sat = parseFloat(resolved[step].split(" ")[1] ?? "0")
      const raw = parseFloat(accentColors.violet[step].split(" ")[1] ?? "0")
      expect(sat).toBeLessThan(raw)
    }
  })

  it("gives every registered ramp all eleven stops", () => {
    for (const [name, scale] of Object.entries(surfaceColors)) {
      for (const step of STEPS) {
        expect(scale[step], `${name}[${step}]`).toMatch(
          /^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/,
        )
      }
    }
  })
})
