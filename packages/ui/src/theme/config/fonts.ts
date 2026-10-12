import type { Font } from "../types"
import type { FontDefinition } from "./schema"

const SANS_FALLBACK = "ui-sans-serif, system-ui, -apple-system, sans-serif"
const SERIF_FALLBACK =
  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'

/** The faces the kit ships; theme.css declares each one's `[data-font]` and `[data-heading-font]` rules. */
export const BUILTIN_FONTS: Readonly<Record<Font, FontDefinition>> = {
  inter: {
    label: "Inter",
    family: `"Inter Variable", ${SANS_FALLBACK}`,
    role: "sans",
  },
  geist: {
    label: "Geist",
    family: `"Geist Variable", ${SANS_FALLBACK}`,
    role: "sans",
  },
  "ibm-plex-sans": {
    label: "IBM Plex Sans",
    family: `"IBM Plex Sans Variable", ${SANS_FALLBACK}`,
    role: "sans",
  },
  newsreader: {
    label: "Newsreader",
    family: `"Newsreader Variable", ${SERIF_FALLBACK}`,
    role: "serif",
  },
}
