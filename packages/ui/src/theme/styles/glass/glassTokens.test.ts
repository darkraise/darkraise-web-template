import { describe, it, expect } from "vitest"
import { accentColors } from "@theme/palettes/accentColors"
import { resolveNeutralScale } from "@theme/engine/generateTokens"
import { GLASS_OPACITIES, GLOW_LEVELS } from "@theme/types"
import { GLASS_TOKEN_KEYS, glassTokens } from "./glassTokens"

// The provider removes GLASS_TOKEN_KEYS from the inline style under every
// other style. A key glassTokens writes but the list misses would leak onto
// the next style, so the write-set comes from a real run over every input.
describe("GLASS_TOKEN_KEYS", () => {
  it("lists every key glassTokens writes", () => {
    const listed = new Set(GLASS_TOKEN_KEYS)
    const written = new Set<string>()
    for (const mode of ["light", "dark"] as const) {
      for (const backgroundStyle of ["solid", "gradient"] as const) {
        for (const glassOpacity of GLASS_OPACITIES) {
          for (const outerGlow of GLOW_LEVELS) {
            const tokens = glassTokens({
              mode,
              accent: accentColors.blue,
              surface: resolveNeutralScale("slate"),
              backgroundStyle,
              outerGlow,
              glassOpacity,
            })
            for (const key of Object.keys(tokens)) written.add(key)
          }
        }
      }
    }
    expect([...written].filter((key) => !listed.has(key)).sort()).toEqual([])
  })
})
