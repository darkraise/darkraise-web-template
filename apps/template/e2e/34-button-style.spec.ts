import { test, expect, type Page } from "@playwright/test"
import { seedApp } from "./helpers/app"
import { openControlFixture } from "./helpers/controls"
import { computed, settle } from "./helpers/measure"

/**
 * Buttons read the style vocabulary: the filled border, the danger shadow,
 * the neutral face and border and the label weight are tokens a style or
 * preset sets, and the ghost button signature turns ghosts into accent text
 * links. The kit defaults draw exactly what the buttons drew before.
 */

const MODES = ["light", "dark"] as const

function button(page: Page, variant: string) {
  return page
    .locator(`[data-probe="buttons"] .dr-btn[data-variant="${variant}"]`)
    .first()
}

/** A value as the browser computes it on a probe element at the root. */
async function resolved(page: Page, property: string, value: string) {
  return page.evaluate(
    ([name, raw]) => {
      const probe = document.createElement("div")
      probe.style.setProperty(name, raw)
      document.body.append(probe)
      const out = getComputedStyle(probe).getPropertyValue(name)
      probe.remove()
      return out
    },
    [property, value] as const,
  )
}

async function setTokens(page: Page, tokens: Record<string, string>) {
  await page.evaluate((pairs) => {
    for (const [name, value] of Object.entries(pairs)) {
      document.documentElement.style.setProperty(name, value)
    }
  }, tokens)
  await settle(page)
}

/** A value as the browser computes it inside the card under the input. */
async function resolvedOnCard(page: Page, property: string, value: string) {
  return page.locator('[data-probe="edge-card-high"]').evaluate(
    (card, [name, raw]) => {
      const probe = document.createElement("div")
      probe.style.setProperty(name, raw)
      card.append(probe)
      const out = getComputedStyle(probe).getPropertyValue(name)
      probe.remove()
      return out
    },
    [property, value] as const,
  )
}

/** A copy of the outline button inside the card, which may rebind --field-edge. */
async function outlineOnCard(page: Page) {
  await page.evaluate(() => {
    const source = document.querySelector(
      '[data-probe="buttons"] .dr-btn[data-variant="outline"]',
    )
    const card = document.querySelector('[data-probe="edge-card-high"]')
    if (!source || !card) throw new Error("fixture changed")
    const copy = source.cloneNode(true) as HTMLElement
    copy.dataset.case = "outline-on-card"
    card.append(copy)
  })
  await settle(page)
  return page.locator('[data-case="outline-on-card"]')
}

for (const mode of MODES) {
  test.describe(`buttons · ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await seedApp(page, { style: "quiet", mode })
      await openControlFixture(page)
      await page.mouse.move(0, 0)
    })

    test("the default tokens draw the buttons as before", async ({ page }) => {
      const filled = await resolved(
        page,
        "box-shadow",
        "var(--btn-edge), var(--btn-shadow), var(--glow-outer), var(--glow-inner)",
      )
      expect(await computed(button(page, "destructive"), "box-shadow")).toBe(
        filled,
      )
      for (const variant of ["default", "destructive"]) {
        expect(
          await computed(button(page, variant), "border-top-color"),
          variant,
        ).toBe("rgba(0, 0, 0, 0)")
      }
      const outline = button(page, "outline")
      expect(await computed(outline, "background-color")).toBe(
        "rgba(0, 0, 0, 0)",
      )
      expect(await computed(outline, "border-top-color")).toBe(
        await resolved(page, "border-top-color", "var(--field-edge)"),
      )
      // On a card the outline takes the card's own edge.
      expect(
        await computed(await outlineOnCard(page), "border-top-color"),
      ).toBe(
        await resolvedOnCard(page, "border-top-color", "var(--field-edge)"),
      )
      expect(
        await computed(button(page, "secondary"), "border-top-color"),
      ).toBe(
        mode === "dark"
          ? await resolved(page, "border-top-color", "hsl(var(--border))")
          : "rgba(0, 0, 0, 0)",
      )
      for (const variant of ["default", "outline", "ghost"]) {
        expect(
          await computed(button(page, variant), "font-weight"),
          variant,
        ).toBe("500")
      }
    })

    test("a style's button tokens reach every variant", async ({ page }) => {
      await setTokens(page, {
        "--btn-border": "rgb(1, 2, 3)",
        "--btn-danger-shadow": "0 0 0 3px rgb(4, 5, 6)",
        "--btn-neutral-fill": "rgb(7, 8, 9)",
        "--btn-neutral-border": "rgb(10, 11, 12)",
        "--btn-font-weight": "650",
      })
      for (const variant of ["default", "destructive"]) {
        expect(
          await computed(button(page, variant), "border-top-color"),
          variant,
        ).toBe("rgb(1, 2, 3)")
      }
      expect(
        await computed(button(page, "destructive"), "box-shadow"),
      ).toContain("rgb(4, 5, 6) 0px 0px 0px 3px")
      expect(
        await computed(button(page, "default"), "box-shadow"),
      ).not.toContain("rgb(4, 5, 6)")
      expect(await computed(button(page, "outline"), "background-color")).toBe(
        "rgb(7, 8, 9)",
      )
      for (const variant of ["outline", "secondary"]) {
        expect(
          await computed(button(page, variant), "border-top-color"),
          variant,
        ).toBe("rgb(10, 11, 12)")
      }
      expect(
        await computed(await outlineOnCard(page), "border-top-color"),
      ).toBe("rgb(10, 11, 12)")
      expect(await computed(button(page, "ghost"), "font-weight")).toBe("650")
    })

    test("ghost button link turns a text ghost into an accent link", async ({
      page,
    }) => {
      const ghost = button(page, "ghost")
      const foreground = await computed(ghost, "color")
      await page.evaluate(() => {
        const source = document.querySelector(
          '[data-probe="buttons"] .dr-btn[data-variant="ghost"]',
        )
        if (!source) throw new Error("fixture changed")
        const icon = source.cloneNode(true) as HTMLElement
        icon.dataset.size = "icon"
        icon.dataset.case = "ghost-icon"
        source.after(icon)
        document.documentElement.setAttribute("data-ghost-button", "link")
      })
      await settle(page)
      expect(await computed(ghost, "color")).toBe(
        await resolved(page, "color", "hsl(var(--primary-text))"),
      )
      await ghost.hover()
      await settle(page)
      expect(await computed(ghost, "text-decoration-line")).toBe("underline")
      expect(
        await ghost.evaluate((el) => getComputedStyle(el, "::before").opacity),
      ).toBe("0")
      // An icon-only ghost has no label to underline, so it keeps its look.
      expect(
        await computed(page.locator('[data-case="ghost-icon"]'), "color"),
      ).toBe(foreground)
    })
  })
}
