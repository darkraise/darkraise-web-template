import { cleanup, render } from "@testing-library/react"
import { createElement } from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { ThemeProvider } from "@theme/theme-provider/ThemeProvider"
import { LEGACY_MARKER_KEY, LEGACY_REVISION, migrateStorage } from "./legacy"
import { PRE_V696_KEYS, V696_KEYS } from "./legacy-fixture"
import { buildPrerenderScript } from "./prerender"
import { TOKEN_CACHE_STORAGE_KEY } from "./tokenCache"

const root = document.documentElement

// A 6.x user who touched every key a rule reads, so every rule has input.
const EVERY_LEGACY_KEY: Record<string, string> = {
  mode: "dark",
  "theme-surface-color": "red",
  "theme-bg-style": "solid",
  "theme-elevation": "low",
  "theme-button-elevation": "high",
  "theme-surface-intensity": "bold",
  "theme-accent-intensity": "intense",
  "theme-accent-vibrancy": "calm",
  "theme-control-depth": "deep",
  "theme-glass-halo": "pronounced",
  "theme-canvas-tint": "neutral",
  "theme-glassmorphism-opacity": "strong",
  "theme-glassmorphism-blur": "high",
  "theme-scifi-intensity": "bright",
  "theme-scifi-frame": "bracketed",
}

function legacyStates(): [string, Record<string, string>][] {
  const states: [string, Record<string, string>][] = [["nothing stored", {}]]
  for (const table of [V696_KEYS, PRE_V696_KEYS]) {
    for (const [key, values] of Object.entries(table)) {
      for (const value of values) {
        if (value !== "*") states.push([`${key}=${value}`, { [key]: value }])
      }
    }
  }
  const presets = [
    ...(V696_KEYS["theme-preset"] ?? []),
    ...(PRE_V696_KEYS["theme-preset"] ?? []),
  ]
  for (const preset of presets) {
    states.push([
      `every legacy key on ${preset}`,
      { ...EVERY_LEGACY_KEY, "theme-preset": preset },
    ])
  }
  states.push(["every legacy key, no preset", EVERY_LEGACY_KEY])
  states.push([
    "every legacy key, already migrated",
    { ...EVERY_LEGACY_KEY, [LEGACY_MARKER_KEY]: String(LEGACY_REVISION) },
  ])
  return states
}

function seed(state: Record<string, string>) {
  localStorage.clear()
  for (const [key, value] of Object.entries(state)) {
    localStorage.setItem(key, value)
  }
}

function storedContents(): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) as string
    if (key !== TOKEN_CACHE_STORAGE_KEY) {
      out[key] = localStorage.getItem(key) as string
    }
  }
  return out
}

function memoryStorage(state: Record<string, string>) {
  const map = new Map(Object.entries(state))
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    contents: () => Object.fromEntries(map),
  }
}

// Clearing the inline style leaves an empty style attribute, which the snapshot
// of what the script painted must not pick up.
function resetRoot() {
  root.style.cssText = ""
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
}

beforeEach(resetRoot)

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("pre-render script and migrateStorage", () => {
  it.each(legacyStates())("agree on %s", (_, state) => {
    seed(state)
    new Function(buildPrerenderScript())()
    const scripted = storedContents()
    const painted = Object.fromEntries(
      root.getAttributeNames().map((name) => [name, root.getAttribute(name)]),
    )

    const memory = memoryStorage(state)
    migrateStorage(memory)
    expect(scripted).toEqual(memory.contents())

    resetRoot()
    seed(state)
    render(createElement(ThemeProvider, { children: null }))
    for (const [name, value] of Object.entries(painted)) {
      expect(root.getAttribute(name), name).toBe(value)
    }
  })
})
