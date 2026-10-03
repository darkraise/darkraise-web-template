import { describe, expect, it } from "vitest"
import {
  PRE_V696_KEYS,
  PRE_V696_PAYLOAD_FIELDS,
  V696_KEYS,
  V696_PAYLOAD_FIELDS,
} from "./legacy-fixture"

const TABLES = {
  V696_KEYS,
  V696_PAYLOAD_FIELDS,
  PRE_V696_KEYS,
  PRE_V696_PAYLOAD_FIELDS,
}

// The storage key 6.9.6's applySettings wrote each payload field to.
const FIELD_KEYS: Record<string, string> = {
  accentColor: "theme-accent",
  surfaceColor: "theme-surface-color",
  preset: "theme-preset",
  backgroundStyle: "theme-bg-style",
  backgroundIntensity: "theme-bg-intensity",
  gradientPattern: "theme-gradient-pattern",
  mode: "mode",
  density: "theme-density",
  elevation: "theme-elevation",
  buttonElevation: "theme-button-elevation",
  surfaceIntensity: "theme-surface-intensity",
  radius: "theme-radius",
  shellStyle: "theme-shell-style",
  sidebarActiveBar: "theme-sidebar-active-bar",
  fontSize: "theme-font-size",
  accentIntensity: "theme-accent-intensity",
  controlDepth: "theme-control-depth",
  outerGlow: "theme-outer-glow",
  innerGlow: "theme-inner-glow",
}

describe("6.9.6 storage baseline", () => {
  it.each(Object.entries(TABLES))(
    "%s lists distinct values, with * only alone",
    (_, table) => {
      for (const [key, values] of Object.entries(table)) {
        expect(values.length, key).toBeGreaterThan(0)
        expect(new Set(values).size, key).toBe(values.length)
        if (values.includes("*")) expect(values, key).toEqual(["*"])
      }
    },
  )

  it("gives each payload field the values of the key it was stored under", () => {
    for (const [field, values] of Object.entries(V696_PAYLOAD_FIELDS)) {
      if (field === "presetAxisValues") continue
      const key = FIELD_KEYS[field]
      expect(key, field).toBeDefined()
      expect(V696_KEYS[key as string], field).toEqual(values)
    }
  })

  it("keeps the older values apart from what 6.9.6 wrote", () => {
    for (const [key, values] of Object.entries(PRE_V696_KEYS)) {
      for (const value of values) {
        expect(V696_KEYS[key] ?? [], `${key}=${value}`).not.toContain(value)
      }
    }
  })
})
