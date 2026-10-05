import { test, expect, type Locator, type Page } from "@playwright/test"
import { STYLES } from "./fixtures/theme"
import { applyTheme, boxOf, readToken, seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { computed, contrast, pixel, rgbOf } from "./helpers/measure"

// Tall enough that every probe renders on screen: pixel() clips its
// screenshot to the viewport.
test.use({ viewport: { width: 1440, height: 2400 } })

// Two pages this tall rendering the glass probes at once crash the renderer
// (page.goto: Page crashed), so the file's tests share one worker.
test.describe.configure({ mode: "default" })

/**
 * Control states on the control-contract fixture: each control's boundary,
 * indicator and state, read from computed style, geometry or rendered pixels
 * in both modes.
 */

const MODES = ["light", "dark"] as const

async function openInMode(
  page: Page,
  mode: (typeof MODES)[number],
): Promise<void> {
  await seedApp(page, { style: "quiet", mode })
  await openControlFixture(page)
  await page.mouse.move(0, 0)
}

function probe(page: Page, name: string, selector: string): Locator {
  return page.locator(`[data-probe="${name}"] ${selector}`)
}

test.describe("select trigger", () => {
  for (const mode of MODES) {
    test(`a long value ends in an ellipsis clear of the chevron · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const trigger = probe(page, "select-long", ".dr-select-trigger")
      const value = trigger.locator(":scope > span")
      const chevron = trigger.locator(":scope > svg")
      await expect(value).toHaveText("Supercalifragilisticexpialidocious")
      expect(await computed(value, "text-overflow")).toBe("ellipsis")
      expect(
        await value.evaluate((el) => el.scrollWidth > el.clientWidth),
        "the value overflows its box",
      ).toBe(true)
      const valueBox = await boxOf(value)
      const chevronBox = await boxOf(chevron)
      expect(
        chevronBox.x - (valueBox.x + valueBox.width),
      ).toBeGreaterThanOrEqual(4)
    })
  }
})

/** What a field trigger paints, compared against the Select trigger's. */
const TRIGGER_PAINT = [
  "background-color",
  "border-top-color",
  "border-bottom-color",
  "border-top-left-radius",
  "color",
  "height",
] as const

test.describe("cascade trigger", () => {
  for (const mode of MODES) {
    test(`paints like the Select trigger · ${mode}`, async ({ page }) => {
      await openInMode(page, mode)
      const select = probe(page, "select", ".dr-select-trigger")
      const cascade = probe(page, "cascade", ".dr-cascade-trigger")
      await expect(cascade).toHaveAttribute("data-placeholder", "")
      for (const property of TRIGGER_PAINT) {
        expect(await computed(cascade, property), property).toBe(
          await computed(select, property),
        )
      }
    })
  }
})

test.describe("time picker trigger", () => {
  for (const mode of MODES) {
    test(`paints like the Select trigger and marks an empty value · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const select = probe(page, "select", ".dr-select-trigger")
      const filled = probe(page, "time-picker", ".dr-time-picker-trigger")
      const empty = probe(page, "time-picker-empty", ".dr-time-picker-trigger")
      await expect(filled.locator(":scope > span")).toHaveText(/12:00/)
      await expect(filled).not.toHaveAttribute("data-placeholder")
      await expect(empty).toHaveAttribute("data-placeholder", "")
      for (const property of TRIGGER_PAINT) {
        expect(await computed(empty, property), property).toBe(
          await computed(select, property),
        )
      }
    })
  }
})

test.describe("date input placeholders", () => {
  for (const mode of MODES) {
    test(`segments show YYYY, MM and DD in the muted colour · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const segments = probe(page, "date-input", ".dr-date-input-segment")
      await expect(segments).toHaveCount(3)
      expect(
        await segments.evaluateAll((elements) =>
          elements.map((element) => (element as HTMLInputElement).placeholder),
        ),
      ).toEqual(["YYYY", "MM", "DD"])
      const muted = await computed(
        probe(page, "select", ".dr-select-trigger"),
        "color",
      )
      for (const segment of await segments.all()) {
        expect(
          await segment.evaluate(
            (element) => getComputedStyle(element, "::placeholder").color,
          ),
        ).toBe(muted)
      }
    })
  }
})

test.describe("chip fills", () => {
  const CHIPS = [".dr-multi-select-chip", ".dr-tags-input-item-preview"]

  for (const style of STYLES) {
    for (const mode of MODES) {
      test(`chips separate from the card well · ${style} · ${mode}`, async ({
        page,
      }) => {
        await seedApp(page, { style, mode })
        await openControlFixture(page)
        await page.mouse.move(0, 0)
        for (const chip of CHIPS) {
          const target = probe(page, "chips-card", chip).first()
          await target.scrollIntoViewIfNeeded()
          const box = await boxOf(target)
          const y = Math.round(box.y + box.height / 2)
          // The well is read in the empty input beside the chip, away from
          // the field's edges.
          const well = await pixel(page, Math.round(box.x + box.width + 12), y)
          const fill = await pixel(page, Math.round(box.x + 3), y)
          const ratio = contrast(fill, well)
          console.log(
            `chip ${style} · ${mode} · ${chip}: ${ratio.toFixed(2)}:1`,
          )
          expect(
            ratio,
            `${chip}: rgb(${fill.join(",")}) on rgb(${well.join(",")})`,
          ).toBeGreaterThanOrEqual(1.1)
        }
      })
    }
  }
})

/** A CSS colour as the browser resolves it on the page. */
async function resolvedColour(page: Page, value: string): Promise<string> {
  return page.evaluate((colour) => {
    const sample = document.createElement("span")
    sample.style.color = colour
    document.body.append(sample)
    const resolved = getComputedStyle(sample).color
    sample.remove()
    return resolved
  }, value)
}

/** A colour token holding an `H S% L%` triple, as the browser resolves it. */
function tokenColour(page: Page, token: string): Promise<string> {
  return resolvedColour(page, `hsl(var(${token}))`)
}

/** Opacity as painted: the element's own times every ancestor's. */
function effectiveOpacity(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    let value = 1
    for (let node: Element | null = element; node; node = node.parentElement) {
      value *= Number(getComputedStyle(node).opacity)
    }
    return value
  })
}

test.describe("grouped input states", () => {
  for (const mode of MODES) {
    test(`an invalid group draws the destructive edge and ring · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const group = probe(page, "input-group-invalid", ".dr-input-group")
      const input = group.locator("input")
      const edge = await tokenColour(page, "--destructive-edge")
      for (const side of ["top", "right", "bottom", "left"]) {
        expect(await computed(group, `border-${side}-color`), side).toBe(edge)
      }
      await input.focus()
      await expect
        .poll(() => computed(group, "box-shadow"))
        .toContain(`${edge} 0px 0px 0px 1px`)
      await expect.poll(() => computed(input, "box-shadow")).toBe("none")
    })

    test(`a disabled group fades as one surface · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const group = probe(page, "input-group-disabled", ".dr-input-group")
      const input = group.locator("input")
      const token = Number(await readToken(page, "--disabled-opacity"))
      expect(token).toBeGreaterThan(0)
      expect(token).toBeLessThan(1)
      expect(Number(await computed(group, "opacity"))).toBeCloseTo(token, 3)
      expect(await computed(group, "cursor")).toBe("not-allowed")
      // The input inside fades once, through its group, not a second time.
      expect(await computed(input, "opacity")).toBe("1")
      expect(await effectiveOpacity(input)).toBeCloseTo(token, 3)
      expect(await computed(input, "cursor")).toBe("not-allowed")

      // An Input disabled on its own, with no group, still fades itself and
      // takes the disabled cursor, not the read-only one.
      const bare = probe(
        page,
        "input-group-disabled",
        '[aria-label="Disabled name"]',
      )
      expect(Number(await computed(bare, "opacity"))).toBeCloseTo(token, 3)
      expect(await effectiveOpacity(bare)).toBeCloseTo(token, 3)
      expect(await computed(bare, "cursor")).toBe("not-allowed")
    })
  }
})

test.describe("file upload trigger", () => {
  for (const mode of MODES) {
    test(`the trigger draws as a default button · ${mode}`, async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode, radius: "pill" })
      await openControlFixture(page)
      await page.mouse.move(0, 0)
      const trigger = probe(page, "file-upload", ".dr-file-upload-trigger")
      const button = probe(page, "buttons", '.dr-btn[data-variant="default"]')
      for (const property of [
        "border-top-left-radius",
        "background-color",
        "color",
        "height",
        "padding-left",
        "font-size",
        "cursor",
      ]) {
        expect(await computed(trigger, property), property).toBe(
          await computed(button, property),
        )
      }
    })
  }
})

test.describe("number input steppers", () => {
  async function dividerRatio(page: Page): Promise<number> {
    const divider = rgbOf(
      await computed(
        probe(page, "number-input", ".dr-number-input-trigger-group"),
        "border-left-color",
      ),
    )
    const fill = rgbOf(
      await computed(
        probe(page, "number-input", ".dr-number-input-control"),
        "background-color",
      ),
    )
    return contrast(divider, fill)
  }

  for (const mode of MODES) {
    test(`steppers draw --icon-size-sm icons and --input dividers · ${mode}`, async ({
      page,
    }) => {
      await openInMode(page, mode)
      const group = probe(
        page,
        "number-input",
        ".dr-number-input-trigger-group",
      )
      const iconSize = await group.evaluate((element) => {
        const ruler = document.createElement("div")
        ruler.style.width = "var(--icon-size-sm)"
        element.append(ruler)
        const width = ruler.getBoundingClientRect().width
        ruler.remove()
        return width
      })
      const icons = await probe(
        page,
        "number-input",
        ".dr-number-input-stepper svg",
      ).all()
      expect(icons).toHaveLength(2)
      for (const icon of icons) {
        expect((await boxOf(icon)).width).toBeCloseTo(iconSize, 1)
      }
      const divider = await tokenColour(page, "--input")
      expect(await computed(group, "border-left-color")).toBe(divider)
      expect(
        await computed(
          probe(page, "number-input", ".dr-number-input-stepper-increment"),
          "border-bottom-color",
        ),
      ).toBe(divider)
    })
  }

  test("the dividers read alike in light and dark", async ({
    page,
    context,
  }) => {
    await openInMode(page, "light")
    const light = await dividerRatio(page)
    await applyTheme(page, { mode: "dark" })
    // A second load of the unbundled fixture in one page renders an empty
    // root; a sibling page shares localStorage and boots in the new mode.
    const darkPage = await context.newPage()
    await openControlFixture(darkPage)
    await expect(darkPage.locator("html")).toHaveAttribute("data-mode", "dark")
    const dark = await dividerRatio(darkPage)
    expect(
      Math.abs(light - dark),
      `light ${light.toFixed(2)}:1, dark ${dark.toFixed(2)}:1`,
    ).toBeLessThanOrEqual(0.5)
  })

  for (const fontSize of ["medium", "extra-large"] as const) {
    test(`steppers share the control's inner height · compact · ${fontSize}`, async ({
      page,
    }) => {
      await seedApp(page, {
        style: "quiet",
        mode: "light",
        density: "compact",
        fontSize,
      })
      await openControlFixture(page)
      const control = await boxOf(
        probe(page, "number-input", ".dr-number-input-control"),
      )
      const increment = await boxOf(
        probe(page, "number-input", ".dr-number-input-stepper-increment"),
      )
      const decrement = await boxOf(
        probe(page, "number-input", ".dr-number-input-stepper-decrement"),
      )
      expect(increment.y - control.y, "increment top").toBeCloseTo(1, 0)
      expect(
        control.y + control.height - (decrement.y + decrement.height),
        "decrement bottom",
      ).toBeCloseTo(1, 0)
    })
  }
})

test.describe("colour picker swatches", () => {
  for (const style of STYLES) {
    for (const mode of MODES) {
      test(`swatch edges and the active ring reach 3:1 · ${style} · ${mode}`, async ({
        page,
      }) => {
        await seedApp(page, { style, mode })
        await openControlFixture(page)
        await page.mouse.move(0, 0)
        const items = probe(page, "swatches", ".dr-color-picker-swatch-item")
        await expect(items).toHaveCount(3)
        await items.first().scrollIntoViewIfNeeded()

        // The white (0) and black (1) swatches: the left edge column against
        // the ground 4px to its left.
        for (const index of [0, 1]) {
          const box = await boxOf(items.nth(index))
          const x = Math.round(box.x)
          const y = Math.round(box.y + box.height / 2)
          const edge = await pixel(page, x, y)
          const ground = await pixel(page, x - 4, y)
          expect(
            contrast(edge, ground),
            `swatch ${index}: edge rgb(${edge.join(",")}) on rgb(${ground.join(",")})`,
          ).toBeGreaterThanOrEqual(3)
        }

        // The ring is a 2px outline 2px out: x + 3 past the right edge sits
        // inside it, x + 8 is clear of it.
        const active = probe(
          page,
          "swatches",
          '.dr-color-picker-swatch-item[data-active="true"]',
        )
        await expect(active).toHaveCount(1)
        const box = await boxOf(active)
        const right = Math.round(box.x + box.width)
        const y = Math.round(box.y + box.height / 2)
        const ring = await pixel(page, right + 3, y)
        const ground = await pixel(page, right + 8, y)
        expect(
          contrast(ring, ground),
          `ring rgb(${ring.join(",")}) on rgb(${ground.join(",")})`,
        ).toBeGreaterThanOrEqual(3)

        expect(
          await computed(
            probe(page, "swatches", ".dr-color-picker-swatch"),
            "border-top-color",
          ),
          "trigger swatch edge",
        ).toBe(await resolvedColour(page, "var(--field-edge)"))
      })
    }
  }
})

test.describe("switch off thumb", () => {
  for (const style of STYLES) {
    for (const mode of MODES) {
      test(`off thumb reaches 2.5:1 on its track · ${style} · ${mode}`, async ({
        page,
      }) => {
        await seedApp(page, { style, mode })
        await openControlFixture(page)
        await page.mouse.move(0, 0)
        const track = probe(page, "switch", ".dr-switch")
        await expect(track).toHaveAttribute("data-state", "unchecked")
        await track.scrollIntoViewIfNeeded()
        const trackBox = await boxOf(track)
        const thumbBox = await boxOf(track.locator(".dr-switch-thumb"))
        const y = Math.round(trackBox.y + trackBox.height / 2)
        const thumb = await pixel(
          page,
          Math.round(thumbBox.x + thumbBox.width / 2),
          y,
        )
        // The off thumb fills the start half; 6px in from the end is the
        // track's own fill, inside its 2px border.
        const ground = await pixel(
          page,
          Math.round(trackBox.x + trackBox.width - 6),
          y,
        )
        expect(
          contrast(thumb, ground),
          `thumb rgb(${thumb.join(",")}) on track rgb(${ground.join(",")})`,
        ).toBeGreaterThanOrEqual(2.5)
      })
    }
  }

  test("the thumb transitions its colour", async ({ page }) => {
    await openInMode(page, "light")
    const thumb = probe(page, "switch", ".dr-switch-thumb")
    expect(await computed(thumb, "transition-property")).toContain(
      "background-color",
    )
  })
})

test.describe("angle slider dial", () => {
  for (const style of STYLES) {
    for (const mode of MODES) {
      test(`dial edge reaches 3:1 and the knob is round · ${style} · ${mode}`, async ({
        page,
      }) => {
        await seedApp(page, { style, mode })
        await openControlFixture(page)
        await page.mouse.move(0, 0)
        const dial = probe(page, "angle", ".dr-angle-slider")
        await dial.scrollIntoViewIfNeeded()
        const box = await boxOf(dial)
        // The knob sits at 45°, so the dial's top centre is bare edge.
        const x = Math.round(box.x + box.width / 2)
        const top = Math.round(box.y)
        const edge = await pixel(page, x, top)
        const ground = await pixel(page, x, top - 4)
        expect(
          contrast(edge, ground),
          `edge rgb(${edge.join(",")}) on rgb(${ground.join(",")})`,
        ).toBeGreaterThanOrEqual(3)

        const knob = dial.locator(".dr-angle-slider-pointer")
        const width = await computed(knob, "width")
        expect(await computed(knob, "height"), "knob is as tall as wide").toBe(
          width,
        )
        expect(parseFloat(width)).toBeGreaterThanOrEqual(12)
        expect(await computed(knob, "border-top-width")).toBe("2px")
        expect(await computed(knob, "border-top-color")).toBe(
          await resolvedColour(page, "hsl(var(--primary))"),
        )
        expect(await computed(knob, "background-color")).toBe(
          await resolvedColour(page, "hsl(var(--primary-foreground))"),
        )
      })
    }
  }
})

test.describe("vertical slider", () => {
  test("the track stands upright and the range spans its thumbs", async ({
    page,
  }) => {
    await openInMode(page, "light")
    const track = await boxOf(
      probe(page, "slider-vertical", ".dr-slider-track"),
    )
    expect(track.height, "track height").toBeGreaterThan(track.width)
    expect(track.height, "track fills the box").toBeCloseTo(
      (await boxOf(page.locator('[data-probe="slider-vertical"]'))).height,
      0,
    )

    const centres: number[] = []
    for (const thumb of await probe(
      page,
      "slider-vertical",
      ".dr-slider-thumb",
    ).all()) {
      const box = await boxOf(thumb)
      centres.push(box.y + box.height / 2)
    }
    expect(centres).toHaveLength(2)
    const upper = Math.min(...centres)
    const lower = Math.max(...centres)
    const range = await boxOf(
      probe(page, "slider-vertical", ".dr-slider-range"),
    )
    expect(
      Math.abs(range.y - upper),
      "range top at the upper thumb",
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(range.y + range.height - lower),
      "range bottom at the lower thumb",
    ).toBeLessThanOrEqual(1)
  })
})
