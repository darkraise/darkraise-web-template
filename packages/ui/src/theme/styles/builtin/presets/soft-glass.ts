import type { PresetDefinition } from "../../../config/schema"
import { glassBackdrop } from "../glass"

// Four blobs turned from the accent hue over a page-to-tint ground, in
// darkcloud's geometry. Each kit colour falls back to a flat ground where
// relative colour syntax is missing.
const GROUND = [
  "radial-gradient(47vw 62vh at 6% 4%, var(--ground-blob-1, transparent), transparent 66%)",
  "radial-gradient(43vw 60vh at 96% 0%, var(--ground-blob-2, transparent), transparent 64%)",
  "radial-gradient(58vw 70vh at 70% 108%, var(--ground-blob-3, transparent), transparent 64%)",
  "radial-gradient(43vw 57vh at 22% 96%, var(--ground-blob-4, transparent), transparent 62%)",
  "linear-gradient(135deg, hsl(var(--background)), var(--ground-tint, hsl(var(--shell-ground))))",
].join(", ")

// The chrome is thinner glass than the cards: 0.26 (light) and 0.34 (dark)
// at Medium. Each line runs through (1, 1), so the chrome turns opaque with
// the cards when the kit's fallback takes the card alpha to 1, and it never
// clears past 0.12 at High.
const LIGHT_CHROME =
  "hsl(var(--card) / max(0.12, calc(var(--surface-alpha) * 2.06 - 1.06)))"
const DARK_CHROME =
  "hsl(var(--card) / max(0.12, calc(var(--surface-alpha) * 1.74 - 0.74)))"

/**
 * Soft Glass: darkcloud's Soft Glass (its 2026-10-10 design, §1, and
 * `web/src/features/shell/softGlassTokens.ts`, Aurora palette) in an island
 * shell. Indigo and cool are the ramps nearest darkcloud's accent (#4a57c2,
 * #a7b1ff in dark) and neutrals (#1a1e2b, #515870) by OKLCH distance:
 * indigo 0.073 against blue's 0.113 over both accents, cool 0.040 against
 * slate's 0.050 over both neutrals. Hanken Grotesk stands in for
 * darkcloud's Be Vietnam Pro, and controls keep the kit's control radius
 * (8px at rounded, where darkcloud uses 6px). The backdrop is four soft
 * blobs tinted from the accent, painted under the gradient background;
 * cards and the bar and rail are frosted glass whose alphas follow the
 * Transparency setting, and the pane is the card glass without a blur of
 * its own, which would trap every fixed-position element in the page.
 */
export const softGlass: PresetDefinition = {
  label: "Soft Glass",
  style: "glass",
  shellStyle: "island",
  axes: {
    accentColor: "indigo",
    surfaceColor: "cool",
    tintWithAccent: "off",
    signalColor: "none",
    font: "hanken-grotesk",
    headingFont: "newsreader",
    glassBlur: "high",
  },
  tokens: {
    shared: {
      cardRadius: "var(--radius)",
      surfaceBackdrop: glassBackdrop("saturate(110%)"),
      chromeBackdrop: glassBackdrop(
        "saturate(115%)",
        "calc(var(--glass-blur) * 0.75)",
      ),
      overlayFillAlpha: "0.46",
      shellContentFill: "hsl(var(--card) / var(--surface-alpha))",
      shellGroundGradient: GROUND,
    },
    light: {
      surfaceFillAlpha: "0.64",
      chromeRailFill: LIGHT_CHROME,
      chromeBarFill: LIGHT_CHROME,
      navSelectionFill: "hsl(var(--sidebar-foreground-hover) / 0.1)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.6), 0 10px 26px -18px rgb(0 0 0 / 0.35)",
      scrim: "hsl(var(--foreground) / 0.16)",
    },
    dark: {
      surfaceFillAlpha: "0.62",
      chromeRailFill: DARK_CHROME,
      chromeBarFill: DARK_CHROME,
      navSelectionFill: "hsl(var(--sidebar-foreground-hover) / 0.1)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 10px 26px -18px rgb(0 0 0 / 0.6)",
      scrim: "rgb(0 0 0 / 0.65)",
    },
  },
}
