import { test, expect, type Locator, type Page } from "@playwright/test"
import { STYLES, type Style } from "./fixtures/theme"
import {
  boxOf,
  gotoApp,
  openAdvanced,
  openThemeSwitcher,
  seedApp,
} from "./helpers/app"
import { contrast, pixel, settle } from "./helpers/measure"

const SHELL_STYLES = [
  "classic",
  "inset",
  "island",
  "floating",
  "framed",
  "flat",
] as const
type ShellStyle = (typeof SHELL_STYLES)[number]

const MODES = ["light", "dark"] as const

const shell = (page: Page) => page.locator(".dr-shell").first()

const region = (page: Page, name: string) =>
  shell(page).locator(`:scope > [data-region="${name}"]`)

/** What a shell style paints on the nav and the content region. */
interface RegionPaint {
  /** The token the nav fill resolves to; null where the nav drops its fill. */
  navFill: string | null
  navBorder: string
  contentBorder: string
  navRadius: string
  contentRadius: string
  /** The separation layer both regions cast; null where they cast none. */
  separation: string | null
}

const WELDED = "0px 0px 0px 0px"
const DETACHED = "1px 1px 1px 1px"
const RAIL_RULE = "0px 1px 0px 0px"

// Radii are the default rounded axis, which the shell takes as 0.5rem.
const REGION_PAINT: Record<ShellStyle, RegionPaint> = {
  classic: {
    navFill: "--surface-sidebar",
    navBorder: RAIL_RULE,
    contentBorder: WELDED,
    navRadius: "0px",
    contentRadius: "0px",
    separation: null,
  },
  inset: {
    navFill: null,
    navBorder: WELDED,
    contentBorder: DETACHED,
    navRadius: "0px",
    contentRadius: "8px",
    separation: null,
  },
  island: {
    navFill: "--surface-sidebar",
    navBorder: DETACHED,
    contentBorder: DETACHED,
    navRadius: "8px",
    contentRadius: "8px",
    separation: "rgba(0, 0, 0, 0.08) 0px 1px 3px 0px",
  },
  floating: {
    navFill: "--surface-sidebar",
    navBorder: DETACHED,
    contentBorder: DETACHED,
    navRadius: "8px",
    contentRadius: "8px",
    separation: "rgba(0, 0, 0, 0.28) 0px 12px 28px -8px",
  },
  framed: {
    navFill: "--surface-sidebar",
    navBorder: RAIL_RULE,
    contentBorder: WELDED,
    navRadius: "0px",
    contentRadius: "0px",
    separation: null,
  },
  flat: {
    navFill: "--muted",
    navBorder: WELDED,
    contentBorder: WELDED,
    navRadius: "0px",
    contentRadius: "0px",
    separation: null,
  },
}

/** Box-shadow layers that paint, leaving out fully transparent ones. */
function paintedLayers(shadow: string): string[] {
  if (shadow === "none") return []
  return shadow
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter((layer) => !layer.startsWith("rgba(0, 0, 0, 0) "))
}

/** Border widths in top, right, bottom, left order. */
function borderWidths(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el)
    return [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth,
    ].join(" ")
  })
}

/** A colour token resolved to the rgb() a computed background reports. */
function resolvedFill(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("div")
    probe.style.backgroundColor = `hsl(var(${name}))`
    document.body.append(probe)
    const value = getComputedStyle(probe).backgroundColor
    probe.remove()
    return value
  }, token)
}

async function pickShellStyle(page: Page, style: ShellStyle) {
  await page.getByRole("button", { name: "Switch layout" }).click()
  await page.getByRole("menuitemradio", { name: style, exact: true }).click()
  await expect(shell(page)).toHaveAttribute("data-shell-style", style)
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
    await expect(shell(page)).toHaveCSS("gap", "8px")
    await expect(shell(page)).toHaveCSS("padding", "8px")

    const names = ["nav", "bar", "content"]
    await expect(shell(page).locator(":scope > [data-region]")).toHaveCount(
      names.length,
    )
    for (const name of names) {
      await expect(region(page, name), name).toHaveCSS("border-radius", "8px")
    }
  })

  test("a mounted shell follows the stored choice, not a raw document attribute", async ({
    page,
  }) => {
    // Layouts resolve prop ?? stored choice ?? default and stamp their own
    // root, so poking the document element must not move a mounted shell.
    await seedApp(page)
    await gotoApp(page, "/")
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-shell-style", "island"),
    )
    await expect(shell(page)).toHaveAttribute("data-shell-style", "classic")
  })

  test("the layout switcher checks the painted style", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await page.getByRole("button", { name: "Switch layout" }).click()
    await expect(
      page.getByRole("menuitemradio", { name: "classic", exact: true }),
    ).toHaveAttribute("aria-checked", "true")
  })

  test("the layout switcher marks the stored style", async ({ page }) => {
    await seedApp(page, { shellStyle: "inset" })
    await gotoApp(page, "/")
    await page.getByRole("button", { name: "Switch layout" }).click()
    await expect(
      page.getByRole("menuitemradio", { name: "inset", exact: true }),
    ).toHaveAttribute("aria-checked", "true")
  })

  test("the choice survives a reload", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await pickShellStyle(page, "framed")
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("theme-shell-style")),
      )
      .toBe("framed")

    await page.reload()
    await expect(shell(page)).toHaveAttribute("data-shell-style", "framed")
  })

  test("the document element carries no shell style", async ({ page }) => {
    // The layout root is the only carrier; neither the provider nor the
    // pre-render script stamps it on <html> any more.
    await seedApp(page, { shellStyle: "island" })
    await gotoApp(page, "/")
    await expect(shell(page)).toHaveAttribute("data-shell-style", "island")
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute("data-shell-style"),
      ),
    ).toBe(false)
  })

  for (const style of SHELL_STYLES) {
    for (const mode of MODES) {
      test(`the dashboard shell renders under ${style} · ${mode}`, async ({
        page,
      }) => {
        await seedApp(page, { shellStyle: style, style: "quiet", mode })
        await gotoApp(page, "/")

        await expect(shell(page)).toHaveAttribute("data-shell-style", style)
        await expect(page.locator("main#main-content")).toBeVisible()
        // The content region must still own its own scroll, whatever the style.
        await expect(page.locator('[data-region="content"]')).toHaveCSS(
          "overflow-y",
          "auto",
        )

        const paint = REGION_PAINT[style]
        const nav = region(page, "nav")
        const content = region(page, "content")
        // The nav paints its fill on ::before, over its own canvas.
        const navFill = paint.navFill
          ? await resolvedFill(page, paint.navFill)
          : "rgba(0, 0, 0, 0)"
        await expect
          .poll(() =>
            nav.evaluate(
              (el) => getComputedStyle(el, "::before").backgroundColor,
            ),
          )
          .toBe(navFill)
        await expect(content).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
        await expect
          .poll(() => borderWidths(nav), { message: "nav border" })
          .toBe(paint.navBorder)
        await expect
          .poll(() => borderWidths(content), { message: "content border" })
          .toBe(paint.contentBorder)
        await expect(nav).toHaveCSS("border-radius", paint.navRadius)
        await expect(content).toHaveCSS("border-radius", paint.contentRadius)
        for (const [name, locator] of [
          ["nav", nav],
          ["content", content],
        ] as const) {
          const layers = paintedLayers(
            await locator.evaluate((el) => getComputedStyle(el).boxShadow),
          )
          if (paint.separation) {
            expect(layers, `${name} shadow`).toContain(paint.separation)
          } else {
            expect(layers, `${name} shadow`).toEqual([])
          }
        }
      })
    }
  }

  // Inset gives up the chrome surface so the ground shows through it, and
  // classic and flat have no gutter, so only these three set one apart.
  // Detached chrome may share its fill with the ground: the separation is
  // its edge (a border under island and floating, an outset ring under
  // framed), so the probe walks across the edge rather than into the fill.
  for (const style of ["island", "floating", "framed"] as const) {
    for (const mode of MODES) {
      test(`the ${style} chrome edge stands apart from the gutter · ${mode}`, async ({
        page,
      }) => {
        await seedApp(page, { shellStyle: style, style: "quiet", mode })
        await gotoApp(page, "/")
        await expect(shell(page)).toHaveAttribute("data-shell-style", style)
        await page.addStyleTag({
          content:
            '.dr-shell > [data-region="nav"] > * { visibility: hidden !important; }',
        })
        await settle(page)

        const nav = await boxOf(region(page, "nav"))
        // The nav sits one gutter in from the viewport edge under all three.
        expect(nav.x, "gutter left of the nav").toBeGreaterThan(4)
        const y = Math.round(nav.y + nav.height / 2)
        const gutter = await pixel(page, Math.round(nav.x / 2), y)
        const edgeX = Math.floor(nav.x)
        let strongest = 0
        for (let x = edgeX - 2; x <= edgeX + 2; x++) {
          strongest = Math.max(
            strongest,
            contrast(gutter, await pixel(page, x, y)),
          )
        }
        expect(
          strongest,
          `strongest edge pixel against gutter rgb(${gutter.join(",")})`,
        ).toBeGreaterThanOrEqual(1.1)
      })
    }
  }

  test("the content gradient clips to the rounded corner", async ({ page }) => {
    // main[data-content]::before is a 300px absolutely-positioned gradient
    // anchored to main's edges; once the region rounds it has to clip.
    await seedApp(page, {
      shellStyle: "island",
      style: "quiet",
      mode: "light",
      backgroundStyle: "gradient",
      backgroundIntensity: "intense",
    })
    await gotoApp(page, "/")

    const content = page.locator('[data-region="content"]')
    await expect(content).toHaveCSS("border-radius", "8px")
    await expect(content).not.toHaveCSS("overflow-x", "visible")
    await page.mouse.move(0, 0)
    await settle(page)

    const box = await boxOf(content)
    const at = (dx: number, dy: number) =>
      pixel(page, Math.round(box.x + dx), Math.round(box.y + dy))
    const ground = await at(-4, 30)
    // The strip must paint inside the curve, or a clipped corner proves nothing.
    expect(
      contrast(await at(12, 12), ground),
      "strip inside the curve against the ground",
    ).toBeGreaterThanOrEqual(1.2)
    expect(
      contrast(await at(1, 1), ground),
      "corner pixel outside the curve against the ground",
    ).toBeLessThan(1.05)
  })

  test("every structure keeps its regions under island", async ({ page }) => {
    await seedApp(page, { shellStyle: "island" })
    await gotoApp(page, "/components/shell-styles")

    const regions: Record<string, string[]> = {
      sidebar: ["nav", "bar", "content"],
      "top-nav": ["bar", "content"],
      stacked: ["nav", "subnav", "bar", "content"],
      "split-panel": ["bar", "panel", "handle", "content"],
    }
    for (const [structure, names] of Object.entries(regions)) {
      const preview = page.locator(
        `main .dr-shell[data-structure="${structure}"][data-shell-style="island"]`,
      )
      await expect(preview, structure).toHaveCount(1)
      const children = preview.locator(":scope > [data-region]")
      await expect(children, structure).toHaveCount(names.length)
      expect(
        await children.evaluateAll((els) =>
          els.map((el) => el.getAttribute("data-region")),
        ),
        structure,
      ).toEqual(names)
      for (const name of names) {
        const part = preview.locator(`:scope > [data-region="${name}"]`)
        await expect(part, `${structure} ${name}`).toBeVisible()
        await expect(part, `${structure} ${name}`).toHaveCSS(
          "border-radius",
          "8px",
        )
      }
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

  test("floating content clears a collapsed sidebar by its gutter", async ({
    page,
  }) => {
    await seedApp(page, { shellStyle: "floating" })
    await gotoApp(page, "/")
    await page.getByRole("button", { name: "Collapse sidebar" }).click()
    await settle(page)

    const gutterInRem = () =>
      page.evaluate(() => {
        const nav = document.querySelector('[data-region="nav"]') as HTMLElement
        const content = document.querySelector(
          '[data-region="content"]',
        ) as HTMLElement
        const textStart =
          content.getBoundingClientRect().left +
          parseFloat(getComputedStyle(content).paddingInlineStart)
        const rem = parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        )
        return (textStart - nav.getBoundingClientRect().right) / rem
      })
    await expect.poll(gutterInRem).toBeCloseTo(1.5, 1)
  })

  test("a scrolling region keeps its edge above its content", async ({
    page,
  }) => {
    // An inset box-shadow paints beneath the region's children, so content
    // scrolled under it erased the edge. Only a real border stays on top.
    await seedApp(page, { shellStyle: "island" })
    await gotoApp(page, "/")

    const content = page.locator('[data-region="content"]')
    await expect(content).toHaveCSS("border-top-width", "1px")
    await expect(content).toHaveCSS("border-top-style", "solid")
    const shadow = await content.evaluate(
      (el) => getComputedStyle(el).boxShadow,
    )
    expect(shadow).not.toContain("inset")
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

test.describe("sidebar selection setting", () => {
  const autoLook: Record<Style, string> = {
    quiet: "chip",
    flat: "pill",
    tactile: "tile",
    glass: "frosted",
  }
  for (const style of STYLES) {
    test(`auto follows the style · ${style}`, async ({ page }) => {
      await seedApp(page, { style, sidebarSelection: "auto" })
      await gotoApp(page, "/")
      await expect(page.locator(".dr-sidebar-nav").first()).toHaveAttribute(
        "data-sidebar-selection",
        autoLook[style],
      )
    })
  }

  test("a chosen look reaches the sidebar", async ({ page }) => {
    await seedApp(page, { sidebarSelection: "tile" })
    await gotoApp(page, "/")
    await expect(page.locator(".dr-sidebar-nav").first()).toHaveAttribute(
      "data-sidebar-selection",
      "tile",
    )
  })

  test("the theme panel switches it live", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    const panel = await openThemeSwitcher(page)
    await openAdvanced(page)
    await panel
      .locator('[aria-label="Sidebar Selection"]')
      .getByRole("radio", { name: "Frosted", exact: true })
      .click()
    await expect(page.locator(".dr-sidebar-nav").first()).toHaveAttribute(
      "data-sidebar-selection",
      "frosted",
    )
  })
})
