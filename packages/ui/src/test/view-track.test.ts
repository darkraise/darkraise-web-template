import { describe, expect, it } from "vitest"
import { composite } from "@theme/engine/oklch"
import { chipEdge } from "@test/preset-tokens"
import {
  PANE,
  SHEEN,
  edgeOn,
  paneEnds,
  trackPairs,
  trackSamples,
} from "@test/view-track"

const WHITE = "0 0% 100%"
const GREY = "0 0% 50%"
const INK = "220 30% 20%"
const at = (key: string) => (key === "--foreground" ? INK : GREY)

const LIGHT_SHEEN =
  "linear-gradient(180deg, rgb(255 255 255 / 0.5), transparent 75%)"
const LIGHT_PANE =
  "linear-gradient(hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.12)), linear-gradient(180deg, rgb(255 255 255 / 0.96), rgb(255 255 255 / 0.62))"

describe("chipEdge", () => {
  it("reads an opaque edge at alpha 1", () => {
    expect(
      chipEdge("0 0 0 1px hsl(var(--border-strong))", at, "look"),
    ).toEqual({ colour: GREY, alpha: 1 })
  })

  it("reads an edge's alpha", () => {
    expect(
      chipEdge(
        "0 0 0 1px hsl(var(--primary) / 0.8), inset 0 1px 0 rgb(255 255 255 / 0.95)",
        at,
        "look",
      ),
    ).toEqual({ colour: GREY, alpha: 0.8 })
  })

  it("mixes an edge in sRGB", () => {
    expect(
      chipEdge(
        "0 0 0 1px color-mix(in srgb, hsl(var(--primary)), hsl(var(--foreground)) 25%)",
        at,
        "look",
      ),
    ).toEqual({ colour: composite(GREY, INK, 0.25), alpha: 1 })
  })

  it("names the look whose shadow has no chip edge", () => {
    expect(() => chipEdge("none", at, "milk-glass light")).toThrow(
      "milk-glass light: no chip edge in none",
    )
  })
})

describe("the view track", () => {
  it("parses Glass's sheen and pane", () => {
    expect(SHEEN.exec(LIGHT_SHEEN)?.[1]).toBe("0.5")
    expect(PANE.exec(LIGHT_PANE)?.slice(1)).toEqual([
      "--primary",
      "0.12",
      "0.96",
      "0.62",
    ])
  })

  it("samples the plain well, and the sheen's peak where a look sets one", () => {
    const plain = composite(GREY, WHITE, 0.35)
    expect(
      trackSamples({ wellFill: "rgb(255 255 255 / 0.35)" }, GREY),
    ).toEqual([["the plain well", plain]])
    expect(
      trackSamples(
        { wellFill: "rgb(255 255 255 / 0.35)", viewTrackSheen: "initial" },
        GREY,
      ),
    ).toEqual([["the plain well", plain]])
    expect(
      trackSamples(
        { wellFill: "rgb(255 255 255 / 0.35)", viewTrackSheen: LIGHT_SHEEN },
        GREY,
      ),
    ).toEqual([
      ["the plain well", plain],
      ["the sheen's peak", composite(plain, WHITE, 0.5)],
    ])
    expect(() =>
      trackSamples({ wellFill: "hsl(var(--muted))" }, GREY),
    ).toThrow("well hsl(var(--muted))")
    expect(() =>
      trackSamples(
        { wellFill: "rgb(255 255 255 / 0.35)", viewTrackSheen: "none" },
        GREY,
      ),
    ).toThrow("sheen none")
  })

  it("reads a flat white pane once and a gradient pane at both ends", () => {
    expect(paneEnds("rgb(255 255 255 / 0.75)", GREY, at)).toEqual([
      ["the pane", composite(GREY, WHITE, 0.75)],
    ])
    expect(paneEnds(LIGHT_PANE, GREY, at)).toEqual([
      ["the pane's top", composite(composite(GREY, WHITE, 0.96), GREY, 0.12)],
      [
        "the pane's bottom",
        composite(composite(GREY, WHITE, 0.62), GREY, 0.12),
      ],
    ])
    expect(() => paneEnds("hsl(var(--card))", GREY, at)).toThrow(
      "pane hsl(var(--card))",
    )
  })

  it("composites an edge at its alpha", () => {
    expect(edgeOn({ colour: INK, alpha: 0.8 }, GREY)).toBe(
      composite(GREY, INK, 0.8),
    )
  })

  it("pairs the edge and every label against every sample", () => {
    const pairs = trackPairs(
      {
        wellFill: "rgb(255 255 255 / 0.35)",
        viewTrackSheen: LIGHT_SHEEN,
        selectedViewFill: LIGHT_PANE,
        selectedViewShadow: "0 0 0 1px hsl(var(--primary) / 0.8)",
      },
      GREY,
      at,
      "look",
    )
    // Two samples; per sample two pane ends plus rest, hover and two presses.
    expect(pairs.edges).toHaveLength(2)
    expect(pairs.labels).toHaveLength(12)
    expect(pairs.edges[0]).toEqual({
      where: "the pane's edge against the plain well",
      ink: composite(composite(GREY, WHITE, 0.35), GREY, 0.8),
      ground: composite(GREY, WHITE, 0.35),
    })
  })
})
