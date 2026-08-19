// One-time migration: the accent axis was renamed from `accentVibrancy` to
// `accentIntensity` so the three intensity axes share a suffix. Without this,
// an existing user's stored value is orphaned and they silently drop back to
// `balanced` on next load.
//
// Pure (operates on the passed Storage) and in its own module so it is
// unit-testable without ThemeProvider's module-load side effect or a real
// `window`, matching migrateGlassPresetKeys.
export function migrateAccentIntensityKey(ls: Storage): void {
  const oldKey = "theme-accent-vibrancy"
  const newKey = "theme-accent-intensity"
  const oldVal = ls.getItem(oldKey)
  if (oldVal === null) return
  // A value already written under the new key wins: it is the more recent
  // choice, made after the rename shipped.
  if (ls.getItem(newKey) === null) {
    ls.setItem(newKey, oldVal)
  }
  ls.removeItem(oldKey)
}
