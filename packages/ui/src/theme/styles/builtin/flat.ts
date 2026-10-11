import type { StyleDefinition } from "../../config/schema"

/**
 * Tool panels on a grey canvas: depth comes only from surface tone, never
 * from a shadow. Panels, popovers and dialogs round 1.625 times the base
 * radius (13px at the default step) over 5-8px controls; fields are
 * borderless wells whose bottom edge alone holds 3:1.
 */
export const flat: StyleDefinition = {
  label: "Flat",
  defaults: { elevation: "flat" },
  signatures: {
    navSelection: "accent",
    menuHighlight: "solid",
    tooltipTone: "inverse",
    fieldBorder: "none",
    tableHead: "plain",
    rowSelection: "accent",
    labelCase: "none",
    badgeStyle: "tint",
    bannerMark: "icon",
    dialogHeader: "band",
  },
  tokens: {
    shared: {
      buttonEdge: "0 0 transparent",
      buttonSheen: "none",
      buttonShadow: "0 0 transparent",
      buttonDangerShadow: "0 0 transparent",
      buttonNeutralEdge: "0 0 transparent",
      buttonNeutralSheen: "none",
      buttonNeutralShadow: "0 0 transparent",
      buttonNeutralFill: "hsl(var(--card))",
      fieldShadow: "0 0 transparent",
      checkWellShadow: "0 0 transparent",
      thumbShadow: "0 0 0 1px rgb(0 0 0 / 0.14)",
      selectedViewShadow: "0 0 0 1px hsl(var(--border))",
      checkRadius: "calc(var(--radius) / 4)",
      cardRadius: "calc(var(--radius) * 1.625)",
      overlayRadius: "calc(var(--radius) * 1.625)",
      dropdownShadow: "0 0 transparent",
      modalShadow: "0 0 transparent",
      scrim: "color-mix(in oklab, #000 42%, transparent)",
      badgeRadius: "calc(var(--radius-control) * 0.625)",
      bannerRadius: "calc(var(--radius-control) * 0.625)",
    },
    dark: {
      thumbShadow: "0 0 transparent",
      scrim: "color-mix(in oklab, #000 55%, transparent)",
    },
  },
}
