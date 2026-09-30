// One-time migration: Glass's `halo` axis was folded into the shared
// outerGlow axis, so its stored value has to carry forward or a user who
// tuned it silently drops to the preset's default. Halo was three steps
// against the shared four, so the mapping is lossy in one direction by design.
//
// Sci-fi's `intensity` key is removed without mapping: the preset is gone,
// and carrying its glow into another preset would restyle that preset.
const HALO_TO_OUTER: Record<string, string> = {
  none: "none",
  soft: "balanced",
  pronounced: "vivid",
}

export function migratePresetGlowAxes(ls: Storage): void {
  const halo = ls.getItem("theme-glass-halo")
  if (halo !== null) {
    const mapped = HALO_TO_OUTER[halo]
    if (mapped !== undefined && ls.getItem("theme-outer-glow") === null) {
      ls.setItem("theme-outer-glow", mapped)
    }
    ls.removeItem("theme-glass-halo")
  }

  ls.removeItem("theme-scifi-intensity")
}
