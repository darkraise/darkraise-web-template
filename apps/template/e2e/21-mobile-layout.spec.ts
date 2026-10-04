import { test, expect, type Page } from "@playwright/test"
import {
  boxOf,
  gotoApp,
  seedApp,
  wrappedTableText,
  type Box,
} from "./helpers/app"

/**
 * The shell clips its own overflow and the content region scrolls inside it,
 * so a document-level check passes while cards run off-screen. This measures
 * the content region and every card as well.
 */
async function expectFits(page: Page): Promise<void> {
  const problems = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth
    const found: string[] = []
    const documentOverflow = document.documentElement.scrollWidth - viewport
    if (documentOverflow > 1) {
      found.push(`page scrolls sideways by ${documentOverflow}px`)
    }
    const region = document.querySelector<HTMLElement>(
      '[data-region="content"]',
    )
    if (region && region.scrollWidth - region.clientWidth > 1) {
      found.push(
        `content region scrolls sideways by ${region.scrollWidth - region.clientWidth}px`,
      )
    }
    for (const card of document.querySelectorAll<HTMLElement>(".dr-card")) {
      const box = card.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) continue
      if (box.left < -1 || box.right > viewport + 1) {
        const chart = card.querySelector(".dr-chart")
        const chartWidth = chart
          ? ` (chart ${Math.round(chart.getBoundingClientRect().width)}px)`
          : ""
        const label = (card.textContent ?? "").trim().slice(0, 30)
        found.push(
          `card "${label}" spans ${Math.round(box.left)}..${Math.round(box.right)}${chartWidth}`,
        )
      }
    }
    return found
  })
  expect(problems).toEqual([])
}

test.describe("dashboard", () => {
  test("chart cards fit the viewport", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await expect(page.locator(".dr-chart").first()).toBeVisible()
    await expectFits(page)
  })
})

test.describe("orders table", () => {
  test("scrolls sideways behind an edge fade, one line per row", async ({
    page,
  }) => {
    await seedApp(page)
    await gotoApp(page, "/orders")
    const scroller = page.locator(".dr-data-table-frame .dr-table-wrapper")
    await expect(scroller.locator("tbody tr").first()).toBeVisible()
    expect(
      await scroller.evaluate((el) => el.scrollWidth > el.clientWidth),
    ).toBe(true)
    await expect(scroller).toHaveAttribute("data-overflow-end", "")
    await expect(scroller).not.toHaveAttribute("data-overflow-start")
    expect(
      await scroller.evaluate((el) => getComputedStyle(el).maskImage),
    ).toContain("linear-gradient")

    await scroller.evaluate((el) => {
      el.scrollLeft = el.scrollWidth
    })
    await expect(scroller).toHaveAttribute("data-overflow-start", "")
    await expect(scroller).not.toHaveAttribute("data-overflow-end")
    expect(await wrappedTableText(scroller)).toEqual([])
  })

  test("keeps every pagination button on screen", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/orders")
    const buttons = page.locator(".dr-data-table-pagination-nav-btn")
    await expect(buttons).toHaveCount(4)
    const width = await page.evaluate(
      () => document.documentElement.clientWidth,
    )
    for (const button of await buttons.all()) {
      const box = await boxOf(button)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    }
  })
})

const HEADER_CASES = [
  { name: "sidebar", path: "/", layout: "sidebar", search: false },
  { name: "top-nav", path: "/", layout: "top-nav", search: true },
  { name: "stacked", path: "/", layout: "stacked", search: true },
  { name: "split-panel", path: "/inbox", layout: null, search: true },
] as const

test.describe("header", () => {
  for (const entry of HEADER_CASES) {
    test(`${entry.name} keeps every control on screen`, async ({ page }) => {
      await seedApp(page)
      if (entry.layout) {
        await page.addInitScript((value) => {
          localStorage.setItem("layout-variant", value)
        }, entry.layout)
      }
      await gotoApp(page, entry.path)
      await expect(
        page.locator(`.dr-shell[data-structure="${entry.name}"]`),
      ).toBeVisible()
      const header = page.locator("header.dr-layout-header").first()
      const required = [
        header.getByRole("button", { name: "Open menu" }),
        header.getByRole("combobox", { name: "Language" }),
        header.getByRole("button", { name: "Switch layout" }),
        header.getByRole("button", { name: "Customize theme" }),
        header.getByRole("button", { name: "Notifications" }),
      ]
      if (entry.search) {
        required.push(header.getByRole("button", { name: /^Search/ }))
      }
      for (const control of required) await expect(control).toBeVisible()

      const offscreen = await header.evaluate((el) => {
        const width = document.documentElement.clientWidth
        return [
          ...el.querySelectorAll<HTMLElement>("button, a, [role='combobox']"),
        ]
          .filter((control) => control.getClientRects().length > 0)
          .map((control) => ({
            label:
              control.getAttribute("aria-label") ??
              control.textContent?.trim() ??
              control.tagName,
            box: control.getBoundingClientRect(),
          }))
          .filter(
            ({ box }) =>
              box.width > 0 && (box.left < -1 || box.right > width + 1),
          )
          .map(
            ({ label, box }) =>
              `${label}: ${Math.round(box.left)}..${Math.round(box.right)}`,
          )
      })
      expect(offscreen).toEqual([])
    })
  }

  test("search is an icon and the brand is hidden at 700px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 844 })
    await seedApp(page)
    await gotoApp(page, "/inbox")
    const header = page.locator("header.dr-layout-header").first()
    const trigger = header.locator(".dr-search-command-trigger")
    const box = await boxOf(trigger)
    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1)
    await expect(trigger.locator("kbd")).toBeHidden()
    await expect(header.locator(".dr-brand-logo")).toBeHidden()
  })
})

test.describe("inbox", () => {
  test("opens a message and goes back to the list", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/inbox")
    const panel = page.locator('[data-region="panel"]')
    const message = panel.getByRole("button").first()
    await expect(message).toBeVisible()
    const subject = (await message.locator("p").first().innerText()).trim()

    await message.click()
    await expect(panel).toBeHidden()
    await expect(page.locator("main h1")).toHaveText(subject)
    await expect(page.locator("main")).toBeFocused()

    const back = page.getByRole("button", { name: "Back" })
    await back.click()
    await expect(panel).toBeVisible()
    await expect(panel).toBeFocused()
    await expect(back).toBeHidden()
  })
})

test.describe("order detail", () => {
  const STATUSES = ["Pending", "Processing", "Shipped", "Delivered"]

  async function stepBoxes(page: Page) {
    const steps = page.locator("[data-order-steps] > *")
    await expect(steps).toHaveCount(4)
    await expect(steps).toContainText(STATUSES)
    const boxes = []
    for (const step of await steps.all()) boxes.push(await boxOf(step))
    return boxes
  }

  async function connectorBoxes(page: Page) {
    const connectors = page.locator("[data-order-connector]")
    await expect(connectors).toHaveCount(3)
    const boxes = []
    for (const connector of await connectors.all()) {
      boxes.push(await boxOf(connector))
    }
    return boxes
  }

  test("stacks every status step on a phone", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/orders/ord-1")
    const width = await page.evaluate(
      () => document.documentElement.clientWidth,
    )
    const boxes = await stepBoxes(page)
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    }
    for (let i = 1; i < boxes.length; i++) {
      expect((boxes[i] as Box).y).toBeGreaterThan((boxes[i - 1] as Box).y)
    }
    for (const box of await connectorBoxes(page)) {
      expect(box.height).toBeGreaterThan(box.width)
    }
  })

  test("lays the steps in a row from 640px", async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 844 })
    await seedApp(page)
    await gotoApp(page, "/orders/ord-1")
    const boxes = await stepBoxes(page)
    const centres = boxes.map((box) => box.y + box.height / 2)
    expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(2)
    for (let i = 1; i < boxes.length; i++) {
      expect((boxes[i] as Box).x).toBeGreaterThan((boxes[i - 1] as Box).x)
    }
    for (const box of await connectorBoxes(page)) {
      expect(box.width).toBeGreaterThan(box.height)
    }
  })
})

test.describe("floating shell", () => {
  const paddingInRem = (page: Page) =>
    page.locator('[data-region="content"]').evaluate((el) => {
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      )
      return parseFloat(getComputedStyle(el).paddingInlineStart) / rem
    })

  test("dashboard content keeps only its phone padding", async ({ page }) => {
    await seedApp(page, { shellStyle: "floating" })
    await gotoApp(page, "/")
    await expect(page.locator(".dr-chart").first()).toBeVisible()
    expect(await paddingInRem(page)).toBeCloseTo(1.5, 1)
    await expectFits(page)
  })

  test("an opened inbox message keeps only its phone padding", async ({
    page,
  }) => {
    await seedApp(page, { shellStyle: "floating" })
    await gotoApp(page, "/inbox")
    await page
      .locator('[data-region="panel"]')
      .getByRole("button")
      .first()
      .click()
    await expect(page.locator("main h1")).toBeVisible()
    expect(await paddingInRem(page)).toBeCloseTo(1.5, 1)
    await expectFits(page)
    await page.getByRole("button", { name: "Back" }).click()
    await expect(page.locator('[data-region="panel"]')).toBeVisible()
  })
})
