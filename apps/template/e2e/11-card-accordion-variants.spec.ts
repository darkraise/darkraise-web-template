import { test, expect, type Page } from "@playwright/test"
import { DARK_ONLY_PRESETS, PRESETS } from "./fixtures/theme"
import { gotoApp, seedApp, watchConsole } from "./helpers/app"

/**
 * Card `divided` / `border` and the Accordion card variant are pure CSS
 * behaviour, so jsdom unit tests can only assert the data attributes. These
 * rules are also the ones presets are most likely to defeat: Terminal, Sci-fi
 * and Neon each re-tint `.dr-card`'s border, and Sci-fi additionally animates
 * `border-color`, which outranks normal declarations in the cascade. Every
 * assertion below therefore runs under every preset.
 */

const TRANSPARENT = "rgba(0, 0, 0, 0)"

async function styleOf(page: Page, selector: string, property: string) {
  await page.locator(selector).first().waitFor({ state: "visible" })
  return page.evaluate(
    ([sel, prop]) => {
      const node = document.querySelector(sel as string)
      if (!node) throw new Error(`no element matched ${sel}`)
      return getComputedStyle(node).getPropertyValue(prop as string)
    },
    [selector, property] as const,
  )
}

/**
 * `.dr-accordion-trigger` carries `transition-all`, so a border-width change
 * animates from its old value over Tailwind's default 150ms. Reading the
 * computed style straight after a click catches it mid-transition.
 */
async function expectSettledStyle(
  page: Page,
  selector: string,
  property: string,
  value: string,
) {
  await expect
    .poll(async () => styleOf(page, selector, property), { timeout: 2000 })
    .toBe(value)
}

for (const preset of PRESETS) {
  const modes = DARK_ONLY_PRESETS.includes(preset)
    ? (["dark"] as const)
    : (["light", "dark"] as const)

  for (const mode of modes) {
    test.describe(`${preset} · ${mode}`, () => {
      test("divided card draws a rule and restores padding", async ({
        page,
      }) => {
        const consoleWatch = watchConsole(page)
        await seedApp(page, { preset, mode })
        await gotoApp(page, "/components/cards")

        const header = ".dr-card[data-divided='true'] > .dr-card-header"
        expect(await styleOf(page, header, "border-bottom-style")).toBe("solid")
        expect(await styleOf(page, header, "border-bottom-width")).toBe("1px")
        expect(await styleOf(page, header, "border-bottom-color")).not.toBe(
          TRANSPARENT,
        )

        // pt-0 in the base rule; the divided rule restores it so the text does
        // not hug the line.
        const contentPadding = await styleOf(
          page,
          ".dr-card[data-divided='true'] > .dr-card-content",
          "padding-top",
        )
        expect(parseFloat(contentPadding)).toBeGreaterThan(0)

        consoleWatch.assertClean()
      })

      test("border variants survive the preset and keep geometry", async ({
        page,
      }) => {
        const consoleWatch = watchConsole(page)
        await seedApp(page, { preset, mode })
        await gotoApp(page, "/components/cards")

        expect(
          await styleOf(page, ".dr-card[data-border='none']", "border-color"),
        ).toBe(TRANSPARENT)

        // The whole point of the `:not([data-border])` guards: an explicit
        // prop must win over the preset's own .dr-card border rules, which are
        // unlayered under Terminal and Sci-fi and therefore outrank
        // @layer components on specificity alone.
        const strong = await styleOf(
          page,
          ".dr-card[data-border='strong']",
          "border-color",
        )
        const accent = await styleOf(
          page,
          ".dr-card[data-border='accent']",
          "border-color",
        )
        expect(strong).not.toBe(TRANSPARENT)
        expect(accent).not.toBe(TRANSPARENT)
        expect(strong).not.toBe(accent)

        // `none` clears only the colour, so a borderless card must not be
        // narrower than a bordered sibling in the same grid.
        const widths = await page.evaluate(() =>
          ["none", "strong", "accent"].map((variant) => {
            const node = document.querySelector(
              `.dr-card[data-border='${variant}']`,
            )
            if (!node) throw new Error(`no card for border=${variant}`)
            return Math.round(node.getBoundingClientRect().width)
          }),
        )
        expect(new Set(widths).size).toBe(1)

        consoleWatch.assertClean()
      })

      test("accordion card variant stacks real cards", async ({ page }) => {
        const consoleWatch = watchConsole(page)
        await seedApp(page, { preset, mode })
        await gotoApp(page, "/components/accordion")

        const root = ".dr-accordion[data-variant='card']"
        expect(await styleOf(page, root, "display")).toBe("flex")
        expect(
          parseFloat(await styleOf(page, root, "row-gap")),
        ).toBeGreaterThan(0)

        const item = `${root} .dr-accordion-item`
        await expect(page.locator(item).first()).toHaveClass(/dr-card/)

        // The base trigger is `py-4` with no horizontal padding; the card
        // variant pads all four sides like a CardHeader. Left padding is the
        // discriminator, since both are 1rem vertically at default density.
        const trigger = `${item} .dr-accordion-trigger`
        expect(
          parseFloat(await styleOf(page, trigger, "padding-left")),
        ).toBeGreaterThan(0)

        // Closed: no divider. Open: divider under the trigger.
        expect(await styleOf(page, trigger, "border-bottom-width")).toBe("0px")
        await page.locator(trigger).first().click()
        await expect(page.locator(trigger).first()).toHaveAttribute(
          "data-state",
          "open",
        )
        await expectSettledStyle(page, trigger, "border-bottom-width", "1px")
        expect(await styleOf(page, trigger, "border-bottom-color")).not.toBe(
          TRANSPARENT,
        )

        consoleWatch.assertClean()
      })

      test("card rules do not leak to other accordions on the page", async ({
        page,
      }) => {
        const consoleWatch = watchConsole(page)
        await seedApp(page, { preset, mode })
        await gotoApp(page, "/components/accordion")

        // Every ShowcaseExample renders its own default-variant Accordion for
        // the "View code" disclosure. Its trigger must keep the base padding.
        const otherTrigger = await page.evaluate(() => {
          const node = [
            ...document.querySelectorAll(".dr-accordion-trigger"),
          ].find((el) => !el.closest("[data-variant='card']"))
          if (!node) throw new Error("no default-variant trigger on the page")
          return getComputedStyle(node).paddingLeft
        })
        expect(parseFloat(otherTrigger)).toBe(0)

        consoleWatch.assertClean()
      })
    })
  }
}
