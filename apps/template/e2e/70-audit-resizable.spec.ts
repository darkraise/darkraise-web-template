import { test, expect, type Locator, type Page } from "@playwright/test"
import { boxOf, gotoApp, seedApp } from "./helpers/app"

/**
 * A panel group sized by consumer classes keeps that size and resizes its
 * panels: the vertical Orientation example on the Resizable page declares
 * h-72 (288px), and its first panel's height follows the keyboard and a
 * pointer drag on the handle.
 */

const GROUP_HEIGHT = 288

async function verticalExample(page: Page) {
  await seedApp(page, { style: "quiet", mode: "light" })
  await gotoApp(page, "/components/resizable")
  const group = page
    .locator('.dr-resizable-panel-group[data-panel-group-direction="vertical"]')
    .first()
  await expect(group).toBeVisible()
  return {
    group,
    firstPanel: group.locator(":scope > [data-panel]").first(),
    handle: group.locator(':scope > [role="separator"]'),
  }
}

async function heightOf(locator: Locator): Promise<number> {
  return (await boxOf(locator)).height
}

test.describe("resizable group sized by classes", () => {
  test("keeps its class height and resizes its panels from the keyboard", async ({
    page,
  }) => {
    const { group, firstPanel, handle } = await verticalExample(page)
    expect(await heightOf(group)).toBeCloseTo(GROUP_HEIGHT, 0)
    const before = await heightOf(firstPanel)

    await handle.focus()
    for (let press = 0; press < 4; press++) await handle.press("ArrowDown")

    await expect
      .poll(() => heightOf(firstPanel))
      .toBeGreaterThan(before + 0.15 * GROUP_HEIGHT)
    expect(await heightOf(group)).toBeCloseTo(GROUP_HEIGHT, 0)
  })

  test("keeps its class height and resizes its panels on a drag", async ({
    page,
  }) => {
    const { group, firstPanel, handle } = await verticalExample(page)
    expect(await heightOf(group)).toBeCloseTo(GROUP_HEIGHT, 0)
    const before = await heightOf(firstPanel)

    const box = await boxOf(handle)
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 60, { steps: 6 })
    await page.mouse.up()

    await expect.poll(() => heightOf(firstPanel)).toBeLessThan(before - 40)
    expect(await heightOf(group)).toBeCloseTo(GROUP_HEIGHT, 0)
  })
})
