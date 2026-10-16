import type { PaintToken } from "@theme/config/tokens"
import { composite } from "@theme/engine/oklch"
import { FROST, chipEdge, type ChipEdge } from "@test/preset-tokens"

const WHITE = "0 0% 100%"

/** A track sheen: white at an alpha at the top, clear by the given stop. */
export const SHEEN =
  /^linear-gradient\(180deg, rgb\(255 255 255 \/ ([\d.]+)\), transparent [\d.]+%\)$/

/**
 * A selected pane: an engine colour's flat tint over a top-lit white
 * gradient, `linear-gradient(tint, tint), linear-gradient(180deg, top, bottom)`.
 */
export const PANE =
  /^linear-gradient\(hsl\(var\((--[\w-]+)\) \/ ([\d.]+)\), hsl\(var\(\1\) \/ \2\)\), linear-gradient\(180deg, rgb\(255 255 255 \/ ([\d.]+)\), rgb\(255 255 255 \/ ([\d.]+)\)\)$/

/** The kit's hover wash where a look sets no ghostHover (theme.css). */
export const HOVER = 0.08

/** The kit's press wash (theme.css --state-layer-press). */
export const PRESS = 0.16

export interface Pair {
  where: string
  ink: string
  ground: string
}

export type TrackPaint = Partial<Record<PaintToken, string>>

type Read = (key: string) => string

/**
 * The colours a view-switch track shows over `under`: the plain frosted
 * well, and the well under the sheen's peak where the look sets a sheen.
 */
export function trackSamples(
  paint: TrackPaint,
  under: string,
): [string, string][] {
  const well = FROST.exec(paint.wellFill ?? "")
  if (!well) throw new Error(`well ${paint.wellFill}`)
  const plain = composite(under, WHITE, Number(well[1]))
  const samples: [string, string][] = [["the plain well", plain]]
  const sheen = paint.viewTrackSheen
  if (sheen !== undefined && sheen !== "initial") {
    const peak = SHEEN.exec(sheen)
    if (!peak) throw new Error(`sheen ${sheen}`)
    samples.push(["the sheen's peak", composite(plain, WHITE, Number(peak[1]))])
  }
  return samples
}

/**
 * The selected pane's colour over `track`: a flat white pane once, a
 * gradient pane at its top and its bottom, the tint over each.
 */
export function paneEnds(
  fill: string | undefined,
  track: string,
  at: Read,
): [string, string][] {
  const flat = FROST.exec(fill ?? "")
  if (flat) return [["the pane", composite(track, WHITE, Number(flat[1]))]]
  const pane = PANE.exec(fill ?? "")
  if (!pane) throw new Error(`pane ${fill}`)
  const [, tint = "", tintAlpha = "", top = "", bottom = ""] = pane
  return [
    ["the pane's top", top],
    ["the pane's bottom", bottom],
  ].map(([end, alpha]): [string, string] => [
    end as string,
    composite(
      composite(track, WHITE, Number(alpha)),
      at(tint),
      Number(tintAlpha),
    ),
  ])
}

/** An edge as it paints over `ground`, at its own alpha. */
export function edgeOn(edge: ChipEdge, ground: string): string {
  return composite(ground, edge.colour, edge.alpha)
}

/**
 * The marks and labels of a view-switch strip over `under`: the selected
 * pane's edge against each track sample; the selected label on each end
 * of the pane over each sample; and the other labels on each sample at
 * rest, under the hover wash and under the press wash, which paint in the
 * label's own colour (`currentColor`). A pointer press keeps the hover
 * label; a touch press keeps the resting one.
 */
export function trackPairs(
  paint: TrackPaint,
  under: string,
  at: Read,
  where: string,
): { edges: Pair[]; labels: Pair[] } {
  const edge = chipEdge(paint.selectedViewShadow, at, where)
  const hover = Number(paint.ghostHover ?? HOVER)
  const rest = at("--muted-foreground")
  const lifted = at("--foreground")
  const edges: Pair[] = []
  const labels: Pair[] = []
  for (const [track, sample] of trackSamples(paint, under)) {
    edges.push({
      where: `the pane's edge against ${track}`,
      ink: edgeOn(edge, sample),
      ground: sample,
    })
    for (const [end, pane] of paneEnds(paint.selectedViewFill, sample, at)) {
      labels.push({
        where: `the selected label on ${end} over ${track}`,
        ink: lifted,
        ground: pane,
      })
    }
    labels.push(
      { where: `a resting label on ${track}`, ink: rest, ground: sample },
      {
        where: `a hovered label on ${track}`,
        ink: lifted,
        ground: composite(sample, lifted, hover),
      },
      {
        where: `a pointer-pressed label on ${track}`,
        ink: lifted,
        ground: composite(sample, lifted, PRESS),
      },
      {
        where: `a touch-pressed label on ${track}`,
        ink: rest,
        ground: composite(sample, rest, PRESS),
      },
    )
  }
  return { edges, labels }
}
