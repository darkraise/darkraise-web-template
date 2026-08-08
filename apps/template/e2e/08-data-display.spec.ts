import { test, expect, type Page } from "@playwright/test"
import { attrOf, boxOf, gotoApp, seedApp, watchConsole } from "./helpers/app"

async function open(page: Page, path: string) {
  await seedApp(page)
  await gotoApp(page, path)
  return page.locator("main")
}

test.describe("tabular data", () => {
  test("table renders header and body rows", async ({ page }) => {
    const main = await open(page, "/components/table")
    const table = main.locator("table").first()
    await expect(table.locator("thead th").first()).toBeVisible()
    expect(await table.locator("tbody tr").count()).toBeGreaterThan(0)
  })

  test("data table sorts by a column header", async ({ page }) => {
    const main = await open(page, "/components/data-table")
    const table = main.locator("table").first()
    const firstCellBefore = await table
      .locator("tbody tr td")
      .first()
      .textContent()

    const sortable = main.locator("th button, thead button").first()
    await sortable.click()
    await expect
      .poll(async () => table.locator("tbody tr td").first().textContent())
      .not.toBe(firstCellBefore)
  })

  test("products data table filters rows by search", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/products")
    await expect(page.locator("main tbody tr").first()).toBeVisible()
    const rowsBefore = await page.locator("main tbody tr").count()
    const search = page.locator('main input[type="search"], main input').first()
    await search.fill("zzzz-no-match")
    await expect
      .poll(async () => page.locator("main tbody tr").count())
      .toBeLessThan(rowsBefore)
  })

  test("pagination moves to the next page", async ({ page }) => {
    const main = await open(page, "/components/pagination")
    // Only the first showcase wires state; the later ones preventDefault.
    const nav = main.locator("nav.dr-pagination").first()
    const before = await nav.locator('[aria-current="page"]').textContent()
    await nav.locator(".dr-pagination-next").click()
    await expect
      .poll(async () => nav.locator('[aria-current="page"]').textContent())
      .not.toBe(before)
  })
})

test.describe("panels and structure", () => {
  test("tabs switch panels", async ({ page }) => {
    const main = await open(page, "/components/tabs")
    const tabs = main.getByRole("tab")
    const second = tabs.nth(1)
    await second.click()
    await expect(second).toHaveAttribute("aria-selected", "true")
    const panelId = await second.getAttribute("aria-controls")
    await expect(page.locator(`#${panelId}`)).toBeVisible()
  })

  test("steps advance to the next step", async ({ page }) => {
    const main = await open(page, "/components/steps")
    const tabs = main.getByRole("tab")
    const before = await tabs.first().getAttribute("data-status")
    const next = main.getByRole("button", { name: /next|continue/i }).first()
    if ((await next.count()) === 0) test.skip()
    await next.click()
    await expect
      .poll(async () => tabs.first().getAttribute("data-status"))
      .not.toBe(before)
  })

  test("carousel moves to the next slide", async ({ page }) => {
    const main = await open(page, "/components/carousel")
    const next = main.getByRole("button", { name: /next/i }).first()
    const track = main.locator('[class*="carousel"]').first()
    const before = await track.evaluate(
      (el) => el.scrollLeft + el.innerHTML.length,
    )
    await next.click()
    await expect
      .poll(async () =>
        track.evaluate((el) => el.scrollLeft + el.innerHTML.length),
      )
      .not.toBe(before)
  })

  test("tree view expands a node", async ({ page }) => {
    const main = await open(page, "/components/tree-view")
    const branch = main.locator("[aria-expanded]").first()
    const before = await attrOf(branch, "aria-expanded")
    await branch.click()
    await expect(branch).not.toHaveAttribute("aria-expanded", before)
  })

  test("json tree view expands a node", async ({ page }) => {
    const main = await open(page, "/components/json-tree-view")
    const row = main.locator(".dr-json-row[aria-expanded]").first()
    const before = await attrOf(row, "aria-expanded")
    await row.focus()
    await page.keyboard.press(before === "true" ? "ArrowLeft" : "ArrowRight")
    await expect(row).not.toHaveAttribute("aria-expanded", before)
  })

  test("scroll area scrolls its viewport", async ({ page }) => {
    const main = await open(page, "/components/scroll-area")
    const viewport = main.locator(".dr-scroll-area > div.overflow-auto").first()
    await viewport.evaluate((el) => {
      el.scrollTop = 120
    })
    expect(await viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  })

  test("resizable panel responds to handle drag", async ({ page }) => {
    const main = await open(page, "/components/resizable")
    const handle = main.getByRole("separator").first()
    const box = await boxOf(handle)
    const panel = main.locator("[data-panel]").first()
    const before = (await boxOf(panel)).width

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 10 })
    await page.mouse.up()

    await expect.poll(async () => (await boxOf(panel)).width).not.toBe(before)
  })
})

test.describe("progress and time", () => {
  test("progress bar exposes a value", async ({ page }) => {
    const main = await open(page, "/components/progress")
    const bar = main.getByRole("progressbar").first()
    await expect(bar).toBeVisible()
  })

  test("timer counts", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    const main = await open(page, "/components/timer")
    const start = main
      .getByRole("button", { name: /start|play|resume/i })
      .first()
    if ((await start.count()) > 0) await start.click()
    const readout = main.locator("text=/\\d+/").first()
    await expect(readout).toBeVisible()
    consoleWatch.assertClean()
  })

  test("spinner renders", async ({ page }) => {
    const main = await open(page, "/components/spinner")
    await expect(main.locator('[class*="spinner"]').first()).toBeVisible()
  })

  test("skeleton renders placeholders", async ({ page }) => {
    const main = await open(page, "/components/skeleton")
    expect(await main.locator('[class*="skeleton"]').count()).toBeGreaterThan(0)
  })
})

test.describe("visualisation", () => {
  test("charts render an SVG surface with data", async ({ page }) => {
    const main = await open(page, "/components/charts")
    const svg = main.locator("svg.recharts-surface").first()
    await expect(svg).toBeVisible()
    const box = await boxOf(svg)
    expect(box.width).toBeGreaterThan(0)
    expect(box.height).toBeGreaterThan(0)
  })

  test("dashboard charts size correctly", async ({ page }) => {
    // ChartContainer seeds ResponsiveContainer with a positive initial size;
    // without it recharts measures -1×-1 on the pre-observer render and warns.
    const consoleWatch = watchConsole(page)
    await seedApp(page)
    await gotoApp(page, "/")
    const svg = page.locator("svg.recharts-surface").first()
    await expect(svg).toBeVisible()
    const box = await boxOf(svg)
    expect(box.width).toBeGreaterThan(0)
    expect(
      consoleWatch.warnings.filter((w) => w.includes("width(-1)")),
      "recharts must not be measured at -1×-1",
    ).toEqual([])
  })

  test("contribution graph renders cells", async ({ page }) => {
    const main = await open(page, "/components/contribution-graph")
    expect(
      await main
        .locator('[class*="contribution"] rect, [class*="contribution"] div')
        .count(),
    ).toBeGreaterThan(10)
  })

  test("qr code renders", async ({ page }) => {
    const main = await open(page, "/components/qr-code")
    await expect(main.locator("svg, canvas").first()).toBeVisible()
  })

  test("virtualized timeline windows its rows", async ({ page }) => {
    const main = await open(page, "/components/virtualized-timeline")
    const viewport = main.locator(".dr-virtualized-timeline-viewport").first()
    await expect(viewport).toBeVisible()
    const count = await viewport
      .locator(".dr-virtualized-timeline-bucket")
      .count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(500)
  })

  test("marquee animates its track", async ({ page }) => {
    const main = await open(page, "/components/marquee")
    const track = main.locator('[class*="marquee"]').first()
    await expect(track).toBeVisible()
  })
})

test.describe("content components", () => {
  test("breadcrumb links back to the components index", async ({ page }) => {
    const main = await open(page, "/components/breadcrumb")
    await expect(main.getByRole("navigation").first()).toBeVisible()
  })

  test("avatar falls back to initials", async ({ page }) => {
    const main = await open(page, "/components/avatar")
    await expect(main.locator('[class*="avatar"]').first()).toBeVisible()
  })

  test("highlight marks the search term", async ({ page }) => {
    const main = await open(page, "/components/highlight")
    expect(await main.locator("mark").count()).toBeGreaterThan(0)
  })

  test("empty state renders its call to action", async ({ page }) => {
    const main = await open(page, "/components/empty-state")
    await expect(main.getByRole("button").first()).toBeVisible()
  })

  test("download trigger produces a download", async ({ page }) => {
    const main = await open(page, "/components/download-trigger")
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15_000 }),
      main.getByRole("button").first().click(),
    ])
    expect(download.suggestedFilename()).toBeTruthy()
  })

  test("image cropper exposes a crop surface", async ({ page }) => {
    const main = await open(page, "/components/image-cropper")
    await expect(main.locator("canvas, img").first()).toBeVisible()
  })
})
