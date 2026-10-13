import type { PresetDefinition } from "../../../config/schema"

/**
 * Smoked Obsidian: a warm amber on pure greys, in the classic shell the
 * layout already defaults to. The dark accent is calmed to the direction's
 * brass. Geist stands in for Manrope. Chrome is a dark smoked strip in both
 * modes, rimmed in the accent; cards are dimming glass under one warm light
 * from the top right, and fields are recessed wells.
 */
export const smokedObsidian: PresetDefinition = {
  label: "Smoked Obsidian",
  style: "glass",
  axes: {
    accentColor: "amber",
    surfaceColor: "neutral",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    darkAccentChroma: "calm",
    gradientPattern: "grain",
    glassTransparency: "subtle",
  },
  signatures: {
    navSelection: "accent",
    railTone: "inverse",
    barTone: "inverse",
    barEdge: "rule",
    menuHighlight: "neutral",
    cardDivider: "hairline",
    bannerMark: "stripe",
    badgeStyle: "chip",
    fieldFill: "well",
  },
  tokens: {
    shared: {
      // Glass docks its rail on the page colour, which the inverse tone's
      // light ink cannot be read on; this is the fill that ink is solved on.
      chromeRailFill: "hsl(var(--surface-sidebar))",
      chromeEdge: "hsl(var(--primary) / 0.3)",
      surfaceFillAlpha: "0.7",
      // Lit from the top right, where the ground's light is.
      cardRim:
        "linear-gradient(200deg, hsl(var(--primary) / 0.4), rgb(255 255 255 / 0.04) 40%, rgb(255 255 255 / 0.02) 70%, hsl(var(--primary) / 0.12))",
      cardRadius: "calc(var(--radius) * 1.75)",
      overlayRadius: "calc(var(--radius) * 1.5)",
      dialogRadius: "calc(var(--radius) * 2)",
      bannerRadius: "calc(var(--radius) * 1.25)",
      badgeRadius: "calc(var(--radius-control) * 3)",
      navItemRadius: "var(--radius)",
      buttonEdge: "inset 0 1px 0 rgb(255 255 255 / 0.35)",
      buttonBorder: "rgb(0 0 0 / 0.18)",
      sectionTitleTracking: "-0.015em",
      dialogTitleTracking: "-0.015em",
    },
    light: {
      // No base layer under the light: the shell ground stays clear, so the
      // page canvas and its grain show through.
      shellGroundFill:
        "radial-gradient(70% 55% at 80% -10%, hsl(var(--primary) / 0.14), transparent 60%)",
      surfaceBackdrop: "blur(20px) saturate(90%)",
      cardBorder: "hsl(var(--foreground) / 0.1)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.7), 0 12px 32px -8px hsl(var(--foreground) / 0.18)",
      buttonNeutralFill: "hsl(var(--foreground) / 0.04)",
      fieldShadow: "inset 0 1px 2px hsl(var(--foreground) / 0.14)",
      selectedViewFill: "hsl(var(--card) / 0.9)",
      selectedViewShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.7), 0 1px 2px hsl(var(--foreground) / 0.12)",
      dropdownShadow: "0 16px 40px -10px hsl(var(--foreground) / 0.3)",
      modalShadow: "0 24px 60px -12px hsl(var(--foreground) / 0.4)",
      scrim: "hsl(var(--foreground) / 0.35)",
    },
    dark: {
      shellGroundFill:
        "radial-gradient(70% 55% at 80% -10%, hsl(var(--primary) / 0.2), transparent 60%)",
      surfaceBackdrop: "blur(20px) saturate(110%) brightness(0.7)",
      cardBorder: "rgb(255 255 255 / 0.07)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.05), 0 20px 50px -12px rgb(0 0 0 / 0.6)",
      buttonNeutralFill: "rgb(255 255 255 / 0.04)",
      fieldShadow: "inset 0 1px 2px rgb(0 0 0 / 0.5)",
      selectedViewFill: "rgb(255 255 255 / 0.08)",
      selectedViewShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
      dropdownShadow: "0 20px 50px rgb(0 0 0 / 0.6)",
      modalShadow: "0 30px 70px rgb(0 0 0 / 0.7)",
      scrim: "rgb(0 0 0 / 0.6)",
    },
  },
}
