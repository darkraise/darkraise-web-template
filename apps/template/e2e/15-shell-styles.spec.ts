import { test, expect, type Page } from "@playwright/test"
import {
  gotoApp,
  openThemeSwitcher,
  readThemeAttrs,
  seedApp,
  themeSwitcher,
} from "./helpers/app"

const SHELL_STYLES = [
  "classic",
  "inset",
  "island",
  "floating",
  "framed",
  "flat",
] as const

const shell = (page: Page) => page.locator(".dr-shell").first()

async function pickShellStyle(page: Page, style: string) {
  await openThemeSwitcher(page)
  await themeSwitcher(page)
    .locator('[aria-label="Shell Style"]')
    .getByRole("radio", { name: style, exact: true })
    .click()
  await expect
    .poll(async () => (await readThemeAttrs(page))["data-shell-style"])
    .toBe(style)
}

test.describe("shell style axis", () => {
  test("defaults to classic, with no gutter and no radius", async ({
    page,
  }) => {
    await seedApp(page)
    await gotoApp(page, "/")

    await expect(shell(page)).toHaveAttribute("data-shell-style", "classic")
    await expect(shell(page)).toHaveCSS("gap", "0px")
    await expect(shell(page)).toHaveCSS("padding", "0px")
  })

  test("island gutters the shell and rounds every region", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await pickShellStyle(page, "island")

    await expect(shell(page)).toHaveAttribute("data-shell-style", "island")
    await expect(shell(page)).not.toHaveCSS("gap", "0px")
    await expect(shell(page)).not.toHaveCSS("padding", "0px")

    const nav = shell(page).locator('[data-region="nav"]')
    await expect(nav).not.toHaveCSS("border-radius", "0px")
  })

  test("a mounted shell follows the axis, not a raw document attribute", async ({
    page,
  }) => {
    // Layouts resolve prop ?? theme value and stamp their own root, so poking
    // the document element must not move a shell that is already mounted.
    await seedApp(page)
    await gotoApp(page, "/")
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-shell-style", "island"),
    )
    await expect(shell(page)).toHaveAttribute("data-shell-style", "classic")
  })

  test("the choice survives a reload", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await pickShellStyle(page, "framed")

    await page.reload()
    await expect(shell(page)).toHaveAttribute("data-shell-style", "framed")
  })

  for (const style of SHELL_STYLES) {
    test(`the dashboard shell renders under ${style}`, async ({ page }) => {
      await seedApp(page, { shellStyle: style })
      await gotoApp(page, "/")

      await expect(shell(page)).toHaveAttribute("data-shell-style", style)
      await expect(page.locator("main#main-content")).toBeVisible()
      // The content region must still own its own scroll, whatever the style.
      await expect(page.locator('[data-region="content"]')).toHaveCSS(
        "overflow-y",
        "auto",
      )
    })
  }

  test("the content gradient clips to the rounded corner", async ({ page }) => {
    // main[data-content]::before is a 300px absolutely-positioned gradient
    // anchored to main's edges; once the region rounds it has to clip.
    await seedApp(page, { shellStyle: "island" })
    await gotoApp(page, "/")

    const content = page.locator('[data-region="content"]')
    await expect(content).not.toHaveCSS("border-radius", "0px")
    await expect(content).not.toHaveCSS("overflow-x", "visible")
  })

  test("every structure keeps its regions under island", async ({ page }) => {
    await seedApp(page, { shellStyle: "island" })
    await gotoApp(page, "/components/shell-styles")

    for (const structure of ["sidebar", "top-nav", "stacked", "split-panel"]) {
      await expect(
        page.locator(`.dr-shell[data-structure="${structure}"]`).first(),
      ).toBeVisible()
    }
  })
})

test.describe("shell style geometry", () => {
  test("inset leaves no hairline inside surfaceless chrome", async ({
    page,
  }) => {
    await seedApp(page, { shellStyle: "inset" })
    await gotoApp(page, "/")

    const seams = await page
      .locator('[data-region="nav"] [data-seam]')
      .evaluateAll((els) =>
        els.map((el) => {
          const cs = getComputedStyle(el)
          return [
            cs.borderTopWidth,
            cs.borderBottomWidth,
            cs.borderLeftWidth,
            cs.borderRightWidth,
          ].join(" ")
        }),
      )

    expect(seams.length).toBeGreaterThan(0)
    expect(seams.every((s) => s === "0px 0px 0px 0px")).toBe(true)
  })

  test("floating runs the content full-bleed under floating chrome", async ({
    page,
  }) => {
    await seedApp(page, { shellStyle: "floating" })
    await gotoApp(page, "/")

    const geom = await page.evaluate(() => {
      const box = (sel: string) => {
        const el = document.querySelector(sel)
        if (!el) throw new Error(`missing ${sel}`)
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      }
      return {
        viewport: { w: innerWidth, h: innerHeight },
        content: box('[data-region="content"]'),
        nav: box('[data-region="nav"]'),
      }
    })

    // The content plane reaches every edge; only the chrome is inset.
    expect(geom.content.x).toBe(0)
    expect(geom.content.y).toBe(0)
    expect(geom.content.w).toBe(geom.viewport.w)
    expect(geom.nav.x).toBeGreaterThan(0)
    expect(geom.nav.y).toBeGreaterThan(0)
  })

  test("framed insets the whole shell from the viewport edge", async ({
    page,
  }) => {
    await seedApp(page, { shellStyle: "framed" })
    await gotoApp(page, "/")

    const geom = await page.evaluate(() => {
      const el = document.querySelector(".dr-shell")
      if (!el) throw new Error("missing .dr-shell")
      const r = el.getBoundingClientRect()
      return {
        viewport: { w: innerWidth, h: innerHeight },
        shell: { x: r.x, y: r.y, w: r.width, h: r.height },
        radius: getComputedStyle(el).borderRadius,
        shadow: getComputedStyle(el).boxShadow,
      }
    })

    // A window on a desktop: ground shows on every side, corners rounded.
    expect(geom.shell.x).toBeGreaterThan(0)
    expect(geom.shell.y).toBeGreaterThan(0)
    expect(geom.shell.w).toBeLessThan(geom.viewport.w)
    expect(geom.shell.h).toBeLessThan(geom.viewport.h)
    expect(geom.radius).not.toBe("0px")

    // The frame edge must be an OUTSET ring. An inset ring paints during the
    // shell's own background stage, and the regions fill every grid cell, so
    // they cover it completely — present in the computed style, invisible on
    // screen.
    const rings = geom.shadow.split(/,(?![^(]*\))/).map((r) => r.trim())
    expect(
      rings.some((r) => r.includes("1px") && !r.includes("inset")),
      `frame ring must be outset; got: ${geom.shadow}`,
    ).toBe(true)
  })
})
