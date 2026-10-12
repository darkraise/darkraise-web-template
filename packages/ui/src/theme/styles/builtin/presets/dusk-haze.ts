import type { PresetDefinition } from "../../../config/schema"

/**
 * Dusk Haze: an indigo accent whose hue tints the neutrals, in a flat shell
 * with pill controls. Geist stands in for Hanken Grotesk. The ground is a
 * haze of the neutral ramp under one soft light, with low ridges along the
 * bottom; panes are thin milk glass in a pale rim, buttons are flat
 * capsules, and the type is set light.
 */
export const duskHaze: PresetDefinition = {
  label: "Dusk Haze",
  style: "glass",
  shellStyle: "flat",
  axes: {
    accentColor: "indigo",
    surfaceColor: "sand",
    tintWithAccent: "on",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    radius: "pill",
    gradientPattern: "spotlight",
    backgroundIntensity: "subtle",
  },
  signatures: {
    navSelection: "pill",
    navMarker: "none",
    menuHighlight: "neutral",
    labelCase: "none",
    cardDivider: "hairline",
    bannerSurface: "card",
    badgeStyle: "tint",
    fieldFill: "translucent",
  },
  tokens: {
    shared: {
      cardRadius: "calc(var(--radius) * 0.75)",
      overlayRadius: "calc(var(--radius) * 0.75)",
      dialogRadius: "var(--radius)",
      bannerRadius: "calc(var(--radius) * 0.75)",
      badgeRadius: "calc(var(--radius) * 0.25)",
      checkRadius: "calc(var(--radius) * 0.25)",
      navItemRadius: "calc(var(--radius) * 0.5)",
      menuItemRadius: "calc(var(--radius) * 0.5)",
      segmentRadius: "calc(var(--radius) * 0.625)",
      // Flat capsules in both modes.
      buttonEdge: "0 0 transparent",
      buttonShadow: "0 0 transparent",
      buttonNeutralEdge: "0 0 transparent",
      buttonNeutralShadow: "0 0 transparent",
      buttonWeight: "400",
      uiWeight: "380",
      pageTitleWeight: "380",
      pageTitleTracking: "-0.015em",
      sectionTitleWeight: "450",
      sectionTitleTracking: "-0.012em",
      dialogTitleWeight: "450",
      dialogTitleTracking: "-0.012em",
      figureWeight: "360",
    },
    light: {
      // No base layer: the haze thins towards the top, where the page
      // canvas shows. Text stands on this ground, so the ridges stay above
      // the tone the muted ink clears 4.5:1 on.
      shellGroundFill:
        "radial-gradient(42% 24% at 46% 12%, rgb(255 255 255 / 0.85), transparent 70%), radial-gradient(90% 34% at 16% 104%, hsl(var(--neutral-7) / 0.14), transparent 70%), radial-gradient(80% 30% at 90% 106%, hsl(var(--neutral-7) / 0.16), transparent 70%), linear-gradient(180deg, hsl(var(--neutral-6) / 0.35), hsl(var(--neutral-6)) 46%)",
      surfaceFillAlpha: "0.72",
      surfaceBackdrop: "blur(20px) saturate(140%)",
      // The rail's glass is thinner than a card's and follows the card
      // alpha, so it turns opaque with the cards when the kit's fallback
      // sets the alpha to 1.
      chromeFlatFill:
        "hsl(var(--card) / calc(var(--surface-fill-alpha) * 1.6 - 0.6))",
      cardBorder: "rgb(255 255 255 / 0.75)",
      cardEdge:
        "0 0 0 1px hsl(var(--foreground) / 0.06), 0 10px 28px -14px hsl(var(--foreground) / 0.22)",
      buttonNeutralFill: "hsl(var(--foreground) / 0.06)",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.18)",
      selectedViewShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.12), 0 1px 2px hsl(var(--foreground) / 0.06)",
      thumbShadow: "0 1px 2px hsl(var(--foreground) / 0.2)",
      overlayBorder: "hsl(var(--foreground) / 0.12)",
      dropdownShadow: "0 12px 32px -8px hsl(var(--foreground) / 0.22)",
      modalShadow:
        "0 0 3px rgb(0 0 0 / 0.05), 0 8px 12px rgb(0 0 0 / 0.05), 0 12px 20px rgb(0 0 0 / 0.05), 0 30px 60px -20px hsl(var(--foreground) / 0.3)",
      scrim: "hsl(var(--foreground) / 0.24)",
    },
    dark: {
      shellGroundFill:
        "radial-gradient(38% 20% at 45% 22%, hsl(var(--primary-text) / 0.14), transparent 70%), radial-gradient(60% 30% at 82% 8%, hsl(var(--neutral-7) / 0.1), transparent 70%), linear-gradient(180deg, hsl(var(--neutral-3) / 0.7), transparent 70%)",
      surfaceFillAlpha: "0.7",
      surfaceBackdrop: "blur(20px)",
      chromeFlatFill:
        "hsl(var(--card) / calc(var(--surface-fill-alpha) * 1.25 - 0.25))",
      cardBorder: "hsl(var(--foreground) / 0.14)",
      cardEdge:
        "0 0 3px rgb(0 0 0 / 0.05), 0 8px 12px rgb(0 0 0 / 0.05), 0 12px 20px rgb(0 0 0 / 0.05)",
      buttonNeutralFill: "hsl(var(--foreground) / 0.14)",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.35)",
      selectedViewFill: "hsl(var(--foreground) / 0.16)",
      selectedViewShadow: "0 0 0 1px hsl(var(--foreground) / 0.24)",
      thumbShadow: "0 1px 2px rgb(0 0 0 / 0.2)",
      overlayBorder: "hsl(var(--foreground) / 0.16)",
      dropdownShadow: "0 16px 40px -8px rgb(0 0 0 / 0.6)",
      modalShadow: "0 30px 70px -20px rgb(0 0 0 / 0.7)",
      scrim: "rgb(0 0 0 / 0.42)",
    },
  },
}
