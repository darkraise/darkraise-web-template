import type { PresetDefinition } from "../../../config/schema"

/**
 * Fractal noise in one ink, black (`0`) or white (`1`), as a background
 * image. `alpha` scales the noise, so the mean cover is about half of it.
 */
const grain = (ink: 0 | 1, alpha: number): string =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${ink} 0 0 0 0 ${ink} 0 0 0 0 ${ink} ${alpha} 0 0 0 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

/**
 * Card Stock: paper sheets on a warm desk under a muted navy, with serif
 * titles and tight corners. The navy carries about half the blue ramp's
 * chroma, which only dark mode can calm. Geist stands in for Figtree and
 * Newsreader for Fraunces.
 *
 * The rail and the bar are plain text on the desk and the content is one
 * sheet, edged like a card. Every raised part is a sheet of paper: a
 * hairline ring and a short contact shadow, where Tactile bevels all four
 * sides. A value that holds a black, white or ink shadow is written per
 * mode: this layer sits above Tactile's dark values, so a shared one would
 * reach dark mode as well.
 *
 * The light desk is the muted step and no deeper: in a shell whose content
 * is not detached the page stands on the shell ground, and status text holds
 * 4.5:1 there only down to that step. The light sheet is the card colour, so
 * it is lighter than the page the text tiers are solved on.
 *
 * Each card sheen opens with a white alpha of 0, top down, ahead of its
 * grain: the lifted field edge is solved for a card face no lighter than the
 * elevation lift plus that alpha. The light grain is black and leaves the
 * card's mean tone at the page colour; the dark grain is white at a mean
 * cover of 0.015, inside what a sheen may add.
 */
export const cardStock: PresetDefinition = {
  label: "Card Stock",
  style: "tactile",
  shellStyle: "inset",
  axes: {
    accentColor: "blue",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "newsreader",
    radius: "subtle",
    darkAccentChroma: "calm",
  },
  signatures: {
    barTone: "page",
    barSpan: "content",
    labelCase: "auto",
    tooltipTone: "inverse",
    cardDivider: "hairline",
    tableHead: "plain",
    badgeStyle: "outline",
    fieldFill: "well",
    dialogFooter: "plain",
    avatarShape: "round",
    switchStyle: "slide",
    checkStyle: "outline",
    sliderStyle: "bar",
  },
  tokens: {
    shared: {
      buttonSheen: "none",
      fieldFocusRing: "0 0 0 3px hsl(var(--primary) / 0.2)",
      fieldFocusBorder: "hsl(var(--primary-text))",
      checkRadius: "calc(var(--radius) * 0.75)",
      switchRadius: "calc(var(--radius) * 0.75)",
      bannerRadius: "var(--radius)",
      shellContentEdge: "transparent",
      shellContentShadow: "0 0 transparent",
      pageTitleWeight: "600",
      pageTitleTracking: "-0.02em",
      sectionTitleWeight: "600",
      sectionTitleTracking: "-0.01em",
      dialogTitleWeight: "600",
      dialogTitleTracking: "-0.01em",
    },
    light: {
      buttonEdge: "inset 0 1px 0 rgb(255 255 255 / 0.15)",
      buttonShadow:
        "0 1px 0 rgb(0 0 0 / 0.35), 0 2px 3px -1px rgb(0 0 0 / 0.25)",
      buttonDangerShadow:
        "0 1px 0 rgb(0 0 0 / 0.35), 0 2px 3px -1px rgb(0 0 0 / 0.25)",
      buttonNeutralEdge: "inset 0 1px 0 rgb(255 255 255)",
      buttonNeutralShadow:
        "0 1px 0 hsl(var(--foreground) / 0.1), 0 1px 2px hsl(var(--foreground) / 0.06)",
      fieldShadow:
        "inset 0 1px 1.5px hsl(var(--foreground) / 0.14), 0 1px 0 rgb(255 255 255 / 0.8)",
      thumbShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.16), 0 1px 2px hsl(var(--foreground) / 0.22)",
      selectedViewFill: "hsl(var(--card))",
      selectedViewShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.1), 0 1px 2px hsl(var(--foreground) / 0.12)",
      cardEdge:
        "0 0 0 1px hsl(var(--foreground) / 0.08), 0 1px 1px hsl(var(--foreground) / 0.08), 0 2px 4px -1px hsl(var(--foreground) / 0.08), 0 8px 16px -8px hsl(var(--foreground) / 0.12)",
      cardSheen: `linear-gradient(180deg, rgb(255 255 255 / 0), rgb(255 255 255 / 0)), ${grain(0, 0.05)}`,
      dropdownShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.1), 0 8px 20px -6px hsl(var(--foreground) / 0.25)",
      modalShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.08), 0 4px 8px -4px hsl(var(--foreground) / 0.12), 0 24px 48px -16px hsl(var(--foreground) / 0.35)",
      scrim: "hsl(var(--foreground) / 0.28)",
      shellGroundFill: "hsl(var(--neutral-3))",
      shellContentFill: "hsl(var(--card))",
      navSelectionFill: "hsl(var(--card))",
      navSelectionShadow:
        "0 0 0 1px hsl(var(--foreground) / 0.08), 0 1px 2px hsl(var(--foreground) / 0.14), 0 4px 8px -4px hsl(var(--foreground) / 0.22)",
      bannerShadow:
        "0 1px 1px hsl(var(--foreground) / 0.08), 0 2px 4px -2px hsl(var(--foreground) / 0.12)",
    },
    dark: {
      buttonEdge: "inset 0 1px 0 rgb(255 255 255 / 0.3)",
      buttonShadow: "0 1px 0 rgb(0 0 0 / 0.5), 0 2px 3px -1px rgb(0 0 0 / 0.4)",
      buttonDangerShadow:
        "0 1px 0 rgb(0 0 0 / 0.5), 0 2px 3px -1px rgb(0 0 0 / 0.4)",
      buttonNeutralEdge: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
      buttonNeutralShadow: "0 1px 2px rgb(0 0 0 / 0.35)",
      fieldShadow:
        "inset 0 1px 2px rgb(0 0 0 / 0.45), 0 1px 0 rgb(255 255 255 / 0.04)",
      thumbShadow: "0 0 0 1px rgb(0 0 0 / 0.4), 0 1px 2px rgb(0 0 0 / 0.5)",
      selectedViewFill: "hsl(var(--neutral-4))",
      selectedViewShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.4)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.04), 0 0 0 1px rgb(0 0 0 / 0.35), 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 16px -8px rgb(0 0 0 / 0.5)",
      cardSheen: `linear-gradient(180deg, rgb(255 255 255 / 0), rgb(255 255 255 / 0)), ${grain(1, 0.03)}`,
      dropdownShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.4), 0 8px 20px -6px rgb(0 0 0 / 0.6)",
      modalShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.4), 0 24px 48px -16px rgb(0 0 0 / 0.7)",
      scrim: "rgb(0 0 0 / 0.5)",
      shellContentFill: "transparent",
      navSelectionFill: "hsl(var(--muted))",
      navSelectionShadow:
        "inset 0 1px 0 rgb(255 255 255 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.35), 0 4px 8px -4px rgb(0 0 0 / 0.6)",
      bannerShadow: "0 1px 2px rgb(0 0 0 / 0.4)",
    },
  },
}
