import { test, expect, type Page } from "@playwright/test"
import {
  boxOf,
  expectNoErrorBoundary,
  gotoApp,
  seedApp,
  wrappedTableText,
  type Box,
} from "./helpers/app"
import { settle } from "./helpers/measure"
import { expectInViewport, openOverlayCase } from "./helpers/overlays"

/**
 * The shell clips its own overflow and the content region scrolls inside it,
 * so a document-level check passes while cards run off-screen. This measures
 * the visible content and panel regions and every card as well.
 */
async function expectFits(page: Page): Promise<void> {
  const problems = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth
    const found: string[] = []
    const documentOverflow = document.documentElement.scrollWidth - viewport
    if (documentOverflow > 1) {
      found.push(`page scrolls sideways by ${documentOverflow}px`)
    }
    for (const name of ["content", "panel"]) {
      const region = document.querySelector<HTMLElement>(
        `[data-region="${name}"]`,
      )
      // A region the phone view hides has no boxes; measuring it would pass.
      if (!region || region.getClientRects().length === 0) continue
      const box = region.getBoundingClientRect()
      if (region.scrollWidth - region.clientWidth > 1) {
        found.push(
          `${name} region scrolls sideways by ${region.scrollWidth - region.clientWidth}px`,
        )
      }
      if (box.left < -1 || box.right > viewport + 1) {
        found.push(
          `${name} region spans ${Math.round(box.left)}..${Math.round(box.right)}`,
        )
      }
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

/** The project viewport height, so a width change keeps the phone height. */
function viewportHeight(page: Page): number {
  const size = page.viewportSize()
  if (!size) throw new Error("the page has no fixed viewport")
  return size.height
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
        header.locator(".dr-user-menu-trigger"),
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

  for (const shellStyle of ["floating", "island"]) {
    test(`the inbox bar fits in the ${shellStyle} shell`, async ({ page }) => {
      await seedApp(page, { shellStyle })
      await gotoApp(page, "/inbox")
      const header = page.locator("header.dr-layout-header").first()
      await expect(header.locator(".dr-user-menu-trigger")).toBeVisible()
      const bar = await header.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }))
      expect(bar.scrollWidth, JSON.stringify(bar)).toBeLessThanOrEqual(
        bar.clientWidth,
      )
    })
  }

  test("the layout is chosen from the user menu", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await expect(
      page.locator('.dr-shell[data-structure="sidebar"]'),
    ).toBeVisible()
    const header = page.locator("header.dr-layout-header").first()
    const switcher = header.locator(".dr-layout-switcher-trigger")
    await expect(switcher).toHaveCount(1)
    await expect(switcher).toBeHidden()
    await header.locator(".dr-user-menu-trigger").click()
    const menu = page.locator(".dr-user-menu-content")
    await menu.getByRole("menuitem", { name: "Layout" }).click()
    await page.getByRole("menuitem", { name: "Top Navigation" }).click()
    await expect(
      page.locator('.dr-shell[data-structure="top-nav"]'),
    ).toBeVisible()

    await header.locator(".dr-user-menu-trigger").click()
    await menu.getByRole("menuitem", { name: "Layout" }).click()
    await page.getByRole("menuitemradio", { name: "Island" }).click()
    await expect(
      page.locator('.dr-shell[data-shell-style="island"]'),
    ).toBeVisible()
  })

  test("search is an icon and the brand is hidden at 700px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: viewportHeight(page) })
    await seedApp(page)
    await gotoApp(page, "/inbox")
    const header = page.locator("header.dr-layout-header").first()
    const trigger = header.locator(".dr-search-command-trigger")
    const box = await boxOf(trigger)
    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1)
    await expect(trigger.locator("kbd")).toBeHidden()
    await expect(header.locator(".dr-brand-logo")).toBeHidden()
  })

  test("the language picker shows only its flag", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    const trigger = page
      .locator("header.dr-layout-header")
      .first()
      .getByRole("combobox", { name: "Language" })
    await expect(trigger).toHaveAttribute("data-compact", "true")
    await expect(trigger.locator(".dr-locale-option-icon")).toBeVisible()
    const name = await boxOf(trigger.locator(".dr-locale-option-label"))
    expect(name.width).toBeLessThanOrEqual(1)
  })

  test("a brand logo in the header slot stays visible", async ({ page }) => {
    await seedApp(page)
    await page.addInitScript(() => {
      localStorage.setItem("layout-variant", "top-nav")
    })
    await gotoApp(page, "/")
    const header = page.locator("header.dr-layout-header").first()
    await expect(header.locator(":scope > .dr-brand-logo")).toBeHidden()
    // A copy of the mark of the header stands in for a logo from the app.
    await header.evaluate((el) => {
      const logo = el.querySelector(":scope > .dr-brand-logo")?.cloneNode(true)
      if (!(logo instanceof HTMLElement)) throw new Error("no brand logo")
      logo.dataset.testid = "slot-logo"
      el.querySelector(".dr-layout-header-end")?.append(logo)
    })
    await expect(header.getByTestId("slot-logo")).toBeVisible()
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

  test("the skip link lands on the list", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/inbox")
    const panel = page.locator('[data-region="panel"]')
    await expect(panel.getByRole("button").first()).toBeVisible()
    await page.keyboard.press("Tab")
    const skip = page.getByRole("link", { name: "Skip to content" })
    await expect(skip).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(panel).toBeFocused()
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
    await page.setViewportSize({ width: 700, height: viewportHeight(page) })
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

  test("the inbox list keeps only its float inset", async ({ page }) => {
    await seedApp(page, { shellStyle: "floating" })
    await gotoApp(page, "/inbox")
    const panel = page.locator('[data-region="panel"]')
    await expect(panel.getByRole("button").first()).toBeVisible()
    await expect(page.locator('[data-region="content"]')).toBeHidden()
    const insets = await panel.evaluate((el) => {
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      )
      const box = el.getBoundingClientRect()
      return {
        start: box.left / rem,
        end: (document.documentElement.clientWidth - box.right) / rem,
      }
    })
    expect(insets.start, "panel inset from the left edge").toBeCloseTo(0.75, 1)
    expect(insets.end, "panel inset from the right edge").toBeCloseTo(0.75, 1)
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

/** Each route's sign of having loaded its data; measuring before it would
 *  pass on a loading placeholder. */
const APP_ROUTES = [
  { path: "/", ready: ".dr-chart" },
  { path: "/analytics", ready: ".dr-chart" },
  { path: "/orders", ready: "tbody tr" },
  { path: "/orders/ord-1", ready: "[data-order-steps]" },
  { path: "/products", ready: "tbody tr" },
  { path: "/products/new", ready: "main form" },
  { path: "/categories", ready: "tbody tr" },
  { path: "/customers", ready: "tbody tr" },
  // A loaded order row has several cells; the empty-state row has one.
  { path: "/customers/cust-1", ready: "main tbody tr:has(td + td)" },
  { path: "/inbox", ready: '[data-region="panel"] button' },
  { path: "/settings", ready: "main form" },
] as const

const GUEST_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  // Without a token the page shows an invalid-link notice instead of a form.
  "/reset-password?token=e2e",
] as const

test.describe("every route fits 390px", () => {
  for (const route of APP_ROUTES) {
    test(`app route ${route.path}`, async ({ page }) => {
      await seedApp(page)
      await gotoApp(page, route.path)
      await expect(page.locator(route.ready).first()).toBeVisible()
      await expect(page.locator(".dr-skeleton")).toHaveCount(0)
      await expectNoErrorBoundary(page)
      await expectFits(page)
    })
  }

  for (const path of GUEST_ROUTES) {
    test(`guest route ${path}`, async ({ page }) => {
      await seedApp(page, {}, { authenticated: false })
      await gotoApp(page, path)
      await expect(page.locator("form").first()).toBeVisible()
      await expectNoErrorBoundary(page)
      await expectFits(page)
    })
  }
})

test.describe("sheets", () => {
  for (const side of ["top", "bottom"] as const) {
    test(`a long ${side} sheet fits a phone and reaches its last row`, async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode: "light" })
      await openOverlayCase(page, "sheets")
      await page.getByRole("button", { name: `Open ${side} sheet` }).click()
      const sheet = page.getByRole("dialog")
      await expect(sheet).toBeVisible()
      await settle(page)
      expect((await boxOf(sheet)).height).toBeLessThanOrEqual(
        viewportHeight(page) - 32 + 1,
      )
      const last = sheet.getByText("Row 100", { exact: true })
      await last.scrollIntoViewIfNeeded()
      await expectInViewport(page, last)
    })
  }
})
