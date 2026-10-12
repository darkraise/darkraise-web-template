import { test, expect, type Locator } from "@playwright/test"
import { gotoApp, reloadApp, seedApp, watchConsole } from "./helpers/app"
import { settle, textContrast } from "./helpers/measure"

/**
 * A locator whose text sits on a background image, so textContrast takes
 * the pixel path. Every evaluate argument is recorded; the evaluate that
 * restores the text throws when `restoreFails` is set, as it does when the
 * element detaches mid-measurement.
 */
function pixelPathLocator(options: {
  box: { x: number; y: number; width: number; height: number } | null
  restoreFails: boolean
  args: unknown[]
}): Locator {
  let evaluations = 0
  const page = {
    screenshot: async () => Buffer.from(""),
    evaluate: async () => [3],
  }
  return {
    evaluate: async (_fn: unknown, arg: unknown) => {
      evaluations += 1
      options.args.push(arg)
      if (evaluations === 1) return { kind: "pixels", text: [0, 0, 0, 1] }
      if (evaluations === 3 && options.restoreFails) {
        throw new Error("the element was detached")
      }
      return undefined
    },
    scrollIntoViewIfNeeded: async () => undefined,
    boundingBox: async () => options.box,
    page: () => page,
  } as unknown as Locator
}

test.describe("e2e helpers", () => {
  test("settle gives up at its deadline when no frame arrives", async ({
    page,
  }) => {
    test.setTimeout(15_000)
    await page.setContent('<div id="probe">probe</div>')
    await page.evaluate(() => {
      document
        .getElementById("probe")
        ?.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 60_000,
          id: "probe-fade",
        })
      window.requestAnimationFrame = () => 0
    })
    const started = Date.now()
    await expect(settle(page)).rejects.toThrow(
      "settle: still running after 5000ms: probe-fade",
    )
    expect(Date.now() - started).toBeLessThan(6_000)
  })

  test("textContrast reports a missing box over a failed restore", async () => {
    const locator = pixelPathLocator({
      box: null,
      restoreFails: true,
      args: [],
    })
    await expect(textContrast(locator)).rejects.toThrow(
      "textContrast: the element has no box",
    )
  })

  test("textContrast reports a failed restore after a good measurement", async () => {
    const locator = pixelPathLocator({
      box: { x: 0, y: 0, width: 10, height: 10 },
      restoreFails: true,
      args: [],
    })
    await expect(textContrast(locator)).rejects.toThrow(
      "the element was detached",
    )
  })

  test("textContrast gives each call its own style element", async () => {
    const first: unknown[] = []
    const second: unknown[] = []
    for (const args of [first, second]) {
      const locator = pixelPathLocator({
        box: { x: 0, y: 0, width: 10, height: 10 },
        restoreFails: false,
        args,
      })
      expect(await textContrast(locator)).toBe(3)
    }
    expect(first[1]).toEqual(first[2])
    expect(second[1]).toEqual(second[2])
    expect(first[1]).not.toEqual(second[1])
  })

  test("textContrast reads a ground a pseudo-element paints only when asked to", async ({
    page,
  }) => {
    await page.setContent(
      `<style>
        body { margin: 0; background: white; }
        #bar { position: relative; isolation: isolate; padding: 16px; color: white; }
        #bar::before { content: ""; position: absolute; inset: 0; z-index: -1; background: black; }
      </style>
      <div id="bar"><span id="ink">Bar text</span></div>`,
    )
    const ink = page.locator("#ink")
    expect(await textContrast(ink)).toBe(1)
    expect(await textContrast(ink, { ground: "painted" })).toBe(21)
  })

  test("watchConsole records a [vite] error but not a [vite] debug message", async ({
    page,
  }) => {
    const consoleWatch = watchConsole(page)
    await page.setContent(`<script>
      console.debug("[vite] connecting...")
      console.error("[vite] Internal Server Error")
    </script>`)
    await expect
      .poll(() => consoleWatch.errors)
      .toEqual(["[vite] Internal Server Error"])
    expect(consoleWatch.warnings).toEqual([])
  })

  test("seedApp seeds once per tab, so a sign-out survives a reload", async ({
    page,
  }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await page.locator(".dr-user-menu-trigger").first().click()
    await page.getByRole("menuitem", { name: "Log out" }).click()
    await expect(page).toHaveURL(/\/login$/)
    await reloadApp(page)
    await expect(page).toHaveURL(/\/login$/)
    expect(
      await page.evaluate(() => localStorage.getItem("auth-token")),
    ).toBeNull()
  })

  test("seedApp skips frames other than the top one", async ({ page }) => {
    const pageErrors: string[] = []
    page.on("pageerror", (error) => pageErrors.push(error.message))
    await page.route("**/e2e-seed-frame", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<iframe src="http://127.0.0.1:9/"></iframe>',
      }),
    )
    await seedApp(page)
    await page.goto("/e2e-seed-frame")
    await expect.poll(() => page.frames().length).toBe(2)
    expect(pageErrors).toEqual([])
  })

  test("gotoApp navigates again once after a module request fails", async ({
    page,
  }, testInfo) => {
    const consoleWatch = watchConsole(page)
    let entryRequests = 0
    await page.route("**/src/main.tsx", async (route) => {
      entryRequests += 1
      if (entryRequests === 1) await route.abort("connectionreset")
      else await route.continue()
    })
    await seedApp(page)
    await gotoApp(page, "/")
    expect(entryRequests).toBe(2)
    const retry = testInfo.annotations.find(
      (annotation) => annotation.type === "gotoApp retry",
    )
    expect(retry?.description).toContain("net::ERR_CONNECTION_RESET")
    consoleWatch.assertClean()
  })

  test("gotoApp reports the first failure when the retry fails too", async ({
    page,
  }) => {
    await page.route("**/src/main.tsx", (route) =>
      route.abort("connectionreset"),
    )
    await seedApp(page)
    await expect(gotoApp(page, "/")).rejects.toThrow(
      /net::ERR_CONNECTION_RESET .*\/src\/main\.tsx/,
    )
  })

  test("gotoApp does not retry after an HTTP error status", async ({
    page,
  }) => {
    let entryRequests = 0
    await page.route("**/src/main.tsx", (route) => {
      entryRequests += 1
      return route.fulfill({ status: 500, body: "" })
    })
    await seedApp(page)
    await expect(gotoApp(page, "/")).rejects.toThrow()
    expect(entryRequests).toBe(1)
  })
})
