import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cssRules } from "../../test/css-rules"
import { stripCssComments } from "../../test/strip-css-comments"

// The sliderStyle signature restyles every Slider and every Progress from
// the root attribute. jsdom computes no cascade, so the source rules are
// what this asserts; e2e 66 measures them in Chromium.

const SOURCES = {
  slider: join("src", "components", "slider", "slider.css"),
  progress: join("src", "components", "progress", "progress.css"),
} as const

type Source = keyof typeof SOURCES

interface Rule {
  selectors: string[]
  wrappers: string[]
  body: string
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function rules(file: Source): Rule[] {
  return cssRules(stripCssComments(readFileSync(SOURCES[file], "utf8"))).map(
    (rule) => ({
      selectors: rule.selector
        .split(/,(?![^(]*\))/)
        .map(normalise)
        .filter(Boolean),
      wrappers: rule.wrappers,
      body: normalise(rule.body),
    }),
  )
}

function bodyOf(file: Source, selector: string): string {
  const bodies = rules(file)
    .filter(
      (rule) =>
        rule.selectors.includes(selector) &&
        rule.wrappers.join(" | ") === "@layer components",
    )
    .map((rule) => rule.body)
  if (bodies.length === 0) {
    throw new Error(`no rule ${selector} in ${file} inside @layer components`)
  }
  return bodies.join(" ")
}

const FILES = Object.keys(SOURCES) as Source[]
const VALUES = ["bar", "knob", "ruled"] as const
const SIGNATURE = /\[data-slider-style="([^"]*)"\]/

/** Every selector of either file that names the signature. */
const SIGNED = FILES.flatMap((file) =>
  rules(file).flatMap((rule) =>
    rule.selectors
      .filter((selector) => SIGNATURE.test(selector))
      .map((selector) => ({ file, selector, wrappers: rule.wrappers })),
  ),
)

/** A slider or progress part under the root attribute, nothing else. */
const SCOPED =
  /^\[data-slider-style="(?:bar|knob|ruled)"\] \.dr-(?:slider|slider-track|slider-range|slider-step|slider-thumb|progress|progress-indicator)(?:\[data-orientation="(?:horizontal|vertical)"\])?(?::has\(\.dr-slider-step\))?(?::dir\(rtl\))?(?:::before|::after)?$/

const RECESS = "var(--check-well-shadow), inset 0 1px 2px rgb(0 0 0 / 0.16)"

describe("slider style signature", () => {
  it.each(FILES.flatMap((file) => VALUES.map((value) => [file, value])))(
    "%s.css draws %s",
    (file, value) => {
      expect(
        SIGNED.some(
          (entry) =>
            entry.file === file &&
            entry.selector.startsWith(`[data-slider-style="${value}"] `),
        ),
      ).toBe(true)
    },
  )

  it("never names the kit default", () => {
    expect(
      SIGNED.filter((entry) => entry.selector.includes('"round"')),
    ).toEqual([])
  })

  it("scopes every rule to a slider or progress part under the root attribute", () => {
    expect(SIGNED.filter((entry) => !SCOPED.test(entry.selector))).toEqual([])
    expect(
      SIGNED.filter(
        (entry) => entry.wrappers.join(" | ") !== "@layer components",
      ),
    ).toEqual([])
  })

  it("keeps any hover rule inside @media (hover: hover)", () => {
    const ungated = FILES.flatMap((file) =>
      rules(file).filter(
        (rule) =>
          rule.selectors.some((selector) => selector.includes(":hover")) &&
          !rule.wrappers.includes("@media (hover: hover)"),
      ),
    )
    expect(ungated).toEqual([])
  })
})

describe("bar", () => {
  it("squares the track and the progress bar", () => {
    expect(bodyOf("slider", '[data-slider-style="bar"] .dr-slider-track')).toBe(
      "border-radius: 0;",
    )
    expect(bodyOf("progress", '[data-slider-style="bar"] .dr-progress')).toBe(
      "border-radius: 0;",
    )
  })

  it("draws the thumb as a 6x18 accent bar, 18x6 when vertical", () => {
    expect(bodyOf("slider", '[data-slider-style="bar"] .dr-slider-thumb')).toBe(
      "width: 6px; height: 18px; border-width: 3px; border-color: hsl(var(--primary)); border-radius: 0; background-color: transparent;",
    )
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="bar"] .dr-slider-thumb[data-orientation="vertical"]',
      ),
    ).toBe("width: 18px; height: 6px;")
  })
})

describe("knob", () => {
  it("recesses the track and makes the progress bar a 10px recessed bar", () => {
    expect(
      bodyOf("slider", '[data-slider-style="knob"] .dr-slider-track'),
    ).toBe(`box-shadow: ${RECESS};`)
    expect(bodyOf("progress", '[data-slider-style="knob"] .dr-progress')).toBe(
      `height: calc(var(--track-height) + 2px); box-shadow: ${RECESS};`,
    )
  })

  it("draws a 22px domed knob with an 8px accent centre dot", () => {
    expect(
      bodyOf("slider", '[data-slider-style="knob"] .dr-slider-thumb'),
    ).toBe(
      "width: 22px; height: 22px; border-color: hsl(var(--border-strong)); background-image: radial-gradient(circle at 50% 30%, rgb(255 255 255 / 0.6), rgb(255 255 255 / 0) 70%), linear-gradient(rgb(0 0 0 / 0) 70%, rgb(0 0 0 / 0.12));",
    )
    expect(
      bodyOf("slider", '[data-slider-style="knob"] .dr-slider-thumb::after'),
    ).toBe(
      'content: ""; position: absolute; inset: 0; width: 8px; height: 8px; margin: auto; border: 4px solid hsl(var(--primary)); border-radius: var(--radius-pill);',
    )
  })
})

describe("ruled", () => {
  it("draws the track as a 2px hairline that lets its marks out", () => {
    expect(
      bodyOf("slider", '[data-slider-style="ruled"] .dr-slider-track'),
    ).toBe(
      "height: 2px; overflow: visible; background-color: hsl(var(--border-strong)); box-shadow: none;",
    )
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider-track[data-orientation="vertical"]',
      ),
    ).toBe("width: 2px; height: 100%;")
    expect(
      bodyOf("slider", '[data-slider-style="ruled"] .dr-slider-range'),
    ).toBe("box-shadow: inset 0 0 0 1px hsl(var(--primary));")
  })

  it("keeps the slider's box at the track height", () => {
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider[data-orientation="horizontal"]',
      ),
    ).toBe("min-height: var(--track-height);")
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider[data-orientation="vertical"]',
      ),
    ).toBe("min-width: var(--track-height);")
  })

  it("rules a tick every 10% below the track, inline-end when vertical", () => {
    expect(
      bodyOf("slider", '[data-slider-style="ruled"] .dr-slider::before'),
    ).toBe('content: ""; position: absolute;')
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider[data-orientation="horizontal"]::before',
      ),
    ).toBe(
      "inset-inline: 0; top: calc(50% + 3px); height: 5px; background-image: repeating-linear-gradient(to right, hsl(var(--border-strong)) 0 1px, transparent 1px calc((100% - 1px) / 10));",
    )
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider[data-orientation="vertical"]::before',
      ),
    ).toBe(
      "inset-block: 0; inset-inline-start: calc(50% + 3px); width: 5px; background-image: repeating-linear-gradient(to bottom, hsl(var(--border-strong)) 0 1px, transparent 1px calc((100% - 1px) / 10));",
    )
  })

  it("lets the slider's own step marks win, drawn as 1px ticks", () => {
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider:has(.dr-slider-step)::before',
      ),
    ).toBe("content: none;")
    expect(
      bodyOf("slider", '[data-slider-style="ruled"] .dr-slider-step'),
    ).toBe(
      "width: 1px; height: 5px; border-radius: 0; background-color: hsl(var(--border-strong)); translate: 0 calc(50% + 3px);",
    )
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider-step[data-orientation="vertical"]',
      ),
    ).toBe("width: 5px; height: 1px; translate: calc(50% + 3px) 0;")
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider-step[data-orientation="vertical"]:dir(rtl)',
      ),
    ).toBe("translate: calc(-50% - 3px) 0;")
  })

  it("draws the thumb as a 2x18 accent needle with a head in its ::after", () => {
    expect(
      bodyOf("slider", '[data-slider-style="ruled"] .dr-slider-thumb'),
    ).toBe(
      "width: 2px; height: 18px; border-width: 1px; border-color: hsl(var(--primary)); border-radius: 0; background-color: transparent;",
    )
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider-thumb[data-orientation="vertical"]',
      ),
    ).toBe("width: 18px; height: 2px;")
    expect(
      bodyOf("slider", '[data-slider-style="ruled"] .dr-slider-thumb::after'),
    ).toBe(
      'content: ""; position: absolute; inset-block-start: -1px; inset-inline-start: calc(50% - 4px); width: 8px; height: 6px; border-style: solid; border-width: 6px 4px 0; border-color: hsl(var(--primary)) transparent transparent;',
    )
    expect(
      bodyOf(
        "slider",
        '[data-slider-style="ruled"] .dr-slider-thumb[data-orientation="vertical"]::after',
      ),
    ).toBe(
      "inset-block-start: calc(50% - 4px); inset-inline-start: -1px; width: 6px; height: 8px; border-width: 4px 0; border-inline-start-width: 6px; border-color: transparent; border-inline-start-color: hsl(var(--primary));",
    )
  })

  it("leaves the thumb's ::before, its 24px hit area, to the kit", () => {
    expect(
      SIGNED.filter((entry) =>
        /\.dr-slider-thumb\S*::before$/.test(entry.selector),
      ),
    ).toEqual([])
  })

  it("draws the progress bar as a hairline in the middle of its own box", () => {
    expect(bodyOf("progress", '[data-slider-style="ruled"] .dr-progress')).toBe(
      "display: flex; align-items: center; background: linear-gradient(hsl(var(--border-strong)) 0 0) center / 100% 2px no-repeat;",
    )
    expect(
      bodyOf("progress", '[data-slider-style="ruled"] .dr-progress-indicator'),
    ).toBe("height: 2px; box-shadow: inset 0 0 0 1px hsl(var(--primary));")
  })

  it("derives the progress hairline from the bar, not from --track-height", () => {
    const ruled = bodyOf("progress", '[data-slider-style="ruled"] .dr-progress')
    expect(ruled).not.toContain("--track-height")
    expect(ruled).not.toContain("padding")
  })
})
