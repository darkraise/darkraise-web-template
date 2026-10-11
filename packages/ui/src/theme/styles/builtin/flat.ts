import type { StyleDefinition } from "../../config/schema"

/** Flat draws no depth on controls, in either mode. */
export const flat: StyleDefinition = {
  label: "Flat",
  signatures: { navSelection: "pill" },
  defaults: { elevation: "flat" },
  tokens: {
    shared: {
      buttonEdge: "0 0 transparent",
      buttonSheen: "none",
      buttonShadow: "0 0 transparent",
      buttonNeutralEdge: "0 0 transparent",
      buttonNeutralSheen: "none",
      buttonNeutralShadow: "0 0 transparent",
      fieldShadow: "0 0 transparent",
      checkWellShadow: "0 0 transparent",
      thumbShadow: "0 0 transparent",
      selectedViewShadow: "0 0 transparent",
    },
  },
}
