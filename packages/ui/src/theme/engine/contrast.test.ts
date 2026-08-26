import { describe, it, expect } from "vitest"
import { generateTokens } from "@theme/engine/generateTokens"
import { contrastRatio } from "@theme/engine/oklch"
import { ACCENT_COLORS } from "@theme/types"

const MODES = ["light", "dark"] as const

/** A shape or boundary must be distinguishable; text must be readable. */
const NON_TEXT = 3
const TEXT = 4.5

function build(
  accentColor: (typeof ACCENT_COLORS)[number],
  mode: "light" | "dark",
) {
  return generateTokens({
    accentColor,
    surfaceColor: "slate",
    preset: "default",
    backgroundStyle: "solid",
    mode,
    accentIntensity: "calm",
  })
}

describe("state and focus colours clear their floors", () => {
  describe.each(MODES)("in %s mode", (mode) => {
    it.each(ACCENT_COLORS)(
      "%s: --focus-ring is visible against the page",
      (accentColor) => {
        const t = build(accentColor, mode)
        expect(
          contrastRatio(t["--focus-ring"] as string, t["--background"] as string),
        ).toBeGreaterThanOrEqual(NON_TEXT)
      },
    )

    it.each(ACCENT_COLORS)(
      "%s: --primary is visible as a mark against the page",
      (accentColor) => {
        // Form controls take their focus indicator from --primary rather than
        // --focus-ring, so this is a real focus ring on every text field.
        const t = build(accentColor, mode)
        expect(
          contrastRatio(t["--primary"] as string, t["--background"] as string),
        ).toBeGreaterThanOrEqual(NON_TEXT)
      },
    )

    it("--success and --warning are visible as marks", () => {
      const t = build("blue", mode)
      const bg = t["--background"] as string
      expect(
        contrastRatio(t["--success"] as string, bg),
        "--success",
      ).toBeGreaterThanOrEqual(NON_TEXT)
      expect(
        contrastRatio(t["--warning"] as string, bg),
        "--warning",
      ).toBeGreaterThanOrEqual(NON_TEXT)
    })

    it.each(ACCENT_COLORS)(
      "%s: --destructive is readable as text",
      (accentColor) => {
        // Destructive is not only a fill: it labels the action it describes.
        const t = build(accentColor, mode)
        expect(
          contrastRatio(
            t["--destructive"] as string,
            t["--background"] as string,
          ),
        ).toBeGreaterThanOrEqual(TEXT)
      },
    )
  })
})
