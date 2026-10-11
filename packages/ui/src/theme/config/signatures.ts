import { SIDEBAR_SELECTIONS, type SidebarSelection } from "../types"

const NAV_SELECTIONS = SIDEBAR_SELECTIONS.filter(
  (value): value is SidebarSelection => value !== "auto",
)

/**
 * The structural choices a style or preset makes, each from a fixed list the
 * kit implements. The first value is the kit default, today's look.
 */
export const SIGNATURES = {
  navSelection: { values: NAV_SELECTIONS, default: "chip" },
  navMarker: { values: ["auto", "none", "bar", "rule"], default: "auto" },
  railTone: {
    values: ["page", "raised", "inverse", "accent"],
    default: "page",
  },
  barTone: {
    values: ["page", "raised", "inverse", "accent"],
    default: "page",
  },
  barSpan: { values: ["content", "full"], default: "content" },
  barEdge: { values: ["rule", "none", "veil"], default: "rule" },
  menuHighlight: { values: ["neutral", "tint", "solid"], default: "neutral" },
  menuTone: { values: ["surface", "inverse"], default: "surface" },
  tooltipTone: {
    values: ["overlay", "inverse", "accent"],
    default: "overlay",
  },
  /** `auto` is today: sidebar and stacked aside labels upper, the rest as written. */
  labelCase: {
    values: ["auto", "upper", "none", "lower"],
    default: "auto",
  },
  figureFamily: { values: ["sans", "mono"], default: "sans" },
  cardDivider: { values: ["none", "hairline", "seam"], default: "none" },
  cardFooter: { values: ["plain", "inset"], default: "plain" },
  bannerMark: {
    values: ["stripe", "rule", "icon", "lamp"],
    default: "stripe",
  },
  bannerSurface: { values: ["tint", "card"], default: "tint" },
  badgeStyle: {
    values: ["subtle", "tint", "chip", "outline"],
    default: "subtle",
  },
  fieldFill: { values: ["well", "surface", "translucent"], default: "well" },
  fieldBorder: { values: ["box", "bottom", "none"], default: "box" },
  tableHead: { values: ["band", "plain", "ruled", "seam"], default: "band" },
  rowSelection: { values: ["tint", "accent", "stripe"], default: "tint" },
  dialogHeader: { values: ["plain", "band"], default: "plain" },
  dialogFooter: { values: ["plain", "ruled", "band"], default: "plain" },
  ghostButton: { values: ["wash", "link"], default: "wash" },
  avatarShape: { values: ["round", "square"], default: "round" },
} as const

export type SignatureKey = keyof typeof SIGNATURES

export type SignatureValues = {
  [K in SignatureKey]: (typeof SIGNATURES)[K]["values"][number]
}

export type SignatureMap = Partial<SignatureValues>

export const SIGNATURE_KEYS = Object.keys(SIGNATURES) as SignatureKey[]

export type StampedSignature = Exclude<SignatureKey, "navSelection">

/** Every signature but navSelection, which the sidebarSelection axis resolves. */
export const STAMPED_SIGNATURES = SIGNATURE_KEYS.filter(
  (key): key is StampedSignature => key !== "navSelection",
)

/** The attribute a signature is stamped as on `<html>`, e.g. `data-nav-marker`. */
export function signatureAttribute(key: StampedSignature): string {
  return `data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}
