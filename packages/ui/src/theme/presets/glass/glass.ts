// packages/ui/src/theme/presets/glass/glass.ts
import type { ThemePreset, CommonAxisInput } from "../types"

type GlassAxes = {
  opacity: readonly ["subtle", "medium", "strong"]
  blur: readonly ["none", "low", "medium", "high"]
  halo: readonly ["none", "soft", "pronounced"]
}

// Axis semantics: "subtle" means a SUBTLE GLASS EFFECT (less glassy, surface
// is more solid). "strong" means a STRONG GLASS EFFECT (very glassy, surface
// is more transparent). Subtle/medium/strong = effect intensity, not opacity
// value.
//
// Light-mode glass = white-tinted card overlaying a colored canvas. Higher
// alphas = more white tint = less of the canvas shows through = subtler effect.
// Dark-mode glass = barely-tinted dark surface letting the canvas through.
// Higher alphas in dark = MORE white frost = the subtler "frosted" look.
//
// Medium values match today's behaviour byte-for-byte so the default settings
// produce zero visual change after Phase 3.
const FOG_ALPHA = {
  subtle: {
    light: [0.7, 0.8, 0.85, 0.9, 0.94, 0.98],
    dark: [0.07, 0.12, 0.17, 0.24, 0.32, 0.5],
  },
  medium: {
    light: [0.55, 0.65, 0.72, 0.82, 0.9, 0.96],
    dark: [0.04, 0.07, 0.1, 0.14, 0.2, 0.38],
  },
  strong: {
    light: [0.3, 0.4, 0.48, 0.58, 0.7, 0.82],
    dark: [0.02, 0.04, 0.06, 0.09, 0.13, 0.24],
  },
} as const

// Inset highlight ("liquid glass" top edge). Sharper edge = subtler glass.
const INSET_HI = {
  subtle: { light: 0.75, dark: 0.18 },
  medium: { light: 0.6, dark: 0.14 },
  strong: { light: 0.4, dark: 0.08 },
} as const

// Halo tier tokens — accent-tinted spatial signature applied per
// elevation tier. Each layer uses hsl(var(--primary) / α) so the
// halo automatically picks up the user's accent palette. Mode-aware
// alpha curve: dark mode roughly doubles each light alpha because
// the canvas is dark and lower alphas wouldn't register.
const HALO_ALPHA = {
  soft: {
    light: {
      raised: [0.06, 0.12, 0.06],
      overlay: [0.08, 0.16, 0.08],
      modal: [0.1, 0.2, 0.1],
    },
    dark: {
      raised: [0.1, 0.2, 0.1],
      overlay: [0.14, 0.28, 0.14],
      modal: [0.18, 0.36, 0.18],
    },
  },
  pronounced: {
    light: {
      raised: [0.1, 0.2, 0.1],
      overlay: [0.13, 0.26, 0.13],
      modal: [0.16, 0.32, 0.16],
    },
    dark: {
      raised: [0.16, 0.32, 0.16],
      overlay: [0.22, 0.44, 0.22],
      modal: [0.28, 0.56, 0.28],
    },
  },
  none: {
    light: {
      raised: [0, 0, 0],
      overlay: [0, 0, 0],
      modal: [0, 0, 0],
    },
    dark: {
      raised: [0, 0, 0],
      overlay: [0, 0, 0],
      modal: [0, 0, 0],
    },
  },
} as const

function haloRecipe(
  tier: "raised" | "overlay" | "modal",
  alphas: readonly [number, number, number],
): string {
  const [rim, tight, mid] = alphas
  if (rim === 0 && tight === 0 && mid === 0) return "0 0 transparent"
  const tightSize = { raised: "12px", overlay: "16px", modal: "24px" }[tier]
  const midSize = { raised: "32px", overlay: "40px", modal: "60px" }[tier]
  const tightYOff = { raised: "4px", overlay: "4px", modal: "8px" }[tier]
  const midYOff = { raised: "12px", overlay: "16px", modal: "24px" }[tier]
  return [
    `0 0 0 1px hsl(var(--primary) / ${rim})`,
    `0 ${tightYOff} ${tightSize} -2px hsl(var(--primary) / ${tight})`,
    `0 ${midYOff} ${midSize} -8px hsl(var(--primary) / ${mid})`,
  ].join(", ")
}

export const glass: ThemePreset<GlassAxes> = {
  name: "glass",
  label: "Glass",
  description:
    "Frosted glass: backdrop-blur with semi-transparent surfaces and subtle highlight insets.",

  axes: {
    opacity: {
      values: ["subtle", "medium", "strong"],
      default: "medium",
      label: "Opacity",
      order: 1,
    },
    blur: {
      values: ["none", "low", "medium", "high"],
      default: "medium",
      label: "Backdrop Blur",
      order: 2,
    },
    halo: {
      values: ["none", "soft", "pronounced"],
      default: "soft",
      label: "Halo",
      order: 3,
    },
  },

  surfaceRecipe: {
    surfaceRaised: (s, m) => (m === "light" ? "0 0% 100%" : s[900]),
    surfaceOverlay: (s, m) => (m === "light" ? "0 0% 100%" : s[800]),
    surfaceSunken: (s, m) => (m === "light" ? s[100] : s[950]),
    surfaceSidebar: (s, m) => (m === "light" ? s[50] : s[950]),
    surfaceHeader: (s, m) => (m === "light" ? "0 0% 100%" : s[900]),
    borderSubtle: (s, m) => (m === "light" ? s[100] : s[600]),
    borderDefault: (s, m) => (m === "light" ? s[200] : s[500]),
    overrides: {
      shadowCard: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      shadowDropdown:
        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
  },

  generateTokens(common: CommonAxisInput, axes) {
    const alphas = FOG_ALPHA[axes.opacity][common.mode]
    const insetAlpha = INSET_HI[axes.opacity][common.mode]

    // Semantic surface-tier overrides. Same approach Neon uses (rebinding
    // --accent / --muted / --secondary to primary-tinted CSS expressions
    // so every bg-accent / bg-muted / bg-secondary consumer in the system
    // automatically reads as preset-styled), but with conservative alphas
    // that preserve Glass's "frosted subtle" aesthetic. Mode-aware
    // because light glass surfaces are mostly white (low alpha reads
    // cleanly as a tint) while dark glass surfaces are mostly
    // transparent (need a touch more alpha to register visibly).
    //
    // --muted-foreground intentionally NOT rebound — it must stay a
    // muted gray so `text-muted-foreground` keeps its "subdued text"
    // semantic.
    const accentAlpha = common.mode === "light" ? 0.1 : 0.14
    const mutedAlpha = common.mode === "light" ? 0.04 : 0.06
    const secondaryAlpha = common.mode === "light" ? 0.08 : 0.1

    // OKLab mix for perceptual color blending. The accent palette uses
    // HSL with high saturation values, which srgb averaging desaturates
    // noticeably for blue/green accents. OKLab preserves perceptual
    // chroma.
    //
    // Dilution base is mode-asymmetric:
    //   - Light: mix into white. Light glass is "white-frosted surface
    //     with accent tint coming through".
    //   - Dark: mix into surface[950] (deepest dark surface). Mixing
    //     accent into white in dark mode produced a near-white fog
    //     that, at the very low dark-mode alphas (0.04-0.38), rendered
    //     as a faint white haze on the dark canvas — the accent
    //     contribution was overwhelmed by white's luminance and the
    //     dialog read as "dim white" rather than "accent-tinted dark".
    //     Mixing into a dark base keeps the fog dark so the accent
    //     contribution actually registers.
    //
    // Tint percentages bumped in dark from 18% to 40% — the higher %
    // is needed because the dark base has its own hue/luminance and
    // the accent needs more weight in the mix to dominate visually.
    // The fog fill bakes a concrete accent shade here, while the halo rim
    // (haloRecipe) defers to hsl(var(--primary)). --primary is accent[primaryShade]
    // where primaryShade is 600 for light glass and 400 for dark glass
    // (generateTokens.ts). So in DARK both fog and halo resolve to accent[400]
    // and agree; in LIGHT the fog uses accent[500] while the halo rim uses
    // accent[600]. This is deliberate — the fog is a heavily white-diluted
    // frosted FILL and the rim is an undiluted low-alpha edge, two different
    // roles — so don't "align" them to one shade without intent. If they ever
    // must match, change the light branch below to common.accent[600] (never
    // touch --primary, which also drives bg-primary/--ring system-wide).
    const accentHSL =
      common.mode === "dark" ? common.accent[400] : common.accent[500]
    const fogBaseDilution =
      common.mode === "dark" ? `hsl(${common.surface[950]})` : "white"
    const tintMix = common.mode === "dark" ? 40 : 24
    const fogBase = `color-mix(in oklab, hsl(${accentHSL}) ${tintMix}%, ${fogBaseDilution})`
    const fog = (alpha: number): string =>
      `color-mix(in oklab, ${fogBase} ${(alpha * 100).toFixed(1)}%, transparent)`

    const tokens: Record<string, string> = {
      "--fog-05": fog(alphas[0]),
      "--fog-10": fog(alphas[1]),
      "--fog-15": fog(alphas[2]),
      "--fog-20": fog(alphas[3]),
      "--fog-30": fog(alphas[4]),
      "--fog-50": fog(alphas[5]),
      // Two-edge inset specular: top-edge highlight + left-edge sliver at
      // 60% of the top alpha. Reads as slight convex curvature without
      // the full curved-sheen treatment we explicitly rejected in favor
      // of the halo signature. The left-edge sliver also helps the card
      // border read as crisp when the bottom or right edge lacks a strong
      // rim source.
      "--inset-hi": `inset 0 1px 0 rgba(255, 255, 255, ${insetAlpha}), inset 1px 0 0 rgba(255, 255, 255, ${(insetAlpha * 0.6).toFixed(2)})`,
      "--inset-hi-strong": `inset 0 1px 0 rgba(255, 255, 255, ${(insetAlpha * 1.25).toFixed(2)}), inset 1px 0 0 rgba(255, 255, 255, ${(insetAlpha * 1.25 * 0.6).toFixed(2)})`,
      "--inset-hi-button": `inset 0 1px 0 rgba(255, 255, 255, ${(insetAlpha * 1.1).toFixed(2)}), inset 1px 0 0 rgba(255, 255, 255, ${(insetAlpha * 1.1 * 0.6).toFixed(2)})`,
    }

    // Halo tier tokens. -raised lands on in-flow Cards via --card-elevation-*;
    // -overlay and -modal are consumed INDIRECTLY (no direct component
    // reference) — -overlay is composed into --surface-overlay-shadow
    // (glass.css) which the portaled overlay components read, and -modal into
    // [data-preset="glass"] .modal-surface (theme.css) for Dialog/Sheet/Drawer.
    // A grep of component CSS finding no -overlay/-modal references is expected,
    // not dead code.
    const haloAlphas = HALO_ALPHA[axes.halo][common.mode]
    tokens["--glass-halo-raised"] = haloRecipe("raised", haloAlphas.raised)
    tokens["--glass-halo-overlay"] = haloRecipe("overlay", haloAlphas.overlay)
    tokens["--glass-halo-modal"] = haloRecipe("modal", haloAlphas.modal)

    // Dark-glass + gradient bg: translucent white border instead of a tinted
    // surface border. Today's behaviour, preserved here because the recipe
    // override signature (scale, mode) can't see backgroundStyle.
    if (common.mode === "dark" && common.backgroundStyle === "gradient") {
      tokens["--border"] = "0 0% 100% / 0.1"
    }

    tokens["--accent"] = `var(--primary) / ${accentAlpha}`
    tokens["--accent-foreground"] = "var(--primary)"
    tokens["--muted"] = `var(--primary) / ${mutedAlpha}`
    tokens["--secondary"] = `var(--primary) / ${secondaryAlpha}`
    tokens["--secondary-foreground"] = "var(--primary)"

    return tokens
  },

  // Only what generateTokens writes. --backdrop-blur, --backdrop-filter,
  // and --surface-opacity are set by glass.css attribute selectors
  // (CSS-only), so they self-clean via the cascade when the preset
  // changes; listing them here is misleading per the docstring contract.
  ownedTokenKeys: [
    "--fog-05",
    "--fog-10",
    "--fog-15",
    "--fog-20",
    "--fog-30",
    "--fog-50",
    "--inset-hi",
    "--inset-hi-strong",
    "--inset-hi-button",
    "--border",
    "--accent",
    "--accent-foreground",
    "--muted",
    "--secondary",
    "--secondary-foreground",
    "--glass-halo-raised",
    "--glass-halo-overlay",
    "--glass-halo-modal",
  ] as const,
}
