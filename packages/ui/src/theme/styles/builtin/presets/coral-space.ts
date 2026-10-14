import type { PresetDefinition } from "../../../config/schema"

/**
 * Coral Space: a rose accent whose hue tints the neutrals, in an inset
 * shell. The dark accent is calmed towards the direction's dusty rose.
 * Inter stands in for the system UI face. Under the gradient background
 * the window frame is the colour: the shell is painted from the accent
 * ramp under a fine grain, the
 * rail and the bar sit directly on it, and the work sits on a pane of the
 * page colour, fainter than its frosted white cards. The current nav row is
 * a white pill.
 */
export const coralSpace: PresetDefinition = {
  label: "Coral Space",
  style: "glass",
  shellStyle: "inset",
  axes: {
    accentColor: "rose",
    surfaceColor: "olive",
    tintWithAccent: "on",
    signalColor: "none",
    font: "inter",
    headingFont: "body",
    darkAccentChroma: "calm",
  },
  signatures: {
    barEdge: "none",
    labelCase: "none",
    cardDivider: "hairline",
    badgeStyle: "tint",
    fieldFill: "translucent",
  },
  tokens: {
    shared: {
      // Twice the card alpha's distance from opaque, as Mica Desk's slab, so
      // the pane turns opaque with the cards under the kit's fallback.
      shellContentFill:
        "hsl(var(--background) / max(0.35, calc(var(--surface-alpha) * 2 - 1)))",
      overlayFillAlpha: "0.65",
      cardRadius: "calc(var(--radius) * 1.25)",
      bannerRadius: "calc(var(--radius) * 1.25)",
      badgeRadius: "calc(var(--radius) * 1.5)",
      navItemRadius: "calc(var(--radius) * 1.25)",
      checkRadius: "calc(var(--radius) * 0.625)",
      navSelectionEdge: "transparent",
      pageTitleTracking: "-0.011em",
      sectionTitleTracking: "-0.011em",
      dialogTitleTracking: "-0.011em",
    },
    light: {
      surfaceFillAlpha: "0.56",
      // Opaque paint from the accent ramp's tint steps, no lower than the
      // step the rail's muted ink still clears 4.5:1 on, under grain drawn
      // as dot tiles.
      shellGroundGradient:
        "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.14) 0.7px, transparent 1.1px) 0 0 / 3px 3px, radial-gradient(circle at 3px 2px, rgb(255 255 255 / 0.1) 0.7px, transparent 1.1px) 0 0 / 5px 5px, radial-gradient(circle at 2px 5px, rgb(255 255 255 / 0.14) 0.8px, transparent 1.2px) 0 0 / 7px 7px, radial-gradient(circle at 8px 4px, rgb(255 255 255 / 0.1) 0.8px, transparent 1.2px) 0 0 / 11px 11px, linear-gradient(155deg, transparent 30%, hsl(var(--primary-6) / 0.18)), hsl(var(--primary-5))",
      shellContentEdge: "hsl(var(--foreground) / 0.1)",
      shellContentShadow:
        "0 2px 6px -1px hsl(var(--foreground) / 0.22), 0 12px 28px -14px hsl(var(--foreground) / 0.35)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.6), 0 1px 2px hsl(var(--foreground) / 0.06), 0 4px 12px -6px hsl(var(--foreground) / 0.1)",
      navSelectionFill: "hsl(var(--card) / 0.9)",
      navSelectionShadow:
        "0 1px 2px hsl(var(--foreground) / 0.16), 0 3px 8px -3px hsl(var(--foreground) / 0.18)",
      ghostHover: "0.06",
      selectedViewShadow: "0 1px 2px hsl(var(--foreground) / 0.14)",
      thumbShadow: "0 1px 3px hsl(var(--foreground) / 0.3)",
      modalShadow: "0 28px 64px -14px hsl(var(--foreground) / 0.45)",
    },
    dark: {
      surfaceFillAlpha: "0.6",
      shellGroundGradient:
        "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.1) 0.7px, transparent 1.1px) 0 0 / 3px 3px, radial-gradient(circle at 3px 2px, rgb(0 0 0 / 0.14) 0.7px, transparent 1.1px) 0 0 / 5px 5px, radial-gradient(circle at 2px 5px, rgb(0 0 0 / 0.1) 0.8px, transparent 1.2px) 0 0 / 7px 7px, radial-gradient(circle at 8px 4px, rgb(0 0 0 / 0.14) 0.8px, transparent 1.2px) 0 0 / 11px 11px, linear-gradient(155deg, hsl(var(--primary-6) / 0.22), transparent 55%), linear-gradient(155deg, hsl(var(--primary-2)), hsl(var(--primary-1)))",
      shellContentEdge: "rgb(0 0 0 / 0.6)",
      shellContentShadow: "0 12px 28px -12px rgb(0 0 0 / 0.7)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.08), 0 1px 2px rgb(0 0 0 / 0.4)",
      navSelectionFill: "rgb(255 255 255 / 0.14)",
      navSelectionShadow: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
      buttonNeutralFill: "rgb(255 255 255 / 0.04)",
      ghostHover: "0.07",
      selectedViewFill: "rgb(255 255 255 / 0.12)",
      thumbShadow: "0 1px 3px rgb(0 0 0 / 0.5)",
      modalShadow: "0 28px 64px -14px rgb(0 0 0 / 0.75)",
    },
  },
}
