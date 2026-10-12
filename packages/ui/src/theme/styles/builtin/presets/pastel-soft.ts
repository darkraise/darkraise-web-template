import type { PresetDefinition } from "../../../config/schema"

/**
 * Pastel Soft-Flat: borderless white cards on warm cream paper with a faint
 * dot grain under the whole shell, an indigo accent whose palest tint fills
 * the secondary action, and pill controls. The chrome gives up its fill, so
 * only the white chip of the current nav row marks the rail. Geist stands in
 * for Figtree.
 */
export const pastelSoft: PresetDefinition = {
  label: "Pastel Soft-Flat",
  style: "flat",
  shellStyle: "flat",
  axes: {
    accentColor: "indigo",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "body",
    radius: "pill",
  },
  signatures: {
    navSelection: "chip",
    menuHighlight: "tint",
    labelCase: "auto",
  },
  tokens: {
    shared: {
      shellGroundFill:
        "radial-gradient(hsl(var(--foreground) / 0.07) 1px, transparent 1px) 0 0 / 12px 12px, hsl(var(--background))",
      chromeFlatFill: "transparent",
      navSelectionShadow: "0 0 transparent",
      navItemRadius: "var(--radius-control)",
      cardBorder: "transparent",
      cardRadius: "calc(var(--radius) * 1.5)",
      overlayRadius: "var(--radius)",
      dialogRadius: "calc(var(--radius) * 1.75)",
      menuItemRadius: "calc(var(--radius) * 0.625)",
      bannerRadius: "var(--radius)",
      bannerBorder: "transparent",
      checkRadius: "calc(var(--radius) * 0.375)",
      segmentRadius: "var(--radius-control)",
      buttonNeutralFill: "hsl(var(--primary-3))",
      fieldFocusRing:
        "0 0 0 2px hsl(var(--card)), 0 0 0 4px hsl(var(--primary))",
      sectionTitleTracking: "-0.02em",
      dialogTitleTracking: "-0.02em",
    },
    dark: {
      shellGroundFill:
        "radial-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px) 0 0 / 12px 12px, hsl(var(--background))",
    },
  },
}
