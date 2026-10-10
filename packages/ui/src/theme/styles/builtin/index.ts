import type { StyleDefinition } from "../../config/schema"
import type { StyleName } from ".."
import { flat } from "./flat"
import { glass } from "./glass"
import { quiet } from "./quiet"
import { tactile } from "./tactile"

/** Keyed in `STYLE_NAMES` order, which is the registry's style order. */
export const BUILTIN_STYLES: Readonly<Record<StyleName, StyleDefinition>> = {
  flat,
  quiet,
  tactile,
  glass,
}
