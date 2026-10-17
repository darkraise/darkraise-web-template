import { test, expect, type Locator } from "@playwright/test"
import {
  gotoApp,
  kitLook,
  reloadApp,
  seedApp,
  watchConsole,
} from "./helpers/app"
import {
  contrast,
  labelContrast,
  markContrast,
  settle,
  textContrast,
} from "./helpers/measure"

/**
 * The app's entry module. A dev server that has reloaded it serves it with a
 * `?t=` timestamp, which a plain glob does not match.
 */
const ENTRY = /\/src\/main\.tsx(?:\?|$)/

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

  test("markContrast reads a round mark against a region beside it", async ({
    page,
  }) => {
    await page.setContent(
      `<style>
        body { margin: 0; background: white; }
        #track { position: absolute; left: 10px; top: 10px; width: 100px; height: 20px; border-radius: 10px; background: rgb(200, 200, 200); }
        #thumb { position: absolute; left: 12px; top: 12px; width: 16px; height: 16px; border-radius: 50%; background: rgb(0, 0, 255); }
      </style>
      <div id="track"></div><div id="thumb"></div>`,
    )
    expect(
      await markContrast(page, page.locator("#thumb"), {
        x: 60,
        y: 12,
        width: 40,
        height: 16,
      }),
    ).toBeCloseTo(contrast([0, 0, 255], [200, 200, 200]), 5)
  })

  test("markContrast returns the lowest contrast a mark reaches", async ({
    page,
  }) => {
    await page.setContent(
      `<style>
        body { margin: 0; background: white; }
        #mark { position: absolute; left: 20px; top: 20px; width: 40px; }
        #mark div { height: 20px; }
      </style>
      <div id="mark">
        <div style="background: black"></div>
        <div style="background: rgb(119, 119, 119)"></div>
      </div>`,
    )
    expect(
      await markContrast(page, page.locator("#mark"), {
        x: 100,
        y: 20,
        width: 40,
        height: 40,
      }),
    ).toBeCloseTo(contrast([119, 119, 119], [255, 255, 255]), 5)
  })

  test("markContrast samples a hairline along its centre", async ({ page }) => {
    await page.setContent(
      `<style>
        body { margin: 0; background: white; }
        #rule { position: absolute; left: 10px; top: 50px; width: 100px; height: 2px; background: black; }
      </style>
      <div id="rule"></div>`,
    )
    const rule = { x: 10, y: 50, width: 100, height: 2 }
    const ground = { x: 10, y: 56, width: 100, height: 2 }
    expect(await markContrast(page, rule, ground)).toBe(21)
  })

  test("markContrast throws when scrolling to the beside target moves the mark out of view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 300 })
    await page.setContent(
      `<style>
        body { margin: 0; background: white; height: 3000px; }
        #mark { position: absolute; left: 10px; top: 10px; width: 20px; height: 20px; background: black; }
        #far { position: absolute; left: 10px; top: 2000px; width: 20px; height: 20px; background: rgb(200, 200, 200); }
      </style>
      <div id="mark"></div><div id="far"></div>`,
    )
    await expect(
      markContrast(page, page.locator("#mark"), page.locator("#far")),
    ).rejects.toThrow(/outside the/)
  })

  test("markContrast throws on a sample outside the screenshot", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 300 })
    await page.setContent(
      `<style>
        body { margin: 0; background: white; }
        #mark { position: absolute; left: 10px; top: 10px; width: 20px; height: 20px; background: black; }
      </style>
      <div id="mark"></div>`,
    )
    await expect(
      markContrast(page, page.locator("#mark"), {
        x: 10,
        y: 280,
        width: 20,
        height: 60,
      }),
    ).rejects.toThrow(/outside the/)
  })

  test("labelContrast reads the face behind a label's line, an icon beside it hidden", async ({
    page,
  }) => {
    await page.setContent(
      `<style>
        body { margin: 0; background: white; }
        button { display: inline-flex; gap: 8px; align-items: center; height: 48px; padding: 0 16px; border: 0; font: 16px/20px sans-serif; color: rgb(255, 255, 255); background: linear-gradient(rgb(0, 0, 0) 0 8px, rgb(0, 0, 160) 8px); }
        svg { width: 16px; height: 16px; }
      </style>
      <button><svg viewBox="0 0 16 16"><rect width="16" height="16" fill="currentColor" /></svg>Next</button>`,
    )
    const face = page.locator("button")
    expect(await labelContrast(page, face)).toBeCloseTo(
      contrast([255, 255, 255], [0, 0, 160]),
      5,
    )
    expect(
      await face.evaluate((el) => [
        el.style.cssText,
        el.querySelector("svg")?.getAttribute("style") ?? "",
      ]),
    ).toEqual(["", ""])
  })

  test("labelContrast restores the inline styles it overrides", async ({
    page,
  }) => {
    await page.setContent(
      `<style>
        body { margin: 0; background: white; }
        button { display: inline-flex; gap: 8px; align-items: center; height: 48px; padding: 0 16px; border: 0; font: 16px/20px sans-serif; color: rgb(255, 255, 255); background: rgb(0, 0, 160); }
        svg { width: 16px; height: 16px; }
      </style>
      <button style="transition: color 2s; -webkit-text-fill-color: rgb(255, 255, 255)"><svg viewBox="0 0 16 16" style="visibility: visible"><rect width="16" height="16" fill="currentColor" /></svg>Next</button>`,
    )
    const face = page.locator("button")
    const inline = () =>
      face.evaluate((el) => {
        const icon = el.querySelector("svg") as SVGElement
        return [
          el.style.getPropertyValue("transition"),
          el.style.getPropertyPriority("transition"),
          el.style.getPropertyValue("-webkit-text-fill-color"),
          el.style.getPropertyPriority("-webkit-text-fill-color"),
          icon.style.getPropertyValue("visibility"),
        ]
      })
    const before = await inline()
    await labelContrast(page, face)
    expect(await inline()).toEqual(before)
  })

  test("kitLook stamps the given signatures over the kit defaults", async ({
    page,
  }) => {
    await page.setContent("<p>kit</p>")
    await kitLook(page, { fieldFill: "translucent" })
    const html = page.locator("html")
    await expect(html).toHaveAttribute("data-style", "kit")
    await expect(html).toHaveAttribute("data-field-fill", "translucent")
    await expect(html).toHaveAttribute("data-badge-style", "subtle")
    await kitLook(page)
    await expect(html).toHaveAttribute("data-field-fill", "well")
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
    await page.route(ENTRY, async (route) => {
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
    await page.route(ENTRY, (route) => route.abort("connectionreset"))
    await seedApp(page)
    await expect(gotoApp(page, "/")).rejects.toThrow(
      /net::ERR_CONNECTION_RESET .*\/src\/main\.tsx/,
    )
  })

  test("gotoApp does not retry after an HTTP error status", async ({
    page,
  }) => {
    let entryRequests = 0
    await page.route(ENTRY, (route) => {
      entryRequests += 1
      return route.fulfill({ status: 500, body: "" })
    })
    await seedApp(page)
    await expect(gotoApp(page, "/")).rejects.toThrow()
    expect(entryRequests).toBe(1)
  })
})
