import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import {
  SURFACE_ALPHA_FLOOR,
  TRANSPARENCY_SCALE,
  effectiveAlpha,
} from "@theme/config/transparency"
import { composite, contrastRatio } from "@theme/engine/oklch"
import {
  comboName,
  finalTokens,
  isOpaque,
  presetCombos,
  reachableCombos,
  type ThemeCombo,
} from "@test/contrast-matrix"
import { FROST, chipEdgeColour, resolvedTokens } from "@test/preset-tokens"

/**
 * The faces and marks the control anatomy signatures draw, over the engine
 * matrix: every accent and surface colour, contrast and chroma step,
 * background intensity and mode, plain and frosted, and every built-in
 * preset as painted, which adds the accent tint. Pairs another suite
 * already holds are left to it: the accent label on `--primary-fill` (the
 * `pill` tab, the `marked` on glyph, the `key` and `glass` filled labels,
 * whose sheens end above the label's line box, as `button-anatomy.test.ts`
 * pins) in `primary-fill.test.ts`; the destructive labels in
 * `status-contrast.test.ts`; `--primary-text` on the page and the card in
 * `primary-text.test.ts`; Glass's chip edge at each look's own accent in
 * `glass-selected-chip.test.ts`.
 */

const TEXT = 4.5
const MARK = 3
const WHITE = "0 0% 100%"

/** The soft default button's press wash toward the page (button.css). */
const PRESS = 0.16

const registry = resolveRegistry()
const COMBOS = [...reachableCombos(), ...presetCombos()]

interface Pair {
  where: string
  ink: string
  ground: string
}

type Read = (key: string) => string
type Pairs = (combo: ThemeCombo, at: Read) => Pair[]

/** Every pair under `floor` across the matrix, with where it falls. */
function failures(pairs: Pairs, floor: number): string[] {
  const out: string[] = []
  for (const combo of COMBOS) {
    const tokens = finalTokens(combo)
    const at: Read = (key) => {
      const value = tokens[key]
      if (!isOpaque(value)) {
        throw new Error(`${key} is ${value} in ${comboName(combo)}`)
      }
      return value
    }
    for (const { where, ink, ground } of pairs(combo, at)) {
      const ratio = contrastRatio(ink, ground)
      if (ratio < floor) {
        out.push(`${comboName(combo)} ${where}: ${ratio.toFixed(2)}`)
      }
    }
  }
  return out
}

/** The tint step a `soft` face and an `outline` tab cell take at rest. */
const tint = (combo: ThemeCombo, at: Read, deeper = 0) =>
  at(`--primary-${(combo.mode === "light" ? 3 : 4) + deeper}`)

/** The paint of Glass, or of the Glass preset the combination paints. */
function glassPaint(combo: ThemeCombo) {
  return resolvedTokens(
    registry.styles.glass?.tokens,
    combo.preset ? registry.presets[combo.preset]?.tokens : undefined,
    combo.mode,
  )
}

/**
 * What a control in a glass look sits on: the bare page, and a card at the
 * look's alpha over the page at every Transparency step.
 */
function glassPlanes(combo: ThemeCombo, at: Read): [string, string][] {
  const declared = Number(glassPaint(combo).surfaceFillAlpha ?? "1")
  const page = at("--background")
  return [
    ["on the page", page],
    ...Object.entries(TRANSPARENCY_SCALE).map(
      ([step, scale]): [string, string] => [
        `on a card at ${step}`,
        composite(
          page,
          at("--card"),
          effectiveAlpha(declared, scale, SURFACE_ALPHA_FLOOR),
        ),
      ],
    ),
  ]
}

/** Glass's frosted well over `under`. */
function frostedWell(combo: ThemeCombo, under: string): string {
  const paint = glassPaint(combo)
  const well = FROST.exec(paint.wellFill ?? "")
  if (!well) throw new Error(`${comboName(combo)}: well ${paint.wellFill}`)
  return composite(under, WHITE, Number(well[1]))
}

describe("control anatomy contrast over the engine matrix", () => {
  // The glass cases skip plain combinations, so the frosted half and every
  // Glass preset must be in the matrix.
  it("runs frosted combinations and every built-in Glass preset in both modes", () => {
    expect(COMBOS.some((combo) => combo.frosted && !combo.preset)).toBe(true)
    expect(COMBOS.filter((combo) => combo.frosted && combo.preset).length).toBe(
      2 * 7,
    )
  })

  it("soft buttons and outline tab cells: the accent label clears 4.5:1 on its tint, at rest, on hover and pressed", () => {
    expect(
      failures(
        (combo, at) => [
          {
            where: "on the resting tint",
            ink: at("--primary-text"),
            ground: tint(combo, at),
          },
          {
            where: "on the hover tint",
            ink: at("--primary-text"),
            ground: tint(combo, at, 1),
          },
          {
            where: "on the soft default press over the resting tint",
            ink: at("--primary-text"),
            ground: composite(tint(combo, at), at("--background"), PRESS),
          },
          {
            where: "on the soft default press over the hover tint",
            ink: at("--primary-text"),
            ground: composite(tint(combo, at, 1), at("--background"), PRESS),
          },
        ],
        TEXT,
      ),
    ).toEqual([])
  }, 30_000)

  // The outline check, bar, ring and dot, the outline tab cell's edge, the
  // pill tab's 1px edge and the soft outline button's edge are --primary on
  // the page or the card.
  it("outline marks: the accent clears 3:1 on the page and the card", () => {
    expect(
      failures(
        (_combo, at) =>
          (["--background", "--card"] as const).map((ground) => ({
            where: `on ${ground}`,
            ink: at("--primary"),
            ground: at(ground),
          })),
        MARK,
      ),
    ).toEqual([])
  }, 30_000)

  it("marked switches: the off glyph clears 4.5:1 on the off track", () => {
    expect(
      failures((combo, at) => {
        const ink = at("--muted-foreground")
        if (!combo.frosted) {
          return [{ where: "on --input", ink, ground: at("--input") }]
        }
        return glassPlanes(combo, at).map(([plane, under]) => ({
          where: `on the frosted well ${plane}`,
          ink,
          ground: frostedWell(combo, under),
        }))
      }, TEXT),
    ).toEqual([])
  }, 30_000)

  // The capsule is the card at the card plane's alpha: secondary paints
  // it, outline reads --btn-neutral-fill, which Glass sets to the same.
  it("glass buttons: the secondary and outline labels clear 4.5:1 on the frosted capsule", () => {
    expect(
      failures((combo, at) => {
        if (!combo.frosted) return []
        const declared = Number(glassPaint(combo).surfaceFillAlpha ?? "1")
        const card = at("--card")
        return Object.entries(TRANSPARENCY_SCALE).flatMap(([step, scale]) => {
          const alpha = effectiveAlpha(declared, scale, SURFACE_ALPHA_FLOOR)
          const onPage = composite(at("--background"), card, alpha)
          const onCard = composite(onPage, card, alpha)
          return [
            ["the secondary", "--secondary-foreground"],
            ["the outline", "--foreground"],
          ].flatMap(([button, label]) => [
            {
              where: `${button} label at ${step}, on the page`,
              ink: at(label as string),
              ground: onPage,
            },
            {
              where: `${button} label at ${step}, on a card`,
              ink: at(label as string),
              ground: onCard,
            },
          ])
        })
      }, TEXT),
    ).toEqual([])
  }, 30_000)

  it("glass tabs: the selected chip's edge clears 3:1 on the frosted well", () => {
    expect(
      failures((combo, at) => {
        if (!combo.frosted) return []
        const ink = chipEdgeColour(
          glassPaint(combo).selectedViewShadow,
          at,
          comboName(combo),
        )
        return glassPlanes(combo, at).map(([plane, under]) => ({
          where: `on the frosted well ${plane}`,
          ink,
          ground: frostedWell(combo, under),
        }))
      }, MARK),
    ).toEqual([])
  }, 30_000)
})

/**
 * The switch marks, as the owner decided on 2026-10-14 from this matrix:
 * the checked `track` thumb and the lit `slide` lamp are `--primary-text`,
 * because `--primary` fell under 3:1 against the `--primary-4` track (2.68
 * light, 2.64 dark at worst) and the `--input` slot (2.25, 2.54).
 */
const SWITCH_MARKS: [string, Pairs][] = [
  [
    "track: the --primary-text thumb on the --primary-4 track",
    (_combo, at) => [
      { where: "thumb", ink: at("--primary-text"), ground: at("--primary-4") },
    ],
  ],
  [
    "slide: the --primary-text lamp on the --input slot",
    (_combo, at) => [
      { where: "lamp", ink: at("--primary-text"), ground: at("--input") },
    ],
  ],
]

describe("switch marks over the engine matrix", () => {
  it.each(SWITCH_MARKS)(
    "%s clears 3:1",
    (_name, pairs) => {
      expect(failures(pairs, MARK)).toEqual([])
    },
    30_000,
  )
})
