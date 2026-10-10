/** Every paint token a style or preset may set: schema name to custom property. */
export const PAINT_TOKENS = {
  buttonEdge: "--btn-edge",
  buttonSheen: "--btn-sheen",
  buttonShadow: "--btn-shadow",
  buttonNeutralEdge: "--btn-neutral-edge",
  buttonNeutralSheen: "--btn-neutral-sheen",
  buttonNeutralShadow: "--btn-neutral-shadow",
  fieldShadow: "--field-shadow",
  checkWellShadow: "--check-well-shadow",
  thumbShadow: "--thumb-shadow",
  selectedViewShadow: "--selected-view-shadow",
  cardEdge: "--card-edge",
  cardSheen: "--card-sheen",
  trackWell: "--track-well",
  chromeRailFill: "--chrome-rail-bg",
  chromeBarFill: "--chrome-bar-bg",
  chromeEdge: "--chrome-edge",
  chromeShadow: "--chrome-shadow",
  chromeBackdrop: "--chrome-backdrop",
  chromeCanvas: "--chrome-canvas",
  overlayFillLayers: "--surface-overlay-layers",
  overlayFillBase: "--surface-overlay-base",
  overlayFillBlend: "--surface-overlay-blend-mode",
  overlayBorder: "--overlay-border",
  overlayShadow: "--overlay-shadow",
  overlayBackdrop: "--overlay-backdrop",
  dropdownShadow: "--shadow-dropdown",
} as const

export type PaintToken = keyof typeof PAINT_TOKENS

/**
 * Opaque, unblurred values the kit restores under reduced transparency or
 * more contrast, whatever the style or preset set. Each equals the token's
 * light `@layer base` value in theme.css.
 */
export const KIT_FALLBACK: Readonly<Partial<Record<PaintToken, string>>> = {
  chromeBackdrop: "none",
  chromeCanvas: "none",
  overlayBackdrop: "none",
  overlayFillLayers: "",
  overlayFillBase: "hsl(var(--popover))",
  overlayFillBlend: "normal",
}
