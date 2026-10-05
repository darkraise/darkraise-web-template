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
