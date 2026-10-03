import { PRESET_NAMES, presets } from "@theme/presets"
import { AXES, AXIS_KEYS } from "./registry"
import { presetAxisStorageKey } from "./settings"

/** The table's revision; a browser stores the one it last ran. */
export const LEGACY_REVISION = 1

export const LEGACY_MARKER_KEY = "theme-settings-version"

export interface LegacyCondition {
  key: string
  /** The payload field; a rule with a condition lacking one skips payloads. */
  field?: string
  /** Holds when the value is one of these. */
  values?: string[]
  /** Holds when the value is absent or none of these. */
  except?: string[]
}

/** Plain JSON, so the pre-render script can embed the table. */
export interface LegacyRule {
  /** Table revision that added the rule; a browser at a lower marker runs it. */
  since: number
  /**
   * Every condition must hold. A condition without `values` or `except` holds
   * when its key is present; an empty list always holds.
   */
  when: LegacyCondition[]
  /** Maps the first condition's value to target values; `"*"` matches any value. */
  map?: Record<string, Record<string, string>>
  /** Targets written when `map` is absent, keyed by storage key. */
  set?: Record<string, string>
  /** Storage keys removed after the rule runs; a payload loses their fields. */
  remove?: string[]
  /**
   * Write targets even when they hold a valid value: one of the target's
   * `LEGACY_TARGETS` values, or for a legacy key outside them, any value.
   */
  overwrite?: boolean
}

// The accents 6.9.6 also offered as surface colours. A fixed list, because the
// accent palette may grow without those names ever having been stored.
const V6_ACCENT_SURFACES = [
  "red",
  "coral",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]

export const LEGACY_RULES: readonly LegacyRule[] = [
  {
    since: 1,
    when: [{ key: "theme-preset", field: "preset", values: ["glassmorphism"] }],
    set: { "theme-preset": "glass" },
  },
  {
    since: 1,
    when: [{ key: "theme-glassmorphism-opacity" }],
    map: {
      subtle: { "theme-glass-opacity": "subtle" },
      medium: { "theme-glass-opacity": "medium" },
      strong: { "theme-glass-opacity": "strong" },
    },
    remove: ["theme-glassmorphism-opacity"],
  },
  {
    since: 1,
    when: [{ key: "theme-glassmorphism-blur" }],
    map: {
      none: { "theme-glass-blur": "none" },
      low: { "theme-glass-blur": "low" },
      medium: { "theme-glass-blur": "medium" },
      high: { "theme-glass-blur": "high" },
    },
    remove: ["theme-glassmorphism-blur"],
  },
  {
    since: 1,
    when: [{ key: "theme-canvas-tint" }],
    map: {
      neutral: { "theme-bg-intensity": "neutral" },
      subtle: { "theme-bg-intensity": "subtle" },
      balanced: { "theme-bg-intensity": "balanced" },
      vivid: { "theme-bg-intensity": "vivid" },
    },
    remove: ["theme-canvas-tint"],
  },
  // Lands on the 6.x accent intensity key, which a later rule maps to dark
  // accent chroma.
  {
    since: 1,
    when: [{ key: "theme-accent-vibrancy" }],
    map: {
      calm: { "theme-accent-intensity": "calm" },
      balanced: { "theme-accent-intensity": "balanced" },
      vivid: { "theme-accent-intensity": "vivid" },
      intense: { "theme-accent-intensity": "intense" },
    },
    remove: ["theme-accent-vibrancy"],
  },
  {
    since: 1,
    when: [{ key: "theme-glass-halo" }],
    map: {
      none: { "theme-outer-glow": "none" },
      soft: { "theme-outer-glow": "balanced" },
      pronounced: { "theme-outer-glow": "vivid" },
    },
    remove: ["theme-glass-halo"],
  },
  {
    since: 1,
    when: [],
    remove: ["theme-scifi-intensity", "theme-scifi-frame"],
  },
  {
    since: 1,
    when: [
      { key: "theme-preset", field: "preset", values: ["glass"] },
      { key: "theme-bg-style", field: "backgroundStyle", values: ["solid"] },
    ],
    set: { "theme-bg-style": "gradient" },
    overwrite: true,
  },
  {
    since: 1,
    when: [
      {
        key: "theme-surface-color",
        field: "surfaceColor",
        values: V6_ACCENT_SURFACES,
      },
    ],
    set: { "theme-surface-color": "zinc", "theme-tint-with-accent": "on" },
  },
  // 6.9.6 glass and sci-fi painted both intensities at the config default
  // whatever was stored, so a stored value there was never the user's visible
  // choice. These two rules must run before the sci-fi preset is dropped.
  {
    since: 1,
    when: [
      { key: "theme-surface-intensity", field: "surfaceIntensity" },
      { key: "theme-preset", field: "preset", except: ["glass", "scifi"] },
    ],
    map: {
      flat: { "theme-contrast": "low" },
      subtle: { "theme-contrast": "standard" },
      balanced: { "theme-contrast": "standard" },
      bold: { "theme-contrast": "high" },
    },
    remove: ["theme-surface-intensity"],
  },
  {
    since: 1,
    when: [
      { key: "theme-accent-intensity", field: "accentIntensity" },
      { key: "theme-preset", field: "preset", except: ["glass", "scifi"] },
    ],
    map: {
      calm: { "theme-dark-accent-chroma": "calm" },
      balanced: { "theme-dark-accent-chroma": "standard" },
      vivid: { "theme-dark-accent-chroma": "vivid" },
      intense: { "theme-dark-accent-chroma": "vivid" },
    },
    remove: ["theme-accent-intensity"],
  },
  {
    since: 1,
    when: [{ key: "theme-preset", field: "preset", values: ["scifi"] }],
    remove: ["theme-preset"],
  },
  {
    since: 1,
    when: [
      { key: "theme-elevation", field: "elevation", values: ["low", "medium"] },
    ],
    set: { "theme-elevation": "standard" },
  },
  {
    since: 1,
    when: [],
    remove: [
      "theme-surface-intensity",
      "theme-accent-intensity",
      "theme-control-depth",
      "theme-button-elevation",
    ],
  },
]

function buildTargets(): Record<string, readonly string[]> {
  const out: Record<string, readonly string[]> = {}
  for (const key of AXIS_KEYS) out[AXES[key].storageKey] = AXES[key].values
  for (const name of PRESET_NAMES) {
    const axes = presets[name].axes as Record<
      string,
      { values: readonly string[] }
    >
    for (const [axis, definition] of Object.entries(axes)) {
      out[presetAxisStorageKey(name, axis)] = definition.values
    }
  }
  return out
}

/** Storage key to the values a 7.0 reader accepts, for every token cache input. */
export const LEGACY_TARGETS: Readonly<Record<string, readonly string[]>> =
  buildTargets()

// The payload field each storage key a rule writes or removes is synced as.
const PAYLOAD_FIELDS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(AXIS_KEYS.map((key) => [AXES[key].storageKey, key])),
  "theme-surface-intensity": "surfaceIntensity",
  "theme-accent-intensity": "accentIntensity",
  "theme-control-depth": "controlDepth",
  "theme-button-elevation": "buttonElevation",
}

interface Slots {
  read(name: string): string | null
  write(name: string, value: string | null): void
}

const own = (record: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key)

function matches(condition: LegacyCondition, value: string | null): boolean {
  if (condition.values) {
    return value !== null && condition.values.includes(value)
  }
  if (condition.except) {
    return value === null || !condition.except.includes(value)
  }
  return value !== null
}

// The pre-render script runs a hand-written ES5 copy of this loop over storage;
// prerender parity tests hold the two to the same result.
function applyRules(
  rules: readonly LegacyRule[],
  slots: Slots,
  conditionName: (condition: LegacyCondition) => string | undefined,
  targetName: (key: string) => string | undefined,
): void {
  for (const rule of rules) {
    const names = rule.when.map(conditionName)
    if (names.includes(undefined)) continue
    const held: (string | null)[] = []
    let holds = true
    for (let i = 0; i < rule.when.length && holds; i++) {
      const value = slots.read(names[i] as string)
      held.push(value)
      holds = matches(rule.when[i] as LegacyCondition, value)
    }
    if (!holds) continue
    const first = held[0]
    const targets = rule.map
      ? typeof first === "string" && own(rule.map, first)
        ? rule.map[first]
        : own(rule.map, "*")
          ? rule.map["*"]
          : undefined
      : rule.set
    for (const [key, value] of Object.entries(targets ?? {})) {
      const name = targetName(key)
      if (name === undefined) continue
      const current = slots.read(name)
      const accepted = LEGACY_TARGETS[key]
      // A legacy key has no 7.0 value set; any value it holds was the user's.
      const valid = accepted
        ? accepted.includes(current ?? "")
        : current !== null
      if (rule.overwrite || !valid) slots.write(name, value)
    }
    for (const key of rule.remove ?? []) {
      const name = targetName(key)
      if (name !== undefined) slots.write(name, null)
    }
  }
}

/**
 * Runs the rules newer than the stored marker over `storage`, then stores
 * `revision` unless a read or write failed. Works on an in-memory copy, so the
 * returned map (every `LEGACY_TARGETS` key that holds a value) is migrated
 * even when storage refuses writes. Never throws.
 */
export function runLegacyTable(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  rules: readonly LegacyRule[],
  revision: number,
): Map<string, string> {
  const held = new Map<string, string | null>()
  const changed: string[] = []
  let failed = false
  const read = (key: string): string | null => {
    if (!held.has(key)) {
      let value: string | null
      try {
        value = storage.getItem(key)
      } catch {
        value = null
        failed = true
      }
      held.set(key, value)
    }
    return held.get(key) ?? null
  }
  const write = (key: string, value: string | null) => {
    if (read(key) === value) return
    held.set(key, value)
    if (!changed.includes(key)) changed.push(key)
  }

  const marker = Number.parseInt(read(LEGACY_MARKER_KEY) ?? "", 10) || 0
  applyRules(
    rules.filter((rule) => rule.since > marker),
    { read, write },
    (condition) => condition.key,
    (key) => key,
  )

  for (const key of changed) {
    const value = held.get(key) ?? null
    try {
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    } catch {
      failed = true
    }
  }
  if (!failed && marker < revision) {
    try {
      storage.setItem(LEGACY_MARKER_KEY, String(revision))
    } catch {
      // Without the marker the next load migrates again, which is harmless.
    }
  }

  const out = new Map<string, string>()
  for (const key of Object.keys(LEGACY_TARGETS)) {
    const value = read(key)
    if (value !== null) out.set(key, value)
  }
  return out
}

export function migrateStorage(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): Map<string, string> {
  return runLegacyTable(storage, LEGACY_RULES, LEGACY_REVISION)
}

/**
 * The payload form of the table, for a synced payload without a version. A
 * payload carries no marker, so every rule runs. Returns the input's fields
 * plus those a rule wrote, minus those a rule removed.
 */
export function migratePayload(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const fields = new Map(Object.entries(input))
  applyRules(
    LEGACY_RULES,
    {
      read: (name) => {
        const value = fields.get(name)
        return typeof value === "string" ? value : null
      },
      write: (name, value) => {
        if (value === null) fields.delete(name)
        else fields.set(name, value)
      },
    },
    (condition) => condition.field,
    (key) => PAYLOAD_FIELDS[key],
  )
  return Object.fromEntries(fields)
}
