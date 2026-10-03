import { describe, expect, it } from "vitest"
import { AXES, AXIS_KEYS } from "./registry"
import { cacheInputKeys } from "./tokenCache"
import {
  LEGACY_MARKER_KEY,
  LEGACY_REVISION,
  LEGACY_RULES,
  LEGACY_TARGETS,
  migratePayload,
  migrateStorage,
  runLegacyTable,
  type LegacyRule,
} from "./legacy"

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

  it("write only values valid for their target, or legacy keys a later rule consumes", () => {
    LEGACY_RULES.forEach((rule, index) => {
      for (const [key, value] of ruleTargets(rule)) {
        const accepted = LEGACY_TARGETS[key]
        if (accepted) {
          expect(accepted, key).toContain(value)
        } else {
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
      { "theme-preset": "glass" },
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
      { "theme-preset": "glass", "theme-bg-style": "gradient" },
    ],
    [
      "moves a renamed glassmorphism user to gradient too",
      { "theme-preset": "glassmorphism", "theme-bg-style": "solid" },
      { "theme-preset": "glass", "theme-bg-style": "gradient" },
    ],
    [
      "leaves the default preset on a solid canvas",
      { "theme-preset": "default", "theme-bg-style": "solid" },
      { "theme-preset": "default", "theme-bg-style": "solid" },
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
      { "theme-preset": "glass" },
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
      { "theme-preset": "glass" },
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
        "theme-preset": "glass",
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
      "moves glass on a solid canvas to gradient",
      { preset: "glass", backgroundStyle: "solid" },
      { preset: "glass", backgroundStyle: "gradient" },
    ],
    [
      "turns an accent-named surface into zinc tinted with the accent",
      { surfaceColor: "red" },
      { surfaceColor: "zinc", tintWithAccent: "on" },
    ],
    [
      "maps the surface intensity to contrast",
      { preset: "default", surfaceIntensity: "bold" },
      { preset: "default", contrast: "high" },
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
      { preset: "glass", backgroundStyle: "gradient" },
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
      "keeps the fields no rule names",
      {
        outerGlow: "vivid",
        shellStyle: "island",
        mode: "dark",
        presetAxisValues: { glass: { blur: "high" } },
      },
      {
        outerGlow: "vivid",
        shellStyle: "island",
        mode: "dark",
        presetAxisValues: { glass: { blur: "high" } },
      },
    ],
  ])("%s", (_, input, expected) => {
    expect(migratePayload(input)).toEqual(expected)
  })

  it("does not change its input", () => {
    const input = Object.freeze({ preset: "scifi", surfaceIntensity: "bold" })
    expect(() => migratePayload(input)).not.toThrow()
    expect(input).toEqual({ preset: "scifi", surfaceIntensity: "bold" })
  })
})
