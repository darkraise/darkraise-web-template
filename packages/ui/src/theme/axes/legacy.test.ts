import { describe, expect, it } from "vitest"
import { STYLE_NAMES } from "@theme/styles"
import { AXES, AXIS_KEYS, type AxisKey } from "./registry"
import { cacheInputKeys } from "./tokenCache"
import {
  LEGACY_MARKER_KEY,
  LEGACY_REVISION,
  LEGACY_RULES,
  LEGACY_TARGETS,
  liftPresetAxisValues,
  migratePayload,
  migrateStorage,
  runLegacyTable,
  type LegacyRule,
} from "./legacy"
import {
  PRE_V696_KEYS,
  PRE_V696_PAYLOAD_FIELDS,
  V696_KEYS,
  V696_PAYLOAD_FIELDS,
  V696_PRESET_AXIS_VALUES,
} from "./legacy-fixture"

type TestStorage = Pick<Storage, "getItem" | "setItem" | "removeItem"> & {
  contents(): Record<string, string>
}

function memoryStorage(seed: Record<string, string> = {}): TestStorage {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    contents: () => Object.fromEntries(map),
  }
}

// Reads work, writes throw: a full quota or old Safari private mode.
function readOnlyStorage(seed: Record<string, string>): TestStorage {
  const refuse = () => {
    throw new DOMException("full", "QuotaExceededError")
  }
  return { ...memoryStorage(seed), setItem: refuse, removeItem: refuse }
}

const withoutMarker = (contents: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(contents).filter(([key]) => key !== LEGACY_MARKER_KEY),
  )

function migrated(seed: Record<string, string>): Record<string, string> {
  const storage = memoryStorage(seed)
  migrateStorage(storage)
  return withoutMarker(storage.contents())
}

const MARKER = String(LEGACY_REVISION)

// The layout store reads these; no rule touches them.
const OUTSIDE_THEME = new Set(["theme-shell-style", "layout-variant"])

function pairs(
  tables: Readonly<Record<string, readonly string[]>>[],
): [string, string][] {
  return tables.flatMap((table) =>
    Object.entries(table).flatMap(([key, values]) =>
      values
        .filter((value) => value !== "*")
        .map((value): [string, string] => [key, value]),
    ),
  )
}

function ruleTargets(rule: LegacyRule): [string, string][] {
  const maps = rule.map ? Object.values(rule.map) : rule.set ? [rule.set] : []
  return maps.flatMap((targets) => Object.entries(targets))
}

describe("LEGACY_TARGETS", () => {
  it("names exactly the keys the token cache reads", () => {
    expect(Object.keys(LEGACY_TARGETS).sort()).toEqual(cacheInputKeys().sort())
  })

  it("holds each registry axis's own values", () => {
    for (const key of AXIS_KEYS) {
      expect(LEGACY_TARGETS[AXES[key].storageKey], key).toEqual(
        AXES[key].values,
      )
    }
  })

  it("holds the style names under the style key and base under the preset key", () => {
    expect(LEGACY_TARGETS["theme-style"]).toEqual(STYLE_NAMES)
    expect(LEGACY_TARGETS["theme-preset"]).toEqual(["base"])
  })
})

describe("LEGACY_RULES", () => {
  it("are plain JSON the pre-render script can embed", () => {
    expect(JSON.parse(JSON.stringify(LEGACY_RULES))).toEqual(LEGACY_RULES)
  })

  it("were all added at or below the current revision", () => {
    for (const rule of LEGACY_RULES) {
      expect(rule.since).toBeGreaterThanOrEqual(1)
      expect(rule.since).toBeLessThanOrEqual(LEGACY_REVISION)
    }
  })

  it("run revision 1, then three revision 2 rules, then one rule each for revisions 3 and 4", () => {
    expect(LEGACY_REVISION).toBe(4)
    const revisions = LEGACY_RULES.map((rule) => rule.since)
    const first = revisions.indexOf(2)
    expect(revisions.slice(0, first).every((since) => since === 1)).toBe(true)
    expect(revisions.slice(first)).toEqual([2, 2, 2, 3, 4])
  })

  it("end with the rule that moves a style off the preset key", () => {
    expect(LEGACY_RULES[LEGACY_RULES.length - 1]).toEqual({
      since: 4,
      when: [
        { key: "theme-preset", field: "preset", values: [...STYLE_NAMES] },
      ],
      map: Object.fromEntries(
        STYLE_NAMES.map((style) => [style, { "theme-style": style }]),
      ),
      remove: ["theme-preset"],
    })
  })

  it("write only values valid for their target, or legacy keys a later rule consumes", () => {
    LEGACY_RULES.forEach((rule, index) => {
      for (const [key, value] of ruleTargets(rule)) {
        const accepted = LEGACY_TARGETS[key]
        // 6.x stored the style under the preset key, so the rules before
        // revision 4 write style names there for the last rule to move.
        const movedLater = LEGACY_RULES.slice(index + 1).some(
          (next) =>
            next.remove?.includes(key) &&
            next.when[0]?.key === key &&
            next.when[0].values?.includes(value),
        )
        if (accepted && !movedLater) {
          expect(accepted, key).toContain(value)
        } else if (!accepted) {
          const later = LEGACY_RULES.slice(index + 1)
          expect(
            later.some((next) => next.remove?.includes(key)),
            key,
          ).toBe(true)
        }
      }
    })
  })
})

describe("migrateStorage", () => {
  it.each<[string, Record<string, string>, Record<string, string>]>([
    [
      "renames the glassmorphism preset",
      { "theme-preset": "glassmorphism" },
      { "theme-style": "glass" },
    ],
    [
      "carries glassmorphism axes to the glass keys",
      {
        "theme-glassmorphism-opacity": "strong",
        "theme-glassmorphism-blur": "high",
      },
      { "theme-glass-opacity": "strong", "theme-glass-blur": "high" },
    ],
    [
      "keeps a glass axis already stored",
      {
        "theme-glassmorphism-opacity": "strong",
        "theme-glass-opacity": "subtle",
      },
      { "theme-glass-opacity": "subtle" },
    ],
    [
      "seeds background intensity from the canvas tint",
      { "theme-canvas-tint": "neutral" },
      { "theme-bg-intensity": "neutral" },
    ],
    [
      "keeps a stored background intensity over the canvas tint",
      { "theme-canvas-tint": "neutral", "theme-bg-intensity": "vivid" },
      { "theme-bg-intensity": "vivid" },
    ],
    [
      "maps no halo to no outer glow",
      { "theme-glass-halo": "none" },
      { "theme-outer-glow": "none" },
    ],
    [
      "maps a soft halo to a balanced outer glow",
      { "theme-glass-halo": "soft" },
      { "theme-outer-glow": "balanced" },
    ],
    [
      "maps a pronounced halo to a vivid outer glow",
      { "theme-glass-halo": "pronounced" },
      { "theme-outer-glow": "vivid" },
    ],
    [
      "keeps a stored outer glow over the halo",
      { "theme-glass-halo": "pronounced", "theme-outer-glow": "subtle" },
      { "theme-outer-glow": "subtle" },
    ],
    [
      "drops the sci-fi axes without seeding a glow",
      { "theme-scifi-intensity": "bright", "theme-scifi-frame": "notched" },
      {},
    ],
    ["drops the sci-fi preset", { "theme-preset": "scifi" }, {}],
    [
      "moves glass on a solid canvas to gradient",
      { "theme-preset": "glass", "theme-bg-style": "solid" },
      { "theme-style": "glass", "theme-bg-style": "gradient" },
    ],
    [
      "moves a renamed glassmorphism user to gradient too",
      { "theme-preset": "glassmorphism", "theme-bg-style": "solid" },
      { "theme-style": "glass", "theme-bg-style": "gradient" },
    ],
    [
      "moves the default preset to quiet and keeps its solid canvas",
      { "theme-preset": "default", "theme-bg-style": "solid" },
      { "theme-style": "quiet", "theme-bg-style": "solid" },
    ],
    [
      "turns an accent-named surface into zinc tinted with the accent",
      { "theme-surface-color": "red" },
      { "theme-surface-color": "zinc", "theme-tint-with-accent": "on" },
    ],
    [
      "keeps a stored tint choice",
      { "theme-surface-color": "red", "theme-tint-with-accent": "off" },
      { "theme-surface-color": "zinc", "theme-tint-with-accent": "off" },
    ],
    [
      "keeps a neutral surface",
      { "theme-surface-color": "slate" },
      { "theme-surface-color": "slate" },
    ],
    [
      "maps a flat surface intensity to low contrast",
      { "theme-surface-intensity": "flat" },
      { "theme-contrast": "low" },
    ],
    [
      "maps a subtle surface intensity to standard contrast",
      { "theme-surface-intensity": "subtle" },
      { "theme-contrast": "standard" },
    ],
    [
      "maps a balanced surface intensity to standard contrast",
      { "theme-surface-intensity": "balanced" },
      { "theme-contrast": "standard" },
    ],
    [
      "maps a bold surface intensity to high contrast",
      { "theme-surface-intensity": "bold" },
      { "theme-contrast": "high" },
    ],
    [
      "maps a calm accent intensity to calm chroma",
      { "theme-accent-intensity": "calm" },
      { "theme-dark-accent-chroma": "calm" },
    ],
    [
      "maps a balanced accent intensity to standard chroma",
      { "theme-accent-intensity": "balanced" },
      { "theme-dark-accent-chroma": "standard" },
    ],
    [
      "maps a vivid accent intensity to vivid chroma",
      { "theme-accent-intensity": "vivid" },
      { "theme-dark-accent-chroma": "vivid" },
    ],
    [
      "maps an intense accent intensity to vivid chroma",
      { "theme-accent-intensity": "intense" },
      { "theme-dark-accent-chroma": "vivid" },
    ],
    [
      "writes nothing for either intensity under glass",
      {
        "theme-preset": "glass",
        "theme-surface-intensity": "bold",
        "theme-accent-intensity": "calm",
      },
      { "theme-style": "glass" },
    ],
    [
      "writes nothing for either intensity under sci-fi",
      {
        "theme-preset": "scifi",
        "theme-surface-intensity": "bold",
        "theme-accent-intensity": "calm",
      },
      {},
    ],
    [
      "carries accent vibrancy through to dark accent chroma",
      { "theme-accent-vibrancy": "intense" },
      { "theme-dark-accent-chroma": "vivid" },
    ],
    [
      "keeps a stored accent intensity over the vibrancy",
      { "theme-accent-vibrancy": "calm", "theme-accent-intensity": "vivid" },
      { "theme-dark-accent-chroma": "vivid" },
    ],
    [
      "drops accent vibrancy under glass",
      { "theme-preset": "glass", "theme-accent-vibrancy": "calm" },
      { "theme-style": "glass" },
    ],
    [
      "keeps a stored contrast over the surface intensity",
      { "theme-surface-intensity": "bold", "theme-contrast": "low" },
      { "theme-contrast": "low" },
    ],
    [
      "maps low elevation to standard",
      { "theme-elevation": "low" },
      { "theme-elevation": "standard" },
    ],
    [
      "maps medium elevation to standard",
      { "theme-elevation": "medium" },
      { "theme-elevation": "standard" },
    ],
    [
      "keeps flat elevation",
      { "theme-elevation": "flat" },
      { "theme-elevation": "flat" },
    ],
    [
      "keeps high elevation",
      { "theme-elevation": "high" },
      { "theme-elevation": "high" },
    ],
    [
      "drops control depth and button elevation",
      { "theme-control-depth": "deep", "theme-button-elevation": "high" },
      {},
    ],
    [
      "leaves the layout store's keys alone",
      { "theme-shell-style": "island", "layout-variant": "top-nav" },
      { "theme-shell-style": "island", "layout-variant": "top-nav" },
    ],
  ])("%s", (_, seed, expected) => {
    expect(migrated(seed)).toEqual(expected)
  })

  it.each(pairs([V696_KEYS, PRE_V696_KEYS]))(
    "brings %s=%s to a value 7.0 accepts",
    (key, value) => {
      for (const [left, held] of Object.entries(migrated({ [key]: value }))) {
        if (OUTSIDE_THEME.has(left)) continue
        expect(LEGACY_TARGETS[left] ?? [], `${left}=${held}`).toContain(held)
      }
    },
  )

  it("returns every target key's migrated value", () => {
    const storage = memoryStorage({
      "theme-surface-color": "red",
      "theme-density": "spacious",
      "theme-surface-intensity": "bold",
    })
    expect(Object.fromEntries(migrateStorage(storage))).toEqual({
      "theme-surface-color": "zinc",
      "theme-tint-with-accent": "on",
      "theme-density": "spacious",
      "theme-contrast": "high",
    })
  })

  it("marks a browser with nothing stored", () => {
    const storage = memoryStorage()
    migrateStorage(storage)
    expect(storage.contents()).toEqual({ [LEGACY_MARKER_KEY]: MARKER })
  })

  it("runs once per browser", () => {
    const storage = memoryStorage({ "theme-elevation": "low" })
    migrateStorage(storage)
    storage.setItem("theme-elevation", "medium")
    migrateStorage(storage)
    expect(storage.getItem("theme-elevation")).toBe("medium")
  })

  it("runs nothing at or above the current revision", () => {
    for (const marker of [MARKER, "9"]) {
      const seed = { [LEGACY_MARKER_KEY]: marker, "theme-elevation": "low" }
      const storage = memoryStorage(seed)
      migrateStorage(storage)
      expect(storage.contents()).toEqual(seed)
    }
  })

  it("runs every rule under an unreadable marker", () => {
    const storage = memoryStorage({
      [LEGACY_MARKER_KEY]: "junk",
      "theme-elevation": "low",
    })
    migrateStorage(storage)
    expect(storage.contents()).toEqual({
      [LEGACY_MARKER_KEY]: MARKER,
      "theme-elevation": "standard",
    })
  })

  it("moves glass to gradient once, so a later solid survives a reload", () => {
    const storage = memoryStorage({
      "theme-preset": "glass",
      "theme-bg-style": "solid",
    })
    migrateStorage(storage)
    expect(storage.getItem("theme-bg-style")).toBe("gradient")
    storage.setItem("theme-bg-style", "solid")
    migrateStorage(storage)
    expect(storage.getItem("theme-bg-style")).toBe("solid")
  })

  it("returns the migrated map when storage refuses writes", () => {
    const seed = {
      "theme-preset": "glass",
      "theme-bg-style": "solid",
      "theme-surface-color": "red",
    }
    const storage = readOnlyStorage(seed)
    for (let load = 0; load < 2; load++) {
      expect(Object.fromEntries(migrateStorage(storage))).toEqual({
        "theme-style": "glass",
        "theme-bg-style": "gradient",
        "theme-surface-color": "zinc",
        "theme-tint-with-accent": "on",
      })
      expect(storage.contents()).toEqual(seed)
    }
  })

  it("keeps the legacy keys when a target write is refused", () => {
    const storage: TestStorage = {
      ...memoryStorage({ "theme-surface-intensity": "bold" }),
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError")
      },
    }
    expect(migrateStorage(storage).get("theme-contrast")).toBe("high")
    expect(storage.contents()).toEqual({ "theme-surface-intensity": "bold" })
    expect(migrateStorage(storage).get("theme-contrast")).toBe("high")
  })

  it("keeps an accent surface until its tint write lands", () => {
    const memory = memoryStorage({ "theme-surface-color": "red" })
    const storage: TestStorage = {
      ...memory,
      setItem: (key, value) => {
        if (key === "theme-tint-with-accent") {
          throw new DOMException("full", "QuotaExceededError")
        }
        memory.setItem(key, value)
      },
    }
    migrateStorage(storage)
    expect(storage.contents()).toEqual({ "theme-surface-color": "red" })

    storage.setItem = memory.setItem
    migrateStorage(storage)
    expect(storage.contents()).toEqual({
      "theme-surface-color": "zinc",
      "theme-tint-with-accent": "on",
      [LEGACY_MARKER_KEY]: MARKER,
    })
  })

  it("returns an empty map when storage cannot be read", () => {
    const storage = memoryStorage()
    storage.getItem = () => {
      throw new DOMException("denied", "SecurityError")
    }
    expect(migrateStorage(storage).size).toBe(0)
    expect(storage.contents()).toEqual({})
  })
})

describe("revision 2 in storage", () => {
  it.each<[string, Record<string, string>, Record<string, string>]>([
    [
      "moves the default preset to quiet",
      { "theme-preset": "default" },
      { "theme-style": "quiet" },
    ],
    [
      "keeps the glass preset as the glass style",
      { "theme-preset": "glass" },
      { "theme-style": "glass" },
    ],
    ["still drops the sci-fi preset", { "theme-preset": "scifi" }, {}],
    [
      "moves a renamed glassmorphism user to the glass style",
      { "theme-preset": "glassmorphism" },
      { "theme-style": "glass" },
    ],
    [
      "removes a medium glass opacity and blur",
      { "theme-glass-opacity": "medium", "theme-glass-blur": "medium" },
      {},
    ],
    [
      "keeps a non-medium glass opacity and blur",
      { "theme-glass-opacity": "strong", "theme-glass-blur": "low" },
      { "theme-glass-opacity": "strong", "theme-glass-blur": "low" },
    ],
    [
      "renames a medium glassmorphism opacity, then removes it",
      { "theme-glassmorphism-opacity": "medium" },
      {},
    ],
    [
      "renames a medium glassmorphism blur, then removes it",
      { "theme-glassmorphism-blur": "medium" },
      {},
    ],
    [
      "keeps a medium glassmorphism value's stored non-medium target",
      {
        "theme-glassmorphism-opacity": "medium",
        "theme-glass-opacity": "subtle",
      },
      { "theme-glass-opacity": "subtle" },
    ],
  ])("%s", (_, seed, expected) => {
    expect(migrated(seed)).toEqual(expected)
  })

  it.each(
    pairs([
      {
        "theme-glass-opacity": V696_KEYS["theme-glass-opacity"] ?? [],
        "theme-glass-blur": V696_KEYS["theme-glass-blur"] ?? [],
      },
    ]),
  )("keeps %s=%s only when it is not medium", (key, value) => {
    expect(migrated({ [key]: value })).toEqual(
      value === "medium" ? {} : { [key]: value },
    )
  })

  it("runs revisions 2 to 4 on a browser at revision 1", () => {
    const storage = memoryStorage({
      [LEGACY_MARKER_KEY]: "1",
      "theme-preset": "default",
      "theme-glass-opacity": "medium",
      "theme-glass-blur": "high",
      "theme-elevation": "low",
      "theme-canvas-tint": "vivid",
    })
    migrateStorage(storage)
    expect(storage.contents()).toEqual({
      [LEGACY_MARKER_KEY]: String(LEGACY_REVISION),
      "theme-style": "quiet",
      "theme-glass-blur": "high",
      "theme-elevation": "low",
      "theme-canvas-tint": "vivid",
    })
  })
})

describe("revision 4 in storage", () => {
  it.each(STYLE_NAMES)(
    "moves a %s style stored under the preset key to the style key",
    (style) => {
      const storage = memoryStorage({
        [LEGACY_MARKER_KEY]: "3",
        "theme-preset": style,
      })
      migrateStorage(storage)
      expect(storage.contents()).toEqual({
        [LEGACY_MARKER_KEY]: MARKER,
        "theme-style": style,
      })
    },
  )

  it("leaves a stored preset that names no style", () => {
    const seed = { [LEGACY_MARKER_KEY]: "3", "theme-preset": "base" }
    const storage = memoryStorage(seed)
    migrateStorage(storage)
    expect(storage.contents()).toEqual({ ...seed, [LEGACY_MARKER_KEY]: MARKER })
  })

  it("keeps a style already stored under the style key", () => {
    const storage = memoryStorage({
      [LEGACY_MARKER_KEY]: "3",
      "theme-preset": "glass",
      "theme-style": "flat",
    })
    migrateStorage(storage)
    expect(storage.contents()).toEqual({
      [LEGACY_MARKER_KEY]: MARKER,
      "theme-style": "flat",
    })
  })

  it("leaves a browser already at revision 4 alone", () => {
    const seed = { [LEGACY_MARKER_KEY]: "4", "theme-preset": "glass" }
    const storage = memoryStorage(seed)
    migrateStorage(storage)
    expect(storage.contents()).toEqual(seed)
  })
})

describe("runLegacyTable", () => {
  const rules: LegacyRule[] = [
    { since: 1, when: [], set: { "theme-density": "compact" } },
    { since: 2, when: [], set: { "theme-radius": "pill" } },
  ]

  it.each<[string, Record<string, string>]>([
    ["0", { "theme-density": "compact", "theme-radius": "pill" }],
    ["1", { "theme-radius": "pill" }],
    ["2", {}],
  ])("from marker %s runs only the newer rules", (marker, expected) => {
    const storage = memoryStorage({ [LEGACY_MARKER_KEY]: marker })
    runLegacyTable(storage, rules, 2)
    expect(storage.contents()).toEqual({
      [LEGACY_MARKER_KEY]: "2",
      ...expected,
    })
  })

  it("maps any value through *", () => {
    const storage = memoryStorage({ "theme-old": "anything" })
    runLegacyTable(
      storage,
      [
        {
          since: 1,
          when: [{ key: "theme-old" }],
          map: { "*": { "theme-radius": "sharp" } },
          remove: ["theme-old"],
        },
      ],
      1,
    )
    expect(storage.contents()).toEqual({
      [LEGACY_MARKER_KEY]: "1",
      "theme-radius": "sharp",
    })
  })
})

describe("migratePayload", () => {
  it.each<[string, Record<string, unknown>, Record<string, unknown>]>([
    [
      "renames the glassmorphism preset to the glass style",
      { preset: "glassmorphism" },
      { style: "glass" },
    ],
    [
      "moves the default preset to the quiet style",
      { preset: "default" },
      { style: "quiet" },
    ],
    [
      "carries the glass preset to the glass style",
      { preset: "glass" },
      { style: "glass" },
    ],
    [
      "drops the sci-fi preset",
      { preset: "scifi", accentColor: "rose" },
      { accentColor: "rose" },
    ],
    [
      "moves glass on a solid canvas to gradient",
      { preset: "glass", backgroundStyle: "solid" },
      { style: "glass", backgroundStyle: "gradient" },
    ],
    [
      "moves a renamed glassmorphism user to gradient too",
      { preset: "glassmorphism", backgroundStyle: "solid" },
      { style: "glass", backgroundStyle: "gradient" },
    ],
    [
      "turns an accent-named surface into zinc tinted with the accent",
      { surfaceColor: "red" },
      { surfaceColor: "zinc", tintWithAccent: "on" },
    ],
    [
      "maps the surface intensity to contrast",
      { preset: "default", surfaceIntensity: "bold" },
      { style: "quiet", contrast: "high" },
    ],
    [
      "maps the accent intensity to dark accent chroma",
      { accentIntensity: "intense" },
      { darkAccentChroma: "vivid" },
    ],
    [
      "writes nothing for either intensity under glass",
      {
        preset: "glass",
        backgroundStyle: "gradient",
        surfaceIntensity: "bold",
        accentIntensity: "calm",
      },
      { style: "glass", backgroundStyle: "gradient" },
    ],
    [
      "writes nothing for either intensity under a renamed glassmorphism preset",
      {
        preset: "glassmorphism",
        backgroundStyle: "gradient",
        surfaceIntensity: "bold",
        accentIntensity: "calm",
      },
      { style: "glass", backgroundStyle: "gradient" },
    ],
    [
      "writes nothing for either intensity under sci-fi",
      {
        preset: "scifi",
        accentColor: "rose",
        surfaceIntensity: "bold",
        accentIntensity: "calm",
      },
      { accentColor: "rose" },
    ],
    [
      "maps medium elevation to standard",
      { elevation: "medium" },
      { elevation: "standard" },
    ],
    [
      "drops control depth and button elevation",
      { controlDepth: "deep", buttonElevation: "low", radius: "pill" },
      { radius: "pill" },
    ],
    [
      "leaves storage-only rules to storage",
      { "theme-glass-halo": "soft", "theme-accent-vibrancy": "calm" },
      { "theme-glass-halo": "soft", "theme-accent-vibrancy": "calm" },
    ],
    [
      "lifts glass's nested axes and skips medium",
      {
        preset: "glass",
        backgroundStyle: "gradient",
        presetAxisValues: { glass: { opacity: "strong", blur: "medium" } },
      },
      { style: "glass", backgroundStyle: "gradient", glassOpacity: "strong" },
    ],
    [
      "keeps a preset field that names no style",
      { preset: "base", density: "compact" },
      { preset: "base", density: "compact" },
    ],
    [
      "keeps the fields no rule names",
      { outerGlow: "vivid", shellStyle: "island", mode: "dark" },
      { outerGlow: "vivid", shellStyle: "island", mode: "dark" },
    ],
  ])("%s", (_, input, expected) => {
    expect(migratePayload(input)).toEqual(expected)
  })

  it("does not change its input", () => {
    const input = Object.freeze({
      preset: "scifi",
      surfaceIntensity: "bold",
      presetAxisValues: Object.freeze({
        glass: Object.freeze({ blur: "high" }),
      }),
    })
    expect(() => migratePayload(input)).not.toThrow()
    expect(input).toEqual({
      preset: "scifi",
      surfaceIntensity: "bold",
      presetAxisValues: { glass: { blur: "high" } },
    })
  })

  it.each(pairs([V696_PAYLOAD_FIELDS, PRE_V696_PAYLOAD_FIELDS]))(
    "brings %s=%s to a value 7.0 accepts",
    (field, value) => {
      for (const [left, held] of Object.entries(
        migratePayload({ [field]: value }),
      )) {
        // The layout store takes shellStyle; accentVibrancy is storage-only
        // in the table, so a 6.0-6.2 payload's value is dropped by sanitising.
        if (left === "shellStyle" || left === "accentVibrancy") continue
        expect(AXIS_KEYS, left).toContain(left)
        expect(AXES[left as AxisKey].values, `${left}=${held}`).toContain(held)
      }
    },
  )
})

const LIFTED_FIELDS: Readonly<Record<string, string>> = {
  opacity: "glassOpacity",
  blur: "glassBlur",
}

describe("liftPresetAxisValues", () => {
  it.each(pairs([V696_PRESET_AXIS_VALUES.glass ?? {}]))(
    "lifts glass %s=%s unless it is medium",
    (axis, value) => {
      const lifted = liftPresetAxisValues({
        accentColor: "rose",
        presetAxisValues: { glass: { [axis]: value } },
      })
      expect(lifted).toEqual(
        value === "medium"
          ? { accentColor: "rose" }
          : { accentColor: "rose", [LIFTED_FIELDS[axis] as string]: value },
      )
    },
  )

  it.each<[string, Record<string, unknown>, Record<string, unknown>]>([
    [
      "drops a value glass never had",
      { presetAxisValues: { glass: { opacity: "foggy", blur: "low" } } },
      { glassBlur: "low" },
    ],
    [
      "drops another preset's axes",
      { presetAxisValues: { scifi: { frame: "notched" } } },
      {},
    ],
    [
      "drops a presetAxisValues that is not an object",
      { presetAxisValues: "glass" },
      {},
    ],
    [
      "leaves a payload without presetAxisValues alone",
      { preset: "glass", density: "compact" },
      { preset: "glass", density: "compact" },
    ],
  ])("%s", (_, input, expected) => {
    expect(liftPresetAxisValues(input)).toEqual(expected)
  })

  it("does not change its input", () => {
    const input = Object.freeze({
      presetAxisValues: Object.freeze({
        glass: Object.freeze({ opacity: "strong" }),
      }),
    })
    expect(liftPresetAxisValues(input)).toEqual({ glassOpacity: "strong" })
    expect(input).toEqual({
      presetAxisValues: { glass: { opacity: "strong" } },
    })
  })
})

describe("sidebar indicator migration", () => {
  it.each([
    ["bar", "pill"],
    ["ring", "chip"],
    ["both", "pill"],
  ])("maps a stored %s to %s", (indicator, look) => {
    expect(migrated({ "theme-sidebar-active-bar": indicator })).toEqual({
      "theme-sidebar-selection": look,
    })
  })

  it("drops a stored default without pinning a look", () => {
    expect(migrated({ "theme-sidebar-active-bar": "default" })).toEqual({})
  })

  it("leaves a stored selection alone", () => {
    expect(migrated({ "theme-sidebar-selection": "tile" })).toEqual({
      "theme-sidebar-selection": "tile",
    })
  })

  it("moves a synced payload's indicator the same way", () => {
    const payload = migratePayload({ sidebarActiveBar: "ring" })
    expect(payload).toMatchObject({ sidebarSelection: "chip" })
    expect(payload).not.toHaveProperty("sidebarActiveBar")
  })
})
