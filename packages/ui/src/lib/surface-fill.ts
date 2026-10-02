/**
 * Which plane a card or overlay paints: its own card plane (the default), the
 * page, the muted fill, or nothing. An explicit value overrides an ancestor's.
 */
export type SurfaceFill = "card" | "page" | "muted" | "none"
