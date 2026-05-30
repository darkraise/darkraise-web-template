// One-time migration: the Glass preset was renamed from "glassmorphism"
// to "glass". Existing users have "glassmorphism" stored in their
// theme-preset LocalStorage value and their axis settings under
// theme-glassmorphism-{opacity,blur}. Rehydrate them under the new
// keys on read so their saved configuration survives the rename.
//
// Pure (operates on the passed Storage) and in its own module so it is
// unit-testable without ThemeProvider's module-load side effect or a real
// `window`. The loop is intentionally ["opacity", "blur"] only: the halo
// axis is net-new and never had a legacy "theme-glassmorphism-halo" key,
// so it must NOT be added here. Halo falls back to its "soft" default via
// the presetAxisValues hydration in ThemeProvider, not via this rename shim.
export function migrateGlassPresetKeys(ls: Storage): void {
  if (ls.getItem("theme-preset") === "glassmorphism") {
    ls.setItem("theme-preset", "glass")
  }
  for (const axis of ["opacity", "blur"] as const) {
    const oldKey = `theme-glassmorphism-${axis}`
    const newKey = `theme-glass-${axis}`
    const oldVal = ls.getItem(oldKey)
    if (oldVal !== null && ls.getItem(newKey) === null) {
      ls.setItem(newKey, oldVal)
    }
    if (oldVal !== null) {
      ls.removeItem(oldKey)
    }
  }
}
