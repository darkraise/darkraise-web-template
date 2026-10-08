import { test, expect } from "@playwright/test"
import { gotoApp, reloadApp, seedApp, watchConsole } from "./helpers/app"
import { settle } from "./helpers/measure"

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
})
