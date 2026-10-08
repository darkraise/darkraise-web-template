import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, seedApp } from "./helpers/app"
import { computed, settle } from "./helpers/measure"
import { expectInViewport, hitsAt, openOverlayCase } from "./helpers/overlays"

/**
 * Overlay geometry: popups stay attached to their trigger and inside the
 * viewport, floating panels stay under modal layers, long sheets scroll, and
 * every floating surface paints the overlay fill. Each case is its own page
 * load of the overlay-geometry fixture.
 */

test.describe("popups follow their trigger", () => {
  test("a popover keeps its offset when its box scrolls or the viewport resizes", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "follow")
    const trigger = page.getByRole("button", { name: "Anchor" })
    await trigger.click()
    const content = page.getByTestId("follow-popover")
    await expect(content).toBeVisible()
    await settle(page)
    const offset = async () => {
      const [anchor, popup] = [await boxOf(trigger), await boxOf(content)]
      return { x: popup.x - anchor.x, y: popup.y - anchor.y }
    }
    const initial = await offset()
    const drift = async () => {
      const now = await offset()
      return Math.max(Math.abs(now.x - initial.x), Math.abs(now.y - initial.y))
    }
    await page.getByTestId("scroll-box").evaluate((element) => {
      element.scrollTop = 50
    })
    await expect.poll(drift).toBeLessThanOrEqual(1)
    await page.setViewportSize({ width: 1080, height: 720 })
    await expect.poll(drift).toBeLessThanOrEqual(1)
  })
})

test.describe("popup origin and width", () => {
  for (const [name, side] of [
    ["Open above", "top"],
    ["Open below", "bottom"],
  ] as const) {
    test(`a popover opened ${side} scales from its trigger's edge`, async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode: "light" })
      await openOverlayCase(page, "origin")
      await page.getByRole("button", { name }).click()
      const content = page.getByTestId(`popover-${side}`)
      await expect(content).toBeVisible()
      await settle(page)
      const origin = (await computed(content, "transform-origin"))
        .split(" ")
        .map(parseFloat)
      const { height } = await boxOf(content)
      expect(origin[1]).toBeCloseTo(side === "top" ? height : 0, 0)
    })
  }

  test("a popper select is at least as wide as its trigger", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "origin")
    await page.getByRole("combobox", { name: "Fruit" }).click()
    const content = page.locator(".dr-select-content")
    await expect(content).toBeVisible()
    await settle(page)
    expect((await boxOf(content)).width).toBeGreaterThanOrEqual(319.5)
  })
})

async function expectCappedAndScrolling(page: Page, list: Locator) {
  await expect(list).toBeVisible()
  await settle(page)
  await expectInViewport(page, list)
  expect(
    await list.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true)
}

test.describe("list popups fit the viewport", () => {
  test("a long menu and its submenu stay on screen and scroll", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "menus")
    await page.getByRole("button", { name: "Long menu" }).click()
    await expectCappedAndScrolling(page, page.locator(".dr-menu-content"))
    await page.getByRole("menuitem", { name: "More items" }).click()
    await expectCappedAndScrolling(page, page.locator(".dr-menu-sub-content"))
  })

  test("a long menubar menu stays on screen and scrolls", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "menus")
    await page.getByRole("menuitem", { name: "File" }).click()
    await expectCappedAndScrolling(page, page.locator(".dr-menubar-content"))
  })
})

test.describe("submenus anchor to their row", () => {
  test("a context submenu opened at once from the keyboard sits beside its sub-trigger", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "context-submenu")
    await page
      .getByText("Context area")
      .click({ button: "right", position: { x: 40, y: 40 } })
    // Off the menu, so no row is hovered while the menu is laid out.
    await page.mouse.move(600, 600)
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowRight")
    const email = page.getByRole("menuitem", { name: "Email" })
    await expect(email).toBeVisible()
    await settle(page)
    const share = await boxOf(page.getByRole("menuitem", { name: "Share" }))
    const submenu = await boxOf(page.locator(".dr-menu-sub-content"))
    expect(Math.abs(submenu.x - (share.x + share.width))).toBeLessThanOrEqual(2)
    expect(Math.abs(submenu.y - share.y)).toBeLessThanOrEqual(2)
  })
})

test.describe("navigation menu panels", () => {
  for (const [name, dir] of [
    ["navigation", "ltr"],
    ["navigation-rtl", "rtl"],
  ] as const) {
    test(`a panel at the inline end stays on screen and on top · ${dir}`, async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode: "light" })
      await openOverlayCase(page, name)
      const trigger = page.getByRole("button", { name: "Company" })
      await trigger.click()
      const panel = page.locator(".dr-navigation-menu-content")
      await expect(panel).toBeVisible()
      await settle(page)
      const box = await boxOf(panel)
      const viewport = page.viewportSize()
      if (!viewport) throw new Error("no viewport")
      expect(box.x).toBeGreaterThanOrEqual(8 - 0.5)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 8 + 0.5)
      const below = await boxOf(page.getByTestId("after-nav"))
      const x = box.x + box.width / 2
      const y = Math.max(box.y, below.y) + 4
      expect(y).toBeLessThan(box.y + box.height)
      expect(await hitsAt(page, x, y, ".dr-navigation-menu-content")).toBe(true)
    })

    test(`the indicator sits under the open trigger · ${dir}`, async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode: "light" })
      await openOverlayCase(page, name)
      const trigger = page.getByRole("button", { name: "Company" })
      await trigger.click()
      const indicator = page.getByTestId("nav-indicator")
      await expect(indicator).toHaveAttribute("data-state", "visible")
      await settle(page)
      const [under, over] = [await boxOf(indicator), await boxOf(trigger)]
      expect(under.x).toBeLessThan(over.x + over.width)
      expect(under.x + under.width).toBeGreaterThan(over.x)
      expect(under.y).toBeGreaterThanOrEqual(over.y + over.height - 1)
    })
  }
})

async function expectListUncut(page: Page, input: Locator) {
  const content = page.locator(".dr-combobox-content")
  await expect(content).toBeVisible()
  await settle(page)
  await expectInViewport(page, content)
  const box = await boxOf(content)
  const option = await boxOf(content.getByRole("option").first())
  for (const [x, y] of [
    [box.x + box.width / 2, box.y + box.height / 2],
    [option.x + option.width / 2, option.y + option.height / 2],
  ] as const) {
    expect(await hitsAt(page, x, y, ".dr-combobox-content")).toBe(true)
  }
  expect(box.y + box.height).toBeLessThanOrEqual((await boxOf(input)).y + 1)
}

test.describe("combobox lists escape their container", () => {
  test("a combobox at the bottom of a dialog opens above it, uncut", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "combobox")
    await page.getByRole("button", { name: "Open dialog" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await dialog.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    const input = dialog.getByRole("combobox")
    await input.click()
    await expectListUncut(page, input)
  })

  test("a multi-select in a short scroll box opens above it, uncut", async ({
    page,
  }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "combobox")
    const input = page.getByTestId("scroll-box").getByRole("combobox")
    await input.click()
    await expectListUncut(page, input)
  })
})

test.describe("floating panels stay under modal layers", () => {
  test("a dialog covers panels after a hundred presses", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "panels")
    await page.evaluate(() => {
      const panels = ["a", "b", "c"].map(
        (id) =>
          document.querySelector(`[data-testid="panel-${id}"]`) as Element,
      )
      for (let i = 0; i < 100; i += 1) {
        ;(panels[i % 3] as Element).dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true }),
        )
      }
    })
    for (const id of ["a", "b", "c"]) {
      const z = Number(
        await computed(page.getByTestId(`panel-${id}`), "z-index"),
      )
      expect(z).toBeLessThan(50)
    }
    await page.getByRole("button", { name: "Open dialog" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await settle(page)
    const box = await boxOf(dialog)
    expect(
      await hitsAt(
        page,
        box.x + box.width / 2,
        box.y + box.height / 2,
        '[role="dialog"]',
      ),
    ).toBe(true)
  })
})

test.describe("long sheets scroll", () => {
  for (const side of ["top", "bottom"] as const) {
    test(`a long ${side} sheet fits the viewport and reaches its last row`, async ({
      page,
    }) => {
      await seedApp(page, { style: "quiet", mode: "light" })
      await openOverlayCase(page, "sheets")
      await page.getByRole("button", { name: `Open ${side} sheet` }).click()
      const sheet = page.getByRole("dialog")
      await expect(sheet).toBeVisible()
      await settle(page)
      const viewport = page.viewportSize()
      if (!viewport) throw new Error("The page has no viewport size")
      expect((await boxOf(sheet)).height).toBeLessThanOrEqual(
        viewport.height - 32 + 1,
      )
      const last = sheet.getByText("Row 100", { exact: true })
      await last.scrollIntoViewIfNeeded()
      await expectInViewport(page, last)
      await last.click()
    })
  }

  test("a sheet body scrolls under a pinned header", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "sheets")
    await page.getByRole("button", { name: "Open pinned sheet" }).click()
    const sheet = page.getByRole("dialog")
    await expect(sheet).toBeVisible()
    await settle(page)
    const header = sheet.getByRole("heading", { name: "Pinned sheet" })
    const footer = sheet.getByRole("button", { name: "Done" })
    await expectInViewport(page, footer)
    const before = (await boxOf(header)).y
    const footerBefore = (await boxOf(footer)).y
    const body = sheet.locator(".dr-sheet-body")
    await body.evaluate((element) => {
      element.scrollTop = 400
    })
    expect(await body.evaluate((element) => element.scrollTop)).toBeGreaterThan(
      0,
    )
    expect((await boxOf(header)).y).toBeCloseTo(before, 0)
    expect((await boxOf(footer)).y).toBeCloseTo(footerBefore, 0)
    await expectInViewport(page, footer)
    // The pinned rule hands scrolling to the body; the sheet itself must not
    // scroll as well.
    expect(
      await sheet.evaluate(
        (element) => element.scrollHeight <= element.clientHeight,
      ),
    ).toBe(true)
  })
})

test.describe("the tour popover stays on screen", () => {
  test("for targets at the right and bottom edges", async ({ page }) => {
    await seedApp(page, { style: "quiet", mode: "light" })
    await openOverlayCase(page, "tour")
    const popover = page.locator(".dr-tour-popover")
    await expect(popover.getByText("Right edge", { exact: true })).toBeVisible()
    await settle(page)
    await expectInViewport(page, popover)
    await popover.getByRole("button", { name: "Next" }).click()
    await expect(
      popover.getByText("Bottom edge", { exact: true }),
    ).toBeVisible()
    await settle(page)
    await expectInViewport(page, popover)
    const target = await boxOf(page.locator("#tour-bottom"))
    const box = await boxOf(popover)
    expect(box.y + box.height).toBeLessThanOrEqual(target.y)
  })
})

test.describe("floating surfaces paint the overlay fill", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`every surface matches a popover · glass · ${mode}`, async ({
      page,
    }) => {
      await seedApp(page, { style: "glass", mode })
      await openOverlayCase(page, "recipe")
      const reference = page.getByTestId("reference-popover")
      await expect(reference).toBeVisible()
      await expect(page.locator(".dr-tour-popover")).toBeVisible()
      await settle(page)
      const paint = (locator: Locator) =>
        Promise.all(
          ["background-color", "background-image", "border-top-color"].map(
            (property) => computed(locator, property),
          ),
        )
      const expected = await paint(reference)
      for (const selector of [
        ".dr-floating-panel",
        ".dr-tour-popover",
        ".dr-chart-tooltip",
        ".dr-contribution-graph-tooltip",
        ".dr-virtualized-timeline-scrubber-label",
      ]) {
        expect(await paint(page.locator(selector)), selector).toEqual(expected)
      }
    })
  }
})
