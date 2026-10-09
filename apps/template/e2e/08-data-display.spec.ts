import { test, expect, type Page } from "@playwright/test"
import { attrOf, boxOf, gotoApp, seedApp, watchConsole } from "./helpers/app"
import { pixel, rgbOf, settle } from "./helpers/measure"
import { example } from "./helpers/showcase"

async function open(page: Page, path: string) {
  await seedApp(page)
  await gotoApp(page, path)
  return page.locator("main")
}

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
)

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
    await expect(next).toBeVisible()
    await next.click()
    await expect
      .poll(async () => tabs.first().getAttribute("data-status"))
      .not.toBe(before)
  })

  test("carousel moves to the next slide", async ({ page }) => {
    await open(page, "/components/carousel")
    const carousel = example(page, "With indicators (dot pagination)")
    const firstSlide = carousel.locator(".dr-carousel-item").first()
    const indicators = carousel.locator(".dr-carousel-indicator")
    await expect(indicators.nth(0)).toHaveAttribute("aria-current", "true")
    const before = (await boxOf(firstSlide)).x

    await carousel.getByRole("button", { name: "Next slide" }).click()
    await expect(indicators.nth(1)).toHaveAttribute("aria-current", "true")
    await expect(indicators.nth(0)).not.toHaveAttribute("aria-current", "true")
    await expect
      .poll(async () => (await boxOf(firstSlide)).x)
      .toBeLessThan(before - 100)
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
    await open(page, "/components/progress")
    const bar = example(page, "Basic progress").getByRole("progressbar")
    await expect(bar).toBeVisible()
    await expect(bar).toHaveAttribute("aria-valuenow", "60")
  })

  test("timer counts", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await open(page, "/components/timer")
    const stopwatch = example(page, "Stopwatch counting up from zero")
    const timer = stopwatch.locator(".dr-timer")
    const seconds = stopwatch.locator('.dr-timer-item[data-type="seconds"]')
    await expect(timer).toHaveAttribute("data-state", "idle")
    await expect(seconds).toHaveText("00")

    await stopwatch.getByRole("button", { name: "Start" }).click()
    await expect(timer).toHaveAttribute("data-state", "running")
    await expect(seconds).not.toHaveText("00")
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
    await open(page, "/components/charts")
    const chart = example(page, "BarChart — discrete category comparison")
    const svg = chart.locator("svg.recharts-surface")
    await expect(svg).toBeVisible()
    const box = await boxOf(svg)
    expect(box.width).toBeGreaterThan(0)
    expect(box.height).toBeGreaterThan(0)
    const bars = chart.locator(".recharts-bar-rectangle")
    await expect(bars).toHaveCount(6)
    await expect
      .poll(async () => (await bars.first().boundingBox())?.height ?? 0)
      .toBeGreaterThan(0)
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
    await open(page, "/components/contribution-graph")
    // The legend reuses the cell class, so only the grid is counted; the
    // demo spans 2025-07-25 to 2026-07-24, one dated cell per day.
    const days = example(page, "Default").locator(
      ".dr-contribution-graph-grid .dr-contribution-graph-cell[data-date]",
    )
    await expect(days).toHaveCount(365)
    await expect(
      days.and(page.locator('[data-date="2025-07-25"]')),
    ).toHaveCount(1)
    await expect(
      days.and(page.locator('[data-date="2026-07-24"]')),
    ).toHaveCount(1)
  })

  test("qr code renders", async ({ page }) => {
    const main = await open(page, "/components/qr-code")
    await expect(main.locator(".dr-qr-code")).toHaveCount(4)
    const frame = example(page, "vCard").getByRole("img")
    await expect(frame).toBeVisible()
    const box = await boxOf(frame)
    expect(Math.abs(box.width - 220)).toBeLessThanOrEqual(1)
    expect(Math.abs(box.height - 220)).toBeLessThanOrEqual(1)
    await expect(frame.locator("path").nth(1)).toHaveAttribute("d", /^M\d/)
  })

  test("virtualized timeline windows its rows", async ({ page }) => {
    await open(page, "/components/virtualized-timeline")
    const viewport = example(page, "Photo timeline").locator(
      ".dr-virtualized-timeline-viewport",
    )
    await expect(viewport).toBeVisible()
    const grids = () =>
      viewport.evaluate((el) =>
        Array.from(el.querySelectorAll('[role="grid"]'), (grid) => ({
          rendered: grid.querySelectorAll(".dr-virtualized-timeline-row")
            .length,
          total: Number(grid.getAttribute("aria-rowcount")),
        })),
      )
    await expect
      .poll(async () => (await grids()).some((grid) => grid.rendered > 0))
      .toBe(true)
    const mounted = await grids()
    for (const grid of mounted) {
      expect(grid.rendered).toBeLessThanOrEqual(grid.total)
    }
    const rendered = mounted.reduce((sum, grid) => sum + grid.rendered, 0)
    const total = mounted.reduce((sum, grid) => sum + grid.total, 0)
    expect(rendered, `${rendered} of ${total} rows mounted`).toBeLessThan(total)
  })

  for (const side of ["right", "left"] as const) {
    test(`virtualized timeline rail centres its ticks, clear of the labels · ${side}`, async ({
      page,
    }) => {
      const main = await open(page, "/components/virtualized-timeline")
      await main.getByRole("button", { name: side, exact: true }).click()
      const rail = main.locator(".dr-virtualized-timeline-scrubber").first()
      await expect(
        rail.locator(".dr-virtualized-timeline-scrubber-tick > span").first(),
      ).toBeVisible()
      const ticks = await rail.evaluate((el) => {
        const top = el.getBoundingClientRect().top
        const rect = (r: DOMRect) => ({
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
        })
        return Array.from(
          el.querySelectorAll<HTMLElement>(
            ".dr-virtualized-timeline-scrubber-tick",
          ),
        ).map((tick) => {
          const box = tick.getBoundingClientRect()
          const label = tick.querySelector("span")
          return {
            kind: tick.dataset.tickKind,
            offset: parseFloat(tick.style.top),
            centre: box.top + box.height / 2 - top,
            box: rect(box),
            label: label ? rect(label.getBoundingClientRect()) : null,
          }
        })
      })
      expect(ticks.length).toBeGreaterThan(1)
      for (const tick of ticks) {
        expect(Math.abs(tick.centre - tick.offset)).toBeLessThanOrEqual(1)
      }
      const labels = ticks.flatMap((tick) => (tick.label ? [tick.label] : []))
      const marks = ticks.filter((tick) => !tick.label && tick.kind === "sub")
      for (const { box } of marks) {
        for (const label of labels) {
          const overlaps =
            box.left < label.right &&
            label.left < box.right &&
            box.top < label.bottom &&
            label.top < box.bottom
          expect(overlaps).toBe(false)
        }
      }
    })
  }

  test("virtualized timeline rings a focused tile inside its box", async ({
    page,
  }) => {
    await open(page, "/components/virtualized-timeline")
    const tile = example(page, "Photo timeline")
      .locator(".dr-virtualized-timeline-tile[tabindex]")
      .first()
    await tile.focus()
    expect(await tile.evaluate((el) => el.matches(":focus-visible"))).toBe(true)
    await settle(page)
    const ring = rgbOf(
      await tile.evaluate((el) => getComputedStyle(el).outlineColor),
    )
    const box = await boxOf(tile)
    // The whole pixel nearest each edge inside the 2px ring band, at the
    // middle of the edge, away from the rounded corners.
    const midX = Math.round(box.x + box.width / 2)
    const midY = Math.round(box.y + box.height / 2)
    const points: Array<[number, number]> = [
      [Math.ceil(box.x), midY],
      [Math.floor(box.x + box.width - 1), midY],
      [midX, Math.ceil(box.y)],
      [midX, Math.floor(box.y + box.height - 1)],
    ]
    for (const [x, y] of points) {
      const onTop = await page.evaluate(
        ([px, py]) =>
          document
            .elementFromPoint(px, py)
            ?.closest(".dr-virtualized-timeline-tile") != null,
        [x, y] as const,
      )
      expect(onTop, `the tile is uncovered at ${x},${y}`).toBe(true)
      const seen = await pixel(page, x, y)
      for (const [i, channel] of seen.entries()) {
        expect(
          Math.abs(channel - (ring[i] as number)),
          `ring pixel at ${x},${y}`,
        ).toBeLessThanOrEqual(8)
      }
    }
  })

  test("virtualized timeline group checkbox stands clear of the next control", async ({
    page,
  }) => {
    const main = await open(page, "/components/virtualized-timeline")
    const header = main
      .locator(".dr-virtualized-timeline-bucket-header")
      .first()
    const checkbox = header.getByRole("checkbox")
    const toggle = header.getByRole("button").first()
    await expect(checkbox).toBeVisible()
    const box = await boxOf(checkbox)
    expect(
      (await boxOf(toggle)).x - (box.x + box.width),
    ).toBeGreaterThanOrEqual(6)
  })
})

test.describe("content components", () => {
  test("breadcrumb links back to the components index", async ({ page }) => {
    const main = await open(page, "/components/breadcrumb")
    await main
      .getByRole("navigation", { name: "breadcrumb" })
      .first()
      .getByRole("link", { name: "Components", exact: true })
      .click()
    await expect(page).toHaveURL(/\/components$/)
    await expect(
      page.getByRole("heading", { level: 1, name: "Component library" }),
    ).toBeVisible()
  })

  test("avatar falls back to initials", async ({ page }) => {
    // The demo loads a remote photo; serving it locally keeps the load
    // event, and so the test, independent of the network.
    await page.route("https://github.com/shadcn.png", (route) =>
      route.fulfill({ contentType: "image/png", body: ONE_PIXEL_PNG }),
    )
    const brokenSettled = page.waitForEvent("requestfinished", (request) =>
      request.url().endsWith("/broken-image.jpg"),
    )
    await open(page, "/components/avatar")
    const avatars = example(
      page,
      "With image (falling back to initials on broken src)",
    ).locator(".dr-avatar")
    await expect(avatars.nth(0).locator("img")).toBeVisible()
    await brokenSettled
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    )
    const broken = avatars.nth(1)
    await expect(broken.locator(".dr-avatar-fallback")).toHaveText("FB")
    await expect(broken.locator("img")).toHaveCount(0)
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

  test("image cropper shows its live dimensions badge at rest", async ({
    page,
  }) => {
    const main = await open(page, "/components/image-cropper")
    await expect(
      main.locator(".dr-image-cropper-dimensions").first(),
    ).toHaveText(/^\d+ × \d+$/)
  })
})
