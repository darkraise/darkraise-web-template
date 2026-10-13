import type { PresetDefinition } from "../../../config/schema"
import { glassBackdrop } from "../glass"

/**
 * Aurora Night: a teal accent on blue-tinted greys in a flat shell, set in
 * Geist with mono figures. The ground is clear but for accent light pooled
 * at the top right; panes are thin glass that
 * lets it bleed through, and the primary action, the focused field and the
 * current nav row glow in the accent.
 */
export const auroraNight: PresetDefinition = {
  label: "Aurora Night",
  style: "glass",
  shellStyle: "flat",
  axes: {
    accentColor: "teal",
    surfaceColor: "gray",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    gradientPattern: "aurora",
    backgroundIntensity: "subtle",
  },
  signatures: {
    navSelection: "accent",
    figureFamily: "mono",
    cardDivider: "hairline",
    badgeStyle: "tint",
    fieldFill: "translucent",
  },
  tokens: {
    shared: {
      overlayFillAlpha: "0.55",
      // The rail's glass is thinner than a card's and follows the card
      // alpha, so it turns opaque with the cards when the kit's fallback
      // sets the alpha to 1.
      chromeFlatFill:
        "hsl(var(--card) / calc(var(--surface-alpha) * 1.2 - 0.2))",
      surfaceBackdrop: glassBackdrop("saturate(160%)"),
      cardRadius: "calc(var(--radius) * 2.25)",
      overlayRadius: "calc(var(--radius) * 1.75)",
      dialogRadius: "calc(var(--radius) * 2.75)",
      bannerRadius: "calc(var(--radius) * 1.5)",
      badgeRadius: "calc(var(--radius) * 1.5)",
      navItemRadius: "calc(var(--radius) * 1.25)",
      checkRadius: "calc(var(--radius) * 0.625)",
      buttonDangerShadow:
        "0 0 0 1px hsl(var(--destructive-solid) / 0.35), 0 0 24px -4px hsl(var(--destructive-solid) / 0.35)",
      pageTitleTracking: "-0.03em",
      sectionTitleTracking: "-0.03em",
      dialogTitleTracking: "-0.03em",
      figureWeight: "500",
    },
    light: {
      // No base layer under the light: the shell ground stays clear, so the
      // page canvas shows around it.
      shellGroundFill:
        "radial-gradient(38% 30% at 72% 4%, hsl(var(--primary) / 0.3), transparent 70%), radial-gradient(32% 28% at 92% 18%, hsl(var(--primary) / 0.18), transparent 70%), radial-gradient(30% 24% at 52% 12%, hsl(var(--primary) / 0.14), transparent 70%)",
      surfaceFillAlpha: "0.62",
      cardBorder: "rgb(255 255 255 / 0.8)",
      cardEdge: "0 20px 40px -16px hsl(var(--foreground) / 0.18)",
      navSelectionGlow: "0 0 16px -4px hsl(var(--primary) / 0.35)",
      buttonShadow:
        "0 0 0 1px hsl(var(--primary) / 0.35), 0 0 24px -4px hsl(var(--primary) / 0.35)",
      buttonNeutralFill: "hsl(var(--card) / 0.5)",
      ghostHover: "0.05",
      fieldFocusRing:
        "0 0 0 1px hsl(var(--primary) / 0.35), 0 0 24px -4px hsl(var(--primary) / 0.35)",
      selectedViewShadow: "0 1px 3px hsl(var(--foreground) / 0.15)",
      overlayBorder: "rgb(255 255 255 / 0.8)",
      dropdownShadow: "0 18px 40px -14px hsl(var(--foreground) / 0.28)",
      modalShadow: "0 30px 60px -18px hsl(var(--foreground) / 0.35)",
      scrim: "hsl(var(--foreground) / 0.16)",
    },
    dark: {
      shellGroundFill:
        "radial-gradient(38% 30% at 72% 4%, hsl(var(--primary-text) / 0.3), transparent 70%), radial-gradient(32% 28% at 92% 18%, hsl(var(--primary-text) / 0.18), transparent 70%), radial-gradient(30% 24% at 52% 12%, hsl(var(--primary-text) / 0.14), transparent 70%)",
      surfaceFillAlpha: "0.57",
      cardBorder: "rgb(255 255 255 / 0.08)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.1), 0 30px 60px -20px rgb(0 0 0 / 0.7)",
      navSelectionGlow: "0 0 18px -4px hsl(var(--primary-text) / 0.45)",
      buttonShadow:
        "0 0 0 1px hsl(var(--primary-text) / 0.35), 0 0 24px -4px hsl(var(--primary-text) / 0.35)",
      buttonNeutralFill: "rgb(255 255 255 / 0.04)",
      ghostHover: "0.06",
      fieldFocusRing:
        "0 0 0 1px hsl(var(--primary-text) / 0.35), 0 0 24px -4px hsl(var(--primary-text) / 0.35)",
      selectedViewFill: "rgb(255 255 255 / 0.1)",
      selectedViewShadow: "inset 0 1px 0 rgb(255 255 255 / 0.1)",
      overlayBorder: "rgb(255 255 255 / 0.08)",
      dropdownShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 24px 50px -16px rgb(0 0 0 / 0.8)",
      modalShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.1), 0 30px 70px -20px rgb(0 0 0 / 0.85)",
      scrim: "rgb(0 0 0 / 0.6)",
    },
  },
}
