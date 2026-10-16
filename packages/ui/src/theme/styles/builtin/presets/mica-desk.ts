import type { PresetDefinition } from "../../../config/schema"

/**
 * Mica Desk: a system blue on cool greys in an inset shell, with 4px
 * controls. Inter stands in for the system UI face. The window base is a
 * blob canvas under a faint accent bloom, showing through the rail and the
 * bar; content sits on a low-opacity slab of flat, shadowless cards that
 * frost, as menus do.
 */
export const micaDesk: PresetDefinition = {
  label: "Mica Desk",
  style: "glass",
  shellStyle: "inset",
  axes: {
    accentColor: "blue",
    surfaceColor: "zinc",
    tintWithAccent: "off",
    signalColor: "none",
    font: "inter",
    headingFont: "body",
    radius: "subtle",
    backgroundIntensity: "balanced",
  },
  signatures: {
    navSelection: "pill",
    barEdge: "none",
    menuHighlight: "neutral",
    cardDivider: "hairline",
    badgeStyle: "tint",
    fieldBorder: "bottom",
    dialogFooter: "band",
    buttonStyle: "solid",
    iconButton: "square",
    switchStyle: "track",
    checkStyle: "box",
    tabStyle: "underline",
  },
  tokens: {
    shared: {
      // Glass's frosted track and lifted pane are Glass's own; the outline
      // variants this look's tab style leaves alone keep today's.
      viewTrackSheen: "initial",
      viewTrackShadow: "initial",
      viewTrackBackdrop: "initial",
      // Twice the card alpha's distance from opaque, so the slab is the
      // fainter layer and turns opaque with the cards when the kit's
      // fallback sets the alpha to 1.
      shellContentFill:
        "hsl(var(--card) / max(0.35, calc(var(--surface-alpha) * 2 - 1)))",
      cardRadius: "calc(var(--radius) * 2)",
      overlayRadius: "calc(var(--radius) * 2)",
      dialogRadius: "calc(var(--radius) * 2)",
      navItemRadius: "var(--radius)",
      menuItemRadius: "var(--radius)",
      checkRadius: "var(--radius)",
      buttonEdge: "inset 0 -1px 0 rgb(0 0 0 / 0.4)",
      buttonShadow: "0 0 transparent",
      buttonNeutralShadow: "0 0 transparent",
      // The focused field's border is one pixel of the underline; the ring
      // adds the second inside it.
      fieldFocusBorder: "hsl(var(--primary))",
      fieldFocusRing: "inset 0 -1px 0 hsl(var(--primary))",
      scrim: "rgb(0 0 0 / 0.3)",
      pageTitleTracking: "0",
    },
    light: {
      selectedViewFill: "rgb(255 255 255 / 0.75)",
      selectedViewShadow: "0 0 0 1px hsl(var(--border-strong))",
      surfaceFillAlpha: "0.6",
      // No base layer under the bloom: the shell ground stays clear, so the
      // page canvas shows through the chrome.
      shellGroundGradient:
        "radial-gradient(80% 70% at 10% 0%, hsl(var(--primary) / 0.34), transparent 60%)",
      shellContentEdge: "rgb(0 0 0 / 0.06)",
      cardEdge: "inset 0 1px 0 rgb(255 255 255 / 0.6)",
      buttonNeutralEdge: "inset 0 -1px 0 rgb(0 0 0 / 0.1)",
      fieldShadow: "0 0 0 1px rgb(0 0 0 / 0.06)",
      fieldFocusFill: "hsl(var(--card))",
      ghostHover: "0.04",
      bannerBorder: "rgb(0 0 0 / 0.06)",
      dropdownShadow: "0 0 2px rgb(0 0 0 / 0.12), 0 8px 16px rgb(0 0 0 / 0.14)",
      modalShadow: "0 0 8px rgb(0 0 0 / 0.12), 0 32px 64px rgb(0 0 0 / 0.14)",
    },
    dark: {
      selectedViewFill: "rgb(255 255 255 / 0.14)",
      selectedViewShadow:
        "0 0 0 1px color-mix(in srgb, hsl(var(--border-strong)), hsl(var(--foreground)) 25%)",
      surfaceFillAlpha: "0.62",
      shellGroundGradient:
        "radial-gradient(80% 70% at 10% 0%, hsl(var(--primary) / 0.28), transparent 60%)",
      shellContentEdge: "rgb(0 0 0 / 0.1)",
      cardEdge: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
      buttonNeutralEdge: "0 0 transparent",
      fieldShadow: "0 0 0 1px rgb(255 255 255 / 0.08)",
      fieldFocusFill: "hsl(var(--background) / 0.7)",
      ghostHover: "0.06",
      bannerBorder: "hsl(var(--foreground) / 0.08)",
      dropdownShadow: "0 0 2px rgb(0 0 0 / 0.24), 0 8px 16px rgb(0 0 0 / 0.28)",
      modalShadow: "0 0 8px rgb(0 0 0 / 0.3), 0 32px 64px rgb(0 0 0 / 0.37)",
    },
  },
}
