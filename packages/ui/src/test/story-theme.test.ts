import { afterEach, describe, expect, it, vi } from "vitest"
import { AXES, type AxisKey } from "@theme/axes/registry"
import { resolveRegistry } from "@theme/config/registry"
import type { PresetDefinition } from "@theme/config/schema"
import {
  STAMPED_SIGNATURES,
  signatureAttribute,
} from "@theme/config/signatures"
import {
  applyStoryTheme,
  presetToolbarItems,
  settleStoryChoice,
  settleStoryToolbars,
  type StoryPresetChoice,
  type StoryPresetState,
} from "../../.storybook/storyTheme"

// Two presets beside the kit's own, so the signature and token assertions
// hold whatever the built-in presets set. Tactile tones its bar and leaves
// its rail on the page: one fixture tones the rail, the other clears the bar.
const FIXTURES = vi.hoisted(
  (): Record<string, PresetDefinition> => ({
    "story-lamp": {
      label: "Story Lamp",
      style: "tactile",
      axes: { accentColor: "teal", signalColor: "yellow", radius: "pill" },
      signatures: {
        railTone: "inverse",
        cardFooter: "inset",
        figureFamily: "mono",
      },
    },
    "story-seam": {
      label: "Story Seam",
      style: "tactile",
      axes: { accentColor: "rose", density: "compact" },
      signatures: { barTone: "page", cardDivider: "seam" },
    },
  }),
)

vi.mock("@theme/styles/builtin/presets", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@theme/styles/builtin/presets")>()
  return {
    ...actual,
    BUILTIN_PRESETS: { ...actual.BUILTIN_PRESETS, ...FIXTURES },
  }
})

const root = document.documentElement

function clearRoot() {
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
}

afterEach(() => {
  clearRoot()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe("Storybook theme decorator", () => {
  it("paints Glass through its attributes, with no inline glass vars", () => {
    applyStoryTheme({ accentColor: "blue", style: "glass", mode: "dark" })
    expect(root.getAttribute("data-mode")).toBe("dark")
    expect(root.getAttribute("data-style")).toBe("glass")
    expect(root.getAttribute("data-glass-opacity")).toBe("medium")
    expect(root.getAttribute("data-glass-blur")).toBe("medium")
    expect(root.getAttribute("data-background-style")).toBe("gradient")
    expect(root.getAttribute("data-preset")).toBe("base")
    expect(root.style.getPropertyValue("--glass-noise")).toBe("")
    expect(root.style.getPropertyValue("--primary")).not.toBe("")
  })

  it("applies the next style's defaults and drops glass's tokens", () => {
    applyStoryTheme({ accentColor: "blue", style: "glass", mode: "dark" })
    applyStoryTheme({ accentColor: "rose", style: "flat", mode: "light" })
    expect(root.getAttribute("data-style")).toBe("flat")
    expect(root.getAttribute("data-elevation")).toBe("flat")
    expect(root.getAttribute("data-background-style")).toBe("solid")
    expect(root.getAttribute("data-accent")).toBe("rose")
    expect(root.style.getPropertyValue("--primary")).not.toBe("")
  })
})

const registry = resolveRegistry()
const presets = Object.values(registry.presets)
const names = presets.map((preset) => preset.name)

/** Every attribute and inline token on <html>, in a comparable shape. */
function painted() {
  const attributes: Record<string, string | null> = {}
  for (const name of root.getAttributeNames()) {
    if (name !== "style") attributes[name] = root.getAttribute(name)
  }
  const tokens: Record<string, string> = {}
  for (let index = 0; index < root.style.length; index++) {
    const name = root.style.item(index)
    tokens[name] = root.style.getPropertyValue(name)
  }
  return { attributes, tokens }
}

function paintedAlone(style: string, preset: string) {
  clearRoot()
  applyStoryTheme({ style, preset, mode: "light" })
  const result = painted()
  clearRoot()
  return result
}

describe("Storybook preset toolbar", () => {
  it("resolves the fixtures beside the kit's presets", () => {
    expect(registry.issues).toEqual([])
    expect(names).toContain("paper-ink")
    expect(names.slice(-2)).toEqual(["story-lamp", "story-seam"])
  })

  it("lists base, then every preset under its label and its style's", () => {
    const items = presetToolbarItems()
    expect(items.map((item) => item.value)).toEqual(["base", ...names])
    expect(items[0]).toEqual({ value: "base", title: "Base" })
    expect(items).toContainEqual({
      value: "paper-ink",
      title: "Paper & Ink",
      right: "Quiet",
    })
    expect(items).toContainEqual({
      value: "story-lamp",
      title: "Story Lamp",
      right: "Tactile",
    })
    for (const preset of presets) {
      expect(items).toContainEqual({
        value: preset.name,
        title: preset.label,
        right: registry.styles[preset.style]?.label,
      })
    }
  })

  it.each(presets)(
    "stamps $name with its style, its axes and its signatures",
    (preset) => {
      applyStoryTheme({
        style: preset.style,
        preset: preset.name,
        mode: "light",
      })
      expect(root.getAttribute("data-style")).toBe(preset.style)
      expect(root.getAttribute("data-preset")).toBe(preset.name)
      for (const [key, value] of Object.entries(preset.axes)) {
        const attribute = AXES[key as AxisKey].attribute
        if (!attribute) continue
        expect([key, root.getAttribute(attribute)]).toEqual([key, value])
      }
      const signatures = registry.signaturesFor(preset.style, preset.name)
      for (const key of STAMPED_SIGNATURES) {
        expect([key, root.getAttribute(signatureAttribute(key))]).toEqual([
          key,
          signatures[key],
        ])
      }
    },
  )

  it("stamps a preset's own signatures over its style's", () => {
    applyStoryTheme({ style: "tactile", preset: "story-lamp", mode: "light" })
    expect(root.getAttribute("data-rail-tone")).toBe("inverse")
    expect(root.getAttribute("data-card-footer")).toBe("inset")
    expect(root.getAttribute("data-figure-family")).toBe("mono")
    // Tactile's own, where the preset is silent.
    expect(root.getAttribute("data-bar-tone")).toBe("inverse")
    expect(root.getAttribute("data-bar-span")).toBe("full")
  })

  it("feeds the engine the preset's tones and signal colour", () => {
    const base = paintedAlone("tactile", "base")
    const lamp = paintedAlone("tactile", "story-lamp")
    const seam = paintedAlone("tactile", "story-seam")
    expect(lamp.tokens["--surface-sidebar"]).not.toBe(
      base.tokens["--surface-sidebar"],
    )
    expect(lamp.tokens["--sidebar-foreground"]).not.toBe(
      base.tokens["--sidebar-foreground"],
    )
    expect(base.tokens["--bar-foreground"]).toBeDefined()
    expect(seam.tokens["--bar-foreground"]).toBeUndefined()
    // With no signal colour the signal fill is the accent's own.
    expect(seam.tokens["--signal-fill"]).toBe(seam.tokens["--primary-fill"])
    expect(lamp.tokens["--signal-fill"]).not.toBe(lamp.tokens["--primary-fill"])
  })

  it("keeps the toolbar's accent over the preset's", () => {
    applyStoryTheme({ style: "tactile", preset: "story-lamp", mode: "light" })
    expect(root.getAttribute("data-accent")).toBe("teal")
    const own = root.style.getPropertyValue("--primary")

    applyStoryTheme({
      accentColor: "rose",
      style: "tactile",
      preset: "story-lamp",
      mode: "light",
    })
    expect(root.getAttribute("data-accent")).toBe("rose")
    expect(root.getAttribute("data-preset")).toBe("story-lamp")
    expect(root.style.getPropertyValue("--primary")).not.toBe(own)
  })

  it("falls to base for a preset of another style", () => {
    applyStoryTheme({ style: "flat", preset: "story-lamp", mode: "light" })
    expect(root.getAttribute("data-style")).toBe("flat")
    expect(root.getAttribute("data-preset")).toBe("base")
    expect(painted()).toEqual(paintedAlone("flat", "base"))
  })

  it.each(presets)(
    "returns from $name to its style's base with nothing left over",
    (preset) => {
      const alone = paintedAlone(preset.style, "base")
      applyStoryTheme({
        style: preset.style,
        preset: preset.name,
        mode: "light",
      })
      applyStoryTheme({ style: preset.style, preset: "base", mode: "light" })
      expect(root.getAttribute("data-preset")).toBe("base")
      expect(painted()).toEqual(alone)
    },
  )

  // Each preset to the next in registry order, and the last back to the
  // first, so every style boundary is crossed.
  it.each(
    presets.map((preset, index) => ({
      from: preset,
      to: presets[(index + 1) % presets.length] as (typeof presets)[number],
    })),
  )(
    "switches from $from.name to $to.name with nothing left over",
    ({ from, to }) => {
      const alone = paintedAlone(to.style, to.name)
      applyStoryTheme({ style: from.style, preset: from.name, mode: "light" })
      applyStoryTheme({ style: to.style, preset: to.name, mode: "light" })
      expect(painted()).toEqual(alone)
    },
  )
})

describe("Storybook style and preset toolbars", () => {
  const pick = (style: string, preset: string): StoryPresetChoice => ({
    style,
    preset,
  })

  function settleAll(picks: StoryPresetChoice[]): StoryPresetChoice[] {
    let state: StoryPresetState | undefined
    return picks.map((picked) => {
      state = settleStoryChoice(picked, state)
      return state.settled
    })
  }

  it.each<[string, StoryPresetChoice[], StoryPresetChoice[]]>([
    [
      "starts on a style's base",
      [pick("flat", "base")],
      [pick("flat", "base")],
    ],
    [
      "starts on a preset's own style",
      [pick("quiet", "mica-desk")],
      [pick("glass", "mica-desk")],
    ],
    [
      "starts on base for an unknown preset",
      [pick("flat", "nope")],
      [pick("flat", "base")],
    ],
    [
      "starts on the default style for an unknown style",
      [pick("nope", "base")],
      [pick("quiet", "base")],
    ],
    [
      "brings a picked preset's style",
      [pick("quiet", "base"), pick("quiet", "mica-desk")],
      [pick("quiet", "base"), pick("glass", "mica-desk")],
    ],
    [
      "returns to base when another style is picked",
      [pick("glass", "mica-desk"), pick("flat", "mica-desk")],
      [pick("glass", "mica-desk"), pick("flat", "base")],
    ],
    [
      "keeps the style when base is picked",
      [pick("glass", "mica-desk"), pick("glass", "base")],
      [pick("glass", "mica-desk"), pick("glass", "base")],
    ],
    [
      "moves between presets of one style",
      [pick("glass", "mica-desk"), pick("glass", "milk-glass")],
      [pick("glass", "mica-desk"), pick("glass", "milk-glass")],
    ],
    [
      "lets the preset win when both change at once",
      [pick("glass", "mica-desk"), pick("flat", "paper-ink")],
      [pick("glass", "mica-desk"), pick("quiet", "paper-ink")],
    ],
    [
      "holds through the toolbars catching up",
      [
        pick("quiet", "base"),
        pick("quiet", "mica-desk"),
        pick("glass", "mica-desk"),
        pick("flat", "mica-desk"),
        pick("flat", "base"),
        pick("flat", "base"),
      ],
      [
        pick("quiet", "base"),
        pick("glass", "mica-desk"),
        pick("glass", "mica-desk"),
        pick("flat", "base"),
        pick("flat", "base"),
        pick("flat", "base"),
      ],
    ],
    [
      "holds while one pick is settled again and again",
      [
        pick("quiet", "base"),
        pick("quiet", "mica-desk"),
        pick("quiet", "mica-desk"),
        pick("quiet", "mica-desk"),
      ],
      [
        pick("quiet", "base"),
        pick("glass", "mica-desk"),
        pick("glass", "mica-desk"),
        pick("glass", "mica-desk"),
      ],
    ],
  ])("%s", (_title, picks, settled) => {
    expect(settleAll(picks)).toEqual(settled)
  })

  // A docs page reloads the preview frame on every toolbar change, so no
  // module state survives from one call to the next.
  it("remembers which toolbar moved across a reload of the frame", () => {
    expect(settleStoryToolbars(pick("quiet", "base"))).toEqual(
      pick("quiet", "base"),
    )
    expect(settleStoryToolbars(pick("quiet", "mica-desk"))).toEqual(
      pick("glass", "mica-desk"),
    )
    expect(settleStoryToolbars(pick("glass", "mica-desk"))).toEqual(
      pick("glass", "mica-desk"),
    )
    expect(settleStoryToolbars(pick("tactile", "mica-desk"))).toEqual(
      pick("tactile", "base"),
    )
    expect(settleStoryToolbars(pick("tactile", "base"))).toEqual(
      pick("tactile", "base"),
    )
  })

  it("settles as a first load in a new session", () => {
    settleStoryToolbars(pick("glass", "mica-desk"))
    sessionStorage.clear()
    expect(settleStoryToolbars(pick("tactile", "mica-desk"))).toEqual(
      pick("glass", "mica-desk"),
    )
  })

  it.each<[string, "style" | "preset", StoryPresetChoice, StoryPresetChoice]>([
    [
      "a pinned preset brings its style",
      "preset",
      pick("flat", "paper-ink"),
      pick("quiet", "paper-ink"),
    ],
    [
      "a pinned style drops a preset of another style",
      "style",
      pick("flat", "paper-ink"),
      pick("flat", "base"),
    ],
    [
      "a pinned style keeps a preset of its own",
      "style",
      pick("quiet", "paper-ink"),
      pick("quiet", "paper-ink"),
    ],
  ])("%s, apart from the toolbars", (_title, pinned, picked, settled) => {
    settleStoryToolbars(pick("glass", "mica-desk"))
    const stored = { ...sessionStorage }
    expect(Object.keys(stored)).toHaveLength(1)

    expect(settleStoryToolbars(picked, pinned)).toEqual(settled)
    expect({ ...sessionStorage }).toEqual(stored)
    // The toolbars still read as glass and Mica Desk to the next pick.
    expect(settleStoryToolbars(pick("tactile", "mica-desk"))).toEqual(
      pick("tactile", "base"),
    )
  })

  it("settles as a first load when storage is blocked", () => {
    settleStoryToolbars(pick("glass", "mica-desk"))
    for (const method of ["getItem", "setItem"] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error("blocked")
      })
    }
    expect(settleStoryToolbars(pick("tactile", "mica-desk"))).toEqual(
      pick("glass", "mica-desk"),
    )
  })
})
