export { BUILTIN_STYLES } from "./builtin"

export const STYLE_NAMES = ["flat", "quiet", "tactile", "glass"] as const

export type StyleName = (typeof STYLE_NAMES)[number]
