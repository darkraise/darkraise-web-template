import type { PresetDefinition } from "../../../config/schema"
import { glassBackdrop } from "../glass"

/**
 * Milk Glass: a deep orange on cool neutrals in a flat shell. Coral is the
 * nearest ramp: the orange ramp's light fill is a bright one under a dark
 * label. Geist stands in for Plus Jakarta Sans. Every pane is near-opaque
 * milk that blurs hard, so the accent halos on the ground glow through it;
 * panes are told apart by a bright edge and a wide soft shadow, and the
 * scrim is a fog of the page colour.
 */
export const milkGlass: PresetDefinition = {
  label: "Milk Glass",
  style: "glass",
  shellStyle: "flat",
  axes: {
    accentColor: "coral",
    surfaceColor: "cool",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    gradientPattern: "blobs",
    backgroundIntensity: "subtle",
    glassBlur: "high",
  },
  signatures: {
    navSelection: "frosted",
    cardDivider: "hairline",
    bannerMark: "lamp",
    bannerSurface: "card",
    badgeStyle: "tint",
  },
  tokens: {
    shared: {
      overlayFillAlpha: "0.7",
      surfaceBackdrop: glassBackdrop("saturate(180%)"),
      cardRadius: "calc(var(--radius) * 2.75)",
      overlayRadius: "calc(var(--radius) * 2)",
      dialogRadius: "calc(var(--radius) * 3.5)",
      bannerRadius: "calc(var(--radius) * 2)",
      badgeRadius: "calc(var(--radius) * 1.5)",
      navItemRadius: "calc(var(--radius) * 1.5)",
      menuItemRadius: "calc(var(--radius) * 1.25)",
      segmentRadius: "calc(var(--radius) * 1.5)",
      checkRadius: "calc(var(--radius) * 0.75)",
      navSelectionEdge: "transparent",
      navSelectionGlow: "0 0 transparent",
      buttonShadow: "0 6px 16px -4px hsl(var(--primary) / 0.35)",
      buttonDangerShadow:
        "0 6px 16px -4px hsl(var(--destructive-solid) / 0.35)",
      thumbShadow: "0 1px 3px rgb(0 0 0 / 0.2)",
      pageTitleWeight: "700",
      pageTitleTracking: "-0.025em",
      sectionTitleWeight: "700",
      sectionTitleTracking: "-0.025em",
      dialogTitleWeight: "700",
      dialogTitleTracking: "-0.025em",
      figureWeight: "700",
    },
    light: {
      // No base layer under the halos: the shell ground stays clear, so the
      // page canvas shows between them.
      shellGroundFill:
        "radial-gradient(45% 40% at 12% 18%, hsl(var(--primary) / 0.26), transparent 70%), radial-gradient(40% 40% at 88% 12%, hsl(var(--primary) / 0.14), transparent 70%), radial-gradient(50% 45% at 70% 92%, hsl(var(--primary) / 0.18), transparent 70%)",
      surfaceFillAlpha: "0.78",
      // The rail's milk is thinner than a card's and follows the card alpha,
      // so it turns opaque with the cards when the kit's fallback sets the
      // alpha to 1.
      chromeFlatFill:
        "hsl(var(--card) / calc(var(--surface-alpha) * 1.75 - 0.75))",
      cardBorder: "rgb(255 255 255 / 0.9)",
      cardEdge:
        "0 0 0 1px hsl(var(--foreground) / 0.04), 0 1px 1px hsl(var(--foreground) / 0.03), 0 8px 24px -6px hsl(var(--foreground) / 0.08), 0 24px 48px -12px hsl(var(--foreground) / 0.08)",
      navSelectionFill: "hsl(var(--card) / 0.92)",
      navSelectionShadow:
        "0 1px 2px hsl(var(--foreground) / 0.05), 0 6px 14px -6px hsl(var(--foreground) / 0.12)",
      buttonNeutralFill: "hsl(var(--card) / 0.7)",
      buttonNeutralShadow: "0 1px 2px hsl(var(--foreground) / 0.06)",
      ghostHover: "0.05",
      fieldFocusRing: "0 0 0 4px hsl(var(--primary) / 0.15)",
      selectedViewShadow: "0 1px 3px hsl(var(--foreground) / 0.1)",
      bannerShadow: "0 8px 20px -10px hsl(var(--foreground) / 0.15)",
      overlayBorder: "rgb(255 255 255 / 0.9)",
      dropdownShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.04), 0 16px 40px -8px hsl(var(--foreground) / 0.18)",
      modalShadow: "0 30px 60px -12px hsl(var(--foreground) / 0.22)",
      scrim: "hsl(var(--background) / 0.45)",
    },
    dark: {
      shellGroundFill:
        "radial-gradient(45% 40% at 12% 18%, hsl(var(--primary) / 0.2), transparent 70%), radial-gradient(40% 40% at 88% 12%, hsl(var(--primary) / 0.1), transparent 70%), radial-gradient(50% 45% at 70% 92%, hsl(var(--primary) / 0.12), transparent 70%)",
      surfaceFillAlpha: "0.8",
      chromeFlatFill:
        "hsl(var(--card) / calc(var(--surface-alpha) * 1.5 - 0.5))",
      cardBorder: "rgb(255 255 255 / 0.1)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 24px 48px -12px rgb(0 0 0 / 0.55)",
      navSelectionFill: "rgb(255 255 255 / 0.14)",
      navSelectionShadow: "inset 0 1px 0 rgb(255 255 255 / 0.1)",
      buttonNeutralFill: "rgb(255 255 255 / 0.08)",
      buttonNeutralEdge: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
      ghostHover: "0.07",
      fieldFocusRing: "0 0 0 4px hsl(var(--primary) / 0.18)",
      selectedViewFill: "rgb(255 255 255 / 0.14)",
      overlayBorder: "rgb(255 255 255 / 0.1)",
      dropdownShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 16px 40px -8px rgb(0 0 0 / 0.6)",
      modalShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 30px 60px -12px rgb(0 0 0 / 0.65)",
      scrim: "hsl(var(--background) / 0.45)",
    },
  },
}
