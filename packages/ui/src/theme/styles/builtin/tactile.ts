import type { StyleDefinition } from "../../config/schema"

/**
 * A sheen over a light label fades out by 20% of the height, above the
 * glyphs: the fills sit at their label's 4.5:1 floor.
 */
export const tactile: StyleDefinition = {
  label: "Tactile",
  tokens: {
    shared: {
      buttonEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.22), inset 0 -1px 0 rgb(0 0 0 / 0.14)",
      buttonSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.16), transparent 20%)",
      buttonShadow:
        "0 1px 2px rgb(0 0 0 / 0.14), 0 2px 5px -2px rgb(0 0 0 / 0.14)",
      buttonNeutralSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.7), transparent)",
      buttonNeutralShadow:
        "0 1px 2px rgb(0 0 0 / 0.14), 0 2px 5px -2px rgb(0 0 0 / 0.14)",
      fieldShadow: "inset 0 1px 2px rgb(0 0 0 / 0.07)",
      checkWellShadow: "inset 0 1px 2px rgb(0 0 0 / 0.07)",
      thumbShadow: "0 1px 2px rgb(0 0 0 / 0.25), 0 0 0 0.5px rgb(0 0 0 / 0.08)",
      selectedViewShadow:
        "0 1px 2px rgb(0 0 0 / 0.1), 0 0 0 0.5px rgb(0 0 0 / 0.06)",
      cardEdge:
        "0 1px 2px rgb(0 0 0 / 0.07), 0 3px 8px -3px rgb(0 0 0 / 0.08), inset 0 -1px 0 rgb(0 0 0 / 0.04)",
      trackWell: "inset 0 1px 2px rgb(0 0 0 / 0.06)",
    },
    dark: {
      buttonEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.3), inset 0 -1px 0 rgb(0 0 0 / 0.35)",
      buttonSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.16), transparent 20%)",
      buttonShadow:
        "0 1px 2px rgb(0 0 0 / 0.5), 0 2px 6px -2px rgb(0 0 0 / 0.45)",
      buttonNeutralSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 20%)",
      buttonNeutralShadow:
        "0 1px 2px rgb(0 0 0 / 0.5), 0 2px 6px -2px rgb(0 0 0 / 0.45)",
      fieldShadow:
        "inset 0 1px 3px rgb(0 0 0 / 0.7), inset 0 -1px 0 rgb(255 255 255 / 0.06)",
      checkWellShadow:
        "inset 0 1px 2px rgb(0 0 0 / 0.5), inset 0 -1px 0 rgb(255 255 255 / 0.04)",
      thumbShadow: "0 1px 3px rgb(0 0 0 / 0.55)",
      selectedViewShadow:
        "0 1px 2px rgb(0 0 0 / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.14)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.1), 0 1px 2px rgb(0 0 0 / 0.7), 0 4px 10px -4px rgb(0 0 0 / 0.6)",
      cardSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.015), transparent 70%)",
      trackWell:
        "inset 0 1px 3px rgb(0 0 0 / 0.6), inset 0 -1px 0 rgb(255 255 255 / 0.05)",
      buttonNeutralEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.1), inset 0 -1px 0 rgb(0 0 0 / 0.4)",
    },
  },
}
