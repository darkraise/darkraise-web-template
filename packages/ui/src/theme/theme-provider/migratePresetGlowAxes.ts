// One-time migration: Glass's `halo` axis and Sci-fi's `intensity` axis were
// folded into the shared outerGlow / innerGlow axes, so their stored values
// have to carry forward or a user who tuned either silently drops to their
// preset's default.
//
// Glass's halo was three steps against the shared four; Sci-fi's `intense` has
// no equivalent because the shared scale tops out lower by design, so it lands
// on `vivid` alongside `bright`. Both mappings are lossy in that one direction
// and that is intentional — see the design doc.
const HALO_TO_OUTER: Record<string, string> = {
  none: "none",
  soft: "balanced",
  pronounced: "vivid",
}

const INTENSITY_TO_GLOW: Record<string, string> = {
  dim: "subtle",
  normal: "balanced",
  bright: "vivid",
  intense: "vivid",
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

  const intensity = ls.getItem("theme-scifi-intensity")
  if (intensity !== null) {
    const mapped = INTENSITY_TO_GLOW[intensity]
    if (mapped !== undefined) {
      // Sci-fi's single axis drove both the inset and outer layers, so it seeds
      // both shared axes.
      if (ls.getItem("theme-outer-glow") === null) {
        ls.setItem("theme-outer-glow", mapped)
      }
      if (ls.getItem("theme-inner-glow") === null) {
        ls.setItem("theme-inner-glow", mapped)
      }
    }
    ls.removeItem("theme-scifi-intensity")
  }
}
