import { flat } from "./flat/flat"
import { glass } from "./glass/glass"
import { quiet } from "./quiet/quiet"
import { tactile } from "./tactile/tactile"
import type { StyleRecord } from "./types"

export const STYLE_NAMES = ["flat", "quiet", "tactile", "glass"] as const

export type StyleName = (typeof STYLE_NAMES)[number]

export const STYLES: Readonly<Record<StyleName, StyleRecord>> = {
  flat,
  quiet,
  tactile,
  glass,
}

export type { StyleRecord }
